const getPackage = require('./utils/getPackage')
const clearConsole = require('./utils/clearConsole')
const inquirer = require('inquirer')
const Generator = require('./Generator')
const PackageManager = require('./PackageManager')
const { log } = require('./utils/logger')

const addNameList = ['babel', 'linter', 'router', 'vuex']

// 新增插件
async function add(name) {
    if (!addNameList.includes(name)) {
        log(`\n请添加如下选项：${addNameList.join(',')}\n`)
        return
    }

    const targetDir = process.cwd()
    //  获取项目中 package.json 文件中内容
    const pkg = getPackage(targetDir)

    clearConsole()

    pkg.devDependencies[`pg-cli-plugin-${name}`] = '~0.0.1'

    const pm = new PackageManager(targetDir, answers.packageManager)
    await pm.install()

    let answers = {}
    // 交互提示语
    if (name === 'linter' || name === 'router') {
        try {
            const pluginPrompts = require(`pg-cli-plugin-${name}/prompts`)
            answers = await inquirer.prompt(pluginPrompts)
        } catch (error) {
            console.log(error)
        }
    }

    const generator = new Generator(pkg, targetDir)
    require(`pg-cli-plugin-${name}/generator`)(generator, answers)

    await generator.generate()
    // 下载依赖
    await pm.install()
    log(`Successfully invoked generator for plugin: pg-cli-plugin-${name}`)
}

module.exports = add