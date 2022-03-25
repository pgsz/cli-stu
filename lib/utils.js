// https://github.com/sindresorhus/ora
const ora = require('ora')

/**
 * loading 加载效果
 * message：加载信息
 * fn：加载函数
 * args：fn 函数执行的参数
 * 返回执行结果
*/
async function loading(message, fn, ...args) {
  const spinner = ora(message)
  // 项目加载
  spinner.start()
  try {
    let executeRes = await fn(...args)
    // 执行成功
    spinner.succeed()
    // 返回执行结果
    return executeRes
  } catch {
    spinner.fail("Request fail, refetching")
    await sleep(1000)
    // 重新拉取
    return loading(message, fn, ...args)
  }

}

function sleep(n) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, n)
  })
}

module.exports = {
  loading
}