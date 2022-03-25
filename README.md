[commander：](https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md0)命令配置工具
[chalk：](https://github.com/chalk/chalk)命令行美化工具
[inquirer：](https://github.com/SBoudrias/Inquirer.js)命令行交互工具
[ora：](https://github.com/sindresorhus/ora)命令行 loading 效果
[fs-extra：](https://github.com/jprichardson/node-fs-extra)更友好的文件操作
[download-git-repo：](https://gitlab.com/flippidippi/download-git-repo)命令行下载工具
[figlet：](https://github.com/patorjk/figlet.js)生成基于 ASCII 的艺术字


[学习来源](https://juejin.cn/post/7077717940941881358)


`package.json` 中：`pg-cli` 命令代替 `node ./bin/index.js`
```json
"bin": {
  "pg-cli": "./bin/index.js"
},
```