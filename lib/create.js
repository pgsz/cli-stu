const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const inquirer = require('inquirer')
const PromptModuleAPI = require('./PromptModuleAPI')
const Creator = require('./Creator')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const { savePreset, rcPath } = require('./utils/options')
const { log } = require('./utils/logger')
const { saveOptions } = require('./utils/options')
const PackageManager = require('./PackageManager')

async function create(name) {
    const targetDir = path.join(process.cwd(), name)
    // 
    // 如果目标目录已存在，询问是覆盖还是合并
    if (fs.existsSync(targetDir)) {
        // 清空控制台
        clearConsole()
        
        inquirer.prompt
        const { action } = await inquirer.prompt([
            {
                name: 'action',
                type: 'list',
                message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
                choices: [
                    { name: 'Overwrite', value: 'overwrite' },
                    { name: 'Merge', value: 'merge' },
                    { name: 'Cancel', value: false },
                ],
            },
        ])

        // 取消
        if (!action) return

        if (action === 'overwrite') {
            console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
            // 覆写 先移除
            await fs.remove(targetDir)
        }
    }

    const creator = new Creator()
    // 获取各个模块的交互提示语
    const promptModules = getPromptModules()
    // 注入提示语
    const promptAPI = new PromptModuleAPI(creator)
    promptModules.forEach(m => m(promptAPI))

    // 清空控制台
    clearConsole()

    // 弹出交互提示语并获取用户的选择
    const answers = await inquirer.prompt(creator.getFinalPrompts())

    // preset 为 __manual__  表明事先配置好的 不是手动配置的
    if (answers.preset !== '__manual__') {
        const preset = creator.getPresets()[answers.preset]
        Object.keys(preset).forEach(key => {
            // answer 值：
            // {
            //     preset: 'default',
            //     features: ['babel', 'linter'],
            //     historyMode: false,
            //     eslintConfig: 'airbnb',
            //     lintOn: ['save'],
            // }
            answers[key] = preset[key]
        })
    }

    // 保存哪个包管理 yarn/npm
    if (answers.packageManager) {
        saveOptions({
            packageManager: answers.packageManager,
        })
    }

    // 将本次手动配置保存到 .pgrc
    if (answers.save && answers.saveName && savePreset(answers.saveName, answers)) {
        log()
        log(`Preset ${chalk.yellow(answers.saveName)} saved in ${chalk.yellow(rcPath)}`)
    }

    // 判断使用哪个 包管理源 npm/yarn
    const pm = new PackageManager(targetDir, answers.packageManager)

    // package.json 文件内容
    const pkg = {
        name,
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
    }
    
    /**
     * 1:往 pkg 注入依赖，形成最终的 package.json 模板
     * 2：调用 render 生成对应的模板，保存到 files 里
     * 3：根据 files 生成对应的文件
    */
    const generator = new Generator(pkg, targetDir)
    // 填入 vue webpack 必选项，无需用户选择
    answers.features.unshift('vue', 'webpack')

    // 根据用户选择的选项加载相应的模块，在 package.json 写入对应的依赖项
    // 并且将对应的 template 模块渲染
    answers.features.forEach(feature => {
        require(`./generator/${feature}`)(generator, answers)
    })

    // 生成文件
    await generator.generate()

    // 下载依赖
    await pm.install()
    log('\n依赖下载完成! 执行下列命令开始开发：\n')
    log(`cd ${name}`)
    log(`${pm.bin === 'npm'? 'npm run' : 'yarn'} dev`)
}

function getPromptModules() {
    return [
        'babel',
        'router',
        'vuex',
        'linter',
    ].map(file => require(`./promptModules/${file}`))
}

module.exports = create