const path = require('path')
const chalk = require('chalk')
const fs = require("fs-extra")
// https://github.com/SBoudrias/Inquirer.js
const Inquirer = require('inquirer')
const Creator = require('./Creator')

module.exports = async (projectName, options) => {

  /**
   * create 的三种情况
   * 1：使用 --force，不管是否有同名目录，直接创建
   * 2：未使用 --force，且当前目录不存在同名目录，直接创建
   * 3：未使用 --force，但当前目录有同名目录，需要给用户提供选择，决定覆盖还是取消
  */
  // 获取当前工作目录  当前 node.js 进程执行时的工作目录
  const cwd = process.cwd()
  // 拼接得到项目目录
  const targetDir = path.join(cwd, projectName)
  // 判断目录是否存在
  if (fs.existsSync(targetDir)) {
    // 判断是否使用 --force 参数
    if (options.force) {
      // 先移除
      fs.removeSync(targetDir)
    } else {
      let { isOverwrite } = await new Inquirer.prompt([
        // 返回值为 promise
        {
          name: 'isOverwrite', // 与返回值对应
          type: "list", // list 类型
          message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
          choices: [
            { name: 'Overwrite', value: true },
            { name: 'Cancel', value: false },
          ]
        }
      ])
      if (!isOverwrite) {
        console.log('Cancel')
        return
      } else {
        // 选择的 Overwrite
        console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
        fs.removeSync(targetDir)
      }
    }
  }
  const creator = new Creator(projectName, targetDir)

  creator.create()
}