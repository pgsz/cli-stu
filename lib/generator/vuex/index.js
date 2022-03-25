// vuex模板
module.exports = (generator) => {
    // 向入口文件 src/main.js 注入导入代码
    generator.injectImports(generator.entryFile, `import store from './store'`)

    // 向入口文件 src/main.js 注入 new Vue 实例选项
    generator.injectRootOptions(generator.entryFile, `store`)

    // 注入依赖
    generator.extendPackage({
        dependencies: {
            vuex: '^3.6.2',
        },
    })

    // 渲染模板
    generator.render('./template', {})
}
