## App 内部 iPhoneX 头部适配实践（by 元丰）

### 背景

目前使用的 Hybrid App 原生和 H5 间互相跳转及转场效果体验较差，无法很好地给予用户无差别的交互体验，主要问题是 H5 的头部加载效果。在 App 容器内的头部显示可以是 H5 自己的，当然也可以是原生的，这时候就衍生出几个问题，H5 头部和原生头部该如何取舍？H5 头部的页面该如何与 App 头部进行转场交互？

### H5 头部

目前容器内部是将整屏的空间都给到 H5 （包括信号栏），之后经过几次踩坑，发现 H5 的页面还是使用 H5 自己的头部比较好，原因如下：

* 头部控制比较自由，如果产品想搞什么骚操作，也可以想办法支持，不用走版本发布；
* 历史原因，已有大量页面都是用 H5 头，统一处理起来工作量可控。

#### 传统 spa 的 H5 头部

这个就比较简单，常用方案有：

* css 适配，iPhoneX 及以上刘海屏使用 **安全距离**，有个坑，安全距离有个版本区别；
* 使用 **媒体查询**，对不同设备进行不同的样式兼容，如使用 margin-top
* 使用 js 处理，可以通过浏览器 ua 来进行判断，区别对待 iPhoneX 以下和以上机型

使用安全距离适配，属性分为constant（ 兼容 iOS < 11.2）和env（兼容 iOS >= 11.2），都要写。
```
// HTML 代码
<meta name="viewport" content="width=device-width, viewport-fit=cover">

// css 代码
{
  // 兼容 iOS < 11.2
  padding-bottom: constant(safe-area-inset-bottom);
  // 兼容 iOS >= 11.2
  padding-bottom: env(safe-area-inset-bottom);
}

// 使用计算高度
{
  height: calc(60px + constant(safe-area-inset-bottom));
  height: calc(60px + env(safe-area-inset-bottom));
}
```

#### 基于 ssr 的 H5 头部适配

* 踩坑一：由于 ssr 是直接输出整个 html，css 的安全距离计算和媒体查询都会稍稍晚于页面的渲染，在 iPhoneX 内会导致很明显头部高度变化，在用户看来页面就会卡顿一下。所以基于 css 的屏幕适配在服务端渲染基本被 pass 掉了，只能通过 js 来控制。

* 踩坑二：由于历史原因，app 容器内竟然不会告诉服务端上下文当前机型是 iPhoneX（ssr 会注入一个环境变量，输出当前 app 的一些信息，包括机型），新版本已经联系 app 的同事进行处理了。

**理想状态：** 如果 app 能够提供完善的机型判断逻辑，一切都是很美好的，在 `created` 的生命周期中进行机型判断，html 输出的时候距离已经计算好了。

**现实状态：** iOS 其他版本的没有问题，就是 iPhoneX 以上机型，服务端上下文中拿不到机型，只能在浏览器端去取值 ua，这时有两个生命周期可以使用`beforeMount`（已经完成模板编译，但还没有挂载到页面中）、`mounted`（将编译好的模板挂载到页面指定的容器并显示），经过测试 `beforeMount` 基本能满足要求，不会给用户带来明显的页面卡顿。

```
const _getUA = function (context) {
  let ua = ''
  if (isServer) {
    // 服务端获取 ua
    ua = context && context.req ? context.req.get('user-agent') : ''
  } else {
    // 客户端获取 ua
    ua = navigator.userAgent
  }
  return ua
}

// 获取 ua
const ua = _getUA(context)
// iPhone
const isiPhone = ua.indexOf('iPhone') > -1
// 当前为浏览器环境
const isBrowser = typeof navigator !== 'undefined'
if (isBrowser) {
  const { width, height } = window.screen
  // iPhoneX
  const isiPhoneX = isiPhone && (width * height === 304500 || width * height === 370944)
}

```

### App 头部转场效果

首先得先确认 app 能够提供的 bridge 方法，如下：

* 通过路由参数 `disabled_bar=1` 来判断是否显示原生头部。起初的方案是在 H5 加载的过程中告知 app 是否需要隐藏头部，这样就有明显延时，容器页面加载过程中默认显示 app 头部，然后通过动画隐藏，体验不佳；后续改为 app 拦截路由参数，在页面加载前就已判断完成；

* 提供了 `openNewPage` 打开新容器（标签）页面的 bridge 方法。不可滥用，过多的新标签页容易导致 app 内存溢出。

* 提供了 `closePage` 关闭当前标签页的 bridge 方法。

* 提供了 `isShowPage`判断当前页面是否被展示的 bridge 方法。

跳转分析：

* 原生头部 -> 原生头部 || H5头部 -> H5头部，同一域名下内单页跳转，非同一域名 **同一容器内** 多页跳转

* 原生头部 -> H5 头部 || H5 头部 —> 原生头部，目前都是在 **同一容器内** 进行切换，app 内部每次都会在同一个标签页内计算当前是否需要隐藏头部，效果体验极差。

#### 问题解析

> 原生头部和 H5 头部进行切换的体验优化？

如果在同一标签内 H5 头部和原生头部的切换，app 能够优化到用户无感知，也就没有我们优化的地方了，但肯定是有无法解决的瓶颈，而且还有低版本兼容问题。所以如果我们从 H5 的角度考虑这个问题，可以从流程优化的方向入手。在同一个页面卡，我们新开个容器页不就解决问题了~但有一点需要考虑，当新开容器页被关闭时，老的页面是否有数据需要被更新（如，红点等）。

> App 内部 H5 页面返回流程优化，a->b->c->d->e，e 页面有一个返回首页的按钮，点击按钮返回 b，点击 b 的返回按钮需要回到 a 该如何实现？

如果单纯从 H5 的角度解决这个问题，你可以从 b 开始，每个页面的跳转都是 replace 的方式去跳转，但有多少几率一个长流程的每个页面都是同一次需求、同一个项目里去做的呢？这时我们可以利用 app 提供的方法，从 b 开始打开新容器，到 e 关闭容器，同样需要注意 b 重新显示时需要更新数据的地方。




