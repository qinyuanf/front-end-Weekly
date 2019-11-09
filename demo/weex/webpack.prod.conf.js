const commonConfig = require('./webpack.common.conf')
const webpackMerge = require('webpack-merge') // used to merge webpack configs
const os = require('os')
const webpack = require('webpack')
const config = require('./config')
const helper = require('./helper')
const UglifyJsparallelPlugin = require('webpack-uglify-parallel')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const utils = require('./utils')
const PACKAGE_PATH = process.env.PACKAGE_PATH
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

/**
 * Webpack configuration for weex.
 */
const weexConfig = webpackMerge(commonConfig[1], {
  plugins: [
    // 清理 dist 目录
    // See: https://github.com/johnagan/clean-webpack-plugin
    new CleanWebpackPlugin(),
    // See: https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': config.prod.env
      }
    }),
    // 执行代码压缩
    // See: https://www.npmjs.com/package/webpack-uglify-parallel
    new UglifyJsparallelPlugin({
      workers: os.cpus().length,
      mangle: true,
      compressor: {
        warnings: false,
        drop_console: true,
        drop_debugger: true
      }
    }),
    ...commonConfig[1].plugins
  ]
})

/**
* Webpack configuration for web.
*/
const webConfig = webpackMerge(commonConfig[0], {
  devtool: config.prod.devtool,
  plugins: [
    // See: https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': config.prod.env
      }
    }),
    // See: https://www.npmjs.com/package/webpack-uglify-parallel
    new UglifyJsparallelPlugin({
      workers: os.cpus().length,
      mangle: true,
      compressor: {
        warnings: false,
        drop_console: true,
        drop_debugger: true
      }
    }),
    /**
     * 压缩 index.js 和 index.web.js
     * See: https://github.com/gregnb/filemanager-webpack-plugin
     */
    new FileManagerPlugin(utils.compressFile(PACKAGE_PATH))
  ]
})

module.exports = [weexConfig, webConfig]
