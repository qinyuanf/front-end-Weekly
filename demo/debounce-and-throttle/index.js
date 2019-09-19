// 防抖
const debounce = (fn, delay) => {
  // 设置一个 timer
  let timer = null
  
  return function () {
    // 获取当前 return 函数作用域和参数
    const args = arguments
    const vm = this
    // 清除正在执行的函数
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(vm, args)
    }, delay)
  }
}

// 节流，时间戳 + 定时器
const throttle = (fn, delay) => {
  let timer = null
  // 开始时间，事件未开始就已赋值
  let startTime = Date.now()
  return function () {
    const endTime = Date.now()
    // 剩余时间
    const remainTime = delay - (endTime - startTime)
    const vm = this
    const args = arguments
    clearTimeout(timer)
    if (remainTime <= 0) {
      fn.apply(vm, args)
      startTime = Date.now()
    } else {
      timer = setTimeout(fn, remainTime)
    }
  }
}