const path = require('path')
const webpack = require('webpack')
const config = require('./config')
const helper = require('./helper')
const vueLoaderConfig = require('./vue-loader.conf')
const { getEntryFile } = require('./utils')

// PACKAGE_PATH：insurance/demo/index
const PACKAGE_PATH = process.env.PACKAGE_PATH
// 重新生成 .temp 下 web、native 端的入口文件，与 src/pages 下业务文件一一对应
// 生成 web、native 端 webpack entry 打包入口
// 传入 PACKAGE_PATH 获得单页打包入口，不传则获得全部打包入口
// webEntry => { 'insurance/demo/index': '/Users/qinyf/Documents/work/weex-code-weiyi/.temp/insurance/demo/index.web.js' }
// weexEntry => { 'insurance/demo/index': '/Users/qinyf/Documents/work/weex-code-weiyi/.temp/insurance/demo/index.js' }
const { webEntry, weexEntry } =  getEntryFile(PACKAGE_PATH || '')

// 生成 eslint 规则
const createLintingRule = () => ({
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [helper.rootNode('src'), helper.rootNode('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
})
// 根据配置决定是否使用 eslint
const useEslint = config.dev.useEslint ? [createLintingRule()] : []

// 解析规则两端保持一致，别名及后缀
const resolve = {
  extensions: ['.js', '.vue', '.json'],
  alias: {
    '@': helper.resolve('src'),
    'config': helper.resolve('config'),
    'pages': helper.resolve('src/pages')
  }
}

// 生成插件列表
const plugins = [
  // 设置默认环境变量
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': config.dev.env
    }
  }),
  // 为打包出来的 js 文件加上注释，h5 无作用，native 端会根据注释选择相对应的解析语言
  new webpack.BannerPlugin({
    banner: '// { "framework": "Vue"} \n',
    raw: true,
    exclude: 'Vue'
  })
]

// 生成 web 端 jsbundle 的 webpack 配置项
const webConfig = {
  // 实质为多页打包
  entry: webEntry,
  // web 端 jsbundle 的目录为 dist/[name].web.js
  output: {
    path: helper.rootNode('./dist'),
    filename: '[name].web.js'
  },
  resolve,
  module: {
    rules: useEslint.concat([
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: config.excludeModuleReg
      },
      // vue-loader 已改版，最新版本为 v15.7.2，当前版本为 v12.2.0
      // 因为 weex-vue-precompiler 的推荐使用方案未发生改变，这里不做升级
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'vue-loader',
          options: Object.assign(vueLoaderConfig({useVue: true, usePostCSS: false}), {
            // 当以 ssr 的模式编译时，渲染函数会把返回的 vdom 树的一部分编译为字符串，以提升服务端渲染性能
            // 此处仅用于客户端渲染，因此关闭该属性
            // 参考：https://vue-loader.vuejs.org/zh/options.html#optimizessr
            optimizeSSR: false,
            // 已废弃
            // 当前版本 v-loader 默认支持 postcss 变换
            // v15 以上已默认不支持，需手动引入
            // 参考：https://vue-loader.vuejs.org/zh/migrating.html#postcss
            postcss: [
              // 转换 weex 特有的一些样式
              // 参考：https://github.com/weexteam/postcss-plugin-for-Apache-Weex
              require('postcss-plugin-weex')(),
              // 为 css 样式自动添加前缀
              // 参考：https://github.com/postcss/autoprefixer
              require('autoprefixer')({
                browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
              }),
              // 将 px 转换为 rem
              // 参考：https://github.com/pigcan/postcss-plugin-px2rem
              require('postcss-plugin-px2rem')({
                // base on 750px standard.
                rootValue: 75,
                // to leave 1px alone.
                minPixelValue: 1.01
              })
            ],
            // 已废弃，新版本使用 compilerOptions.modules
            // 若之后升级可参考 vue-template-compiler
            // 利用 compiler.parseComponent(file, [options]) 解析 .vue 单文件，提取出 template 部分
            // 再利用 compiler.compile(template, [options]) 将 template 解析为 vnode
            compilerModules: [
              {
                postTransformNode: el => {
                  // to convert vnode for weex components.
                  require('weex-vue-precompiler')()(el)
                }
              }
            ]

          })
        }],
        exclude: config.excludeModuleReg
      }
    ])
  },
  plugins: plugins
}
// 生成 native 端 jsbundle 的 webpack 配置项
const weexConfig = {
  entry: weexEntry,
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js'
  },
  resolve,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: config.excludeModuleReg
      },
      // weex-loader 用来编译 .vue 或 .we 文件
      // .vue 文件 主要依赖 weex-vue-loader 编译
      // 目前关注了该 loader 对 css 的校验及发出的修改建议（WARNING、ERROR、NOTE）
      // 使用该 loader 将 .vue 文件打包成了 render 函数
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'weex-loader',
          options: vueLoaderConfig({useVue: false})
        }],
        exclude: config.excludeModuleReg
      }
    ]
  },
  plugins: plugins,
  // node 配置
  node: config.nodeConfiguration
}

module.exports = [webConfig, weexConfig]
