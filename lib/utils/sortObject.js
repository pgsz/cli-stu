module.exports = function sortObject(obj, keyOrder, dontSortByUnicode) {
    if (!obj) return
    const res = {}

    if (keyOrder) {
        // 按照传递进来的顺序排列
        keyOrder.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res[key] = obj[key]
                delete obj[key]
            }
        })
    }

    const keys = Object.keys(obj)

    // 排序
    !dontSortByUnicode && keys.sort()
    keys.forEach(key => {
        res[key] = obj[key]
    })

    return res
}