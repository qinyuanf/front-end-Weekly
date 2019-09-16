## 基于 TypeScript + Webpack4 搭建 Vue 业务组件库（by 元丰）

### 背景
众所周知，基础组件库是从业务中抽象出来的，功能相对单一、独立，在整个系统的代码层次中位于最底层，被其他代码所依赖。由于考虑到扩展性及通用性，基础组件基本不包含任何业务代码或 http 请求。但实际开发中又会存在着对某块业务的封装，或者是交互设计师针对当前业务做出特定交互设计，这时就需要一个系统来承载这些组件，便于跨业务单元进行调用。

### 概述
从下列几点来简述组件库的搭建过程：
* vue-cli3/webpack-chain
* TypeScript 支持
* 热更新/模块热替换
* 组件库的适配
* 按需加载
* 开发体验
* 使用体验
* 利用 verdaccio 搭建 npm 私服
* 后续

### vue-cli3/webpack-chain

vue-cli3 相较于2的版本比较大的更新是避免用户直接操作 webpack 配置，默认场景下底层配置项在项目中不可见（可手动导出）。脚手架实现了对 webpack 配置的二次封装，形成了一套新的配置语法，在 vue.config.js 进行配置。官方推荐使用链式操作（基于 webpack-chain），如下：

```
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
          // 修改它的选项...
          return options
        })
  }
}
```
组件库前期使用 vue-cli3，后期抛弃了，原因如下：

* 对于不太熟悉 webpack 配置的同学来说，上手成本是简单了，但对于 webpack 配置工程师来说，webpack 是基础
* 在组件库搭建过程中，对脚手架自定义语法的学习时间大于对库本身优化的时间
* 更细粒度的打包控制还是依赖 webpack 原生 api
* 前期使用的主要原因是脚手架直接支持对 ts 的配置，后期发现自己搭也没那么复杂

**参考：** https://cli.vuejs.org/zh/guide/webpack.html

### TypeScript 支持

* 核心 npm 包：
   * `typescript`
   * `ts-loader`
   * `vue-class-component`
   * `vue-property-decorator`
   * `@babel/plugin-proposal-class-properties`
   * `@babel/plugin-proposal-decorators`

* 配置流程
   * 配置 tsconfig.json
   * 配置 ts-loader（见下文）
   * 配置 babel.config.js
   * 以 ts 语法编写 vue 组件
   
tsconfig.json 关键配置
```
{
  // 编译配置
  "compilerOptions": {
    // 编译输出目标 ES 版本
    "target": "ES5",
    // 采用的模块系统
    "module": "ESNext",
    // 启用装饰器
    "experimentalDecorators": true,
    // 允许编译javascript文件
    "allowJs": true,
  },
  // 编译的文件夹
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ],
  // 排除文件夹
  "exclude": [
    "node_modules"
  ]
}
```
babel.config.js 关键配置

```
module.exports = function (api) {
  api && api.cache(false)
  return {
    presets: [
      // 预设，等于配置一系列支持 ts 的 babel 插件
      "@babel/preset-typescript"
    ],
    plugins: [
      // 以下插件具有先后顺序
      // 首先编译装饰器语法
      [
        "@babel/plugin-proposal-decorators",
        {
          "legacy": true
        }
      ],
      // 再编译 class 语法
      "@babel/plugin-proposal-class-properties"
    ]
  }
}
```

Vue 组件示例（js 部分）

```
<script lang="ts">
import scout from "wy-ssr-scout"
import { Component, Prop, Vue, Provide, PropSync, Emit } from "vue-property-decorator"
import { WeTabBar, WeTabBarItem } from "wand-ui"

@Component({
  components: {
    WeTabBar,
    WeTabBarItem
  }
})
export default class WeUserDemo extends Vue {
  tabSelected: number = 0
  msg = "这是demo弹窗"
  @Prop({ type: String, default: "确认要取消吗？" }) readonly title!: string
  @Prop({ type: String, default: "" }) readonly content!: string
  @PropSync("showToast", { type: Boolean }) private show!: boolean

  @Emit("on-confirm")
  confirm(): string {
    scout.click("测试埋点", {
      page: "demo",
      type: 2
    })
    this.show = false
    return "参数被传递出来啦"
  }
}
</script>
```
**参考：**

