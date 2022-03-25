// 渲染模板
const fs = require('fs-extra')
const path = require('path')
// 模板引擎   https://ejs.bootcss.com
const ejs = require('ejs')
const sortObject = require('./utils/sortObject')
const normalizeFilePaths = require('./utils/normalizeFilePaths')
// https://github.com/vuejs/vue-codemod
const { runTransformation } = require('vue-codemod')
const writeFileTree = require('./utils/writeFileTree')
// 检查目标文件是否是二进制文件
const { isBinaryFileSync } = require('isbinaryfile')
const isObject = (val) => val && typeof val === 'object'
const ConfigTransform = require('./ConfigTransform')

const defaultConfigTransforms = {
    babel: new ConfigTransform({
        file: {
            js: ['babel.config.js'],
        },
    }),
    postcss: new ConfigTransform({
        file: {
            js: ['postcss.config.js'],
            json: ['.postcssrc.json', '.postcssrc'],
            yaml: ['.postcssrc.yaml', '.postcssrc.yml'],
        },
    }),
    eslintConfig: new ConfigTransform({
        file: {
            js: ['.eslintrc.js'],
            json: ['.eslintrc', '.eslintrc.json'],
            yaml: ['.eslintrc.yaml', '.eslintrc.yml'],
        },
    }),
    jest: new ConfigTransform({
        file: {
            js: ['jest.config.js'],
        },
    }),
    browserslist: new ConfigTransform({
        file: {
            lines: ['.browserslistrc'],
        },
    }),
}

const reservedConfigTransforms = {
    vue: new ConfigTransform({
        file: {
            js: ['vue.config.js'],
        },
    }),
}

const ensureEOL = str => {
    if (str.charAt(str.length - 1) !== '\n') {
        return str + '\n'
    }

    return str
}

/**
 * 重点!!!
 *  1：向 pkg 中注入依赖
 *  2：调用 render 生成对应的模板  this.files = [{路径： 模板内容}, {'src/App.vue': '<template>....'} ....]
 *  3：根据 files 依次生成对应的文件
*/
class Generator {
    constructor(pkg, context) {
        // 最终 package.json 的模板；
        // 中间会注入很多内容，最后会一一对应 defaultConfigTransforms 生成文件，并删除对应的 pkg 内容，形成最终的 package.json
        this.pkg = pkg
        // main.js 中 new Vue 实例的选项
        this.rootOptions = {}
        // main.js 中 导入语句
        this.imports = {}
        // 所有的需要生成的文件集合，最终根据此字段来生成文件及其内容
        this.files = []
        // 入口文件
        this.entryFile = `src/main.js`
        // 模板文件中间件，[ ()=>{}, ... ]
        this.fileMiddlewares = []
        // 对应的路径
        this.context = context
        // 中间件文件的集合： { babel: ConfigTransform { fileDescriptor: { js: [Array] } }, ... }
        this.configTransforms = {}
    }

    // 合并对应的依赖项 向 pkg 注入依赖
    extendPackage(fields) {
        const pkg = this.pkg
        for (const key in fields) {
            const value = fields[key]
            const existing = pkg[key]
            // dependencies、devDependencies、scripts  合并增加
            if (isObject(value) && (key === 'dependencies' || key === 'devDependencies' || key === 'scripts')) {
                pkg[key] = Object.assign(existing || {}, value)
            } else {
                // 其他的是各自的属性
                pkg[key] = value
            }
        }
    }

    /**
     * 经过之前 extendPackage 此时的 pkg 是个完整的 package.json 文件，包含各项
    */
    async generate() {
        // 从 package.json 中提取文件
        this.extractConfigFiles()
        // 解析文件内容  形成最终的 this.files
        await this.resolveFiles()
        // 将 package.json 中的字段排序
        this.sortPkg()
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // 将所有文件写入到用户要创建的目录
        await writeFileTree(this.context, this.files)
    }

