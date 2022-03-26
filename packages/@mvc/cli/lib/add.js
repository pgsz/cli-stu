const path = require('path')
const inquirer = require('inquirer')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const PackageManager = require('./PackageManager')
const getPackage = require('./utils/getPackage')
const readFiles = require('./utils/readFiles')

async function add(name) {
    const targetDir = process.cwd()
    const pkg = getPackage(targetDir)
    // 清空控制台
    clearConsole()

    let answers = {}
    try {
        const pluginPrompts = require(`@mvc/cli-plugin-${name}/prompts`)
        answers = await inquirer.prompt(pluginPrompts)
    } catch (error) {
        console.log(error)
    }

    const generator = new Generator(pkg, targetDir, await readFiles(targetDir))
    const pm = new PackageManager(targetDir, answers.packageManager)
    require(`@mvc/cli-plugin-${name}/generator`)(generator, answers)

    await generator.generate()
    // 下载依赖
    await pm.install()
}

module.exports = add