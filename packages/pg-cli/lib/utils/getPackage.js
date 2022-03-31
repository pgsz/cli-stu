const path = require('path')
const fs = require('fs')

// 获取对应项目中的 package.json 内容
module.exports = function getPackage(context) {
    const packagePath = path.join(context, 'package.json')
    
    let packageJson
    try {
        packageJson = fs.readFileSync(packagePath, 'utf-8')
    } catch (error) {
        throw new Error(`The package.json file at '${context}' does not exist`)
    }

    try {
        packageJson = JSON.parse(packageJson)
    } catch (error) {
        throw new Error('The package.json is malformed')
    }

    return packageJson
}