const { hasYarn } = require('./utils/env')
// 是否是手动配置
const isManualMode = answers => answers.preset === '__manual__'

const {
    defaults,
    // 返回之前保存的配置项，保存在 C:\Users\pengguang\.pgrc
    loadOptions,
} = require('./utils/options')

class Creator {
    constructor() {
        this.injectedPrompts = []
        const { presetPrompt, featurePrompt } = this.getDefaultPrompts()
        this.presetPrompt = presetPrompt
        this.featurePrompt = featurePrompt
    }

    getFinalPrompts() {
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = (answers) => isManualMode(answers) && originalWhen(answers)
        })

        const prompts = [
            this.presetPrompt,
            this.featurePrompt,
            ...this.injectedPrompts,
            ...this.getOtherPrompts(),
        ]

        return prompts
    }

    getPresets() {
        // 读取现有的配置
        const savedOptions = loadOptions()
        return { ...savedOptions.presets, ...defaults.presets }
    }

    // 读取配置： 是否需要手动配置，手动配置的内容
    getDefaultPrompts() {
        const presets = this.getPresets()
        // "pgTest": {
        //   "features": [
        //       "babel",
        //       "router",
        //       "vuex",
        //       "linter"
        //   ],
        //   "historyMode": true,
        //   "eslintConfig": "airbnb",
        //   "lintOn": [
        //       "save"
        //   ]
        // }
        const presetChoices = Object.entries(presets).map(([name, preset]) => {
            let displayName = name

            return {
                // pgTest (babel,router,vuex,linter)
                name: `${displayName} (${preset.features})`,
                value: name,
            }
        })

        const presetPrompt = {
            name: 'preset',
            type: 'list',
            message: `Please pick a preset:`,
            choices: [
                // 默认配置
                ...presetChoices,
                // 手动模式提示语
                {
                    name: 'Manually select features',
                    value: '__manual__',
                },
            ],
        }

        const featurePrompt = {
            name: 'features',
            // 是否是手动配置
            when: isManualMode,
            type: 'checkbox',
            message: 'Check the features needed for your project:',
            choices: [],
            pageSize: 10,
        }

        return {
            presetPrompt,
            featurePrompt,
        }
    }

    // 是否保存手动配置，存在 yarn 和 npm 时，询问使用哪个包管理
    getOtherPrompts() {
        const otherPrompts = [
            {
                name: 'save',
                // 手动配置时，才会出现提示
                when: isManualMode,
                type: 'confirm',
                message: 'Save this as a preset for future projects?',
                default: false,
            },
            {
                name: 'saveName',
                when: answers => answers.save,
                // 输入保存配置的名称
                type: 'input',
                message: 'Save preset as:',
            },
        ]

        const savedOptions = loadOptions()
        // 没有 packageManager 且 有 yarn 环境，则询问选择哪个包管理，第一次保存之后则会保存packageManager
        if (!savedOptions.packageManager && hasYarn) {
            const packageManagerChoices = []

            if (hasYarn()) {
                packageManagerChoices.push({
                    name: 'Use Yarn',
                    value: 'yarn',
                    short: 'Yarn',
                })
            }

            packageManagerChoices.push({
                name: 'Use NPM',
                value: 'npm',
                short: 'NPM',
            })

            otherPrompts.push({
                name: 'packageManager',
                type: 'list',
                message: 'Pick the package manager to use when installing dependencies:',
                choices: packageManagerChoices,
            })
        }

        return otherPrompts
    }
}

module.exports = Creator