// https://www.npmjs.com/package/execa
const execa = require('execa')

// 在终端执行 命令行
module.exports = function executeCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        /**
         * 第一个参数： 运行脚本的命令
         * 第二个参数： 参数列表，脚本需要的参数，数组
         * 第三个参数： 选项
        */
        const child = execa(command, [], {
            // 用户创建的项目路径
            cwd,
            // http://nodejs.cn/api/child_process.html
            stdio: ['inherit', 'pipe', 'inherit'],
        })

        // 将子进程输出传给主进程，也就是输出到控制台，可以看到进度
        child.stdout.on('data', buffer => {
            process.stdout.write(buffer)
        })

        // 关闭
        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`command failed: ${command}`))
                return
            }

            resolve()
        })
    })
}