    // 按照下面的顺序对 package.json 中的 key 进行排序
    sortPkg() {
        // ensure package.json keys has readable order
        this.pkg.dependencies = sortObject(this.pkg.dependencies)
        this.pkg.devDependencies = sortObject(this.pkg.devDependencies)
        // 第二个参数 按照固定的顺序
        this.pkg.scripts = sortObject(this.pkg.scripts, [
            'dev',
            'build',
            'test:unit',
            'test:e2e',
            'lint',
            'deploy',
        ])

        this.pkg = sortObject(this.pkg, [
            'name',
            'version',
            'private',
            'description',
            'author',
            'scripts',
            'husky',
            'lint-staged',
            'main',
            'module',
            'browser',
            'jsDelivr',
            'unpkg',
            'files',
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'vue',
            'babel',
            'eslintConfig',
            'prettier',
            'postcss',
            'browserslist',
            'jest',
        ])
    }

    // 使用 ejs 解析 lib\generator\xx\template 中的文件
    async resolveFiles() {
        const files = this.files
        for (const middleware of this.fileMiddlewares) {
            // 依次调用方法 生成所需模板的内容 {路径：模板}  第二个参数没使用到
            await middleware(files, ejs.render)
        }

        // files = [{路径： 模板内容}, {'src/App.vue': '<template>....'} ....]

        // normalize file paths on windows
        // all paths are converted to use / instead of \
        // 将反斜杠 \ 转换为正斜杠 /
        normalizeFilePaths(files)

        // 处理 import 语句的导入和 new Vue() 选项的注入
        // vue-codemod 库，对代码进行解析得到 AST，再将 import 语句和根选项注入
        Object.keys(files).forEach(file => {
            let imports = this.imports[file]
            // 确保是数组
            imports = imports instanceof Set ? Array.from(imports) : imports
            if (imports && imports.length > 0) {
                // runTransformation(fileInfo, transformation, params)
                /**
                 * 1：使用 vue-codemod 将代码解析成 AST
                 * 2：将要插入的代码变成 AST 节点插入到上面的 AST
                 * 3：最后将新的 AST 重新渲染成代码
                */
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectImports'),
                    { imports },
                )
            }

            let injections = this.rootOptions[file]
            injections = injections instanceof Set ? Array.from(injections) : injections
            if (injections && injections.length > 0) {
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectOptions'),
                    { injections },
                )
            }
        })
    }

    // 将 package.json 中的配置提取出来，生成单独的文件
    // 例如将 package.json 中的
    // babel: {
    //     presets: ['@babel/preset-env']
    // },
    // 提取出来变成 babel.config.js 文件
    extractConfigFiles() {
        // {
        //     babel: ConfigTransform { fileDescriptor: { js: [Array] } },
        //     postcss: ConfigTransform {
        //         fileDescriptor: { js: [Array], json: [Array], yaml: [Array] }
        //     },
        //     eslintConfig: ConfigTransform {
        //         fileDescriptor: { js: [Array], json: [Array], yaml: [Array] }
        //     },
        //     jest: ConfigTransform { fileDescriptor: { js: [Array] } },
        //     browserslist: ConfigTransform { fileDescriptor: { lines: [Array] } },
        //     vue: ConfigTransform { fileDescriptor: { js: [Array] } }
        // }
        const configTransforms = {
            ...defaultConfigTransforms,
            ...this.configTransforms,
            ...reservedConfigTransforms,
        }

        const extract = key => {
            if (configTransforms[key] && this.pkg[key]) {
                const value = this.pkg[key]
                const configTransform = configTransforms[key]
                // {
                //   filename: 'babel.config.js',
                //   content: "module.exports = {\n    presets: [\n        '@babel/preset-env'\n    ]\n}"
                // }
                const res = configTransform.transform(
                    value,
                    this.files,
                    this.context,
                )

                const { content, filename } = res
                // 如果文件不是以 \n 结尾，则补上 \n
                this.files[filename] = ensureEOL(content)
                delete this.pkg[key]
            }
        }

        extract('vue')
        extract('babel')
    }

    // 生成文件所需模板
    render(source, additionalData = {}, ejsOptions = {}) {
        // 获取调用 generator.render() 函数的文件的父目录路径 
        const baseDir = extractCallDir()

        // 获取模板文件路径
        source = path.resolve(baseDir, source)
        this._injectFileMiddleware(async (files) => {
            const data = this._resolveData(additionalData)
            // https://github.com/sindresorhus/globby
            const globby = require('globby')
            // 读取目录中所有的文件
            // router 文件下： _files
            // [
            //   'src/App.vue',
            //   'src/views/About.vue',
            //   'src/views/Home.vue',
            //   'src/router/index.js'
            // ]
            const _files = await globby(['**/*'], { cwd: source, dot: true })
            for (const rawPath of _files) {
                const sourcePath = path.resolve(source, rawPath)
                // 解析文件内容，生成模板
                const content = this.renderFile(sourcePath, data, ejsOptions)
                // only set file if it's not all whitespace, or is a Buffer (binary files)
                if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
                    files[rawPath] = content
                }
            }
        })
    }

    _injectFileMiddleware(middleware) {
        this.fileMiddlewares.push(middleware)
    }

    // 合并选项
    _resolveData(additionalData) {
        return {
            // options: this.options,
            rootOptions: this.rootOptions,
            ...additionalData,
        }
    }

    renderFile(name, data, ejsOptions) {
        // 如果是二进制文件，直接将读取结果返回  如图片等
        if (isBinaryFileSync(name)) {
            return fs.readFileSync(name) // return buffer
        }

        // 返回文件内容
        const template = fs.readFileSync(name, 'utf-8')
        // 使用 ejs：可以结合变量来决定是否渲染某些代码
        return ejs.render(template, data, ejsOptions)
    }

    /**
     * Add import statements to a file.
     * 添加导入语句
     */
    injectImports(file, imports) {
        const _imports = (
            this.imports[file]
            // new Set 去重
            || (this.imports[file] = new Set())
        );
        // 传递的可能是数组或单个字符串，将其变为数组，添加到对应的文件里面
        (Array.isArray(imports) ? imports : [imports]).forEach(imp => {
            _imports.add(imp)
        })
    }

    /**
     * Add options to the root Vue instance (detected by `new Vue`).
     * 往 Vue 实例添加选项
     */
    injectRootOptions(file, options) {
        const _options = (
            this.rootOptions[file]
            || (this.rootOptions[file] = new Set())
        );
        (Array.isArray(options) ? options : [options]).forEach(opt => {
            _options.add(opt)
        })
    }
}

