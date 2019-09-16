# 使用单元测试提高 Vue 项目的代码质量（by 宇清）

## 为什么要单元测试（单测，UT）？

### 提高代码质量

### 重构无压力

- 解决 “我也不知道这是什么代码，但是又不敢删”

## 给现有的 Vue 项目添加单元测试

[vue-cli](https://cli.vuejs.org) 已经完美集成了单元测试的[插件](https://cli.vuejs.org/guide/#cli-plugins)，可以无压力添加 UT。如果现有的项目没有使用 vue-cli，则需要手动添加 UT 工具链

### 测试框架
- [Jest](https://jestjs.io/)
- [Mocha](https://mochajs.org/)

官方支持两种框架 Jest 和 Mocha，本文以 Jest 为例

### 相关依赖包

```
babel7
@vue/test-utils
jest
vue-jest@4.0.0-beta.2 // 3.x 不支持 babel7+
```

### 配置


- `package.json` 中添加相关 script

  ```json
  {
    "scripts": {
      // 其他脚本
      "test": "jest"
    }
  }
  ```

- Jest 配置文件。在根目录创建 `jest.config.js`。所有配置，请参考[官网文档](https://jestjs.io/docs/en/configuration)

  ```js
  module.exports = {
    moduleFileExtensions: [
      'js',
      'json',
      'vue'
    ],
    transform: {
      '.*\\.(vue)$': 'vue-jest',
      '^.+\\.js$': '<rootDir>/node_modules/babel-jest' // 使用 babel
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1' // 映射目录的别名
    },
    testPathIgnorePatterns: [
      '<rootDir>/src/router/modules/test.js' // 乎略的文件
    ]
  }
  ```

- 添加测试覆盖率报告，参考[文档](https://vue-test-utils.vuejs.org/guides/#coverage) (待验证)

  ```json
  {
    // ...
    "collectCoverage": true,
    "collectCoverageFrom": ["**/*.{js,vue}", "!**/node_modules/**"]
  }
  ```

## 编写单元测试

### 需要为哪些代码写单测？

原则上**所有**代码都需要单元测试。我们的追求是覆盖率 100%。然而现实很骨干，大家业务繁忙，都没（lan）空（de）写单元测试。所以，我们可以考虑为以下两种代码写单测

- 工具类函数。这类函数一般由调用者输入参数，并返回一个值。这类函数比较容易书写单元测试。
- 公共 Vue 组件

### 工具类函数的单测

> 更多功能（包括 Mock 等），请阅读 Jest 官方文档

```js
// utils.test.js

import { add } from './utils'

test("add two numbers", () => {
  expect(add(1, 2)).toBe(3)
})
```

### 组件的单测

> 更多厉（zhuang）害（bi）的写法，请阅读 [Vue Test Utils 官方文档](https://vue-test-utils.vuejs.org/)。文档不长，很快就能读完。

```js
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import XHeader from '../x-header'

const localVue = createLocalVue()
// 注册 Vuex 的 $store
localVue.use(Vuex)
// 注册 directive
localVue.directive('user-directive', function(){})

describe('XHeader', () => {
  let store
  beforeEach(() => {
    store = new Vuex.Store({
      state: {}
      }
    })
  })
  test('is a Vue instance', () => {
    const wrapper = shallowMount(XHeader, { localVue, store })
    expect(wrapper.isVueInstance()).toBeTruthy()
  })
})
```

## Run！

```
$ npm run test
```

**强烈推荐在以下场景跑单元测试**

- 提交代码之前
- 修 bug 之后
- 添加测试用例之后
- 给现有的模块添加新功能后
