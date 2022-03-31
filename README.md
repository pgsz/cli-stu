### V1

- 用户输入命令，这边创建项目
  - 使用[commander.js](https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md)，解析用户的目录，提取用户的输入给脚手架
  - 使用 `npm link` 注册成全局命令，这样可以在电脑任何地方适应命令；可用 `npm ls -g -depth=0` 查看已注册的全局命令，可以使用 `npm unlink` 取消全局注册或 `npm rm -g 模块名`进行删除

- 脚手架解析用户命令，弹出交互语句，询问用户创建项目所需功能
  - 使用[Inquirer.js](https://github.com/SBoudrias/Inquirer.js/)，弹出问题和选项，让用户选择
  
- 用户选择所需功能
  
- 脚手架根据用户的选择创建 `package.json` 文件，并添加对应的依赖项
  
- 脚手架根据用户的选择渲染项目模板，生成文件
  
- 执行 `npm install` 命令安装依赖


### V2

- 创建项目时判断该项目是否已存在，支持覆盖和合并创建

- 选择功能时提供默认配置和手动选择两种模式

- 如果用户的环境同时存在 yarn 和 npm，则提示用户使用哪个包管理器

- 如果包管理器的默认源速度慢，则提示用户是否切换到淘宝源

- 如果是手动选择功能，则在结束之后询问用户是否将本次的选择保存为默认配置


### v3

  - 将项目拆分为 monorepo 的组织方法
    - monorepo：单一代码库，在版本控制系统的单个代码库里包含了许多项目的代码；代码可能相关，但通常在逻辑上是独立的，可能由不同的团队维护
      - 可见性、跟简单的依赖关系管理、唯一依赖源、一致性、共享时间线、原子提交、统一的CI/CD、统一的构建等
      - 性能差、破坏主线、学习曲线、大量的数据、所有权等
    - multirepo：多代码库，每个项目存储在一个完全独立的、版本控制的代码库中
  
  [lerna多包管理实践](https://juejin.cn/post/6844904194999058440)
  [lerna官网](https://lerna.js.org/)
  [lerna github文档](https://github.com/lerna/lerna#readme)
  ```
  npm install lerna

  lerna init 

  lerna create  xxx

  <!-- 将本地或者远程的包作为依赖项添加到当前的packages中，每次只能添加一个包 -->
  lerna add xxx --scope=xxx

  <!-- 安装所有packages的依赖项并且连接本地包的交叉依赖项 -->
  lerna bootstrap
  ```

  ```
    ├─packages
    │  ├─@pg
    │  │  ├─cli # 核心插件
    │  │  ├─cli-plugin-babel # babel 插件
    │  │  ├─cli-plugin-linter # linter 插件
    │  │  ├─cli-plugin-router # router 插件
    │  │  ├─cli-plugin-vue # vue 插件
    │  │  ├─cli-plugin-vuex # vuex 插件
    │  │  └─cli-plugin-webpack # webpack 插件
    └─scripts # commit message 验证脚本 和项目无关 不需关注
    │─lerna.json
    |─package.json
  ```

  - 新增 add 命令，通过 pg-cli-v3 add xxx 命令的方式添加插件



### v4

- 抽离 webpack