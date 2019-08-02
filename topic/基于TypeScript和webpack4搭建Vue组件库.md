## 基于 TypeScript + Webpack4 搭建 Vue 业务组件库（by qinyf）

### 背景
周所周知，基础组件库是从业务中抽象出来的，功能相对单一、独立，在整个系统的代码层次中位于最底层，被其他代码所依赖。由于考虑到扩展性及通用性，基础组件基本不包含任何业务代码或 http 请求。但实际开发中又会存在着对某块业务的封装，或者是交互设计师针对当前业务做出特定交互设计，这时就需要一个系统来承载这些组件，便于跨业务单元进行调用。

### 组件库特征
* 开发层面
   * 支持 TypeScript
   * 支持模块热替换
   * 一键创建/删除组件模板，更专注于功能开发
   * 使用 vw 布局方案
* 使用层面
   * 支持全局引入
   * 支持按需引入
   * 支持 babel-plugin-import

### 从 0 开始
创建文件夹并快速生成 package.json 文件
```
mkdir library-test
cd library-test
// 直接创建 json 文件，后期可修改
npm init --yes
```

安装一波依赖
```
// webpack、webpack-cli：js 打包工具
// typescript：支持 typescript
// *-loader：对应文件的解析和转换器
// vue-template-compiler：vue 模板文件解析器

npm install --save-dev typescript webpack webpack-cli ts-loader css-loader vue vue-loader vue-template-compiler
```

因为需要支持 ts，在当前项目手动创建 tsconfig.json，或全局安装 typescript 后，执行 `tsc --init`。贴一波配置文件：
```
{
  "compilerOptions": {
    // 编译输出目标 ES 版本
    "target": "esnext",
    // 采用的模块系统
    "module": "esnext",
    // 以严格模式解析
    "strict": true,
    // 在.tsx文件里支持JSX
    "jsx": "preserve",
    // 导入辅助函数
    "importHelpers": true,
    // 如何处理模块
    "moduleResolution": "node",
    // 启用装饰器
    "experimentalDecorators": true,
    "esModuleInterop": true,
    // 允许从没有设置默认导出的模块中默认导入
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    // 允许编译javascript文件
    "allowJs": true,
    "baseUrl": ".",
    "types": [],
    "paths": {
      "@": ["src/*"]
    },
    "lib": [
      "esnext",
      "dom",
      "dom.iterable",
      "scripthost"
    ]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "tests/**/*.ts",
    "tests/**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
参考：https://www.tslang.cn/docs/handbook/tsconfig-json.html