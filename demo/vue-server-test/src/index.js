const vue = require('vue')
const koa = require('koa')
const server = new koa()
const fs = require('fs')
const renderer = require('vue-server-renderer').createRenderer({
  template: fs.readFileSync('./index.template.html', 'utf-8')
})
const createApp = require('./app.js')
const templateInfo = {
  title: '测试模板插值',
  meta: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
}
server.use(async ctx => {
  const context = { url: ctx.url }
  const app = createApp(context)
  renderer.renderToString(app, templateInfo).then(html => {
    ctx.body = html
  }).catch(err => {
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  })
})

server.listen(3000, () => {
  console.log(`server is started at http://127.0.0.1:3000`)
})