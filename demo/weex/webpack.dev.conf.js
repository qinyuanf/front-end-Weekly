const commonConfig = require('./webpack.common.conf')
const webpackMerge = require('webpack-merge')
// tools
const chalk = require('chalk')
const webpack = require('webpack')
const ip = require('ip').address()
const path = require('path')
// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin-for-multihtml')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')
// 自定义方法
const config = require('./config')
const utils = require('./utils')
const helper = require('./helper')
const serverUtils = require('../server/utils/index')
const { postMessageToOpenPage, readFile, filterRoute } = require('./utils')
const rootConfig = require('../config.json')
// 路由前缀
const WEEXALIAS = rootConfig.routePrefix

// 通过获取原始路由，PACKAGE_PATH：insurance/demo/index
const PACKAGE_PATH = process.env.PACKAGE_PATH
const realRoutes = serverUtils.getRoutesPath(PACKAGE_PATH || '')

// webpack-dev-server 运行时自动打开浏览器的地址，配置路由参数
const openPages = postMessageToOpenPage(realRoutes)

// 实现 playground App 的热更新
const wsServer = require('./hotreload')
let wsTempServer = null

/**
 * 利用 html-webpack-plugin-for-multihtml 生成多页面
 * 存在瓶颈，当同时存在很多页面时，会导致编译卡主
 * @param {Array} entry 
 */
const generateHtmlWebpackPlugin = (entrys) => {
  const htmlPlugin = entrys.map(name => {
    return new HtmlWebpackPlugin({
      multihtmlCache: true,
      filename: `${WEEXALIAS}/${name}.html`,
      template: helper.rootNode(`web/index.html`),
      isDevServer: true,
      chunksSortMode: 'dependency',
      inject: true,
      devScripts: config.dev.htmlOptions.devScripts,
      chunks: ['vendor', name]
    })
  })
  return htmlPlugin
}

// web 端开发环境 webpack 配置
const devWebpackConfig = webpackMerge(commonConfig[0], {
  entry: {
    // vendor 包仅在调试环境用到
    // 用于在 PC 端模拟 Touch 事件，仅在开发阶段用到，实际没什么用
    'vendor': [path.resolve('node_modules/phantom-limb/index.js')]
  },
  module: {
    // 生成与 css 相关的各种 loader
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // 控制 sourceMap 的细粒度
  devtool: config.dev.devtool,
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': config.dev.env
      }
    }),
    ...generateHtmlWebpackPlugin(realRoutes),
    // 为 js 文件插入 defer 异步加载的标记
    // 页面加载完成后再支持 js
    // 参考：https://github.com/numical/script-ext-html-webpack-plugin
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'defer'
    })
  ],
  // webpack-dev-server 配置
  // webpack-dev-server 在编译之后不会写入到任何输出文件。而是将 bundle 文件保留在内存中，路径和真实文件一样
  // 参考：https://webpack.docschina.org/configuration/dev-server/
  devServer: {
    clientLogLevel: 'warning',
    compress: true,
    contentBase: config.dev.contentBase,
    disableHostCheck: true,
    host: config.dev.host,
    port: config.dev.port,
    historyApiFallback: config.dev.historyApiFallback,
    open:config.dev.open,
    watchContentBase: config.dev.watchContentBase,
    overlay: config.dev.errorOverlay
    ? { warnings: false, errors: true }
    : false,
    proxy: config.dev.proxyTable,
    quiet: true,
    // 编译完成后自动打开的页面
    openPage: encodeURI(openPages),
    watchOptions: config.dev.watchOptions,
    // 在服务内部的所有其他中间件之前， 提供执行自定义中间件的功能。
    before: function (app, server) {
      // 利用已有服务器，将访问自定义路由代理到 dist 目录相应的 js 文件
      app.get(`/${WEEXALIAS}/**/*.js`, async (req, res) => {
        console.log(`INFO 访问了：${ req.path }`)
        // 提取路由
        const length = `/${rootConfig.routePrefix}`.split('/').length
        const pathString = filterRoute(req.path, length)
        const pathname = pathString.split('.')[0]
        if (realRoutes.includes(pathname)) {
          const filePath = path.resolve(__dirname, `../dist/${pathname}.js`)
          console.log(`INFO 资源重定向至：${ filePath }`)
          const md5 = await readFile(filePath)
          res.set({
            'x-weex': 1,
            'x-cahce': 1,
            'x-force': 1,
            'x-md5': md5
          })
          res.sendFile(filePath)
        } else {
          res.send('该文件不存在~')
        }
      })
      app.get('/', (req, res) => {
        res.send('欢迎使用weex~')
      })
    }
  }
})

// native 端开发环境 webpack 配置
// 启用 watch 模式
// 这意味着在初始构建之后，webpack 将继续监听任何已解析文件的更改，当它们修改后会重新编译
// 参考：https://webpack.docschina.org/configuration/watch/
const weexConfig = webpackMerge(commonConfig[1], {
  watch: true
})

// build source to weex_bundle with watch mode.
// 使用 NodeApi 进行 webpack 编译
// 开发环境下生成 dist 目录下的文件
// 参考：https://webpack.docschina.org/api/node/
webpack(weexConfig, (err, stats) => {
  // 每次文件发生变化后都会重新编译生成 native 端的 js-bundle
  // weex-loader 检测到 css 不合规时会调用 this.emitWarning 方法将警告抛出
  // 通过 status 对象能抓取到警告并在控制台抛出
  const info = stats.toJson()
  if (stats.hasWarnings()) {
    info.warnings.forEach(item => {
      const SIGN = 'NonErrorEmittedError: (Emitted value instead of an instance of Error) '
      const wordsArray = item.split(SIGN)
      if (wordsArray[1]) {
        serverUtils.chalkLog(wordsArray[1])
      }
    })
  }
  if (err) {
    console.err('COMPILE ERROR:', err.stack)
  } else {
    // 每次 native 端的 js-bundle 发生变化时将通知 app 重载页面，实现热刷新
    wsTempServer && wsTempServer.sendSocketMessage()
  }
})

// 以 promise 的形式抛出 webpack 配置文件
module.exports = new Promise((resolve, reject) => {
  // 从 basePort 开始寻找可使用的端口号
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port
      devWebpackConfig.devServer.public = `${rootConfig.dev.domainName || ip}:${port}`
      devWebpackConfig.devServer.openPage += `&wsport=${port+1}`
      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [
            `Your application is running here: ${chalk.yellow(`${devWebpackConfig.devServer.public}/${devWebpackConfig.devServer.openPage}`)}.`
          ],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))
      // 启动 webpack socket
      wsTempServer = new wsServer(port+1)
      resolve(devWebpackConfig)
    }
  })
})
