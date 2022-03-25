// 将各个功能的提示语注入 Creator
module.exports = class PromptModuleAPI {
    constructor(creator) {
        this.creator = creator
    }

    injectFeature(feature) {
        this.creator.featurePrompt.choices.push(feature)
    }

    injectPrompt(prompt) {
        this.creator.injectedPrompts.push(prompt)
    }
}