https://www.tslang.cn/docs/handbook/tsconfig-json.html<br>
https://github.com/TypeStrong/ts-loader<br>
https://github.com/vuejs/vue-class-component<br>
https://github.com/kaorun343/vue-property-decorator<br>
https://babeljs.io/docs/en/next/babel-preset-typescript<br>
https://babeljs.io/docs/en/babel-plugin-proposal-class-properties<br>
https://babeljs.io/docs/en/babel-plugin-proposal-decorators<br>


### 热更新/模块热替换

* 热更新：修改代码保存后页面自动刷新，不保留页面状态；
* 模块热替换：修改代码保存后只替换修改的代码块，保留页面状态

配置方案（下文提到的配置方案全部基于 webpack）：

```
const webpack = require('webpack')

module.exports = {
  devServer: {
    // 启用 webpack 的模块热替换
    hot: true,
    // 只允许热替换
    hotOnly: true,
    // 单页应用刷新 404
    historyApiFallback: true,
    // 去除 host 检测
    disableHostCheck: true
  },
  // 模块热替换插件
  new webpack.HotModuleReplacementPlugin()
}

```
以上是通用热替换方案，但 ts 项目没有那么简单，通过以上配置仅实现了热更新，热替换还需要加入以下配置

```
module.exports = {
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              // 关键代码段
              // 当遇见 .vue 结尾的文件默认添加 .ts/.tsx
              // ts-loader 内部实现了 ts 代码段的热替换
              appendTsSuffixTo: [/\.vue$/],
              appendTsxSuffixTo: [/\.vue$/]
            }
          }
        ]
      }
    ]
  }
}
```
**参考：** 

https://webpack.docschina.org/plugins/hot-module-replacement-plugin/</br>
https://webpack.docschina.org/configuration/dev-server/<br/>
https://github.com/microsoft/TypeScript-Vue-Starter/blob/master/webpack.config.js

### 组件库的适配

一个业务组件被设计出来必然要支持各种机型，组件如何去更好地适配，即要在开发时不给开发人员带来困扰，又能轻易地接入到各个系统当中去，这是组件库在搭建时必然要考虑的问题。常见的适配方案：
* 百分比 + px
   * 所见才能所得，组件开发完成后必须要在各个机型上测过，是否能完美兼容；万一哪天视觉和产品纠结在 iPhone5/4！！！
   * 内容和样式之间平衡，达到那个平衡点才能完成最终适配，太难~

* rem
   * 项目中必须手动引入 rem 的类库，可能是自家的也可能是开源的，万一人家不想引呢

* vw
   * 前端内部概念较新，总感觉兼容不好（其实并不是）
   * 是否有降级方案，万一某个机型真不行，用户量又不少呢

最终采用 vw 的方案，理由如下：

* 兼容性调研
   * ios 6.1 以上，安卓 4.4以上
   * 具体参考：https://www.caniuse.com/#search=vw
* 适配方案具有独立性，不依赖项目，仅与理想视口宽度有关
* 综合考虑公司兼容性要求、开发体验和已有的兼容方案
* 由于找不到不兼容的样机，兼容方案未得到验证

如何配置：
* 核心 npm 包：
   * `postcss`
   * `postcss-loader`
   * `postcss-px-to-viewport`
   * `postcss-viewport-units`
   * `viewport-units-buggyfill`

* webpack.common.js 关键代码段

```
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        sideEffects: true,
        use: [
          'vue-style-loader',
          'css-loader',
          // 具有先后顺序，从上至下，从右往左
          'postcss-loader',
          'less-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  }
}
```

* postcss.config.js 关键代码段
```
module.exports = {
  "plugins": {
    // 自动添加前缀插件
    "autoprefixer": {},
    "postcss-px-to-viewport": {
      // 视口宽度、高度
      "viewportWidth": 375,
      "viewportHeight": 667,
      // 指定`px`转换为视窗单位值的小数位数
      "unitPrecision": 3,
      // 所要转换的单位
      "viewportUnit": "vw",
      // 添加不转换的白名单
      "selectorBlackList": [
        ".ignore",
        ".hairlines"
      ],
      // 小于或等于`1px`不转换为视窗单位
      "minPixelValue": 1,
      // 允许在媒体查询中转换`px`
      "mediaQuery": false
    },
    // 为 viewport-units-buggyfill 添加 content属性
    "postcss-viewport-units":{
      filterRule: rule => rule.nodes.findIndex(i => i.prop === 'content') === -1
    }
  }
}
```
* 降级方案
```
// index.html
<script src="//g.alicdn.com/fdilab/lib3rd/viewport-units-buggyfill/0.6.2/??viewport-units-buggyfill.hacks.min.js,viewport-units-buggyfill.min.js"></script>

<script>
  // vw兼容性处理viewport-units-buggyfill
  window.onload = function () {
    window.viewportUnitsBuggyfill.init({ hacks: window.viewportUnitsBuggyfillHacks });
  }
</script>
```
**参考：**

