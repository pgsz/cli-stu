// create 命令处理函数
const path = require('path')
const inquirer = require('inquirer')
const PromptModuleAPI = require('./PromptModuleAPI')
const Creator = require('./Creator')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const executeCommand = require('./utils/executeCommand')

async function create(name) {
    // 创建 creator 对象
    const creator = new Creator()
    // 获取各个模块的交互提示语
    const promptModules = getPromptModules()
    // 将所有交互提示注入到 creator 对象中
    const promptAPI = new PromptModuleAPI(creator)
    // 执行方法，得到完整的 creator 对象
    promptModules.forEach(m => m(promptAPI))

    // 清空控制台
    clearConsole()

    // 弹出交互提示语并获取用户的选择
    /**
     * answers 值为：  用户的选择
     * {
          features: [ 'babel', 'router', 'vuex', 'linter' ],
          historyMode: true,
          eslintConfig: 'airbnb',
          lintOn: [ 'save' ]
       }
    */
    const answers = await inquirer.prompt(creator.getFinalPrompts())

    // package.json 文件内容
    const pkg = {
        name,
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
    }
    
    // 第二个参数是 路径
    const generator = new Generator(pkg, path.join(process.cwd(), name))
    // 填入 vue webpack 必选项，无需用户选择
    answers.features.unshift('vue', 'webpack')

    // 下面重点：：
    
    // 根据用户选择的选项加载相应的模块，在 package.json 写入对应的依赖项
    // 并且将对应的 template 模块渲染
    answers.features.forEach(feature => {
        require(`./generator/${feature}`)(generator, answers)
    })

    // 下载文件
    await generator.generate()

    console.log('\n正在下载依赖...\n')

    // 执行 npm install 下载依赖
    await executeCommand('npm install', path.join(process.cwd(), name))

    console.log('\n依赖下载完成! 执行下列命令开始开发：\n')
    console.log(`cd ${name}`)
    console.log(`npm run dev`)
}

/**
 * 获取对应的模板，作用：
 *  1：向 pkg 变量注入依赖
 *  2：提供模板文件
*/
function getPromptModules() {
    return [
        'babel',
        'router',
        'vuex',
        'linter',
    ].map(file => require(`./promptModules/${file}`))
}

module.exports = create