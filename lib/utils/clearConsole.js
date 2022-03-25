const readline = require('readline')
// 清空控制台
// 来源 Vue 源码 https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-shared-utils/lib/logger.js
module.exports = function clearConsole(title) {
    if (process.stdout.isTTY) {
        const blank = '\n'.repeat(process.stdout.rows)
        console.log(blank)
        readline.cursorTo(process.stdout, 0, 0)
        readline.clearScreenDown(process.stdout)
        if (title) {
            console.log(title)
        }

        // // 移动到那个位置
        // process.stdout.cursorTo(0, 0)
        // // 还有 clearLine：清空当前行   write：输出
        // // 清空目标光标下面的部分
        // process.stdout.clearScreenDown()
    }
}