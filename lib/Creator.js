// 处理交互提示
class Creator {
    constructor() {
        this.featurePrompt = {
            name: 'features',
            message: 'Check the features needed for your project:',
            pageSize: 10,
            type: 'checkbox',
            choices: [],
        }

        this.injectedPrompts = []
    }

    getFinalPrompts() {
        this.injectedPrompts.forEach(prompt => {
            // tag: (() => true)：函数返回一个 true，确保都会出现
            const originalWhen = prompt.when || (() => true)
            prompt.when = answers => originalWhen(answers)
        })
    
        const prompts = [
            this.featurePrompt,
            ...this.injectedPrompts,
        ]
    
        return prompts
    }
}

module.exports = Creator