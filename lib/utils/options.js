const fs = require('fs')
const cloneDeep = require('lodash.clonedeep')
const { getRcPath } = require('./rcPath')
const exit = require('./exit')
const { error } = require('./logger')

/**
 * 在 vue-cli 创建项目时，回生成 .vuerc 文件，记录一些关于项目的配置信息
 * 例如：使用哪个包管理器、npm源是否使用淘宝等
 * 
 * 此处脚手架配置文件为： .pgrc
 * 保存在 C:\Users\pengguang 下
 * 保存用户创建项目的配置，当重新创建项目时，可以直接选择以前创建过的配置，无需一步步的选择
*/
// eslint-disable-next-line no-multi-assign
const rcPath = exports.rcPath = getRcPath('.pgrc')

exports.defaultPreset = {
    features: ['babel', 'linter'],
    historyMode: false,
    eslintConfig: 'airbnb',
    lintOn: ['save'],
}

exports.defaults = {
    packageManager: undefined,
    useTaobaoRegistry: undefined,
    presets: {
        default: { ...exports.defaultPreset },
    },
}

let cachedOptions

// 读取并返回用户配置项
exports.loadOptions = () => {
    if (cachedOptions) {
        return cachedOptions
    }
    if (fs.existsSync(rcPath)) {
        try {
            // 读取配置
            cachedOptions = JSON.parse(fs.readFileSync(rcPath, 'utf-8'))
        } catch (e) {
            error(
                `Error loading saved preferences: `
        + `~/.pgrc may be corrupted or have syntax errors. `
        + `Please fix/delete it and re-run vue-cli in manual mode.\n`
        + `(${e.message})`,
            )
            exit(1)
        }
        
        return cachedOptions
    } 
    return {}
}

// 保存配置项
exports.saveOptions = (toSave) => {
    // 合并选项，用户的覆盖现有的    
    // note: 为什么需要使用 cloneDeep()
    const options = Object.assign(cloneDeep(exports.loadOptions()), toSave)
    for (const key in options) {
        if (!(key in exports.defaults)) {
            // 避免无用字段进入
            delete options[key]
        }
    }
    cachedOptions = options
    try {
        // 保存
        fs.writeFileSync(rcPath, JSON.stringify(options, null, 2))
        return true
    } catch (e) {
        error(
            `Error saving preferences: `
      + `make sure you have write access to ${rcPath}.\n`
      + `(${e.message})`,
        )
    }
}

exports.savePreset = (name, preset) => {
    preset = filter(preset)
    const presets = cloneDeep(exports.loadOptions().presets || {})
    presets[name] = preset

    return exports.saveOptions({ presets })
}

function filter(preset, keys = ['preset', 'save', 'saveName', 'packageManager']) {
    preset = { ...preset }
    keys.forEach(key => {
        delete preset[key]
    })

    return preset
}