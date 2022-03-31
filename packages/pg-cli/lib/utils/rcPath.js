const fs = require('fs-extra')
// http://nodejs.cn/api/os.html
const os = require('os')
const path = require('path')

const xdgConfigPath = file => {
    const xdgConfigHome = process.env.XDG_CONFIG_HOME
    if (xdgConfigHome) {
        const rcDir = path.join(xdgConfigHome, 'vue')
        if (!fs.existsSync(rcDir)) {
            fs.ensureDirSync(rcDir, 0o700)
        }
        return path.join(rcDir, file)
    }
}

// migration for 3.0.0-rc.7
// we introduced a change storing .mvcrc in AppData, but the benefit isn't
// really obvious so we are reverting it to keep consistency across OSes
const migrateWindowsConfigPath = file => {
    if (process.platform !== 'win32') {
        return
    }
    // AppData 文件夹： C:\Users\pengguang\AppData\Roaming
    const appData = process.env.APPDATA
    if (appData) {
        const rcDir = path.join(appData, 'vue')
        const rcFile = path.join(rcDir, file)
        // os.homedir()  返回当前用户的主目录的字符串路径。 :C:\Users\pengguang
        const properRcFile = path.join(os.homedir(), file)
        if (fs.existsSync(rcFile)) {
            try {
                if (fs.existsSync(properRcFile)) {
                    // 删除
                    fs.removeSync(rcFile)
                } else {
                    // 移动
                    fs.moveSync(rcFile, properRcFile)
                }
            // eslint-disable-next-line no-empty
            } catch (e) {}
        }
    }
}

// note: 不同操作系统目录不同
exports.getRcPath = file => {
    migrateWindowsConfigPath(file)
    return (
        // undefined
        process.env.VUE_CLI_CONFIG_PATH
    || xdgConfigPath(file)
    // window: 走这  C:\Users\pengguang\file
    || path.join(os.homedir(), file)
    )
}
