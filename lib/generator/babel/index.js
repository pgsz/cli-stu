// babel模板
module.exports = (generator) => {
    generator.extendPackage({
        // 全部依赖注入到 pkg 中，即 packages.json 的初始模板
        // 在 new Generator 的 extractConfigFiles 方法中 将 babel 抽离出来成文件
        // 在 defaultConfigTransforms 中可知：同理会抽离其他模块对应的文件
        babel: {
            presets: ['@babel/preset-env'],
        },
        dependencies: {
            'core-js': '^3.8.3',
        },
        devDependencies: {
            '@babel/core': '^7.12.13',
            '@babel/preset-env': '^7.12.13',
            'babel-loader': '^8.2.2',
        },
    })
}
