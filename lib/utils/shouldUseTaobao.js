const execa = require('execa')
const chalk = require('chalk')
const request = require('./request')
const { hasYarn } = require('./env')
const inquirer = require('inquirer')
const registries = require('./registries')
const { loadOptions, saveOptions } = require('./options')
  
async function ping(registry) {
    await request.get(`${registry}/vue-cli-version-marker/latest`)
    return registry
}
  
function removeSlash(url) {
    return url.replace(/\/$/, '')
}
  
let checked
let result
  
module.exports = async function shouldUseTaobao(command) {
    if (!command) {
        command = hasYarn() ? 'yarn' : 'npm'
    }
  
    // ensure this only gets called once.
    if (checked) return result
    checked = true
  
    // previously saved preference
    // 以前保存好的偏好，有误 useTaobaoRegistry 字段
    const saved = loadOptions().useTaobaoRegistry
    // 有的话 直接将结果返回
    if (typeof saved === 'boolean') {
        return (result = saved)
    }
  
    const save = val => {
        result = val
        saveOptions({ useTaobaoRegistry: val })
        return val
    }
  
    let userCurrent
    try {
        // 获取当前源  npm/yarn config get registry
        userCurrent = (await execa(command, ['config', 'get', 'registry'])).stdout
    } catch (registryError) {
        try {
        // Yarn 2 uses `npmRegistryServer` instead of `registry`
            userCurrent = (await execa(command, ['config', 'get', 'npmRegistryServer'])).stdout
        } catch (npmRegistryServerError) {
            return save(false)
        }
    }
  
    const defaultRegistry = registries[command]
    // 当前源 和 默认源 不一致的时候
    if (removeSlash(userCurrent) !== removeSlash(defaultRegistry)) {
        // user has configured custom registry, respect that
        // 将 useTaobaoRegistry 设置为 false
        return save(false)
    }
  
    let faster
    try {
        // 向 npm 默认源和淘宝源各发一个 get 请求
        // 用 race 来判断哪个请求会先返回
        faster = await Promise.race([
            ping(defaultRegistry),
            ping(registries.taobao),
        ])
    } catch (e) {
        return save(false)
    }
  
    // 将其结果保存到配置项
    if (faster !== registries.taobao) {
        // default is already faster
        return save(false)
    }
  
    if (process.env.VUE_CLI_API_MODE) {
        return save(true)
    }
  
    // ask and save preference
    // 询问是否切换到 淘宝源
    const { useTaobaoRegistry } = await inquirer.prompt([
        {
            name: 'useTaobaoRegistry',
            type: 'confirm',
            message: chalk.yellow(
                ` Your connection to the default ${command} registry seems to be slow.\n`
            + `   Use ${chalk.cyan(registries.taobao)} for faster installation?`,
            ),
        },
    ])
    
    // 注册淘宝源
    if (useTaobaoRegistry) {
        // 即 npm/yarn config set registry 淘宝源
        await execa(command, ['config', 'set', 'registry', registries.taobao])
    }

    return save(useTaobaoRegistry)
}
