const slash = require('slash')
// 把 window 的反斜杠 \\ 改为正斜杠 / 

// Unix    => foo/bar
// Windows => foo\\bar

// slash(string)

// Unix    => foo/bar
// Windows => foo/bar

// 用于转换 Windows 反斜杠路径转换为正斜杠路径 \ => /
module.exports = function normalizeFilePaths(files) {
    Object.keys(files).forEach(file => {
        const normalized = slash(file)
        if (file !== normalized) {
            files[normalized] = files[file]
            delete files[file]
        }
    })
    
    return files
}
