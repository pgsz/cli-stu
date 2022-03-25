const fs = require('fs-extra')
const path = require('path')

/**
 * 1：遍历所有渲染好的文件，逐一生成
 * 2：生成文件时，确认父目录是否存在，不存在，则生成父目录
 * 3：生成文件
*/
module.exports = async function writeFileTree(dir, files) {
    Object.keys(files).forEach((name) => {
        const filePath = path.join(dir, name)
        // 创建目录，确保目录的存在，不存在则创建一个
        fs.ensureDirSync(path.dirname(filePath))
        fs.writeFileSync(filePath, files[name])
    })
}
