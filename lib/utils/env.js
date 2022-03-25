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

exports.hasProjectYarn = (cwd) => {
    const lockFile = path.join(cwd, 'yarn.lock')
    const result = fs.existsSync(lockFile)
    return checkYarn(result)
}

function checkYarn(result) {
    if (result && !exports.hasYarn()) throw new Error(`The project seems to require yarn but it's not installed.`)
    return result
}