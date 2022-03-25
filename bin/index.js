#!/usr/bin/env node
// 全局命令
const program = require('commander')
const create = require('../lib/create')

// 版本号
program.version(require('../package.json').version)

// 处理用户命令
program
.command('create <name>')
.description('create a new project')
.action(name => {
    create(name)
})

program.parse()