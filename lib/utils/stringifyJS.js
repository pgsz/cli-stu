// 递归的序列化代码
module.exports = function stringifyJS(value) {
    const { stringify } = require('javascript-stringify')
    // 参数1：要转换为字符串的值
    // 参数2：改变val的函数
    // 参数3: 数字或字符串，用于输出时的空白，达到可读性
    // 参数4：options： maxDepth,maxValues  等
    // eslint-disable-next-line no-shadow
    return stringify(value, (val, indent, stringify) => {
        if (val && val.__expression) {
            return val.__expression
        }

        return stringify(val)
    }, 4)
}