// https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
// 获取调用栈信息
function extractCallDir() {
    const obj = {}
    Error.captureStackTrace(obj)
    // 在 lib\generator\xx 等各个模块中 调用 generator.render()
    // 将会排在调用栈中的第四个，也就是 obj.stack.split('\n')[3]
    // obj.stack  类似于 new Error().stack
    // [
    // 'Error',
    // '    at extractCallDir (C:\\Users\\pengguang\\Desktop\\learning\\gitProject\\mini-cli\\lib\\Generator.js:294:11)',
    // '    at Generator.render (C:\\Users\\pengguang\\Desktop\\learning\\gitProject\\mini-cli\\lib\\Generator.js:216:25)',
    // '    at module.exports (C:\\Users\\pengguang\\Desktop\\learning\\gitProject\\mini-cli\\lib\\generator\\linter\\index.js:16:15)',
    // '    at C:\\Users\\pengguang\\Desktop\\learning\\gitProject\\mini-cli\\lib\\create.js:52:42',
    // '    at Array.forEach (<anonymous>)',
    // '    at create (C:\\Users\\pengguang\\Desktop\\learning\\gitProject\\mini-cli\\lib\\create.js:51:22)',
    // '    at processTicksAndRejections (internal/process/task_queues.js:93:5)'
    // ]
    const callSite = obj.stack.split('\n')[3]

    // the regexp for the stack when called inside a named function
    const namedStackRegExp = /\s\((.*):\d+:\d+\)$/
    // the regexp for the stack when called inside an anonymous
    const anonymousStackRegExp = /at (.*):\d+:\d+$/

    let matchResult = callSite.match(namedStackRegExp)

    if (!matchResult) {
        matchResult = callSite.match(anonymousStackRegExp)
    }
    const fileName = matchResult[1]
    // 获取对应文件的目录  C:\Users\pengguang\Desktop\learning\gitProject\mini-cli\lib\generator\linter
    return path.dirname(fileName)
}

module.exports = Generator