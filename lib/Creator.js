const util = require('util')
const Inquirer = require('inquirer')
const chalk = require('chalk')
const downloadGitRepo = require('download-git-repo')
const { loading } = require('./utils')
const { getPgRepo, getTagsByRepo } = require('./api')

class Creator {
  // 项目名称和路径
  constructor(name, target) {
    this.name = name
    this.target = target
    // 转化为 promise 方法
    this.downloadGitRepo = util.promisify(downloadGitRepo)
  }

  async create() {
    console.log(this.name, this.target)

    let repo = await this.getRepoInfo()
    let tag = await this.getTagInfo(repo)
    await this.download(repo, tag)

    console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
    console.log(`\r\n cd ${chalk.cyan(this.name)}`)
    console.log("\r npm install \r")
    console.log("\r npm run dev \r\n")

  }

  // 选取仓库模板信息及用户最终选择的模板
  async getRepoInfo() {
    // 获取组织下的仓库信息
    // let repoList = await getPgRepo()
    let repoList = await loading(
      "waiting for axios template",
      getPgRepo
    )
    // 提取仓库名
    const repos = repoList.map(v => v.name)
    // 选取仓库模板
    let { repo } = await new Inquirer.prompt([
      {
        name: 'repo',
        type: 'list',
        message: "Please choose a template:",
        choices: repos
      }
    ])
    return repo
  }

  // 根据仓库获取版本信息及用户选择的版本
  async getTagInfo(repo) {
    // let targetList = await getTagsByRepo(repo)
    let targetList = await loading(
      "waiting for axios tag",
      getTagsByRepo,
      repo
    )
    const tags = targetList.map(v => v.name)
    // 选取模板信息
    let { tag } = await new Inquirer.prompt([
      {
        name: 'tag',
        type: "list",
        message: "Please choose a version:",
        choices: tags
      }
    ])
    return tag
  }

  async download(repo, tag) {
    // 模板下载地址
    const templateUrl = `zhurong-cli/${repo}${tag ? "#" + tag : ""}`;
    await loading(
      "downloading template, please wait",
      this.downloadGitRepo,
      templateUrl,
      // 项目创建位置
      this.target
    )
  }
}

module.exports = Creator