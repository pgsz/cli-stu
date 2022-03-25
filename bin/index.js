#!/usr/bin/env node
/**
 * 首行
 * #! 标识作用，文件可以当做脚本来运行，指定脚本的解析程序
 * /usr/bin/env 用户(usr)的安装根目录(bin)下的env环境变量中
 * node 用 node 来执行此文件
 * 发 npm 包时，需要在入口文件指定该指令，否则会抛出 No such file or directory 错误
*/

const program = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')

program
  .name('pg-cli-demo')
  .usage(`<command> [option]`)

// package.json 中存取了项目的版本号 version
// 直接使用该属性
program.version(`pg-cli-demo ${require("../package.json").version}`);

program
  .command("create <project-name>")
  .description("create a new project")
  .option("-f, --force", "overwrite target directory if it exists")
  .action((projectName, options) => {
    require("../lib/create")(projectName, options)
  })

program
  .command("config [value]")
  .description("inspect and modify the config")
  .option("-g --get <key>", "get value by key")
  .option("-s, --set <key> <value>", "set option[key] is value")
  .option("-d, --delete <key>", "delete option by key")
  .action((value, keys) => {
    console.log(value, keys)
  })

program.on("--help", () => {
  console.log(
    "\r\n" + figlet.textSync("pg-cli-demo", {
      font: "3D-ASCII",
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80,
      whitespaceBreak: true
    })
  )
  console.log(` Run ${chalk.cyan('pg-cli-demo <command> --help')} for detailed usage of given command.`)
  console.log()
})

program.parse(process.argv);
