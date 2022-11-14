import { Gantt } from './types'

/** 获取垂直辅助线的行数 - 目标行与父级行之间的距离 */
export const getVerticalRowNumber = (target: Gantt.Bar, barList: Gantt.Bar[]) => {
  const targetIndex = barList.indexOf(target)
  const parentIndex = barList.findIndex(bar => bar._parent === target._parent)
  return targetIndex - parentIndex + 1
}

/**
 * 将树形数据向下递归为一维数组
 *
 * @param {any} array 格式化后的数据源
 */
export function flattenDeep(array: Gantt.Item[] = [], depth = 0, parent?: Gantt.Item | undefined): Gantt.Item[] {
  let index = 0
  return array.reduce((prevArr: Gantt.Item[], item) => {
    item._depth = depth // 数据对应的层级深度：eg：第一层 0
    item._parent = parent // 父级对象
    item._index = index // 扁平后对应的索引
    index += 1

    return [
      ...prevArr,
      item,
      ...(
        item.children && !item.collapsed
          ? flattenDeep(item.children, depth + 1, item)
          : []
      ),
    ]
  }, [])
}

/** 获取起始偏移量和最大宽度 */
export function getMaxRange(bar: Gantt.Bar) {
  let minTranslateX = 0
  let maxTranslateX = 0
  const temporary: Gantt.Bar[] = [bar]

  while (temporary.length > 0) {
    const current = temporary.shift()
    if (current) {
      const { translateX = 0, width = 0 } = current
      if (minTranslateX === 0) minTranslateX = translateX || 0

      if (translateX) {
        minTranslateX = Math.min(translateX, minTranslateX)
        maxTranslateX = Math.max(translateX + width, maxTranslateX)
      }
      if (current.task.children && current.task.children.length > 0)
        for (const t of current.task.children) if (t._bar) temporary.push(t._bar)
    }
  }

  return {
    translateX: minTranslateX,
    width: maxTranslateX - minTranslateX,
  }
}

/**
 * 获取递增的 key，初始值为0
 */
const genKey = (() => {
  let key = 0
  return function () {
    return key++
  }
})()

/** 对原有的数据源 data 进行转换 */
export function transverseData(data: Gantt.Record[] = [], startDateKey: string, endDateKey: string) {
  const result: Gantt.Item[] = []

  for (const record of data) {
    const item: Gantt.Item = {
      key: genKey(), // TODO
      record,
      content: '', // TODO
      group: record.group, //
      startDate: record[startDateKey] || '',
      endDate: record[endDateKey] || '',
      collapsed: record.collapsed || false, // 是否是折叠起来的状态
      children: transverseData(record.children || [], startDateKey, endDateKey),
    }
    result.push(item)
  }
  return result
}