https://blog.csdn.net/qq_21729177/article/details/79466951<br>
https://github.com/evrone/postcss-px-to-viewport<br>
https://github.com/rodneyrehm/viewport-units-buggyfill<br>
https://github.com/springuper/postcss-viewport-units<br>

### 按需加载

印象中的按需加载

```
import { WeUserDialog } from '@weiyi/wand-ui-user'
```
通过 babel-plugin-import 转译后的按需加载
```
import WeUserDialog from '@weiyi/wand-ui-user/lib/components/dialog/index.js'
import '@weiyi/wand-ui-user/lib/components/dialog/index.css'
```

按需加载打包方式调研：

1. 以 SFC .vue 单文件方式编写组件，打包时利用 `vue-template-compiler` 手动将文件分离为template、js、css，利用 babel 系列工具将 template 与 js 输出为 js 文件，利用 less/sass、postcss 等工具输出 css 文件，如 wand-ui;

2. 模板和 js 部分使用 jsx/tsx 编写，css 样式分离，可以进行较小成本地手动打包，如 vant-ui

3. 充分利用已有的 loader，将按需加载的组件认为是多个 entry，利用 webpack 进行多入口打包，如 element-ui、nut-ui
4. ...

实践：

* 方案一：在编译 ts 和 template 模板时混入失败，无法解决
* 方案二：要是组件开发过程中强制使用 jsx，估计大家编写的热情都不高
* 方案三：最终方案，并在该方案上越走越远...

webpack.prod.demand.js 关键代码段
```
// 获取所有组件入口的绝对地址
let entry = getEntry()
module.exports =  {
  mode: 'production',
  entry,
  output: {
    // 输出的文件目录及文件名
    path: getPath('../lib'),
    filename: 'components/[name]/index.js',
    // 以库的形式输出
    library: '[name]',
    // 该库可在所有的模块定义下都可运行，如 CommonJS, AMD 等
    libraryTarget: 'umd',
    // 会对 UMD 的构建过程中的 AMD 模块进行命名
    umdNamedDefine: true,
    globalObject: 'this'
  },
  // 防止将某些 import 的包打包到 bundle 中，而是在运行时再去从外部获取这些扩展依赖
  externals: [
    {
      vue: {
        root: 'Vue',
        commonjs: 'vue',
        commonjs2: 'vue',
        amd: 'vue'
      },
      lodash: 'lodash',
      axios: 'axios',
      uuid: 'uuid',
      moment: 'moment',
      'vue-property-decorator': 'vue-property-decorator',
      'wy-ssr-scout': 'wy-ssr-scout',
      'js-cookie': 'js-cookie',
    },
    /^wand-ui\/.+$/
  ],
  optimization: {
    // 是否压缩
    minimize: true
  },
  plugins: [
    // ...
    // 从 .vue 文件中分离 css，并输出到文件
    new MiniCssExtractPlugin({
      filename: 'components/[name]/index.css'
    })
    // ...
  ]
}
```
**参考：**

https://webpack.docschina.org/configuration/externals/#externals<br>
https://github.com/youzan/vant<br>
https://github.com/ElemeFE/element<br>


### 开发体验

* 如何创建一个组件
   * packages/components 下创建组件文件夹、文件及 README
   * 更新 packages/index.ts
   * 更新 typings/index.d.ts
   * example/pages 下创建示例文件
   * 更新 router.js
   * 更新 example/index.vue

思考：能不能通过程序来一键完成上述操作？
```
npm run create
```

* eslint + prettier 保存时自动格式化，美化代码格式

