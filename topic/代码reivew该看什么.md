## 代码 reivew 该看什么？（多人维护，不断总结）

### 背景

基于 sentry 和 gtrace 的线上问题分析

> 问题：直接操作 dom 元素 ，不能确定元素是否存在（by 元丰）

**案例：** x-header 在微信中是隐藏的，存在操作 dom 元素时需要区分环境

```
const domStyle = this.$refs['x-header'].$el.children[0].style
```

**解决：** 加入当前 dom 是否存在的判断

```
const XHeader = this.$refs['x-header'].$el.children
if (XHeader) { // ... }
```

> 问题：服务端渲染发生重定向时，提示 “Cannot set headers after they are sent to the client;”（by 元丰）

![review-8](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-8.png "review-8")

**参考：** https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client

**原因：** 在 res.redirect 之后继续调用 res.clearCookie、res.redirect 等方法；return 方法的正确使用

**复现：** 

```
var express = require('express')
var app = express()

function redirectInFunction (res) {
  return res.redirect('/page1')
}

app.get('/', function(req, res) {
  const a = 1
  if (a) {
    // 错误写法，方法内无法被及时 return，还会继续调用 res.redirect
    // res.redirect 之后继续调用 res.clearCookie、res.redirect 等方法将导致以下错误
    // Cannot set headers after they are sent to the client
    redirectInFunction(res)

    // 正确写法，return 语句之后的代码将不会被执行
    // return res.redirect('/page1')
  }
  return res.redirect('/page2')
})
app.get('/page1', function (req, res) {
  res.send('这是page-----1')
})
app.get('/page2', function (req, res) {
  res.send('这是page-----2')
})
app.listen(3000, () => {
  console.log('server is starting at 3000');
})
```

> 问题：Cannot read property 'req' of null（by 元丰）

![review-9](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-9.png "review-9")

**原因：** axios的 get 和 post 请求参数使用不正确

**官方实现：**

```
// get 请求方式一
axios.get('/user?ID=12345')
  .then(function (response) {
    // handle success
    console.log(response)
  })
  .catch(function (error) {
    // handle error
    console.log(error)
  })
  
// get 请求方式二
axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response)
  })
  .catch(function (error) {
    console.log(error)
  })  
  
// 注意“get 请求方式二”和“post 请求方式”传参的差别
// post 请求方式
axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response)
  })
  .catch(function (error) {
    console.log(error)
  })
```

**项目中实现：**

```
// 注意 post 和 get 请求 params 参数的位置
// post 请求方式
export const setReadStatus = function (context, params = {}) {
  return gatewayAPI.post('/healthvip/rest/invitereward/black/records/read.json', params, {
    context
  }).then(response => {
    return utils.getWithNil(response, 'data.data', null)
  })
}

// get 请求方式
export const getActivity = function (context, params = {}) {
  return gatewayAPI.get('/healthvip/rest/invitereward/black/rights/stats.json', {
    context,
    params
  }).then(response => {
    return utils.getWithNil(response, 'data.data', {})
  })
}
```