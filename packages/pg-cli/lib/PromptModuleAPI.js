module.exports = class PromptModuleAPI {
    constructor(creator) {
        this.creator = creator
    }

    injectFeature(feature) {
        // 为手动配置注入选项
        this.creator.featurePrompt.choices.push(feature)
    }

    injectPrompt(prompt) {
        // 为手动配置之后注入交互询问
        this.creator.injectedPrompts.push(prompt)
    }
}