* 本地站点搭建，保证自己的代码在生产环境下正确执行
```
npm run build:site
npm run start
```
```
const Koa = require('koa')
const app = new Koa()
const { historyApiFallback } = require('koa2-connect-history-api-fallback')
const static = require('koa-static')
const path = require('path')
const port = 8083

app.use(
  // 单页应用刷新 404
  historyApiFallback({
    rewrites: [{
      from: /^\/site\/.*$/,
      to: '../site/index.html'
    }]
  })
)
app.use(static(path.join(__dirname, '../site/')))

app.listen(port, () => {
  console.log(`Server listening on: http://localhost:${port}`)
})
```
**参考：**

https://github.com/jprichardson/node-fs-extra<br>
https://github.com/prettier/eslint-plugin-prettier<br>
https://github.com/ishen7/koa2-connect-history-api-fallback<br>


### 使用体验
 * markdown 预览功能
 ```

 module.exports = {
  module: {
    rules: [
      test: /\.md$/,
        use: [
          {
            loader: "vue-loader"
          },
          {
            loader: "vue-markdown-loader/lib/markdown-compiler",
            options: {
              raw: true,
              wrapper: 'article',
              preprocess: function (MarkdownIt, Source) {
                MarkdownIt.renderer.rules.table_open = function () {
                  return '<div class="table-container"><table class="table">'
                }
                MarkdownIt.renderer.rules.table_close = function () {
                  return '</table></div>'
                }
                // 给代码块添加复制样式
                const fence = MarkdownIt.renderer.rules.fence
                MarkdownIt.renderer.rules.fence = function (...args) {
                  return '<div class="markdown-code-block"><div class="markdown-code--btn-copy" @click="copyMdCode" data-clipboard-text="">复制</div>'
                    + fence(...args)
                    + '</div>'
                }
                return Source
              }
            }
          }
    ]
  }
  
 }

 ```
 * 代码一键复制
 ```
// main.ts
Vue.use(base)

// base.ts
import Clipboard from "clipboard"
export default {
  install: function(Vue: any) {
    Vue.prototype.copyMdCode = function(e: any) {
      let clipboard = new Clipboard(".markdown-code--btn-copy", {
        target: function() {
          return e.target.nextElementSibling
        }
      })
      clipboard.on("success", () => {
        alert("复制成功")
        clipboard.destroy()
      })
      clipboard.on("error", () => {
        alert("该浏览器不支持自动复制")
        clipboard.destroy()
      })
    }
  }
}
 ```
* babel-plugin-import 支持

**参考：**

https://github.com/QingWei-Li/vue-markdown-loader<br>
https://github.com/zenorocha/clipboard.js<br>
https://github.com/ant-design/babel-plugin-import

### 利用 verdaccio 搭建 npm 私服

编写 npm 包必然要测试包的发布、引用是否正常， verdaccio 是一个很不错的选择，一键搭建。期待达到的效果，安装各种包一定快，并且通过一定的配置，找不到的依赖包会去外网下载。

```
// 本地找不到的包就代理到淘宝源
uplinks:
  taobao: 
    url: https://registry.npm.taobao.org/
packages:
  '@*/*':
    # scoped packages
    access: $all
    publish: $all
    unpublish: $all
    proxy: taobao
  '**':
    access: $all
    publish: $all
    proxy: taobao

```

### 后续
1. 单文件打包过大，如 location 组件打包后 js 大小为 96k，如何解决？

   分析：一部分代码来源于 babel 编译时插入的垫片代码，一部分代码来源于 import 进来的包的代码。

   解决：移除 babel 中的垫片代码，利用 ts 的代码编译将代码编译为 ES5；打包时剔除 npm 包的依赖代码，在项目中运行时再安装，最终压缩后 js 大小为 25k。

2. 代码压缩后 Vue 组件找不到文件名，导致组件注册失效?

   分析：官方说明当 Vue 组件不设置 name 时默认会取类名作为组件名，但测试的两种打包方式（全局打包、按需打包）均出现不指定 name 名抛错的问题。

   解决：
   ```
   @Component({
      name: "WeUserAddress",
      components: {
        // ...
      }
    })
    export default class WeUserAddress extends Vue {
      // ...
    }
   ```  
3. commit 的时候进行 eslint 校验，因为本地安装了 nvm 进行 node 版本，导致提交时校验代码抛错，又考虑目前保存代码时已进行代码校验，放缓该方案的实践。
