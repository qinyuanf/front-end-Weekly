const koa = require('koa')
const server = new koa()
const fs = require('fs')
const { createBundleRenderer } = require('vue-server-renderer')
const serverBundle = require('../dist/built-server-bundle.js')
const renderer = createBundleRenderer(serverBundle, {
  template: fs.readFileSync('./index.template.html', 'utf-8'),
  runInNewContext: false,
  // clientManifest
})

server.use(async ctx => {
  const context = { url: ctx.url }
  renderer.renderToString(context).then(html => {
    ctx.body = html
  }).catch(err => {
    let status, content
    if (err.code === 404) {
      status = 404
      content = 'Page Not Find'
    } else {
      status = 500
      content = 'Internal Server Error'
    }
    ctx.status = status
    ctx.body = content
  })
})

server.listen(3000, () => {
  console.log(`server is started at http://127.0.0.1:3000`)
})