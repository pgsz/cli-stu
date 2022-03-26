const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

let _hasYarn
// 是否存在 yarn 包
exports.hasYarn = () => {
    if (_hasYarn != null) {
        return _hasYarn
    }
    try {
        // http://nodejs.cn/api/child_process.html#child_processexecsynccommand-options
        // 运行 yarn --version  有版本号,则表面有 yarn 包
        execSync('yarn --version', { stdio: 'ignore' })
        return (_hasYarn = true)
    } catch (e) {
        return (_hasYarn = false)
    }
}

// 项目中是否是 yarn 管理源
exports.hasProjectYarn = (cwd) => {
    const lockFile = path.join(cwd, 'yarn.lock')
    // 是否存在 yarn.lock
    const result = fs.existsSync(lockFile)
    return checkYarn(result)
}

function checkYarn(result) {
    // 项目使用的 yarn 但电脑环境中没安装 yarn，则提示
    if (result && !exports.hasYarn()) throw new Error(`The project seems to require yarn but it's not installed.`)
    return result
}