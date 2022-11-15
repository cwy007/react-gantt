/**
 * // TODO: mobx v4 -> v6
 * // dayjs -> moment
 * 分号
 */
import dayjs, { Dayjs } from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import isBetween from 'dayjs/plugin/isBetween'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import throttle from 'lodash/throttle'
import { action, computed, observable, runInAction, toJS } from 'mobx'
import React, { createRef } from 'react'
import { HEADER_HEIGHT, INIT_TABLE_WIDTH, INIT_VIEW_WIDTH, MIN_TABLE_WIDTH, MIN_VIEW_WIDTH, TOP_PADDING } from './constants'
import { GanttProps as GanttProperties } from './Gantt'
import { Gantt } from './types'
import { flattenDeep, transverseData } from './utils'

// TODO 使用 moment 替换
dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)
dayjs.extend(advancedFormat)
dayjs.extend(isBetween)
dayjs.extend(isLeapYear)

/** 一天对应的毫秒数 */
export const ONE_DAY_MS = 86400000
export const ONE_HOUR_MS = 3600000 // TODO

/**
 * 视图类型：日视图、周视图、月视图、季视图、年视图
 */
export const viewTypeList: Gantt.SightConfig[] = [
  {
    type: 'day',
    label: '日视图',
    value: Gantt.ESightValues.day,
  },
  {
    type: 'week',
    label: '周视图',
    value: Gantt.ESightValues.week,
  },
  {
    type: 'month',
    label: '月视图',
    value: Gantt.ESightValues.month,
  },
  {
    type: 'quarter',
    label: '季视图',
    value: Gantt.ESightValues.quarter,
  },
  {
    type: 'halfYear',
    label: '年视图',
    value: Gantt.ESightValues.halfYear,
  },
]

/**
 * 是否是休息日 0:周日 6:周六
 */
function isRestDay(date: string) {
  const calc = [0, 6]; // 0是周日
  return calc.includes(dayjs(date).weekday())
}

class GanttStore {
  constructor({
    rowHeight,
    disabled = false,
    customSights
  }: {
    rowHeight: number;
    disabled: boolean;
    customSights: Gantt.SightConfig[];
  }) {
    this.width = 1320
    this.height = 418
    this.viewTypeList = customSights.length ? customSights : viewTypeList
    const sightConfig = customSights.length ? customSights[0] : viewTypeList[0]
    const translateX = dayjs(this.getStartDate()).valueOf() / (sightConfig.value * 1000)
    const bodyWidth = this.width
    // const viewWidth = 704
    // const tableWidth = 500
    this.viewWidth = INIT_VIEW_WIDTH
    this.tableWidth = INIT_TABLE_WIDTH
    this.translateX = translateX
    this.sightConfig = sightConfig
    this.bodyWidth = bodyWidth
    this.rowHeight = rowHeight
    this.disabled = disabled
  }

  _wheelTimer: number | undefined

  // scrollTimer: number | undefined

  /** 转换过的数据源 */
  @observable data: Gantt.Item[] = []

  /** 原有的数据源 */
  @observable originData: Gantt.Record[] = []

  /** 数据列 */
  @observable columns: Gantt.Column[] = []

  /** 依赖 */
  @observable dependencies: Gantt.Dependence[] = []

  /** 甘特图是否在水平移动 */
  @observable scrolling = false

  /** tableBody 和 gantt 的父元素 main 元素的滚动高度 */
  @observable scrollTop = 0

  // @observable collapse = false

  /** table 的宽度 */
  @observable tableWidth: number

  /** gantt 的宽度 */
  @observable viewWidth: number

  /** table 和 gantt 容器的宽度 */
  @observable width: number

  /** gantt-body 元素的高度 */
  @observable height: number

  /** gantt-body 容器的宽度 */
  @observable bodyWidth: number

  /** 水平移动的距离, 始终 >= 0, 向右平移甘特图时translateX变小，向左移动甘特图translateX变大 */
  @observable translateX: number

  /** 当前视图配置 */
  @observable sightConfig: Gantt.SightConfig

  /** 是否显示鼠标hover效果 */
  @observable showSelectionIndicator = false

  /** 鼠标hover效果模拟 div 元素 top 属性 */
  @observable selectionIndicatorTop = 0

  /** 拖拽数据 bar */
  @observable dragging: Gantt.Bar | null = null

  /** 拖拽类型 */
  @observable draggingType: Gantt.MoveType | null = null

  /** 是否禁用图表 */
  @observable disabled = false

  /** 视图类型：日视图、周视图、月视图、季视图、年视图 */
  viewTypeList = viewTypeList

  // gestureKeyPress = false

  /** tableBody 和 gantt 的父元素 main */
  mainElementRef = createRef<HTMLDivElement>()

  /** gantt-chart ref */
  chartElementRef = createRef<HTMLDivElement>()

  /**
   * 是否按下鼠标
   *
   * 按下鼠标后，上下移动，模拟的 hover 效果不会跟着上下移动
   * */
  isPointerPress = false

  /** 开始时间的字段名称 */
  startDateKey = 'startDate'

  /** 接受时间的字段名称 */
  endDateKey = 'endDate'

  // autoScrollPos = 0

  // clientX = 0

  /** 行高 */
  rowHeight: number

  /** 修改回调 */
  onUpdate: GanttProperties['onUpdate'] = () => Promise.resolve(true)

  /** 是否是周六日 */
  isRestDay = isRestDay

  /** 10天前 eg: Tue, 01 Nov 2022 10:34:53 GMT*/
  getStartDate() {
    return dayjs().subtract(10, 'day').toString()
  }

  /** 覆盖默认的是否是休假日判断函数 */
  setIsRestDay(function_: (date: string) => boolean) {
    this.isRestDay = function_ || isRestDay
  }

  /** 格式化和保存数据源 */
  @action setData(data: Gantt.Record[], startDateKey: string, endDateKey: string) {
    this.startDateKey = startDateKey // 字段名称
    this.endDateKey = endDateKey // endDate 对应的字段名称
    this.originData = data // 数据源
    this.data = transverseData(data, startDateKey, endDateKey) // 格式化后的数据源
  }

  /**
   * 1.将table的宽度改为0
   *
   * 2.
   */
  @action toggleCollapse() {
    if (this.tableWidth > 0) {
      this.tableWidth = 0
      this.viewWidth = this.width - this.tableWidth
    } else {
      this.initWidth()
    }
  }

  /** 修改 data 中的数据 item 的 collapsed 属性 */
  @action setRowCollapse(item: Gantt.Item, collapsed: boolean) {
    // getBarList 中用到 flattenDeep
    // flattenDeep 中用到 collapsed 判断是否展开 children
    item.collapsed = collapsed
    // this.barList = this.getBarList();
  }

  /** 保存回调函数（回调函数在拖拽排期区间的时候会触发） */
  @action setOnUpdate(onUpdate: GanttProperties['onUpdate']) {
    this.onUpdate = onUpdate
  }

  @action setColumns(columns: Gantt.Column[]) {
    this.columns = columns
  }

  /** 修改dependencies */
  @action  setDependencies(dependencies: Gantt.Dependence[]) {
    this.dependencies = dependencies
  }

  /**
   * 水平移动时间轴
   *
   * PAN是把同一个界面上的所有图像都移动,而图像的坐标都不会改变
   */
  @action handlePanMove(translateX: number) {
    this.scrolling = true
    this.setTranslateX(translateX)
  }

  /**
   * 水平移动时间轴 - 停止时调用
   *
   * PAN是把同一个界面上的所有图像都移动,而图像的坐标都不会改变
   */
  @action handlePanEnd() {
    this.scrolling = false
  }

  /**
   * size 是元素 gantt-body 的尺寸（容器的尺寸）
   */
  @action syncSize(size: { width?: number; height?: number }) {
    if (!size.height || !size.width) return

    const { width, height } = size
    if (this.height !== height) this.height = height

    if (this.width !== width) {
      this.width = width
      this.initWidth()
    }
  }

  /**
   * 左右拖拽改变 table 宽度的回调
   *
   * 1.每一列都设置了 width 属性时，不改变 table 的总宽度
   */
  @action handleResizeTableWidth(width: number) {
    const columnsWidthArr = this.columns.filter(column => column.width > 0)
    if (this.columns.length === columnsWidthArr.length) return
    this.tableWidth = width
    this.viewWidth = this.width - this.tableWidth

    // TODO
    // 图表宽度不能小于 MIN_VIEW_WIDTH
    if (this.viewWidth < MIN_VIEW_WIDTH) {
      this.viewWidth = MIN_VIEW_WIDTH
      this.tableWidth = this.width - this.viewWidth
    }
    // if (width <= this.totalColumnWidth) {
    //   this.tableWidth = width
    //   this.viewWidth = this.width - this.tableWidth
    // }
    // const tableMinWidth = 200;
    // const chartMinWidth = 200;
    // if (this.tableWidth + increase >= tableMinWidth && this.viewWidth - increase >= chartMinWidth) {
    //   this.tableWidth += increase;
    //   this.viewWidth -= increase;
    // }
  }

  /**
   * 图表宽度不能小于 MIN_VIEW_WIDTH
   */
  @action initWidth() {
    this.tableWidth = Math.max(this.totalColumnWidth, INIT_TABLE_WIDTH)
    // 如果屏幕宽度被拉大，table宽度不变，甘特图宽度变大
    this.viewWidth = this.width - this.tableWidth // gantt图宽度
    console.log('this.tableWidth-->', this.tableWidth)

    // 图表宽度不能小于 MIN_VIEW_WIDTH
    if (this.viewWidth < MIN_VIEW_WIDTH) {
      this.viewWidth = MIN_VIEW_WIDTH
      this.tableWidth = this.width - this.viewWidth
    }
  }

  /** 水平移动的距离 */
  @action setTranslateX(translateX: number) {
    this.translateX = Math.max(translateX, 0)
  }

  /** 切换视图 */
  @action switchSight(type: Gantt.Sight) {
    const target = find(this.viewTypeList, { type })
    if (target) {
      this.sightConfig = target
      this.setTranslateX(dayjs(this.getStartDate()).valueOf() / (target.value * 1000))
    }
  }

  /** 返回今日 今日的坐标位于甘特图中间 */
  @action scrollToToday() {
    const translateX = this.todayTranslateX - this.viewWidth / 2
    this.setTranslateX(translateX)
  }

  /** 获取指定日期 date 对应的平移距离 px */
  getTranslateXByDate(date: string) {
    return dayjs(date).startOf('day').valueOf() / this.pxUnitAmp
  }

  /** 今日对应的横坐标 px */
  @computed get todayTranslateX() {
    return dayjs().startOf('day').valueOf() / this.pxUnitAmp
  }

  /** 甘特图下方滚动条拖拽按钮的宽度 30..160 */
  @computed get scrollBarWidth() {
    const MIN_WIDTH = 30
    return Math.max((this.viewWidth / this.scrollWidth) * 160, MIN_WIDTH)
  }

  /** 甘特图下方滚动条拖拽按钮样式 left 属性 */
  @computed get scrollLeft() {
    const rate = this.viewWidth / this.scrollWidth
    const currentDate = dayjs(this.translateAmp).toString()
    // console.log('currentDate', currentDate)
    // 默认滚动条在中间
    const half = (this.viewWidth - this.scrollBarWidth) / 2
    const viewScrollLeft =
      half + rate * (this.getTranslateXByDate(currentDate) - this.getTranslateXByDate(this.getStartDate()))
    return Math.min(Math.max(viewScrollLeft, 0), this.viewWidth - this.scrollBarWidth)
  }

  /** 相对应甘特图初始位置 this.getStartDate 的偏移量 */
  @computed get scrollWidth() {
    // TODO 待研究
    // 最小宽度
    const init = this.viewWidth + 200 // 甘特图最小宽度200
    const value = this.viewWidth + this.translateX - this.getTranslateXByDate(this.getStartDate())
    return Math.max(Math.abs(value), init) // 取的绝对值 - 控制拖拽按钮长度和位置的变化
  }

  /** 内容区滚动高度 */
  @computed get bodyClientHeight() {
    // 1是边框 - gantt-body下边框
    return this.height - HEADER_HEIGHT - 1
  }

  /**
   * 设置每一列的宽度
   *
   * 在 table-header 中使用
   */
  @computed get getColumnsWidth(): number[] {
    // 为1列时最小宽度为200
    // FIXME TODO: 原来组件这里是有bug的
    if (this.columns.length === 1 && (this.columns[0]?.width || 0) <= MIN_TABLE_WIDTH) {
      return [Math.max(MIN_TABLE_WIDTH, this.tableWidth)]
    }

    // columns 中指定的 width 和
    const totalColumnWidth = this.columns.reduce((width, item) => width + (item.width || 0), 0)
    const totalFlex = this.columns.reduce((total, item) => total + (item.width ? 0 : item.flex || 1), 0)
    // FIXME:
    // 剩余宽度 - 当 table 被隐藏时 tableWidth 为0
    // 这时得到的 restWidth <= 0
    //
    // const restWidth = this.tableWidth - totalColumnWidth > 0 ? this.tableWidth - totalColumnWidth : 0
    let restWidth = Math.max(this.tableWidth, INIT_TABLE_WIDTH);

    return this.columns.map(column => {
      if (column.width && restWidth >= 0) {
        if (column.width < restWidth) {
          restWidth -= column.width;
          return column.width
        }

        const columnWidth = restWidth;
        restWidth = 0;
        return columnWidth
      }

      if (column.flex) return restWidth * (column.flex / totalFlex)

      return restWidth * (1 / totalFlex) // 不指定 width 和 flex 的 column，平分剩余的宽度（宽度相等）
    })
  }

  /** table 总的宽度 */
  @computed get totalColumnWidth(): number {
    return this.getColumnsWidth.reduce((width, item) => width + (item || 0), 0)
  }

  /** 内容区滚动区域高度 */
  @computed get bodyScrollHeight() {
    // 数据行的高度
    let height = this.getBarList.length * this.rowHeight + TOP_PADDING

    // 容器gantt-body中对应的 table-body 高度
    if (height < this.bodyClientHeight) height = this.bodyClientHeight

    return height
  }

  /**
   * 1px对应的毫秒数
   *
   * amp -> amplification 放大
   * */
  @computed get pxUnitAmp() {
    return this.sightConfig.value * 1000
  }

  /** 甘特图可见区域左边框对应的毫秒数 */
  @computed get translateAmp() {
    const { translateX } = this
    // console.log('translateX', translateX)
    return this.pxUnitAmp * translateX
  }

  /** 甘特图宽度对应的毫秒数 */
  getDurationAmp() {
    const clientWidth = this.viewWidth
    return this.pxUnitAmp * clientWidth
  }

  /** 组件通过 ref 暴露的方法：计算开始/结束时间区间对应的横坐标宽度 */
  getWidthByDate = (startDate: Dayjs, endDate: Dayjs) => (endDate.valueOf() - startDate.valueOf()) / this.pxUnitAmp

  /** 时间轴上面大的区间对应的数据列表 - 像素单位 */
  getMajorList(): Gantt.Major[] {
    const majorFormatMap: { [key in Gantt.Sight]: string } = {
      day: 'YYYY年MM月',
      week: 'YYYY年MM月',
      month: 'YYYY年',
      quarter: 'YYYY年',
      halfYear: 'YYYY年',
    }
    const { translateAmp } = this // 甘特图可见区域左边框对应的毫秒数
    const endAmp = translateAmp + this.getDurationAmp() // 甘特图可见区域右边框对应的毫秒数
    const { type } = this.sightConfig
    const format = majorFormatMap[type] // 用来计算 label 值

    /** 根据视图类型 type 对 start 进行递增 */
    const getNextDate = (start: Dayjs) => {
      if (type === 'day' || type === 'week') return start.add(1, 'month')

      return start.add(1, 'year')
    }

    /** 根据视图类型 type 获取 date 开始的时间 */
    const getStart = (date: Dayjs) => {
      if (type === 'day' || type === 'week') return date.startOf('month')

      return date.startOf('year')
    }

    /** 根据视图类型 type 获取 date 结束的时间 */
    const getEnd = (date: Dayjs) => {
      if (type === 'day' || type === 'week') return date.endOf('month')

      return date.endOf('year')
    }

    // 初始化当前时间
    let currentDate = dayjs(translateAmp)
    const dates: Gantt.MajorAmp[] = []

    // 对可视区域内的时间进行迭代
    while (currentDate.isBetween(translateAmp - 1, endAmp + 1)) {
      const majorKey = currentDate.format(format)

      let start = currentDate // 第一条的开始，取左侧的坐标
      const end = getEnd(start)
      if (dates.length > 0) start = getStart(currentDate) // 非首条的开始

      dates.push({
        label: majorKey,
        startDate: start,
        endDate: end,
      })

      // 获取下次迭代的时间
      start = getStart(currentDate)
      currentDate = getNextDate(start) // 下一段的开始时间，按规则递增
    }

    return this.majorAmp2Px(dates)
  }

  /** 时间单位 -> 像素单位 */
  majorAmp2Px(ampList: Gantt.MajorAmp[]): Gantt.Major[] {
    const { pxUnitAmp } = this
    return ampList.map(item => {
      const { startDate } = item
      const { endDate } = item
      const { label } = item
      const left = startDate.valueOf() / pxUnitAmp
      const width = (endDate.valueOf() - startDate.valueOf()) / pxUnitAmp

      return {
        label,
        left,
        width,
        key: startDate.format('YYYY-MM-DD HH:mm:ss'),
      }
    })
  }

  /** 时间轴上下的单坐标对应的数据列表 - 像素单位 */
  getMinorList(): Gantt.Minor[] {
    const minorFormatMap = {
      day: 'YYYY-MM-D',
      week: 'YYYY-w周',
      month: 'YYYY-MM月',
      quarter: 'YYYY-第Q季',
      halfYear: 'YYYY-',
    }
    const fstHalfYear = new Set([0, 1, 2, 3, 4, 5])

    const startAmp = this.translateAmp
    const endAmp = startAmp + this.getDurationAmp()
    const format = minorFormatMap[this.sightConfig.type] // 计算 label 时会用到

    /** 下一个起点：修改参数的值 */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const getNextDate = (start: Dayjs) => {
      const map = {
        day() {
          return start.add(1, 'day')
        },
        week() {
          return start.add(1, 'week')
        },
        month() {
          return start.add(1, 'month')
        },
        quarter() {
          return start.add(1, 'quarter')
        },
        halfYear() {
          return start.add(6, 'month')
        },
      }

      return map[this.sightConfig.type]()
    }

    /** 起点：不修改参数的值 */
    const setStart = (date: Dayjs) => {
      const map = {
        day() {
          return date.startOf('day')
        },
        week() {
          return date.weekday(1).hour(0).minute(0).second(0)
        },
        month() {
          return date.startOf('month')
        },
        quarter() {
          return date.startOf('quarter')
        },
        halfYear() {
          if (fstHalfYear.has(date.month())) return date.month(0).startOf('month')

          return date.month(6).startOf('month')
        },
      }

      return map[this.sightConfig.type]()
    }

    /** 终点：不修改参数的值 */
    const setEnd = (start: Dayjs) => {
      const map = {
        day() {
          return start.endOf('day')
        },
        week() {
          return start.weekday(7).hour(23).minute(59).second(59)
        },
        month() {
          return start.endOf('month')
        },
        quarter() {
          return start.endOf('quarter')
        },
        halfYear() {
          if (fstHalfYear.has(start.month())) return start.month(5).endOf('month')

          return start.month(11).endOf('month')
        },
      }

      return map[this.sightConfig.type]()
    }

    const getMinorKey = (date: Dayjs) => {
      if (this.sightConfig.type === 'halfYear') {
        return date.format(format) + (fstHalfYear.has(date.month()) ? '上半年' : '下半年')
      }

      return date.format(format)
    }

    // 初始化当前时间
    let currentDate = dayjs(startAmp)
    const dates: Gantt.MinorAmp[] = []
    while (currentDate.isBetween(startAmp - 1, endAmp + 1)) {
      const minorKey = getMinorKey(currentDate)
      const start = setStart(currentDate)
      const end = setEnd(start)
      dates.push({
        label: minorKey.split('-').pop() as string, // 取最后一个片段
        startDate: start,
        endDate: end,
      })
      currentDate = getNextDate(start)
    }

    return this.minorAmp2Px(dates)
  }

  startXRectBar = (startX: number) => {
    let date = dayjs(startX * this.pxUnitAmp)
    const dayRect = () => {
      const stAmp = date.startOf('day')
      const endAmp = date.endOf('day')
      // @ts-ignore
      const left = stAmp / this.pxUnitAmp
      // @ts-ignore
      const width = (endAmp - stAmp) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }
    const weekRect = () => {
      if (date.weekday() === 0) date = date.add(-1, 'week')

      const left = date.weekday(1).startOf('day').valueOf() / this.pxUnitAmp
      const width = (7 * 24 * 60 * 60 * 1000 - 1000) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }
    const monthRect = () => {
      const stAmp = date.startOf('month').valueOf()
      const endAmp = date.endOf('month').valueOf()
      const left = stAmp / this.pxUnitAmp
      const width = (endAmp - stAmp) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }

    const map = {
      day: dayRect,
      week: weekRect,
      month: weekRect,
      quarter: monthRect,
      halfYear: monthRect,
    }

    return map[this.sightConfig.type]()
  }

  /** minor 时间单位 -> 像素单位 */
  minorAmp2Px(ampList: Gantt.MinorAmp[]): Gantt.Minor[] {
    const { pxUnitAmp } = this
    return ampList.map(item => {
      const { startDate } = item
      const { endDate } = item

      const { label } = item
      const left = startDate.valueOf() / pxUnitAmp
      const width = (endDate.valueOf() - startDate.valueOf()) / pxUnitAmp

      let isWeek = false
      if (this.sightConfig.type === 'day') isWeek = this.isRestDay(startDate.toString())

      return {
        label,
        left,
        width,
        isWeek,
        key: startDate.format('YYYY-MM-DD HH:mm:ss'),
      }
    })
  }

  /** 缩略图是否可见：当 bar 位于甘特图可见区域外时，返回true */
  getTaskBarThumbVisible(barInfo: Gantt.Bar) {
    const { width, translateX: barTranslateX, invalidDateRange } = barInfo
    if (invalidDateRange) return false

    const rightSide = this.translateX + this.viewWidth
    console.log('this.translateX->', this.translateX)
    return barTranslateX + width < this.translateX || barTranslateX - rightSide > 0
  }

  scrollToBar(barInfo: Gantt.Bar, type: 'left' | 'right') {
    const { translateX: barTranslateX, width } = barInfo
    const translateX1 = this.translateX + this.viewWidth / 2
    const translateX2 = barTranslateX + width

    const diffX = Math.abs(translateX2 - translateX1)
    let translateX = this.translateX + diffX

    if (type === 'left') translateX = this.translateX - diffX

    this.setTranslateX(translateX)
  }

  /**
   * Item -> Bar
   */
  @computed get getBarList(): Gantt.Bar[] {
    const { pxUnitAmp, data } = this
    // 最小宽度
    // const minStamp = 11 * pxUnitAmp
    // TODO 去除高度读取
    // const height = 8 // 排期条对应的高度
    const height = 24 // FIXME: 排期条对应的高度
    const baseTop = TOP_PADDING + this.rowHeight / 2 - height / 2
    const topStep = this.rowHeight

    /** 将横坐标 startX 转换为对应的日期格式 */
    const dateTextFormat = (startX: number) => dayjs(startX * pxUnitAmp).format('YYYY-MM-DD HH:mm')

    /** 开始时间和结束时间之间相差的天数 */
    const getDateWidth = (start: number, endX: number) => {
      const startDate = dayjs(start * pxUnitAmp)
      const endDate = dayjs(endX * pxUnitAmp)
      return `${startDate.diff(endDate, 'day') + 1}`
    }

    const flattenData = flattenDeep(data)
    const barList = flattenData.map((item, index) => {
      const valid = item.startDate && item.endDate // 存在起止时间
      let startAmp = dayjs(item.startDate || 0)
        // .startOf('day') // TODO: 时间精度为 hour 时如何处理
        .valueOf()
      let endAmp = dayjs(item.endDate || 0)
        // .endOf('day')
        .valueOf()

      // 开始结束日期相同默认一天
      // if (Math.abs(endAmp - startAmp) < minStamp) {
      //   console.log('minStamp', minStamp)
      //   startAmp = dayjs(item.startDate || 0)
      //     .startOf('day')
      //     .valueOf()
      //   endAmp = dayjs(item.endDate || 0)
      //     .endOf('day')
      //     .add(minStamp, 'millisecond')
      //     .valueOf()
      // }

      const width = valid ? (endAmp - startAmp) / pxUnitAmp : 0
      const translateX = valid ? startAmp / pxUnitAmp : 0
      const translateY = baseTop + index * topStep
      const { _parent } = item
      const record = { ...item.record, disabled: this.disabled }
      const bar: Gantt.Bar = {
        key: item.key,
        task: item,
        record,
        translateX,
        translateY,
        width,
        label: item.content,
        stepGesture: 'end',
        invalidDateRange: !item.endDate || !item.startDate,
        dateTextFormat,
        getDateWidth,
        loading: false,
        _group: item.group,
        _collapsed: item.collapsed,
        _depth: item._depth as number,
        _index: item._index,
        _parent,
        _childrenCount: !item.children ? 0 : item.children.length,
      }
      item._bar = bar // TODO 怎么又备份一次
      return bar
    })
    // 进行展开扁平
    return observable(barList)
  }

  @action handleWheel = (event: WheelEvent) => {
    if (event.deltaX !== 0) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (this._wheelTimer) clearTimeout(this._wheelTimer)
    // 水平滚动
    if (Math.abs(event.deltaX) > 0) {
      this.scrolling = true
      this.setTranslateX(this.translateX + event.deltaX)
    }
    this._wheelTimer = window.setTimeout(() => {
      this.scrolling = false
    }, 100)
  }

  /** 上下滚动时的回调 */
  handleScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { scrollTop } = event.currentTarget
    this.scrollY(scrollTop)
  }

  /** tableBody 和 gantt 的父元素 main 元素的滚动高度 */
  scrollY = throttle((scrollTop: number) => {
    this.scrollTop = scrollTop
  }, 100)

  /** 虚拟滚动：可见行数 + 10 */
  @computed get getVisibleRows() {
    const visibleHeight = this.bodyClientHeight // 页面可见的甘特图高度（不包含时间轴）
    // 多渲染10个，减少空白
    const visibleRowCount = Math.ceil(visibleHeight / this.rowHeight) + 10

    // 向上滚动5行距离后，start值开始递增
    const start = Math.max(Math.ceil(this.scrollTop / this.rowHeight) - 5, 0)

    return {
      /** 数据起点 */
      start,
      /** 数据长度 */
      count: visibleRowCount,
    }
  }

  /**
   * 在 table-body, gantt 上移动鼠标时触发
   *
   * 按下鼠标后，上下移动，模拟的 hover 效果不会跟着上下移动
   *  */
  handleMouseMove = debounce(event => {
    if (!this.isPointerPress) this.showSelectionBar(event)
  }, 5)

  /** 鼠标离开容器区域后 */
  handleMouseLeave = debounce(() => {
    this.showSelectionIndicator = false
  }, 5)

  /** 显示：模拟鼠标hover效果 */
  @action showSelectionBar(event: MouseEvent) {
    const scrollTop = this.mainElementRef.current?.scrollTop || 0
    // top 元素上边距离浏览器窗口上边的距离
    const { top } = this.mainElementRef.current?.getBoundingClientRect() || {
      top: 0,
    }
    // 内容区高度
    const contentHeight = this.getBarList.length * this.rowHeight
    const offsetY = event.clientY - top + scrollTop
    // console.log('contentHeight-->', contentHeight)
    // console.log('offsetY-->', offsetY)
    if (offsetY - contentHeight > TOP_PADDING) {
      this.showSelectionIndicator = false
    } else {
      const topValue = Math.floor((offsetY - TOP_PADDING) / this.rowHeight) * this.rowHeight + TOP_PADDING
      this.showSelectionIndicator = true // 模拟鼠标hover效果
      this.selectionIndicatorTop = topValue // 模拟元素的位置
    }
  }

  /** top 为 bar.translateY，判断 bar 是否位于鼠标所在的行 */
  getHovered = (top: number) => {
    const baseTop = top - (top % this.rowHeight)
    return this.selectionIndicatorTop >= baseTop && this.selectionIndicatorTop <= baseTop + this.rowHeight
  }

  /** 拖拽开始 - mouseup */
  @action handleDragStart(barInfo: Gantt.Bar, type: Gantt.MoveType) {
    this.dragging = barInfo
    this.draggingType = type
    barInfo.stepGesture = 'start'
    this.isPointerPress = true
  }

  /** 拖拽结束 - mouseup */
  @action handleDragEnd() {
    if (this.dragging) {
      this.dragging.stepGesture = 'end'
      this.dragging = null
    }
    this.draggingType = null
    this.isPointerPress = false
  }

  /** =============== // TODO invalid bar END =============== */
  @action handleInvalidBarLeave() {
    this.handleDragEnd()
  }

  @action handleInvalidBarHover(barInfo: Gantt.Bar, left: number, width: number) {
    barInfo.translateX = left
    barInfo.width = width
    this.handleDragStart(barInfo, 'create')
  }

  @action handleInvalidBarDragStart(barInfo: Gantt.Bar) {
    barInfo.stepGesture = 'moving'
  }

  @action handleInvalidBarDragEnd(barInfo: Gantt.Bar, oldSize: { width: number; x: number }) {
    barInfo.invalidDateRange = false
    this.handleDragEnd()
    this.updateTaskDate(barInfo, oldSize, 'create')
  }
  /** =============== // TODO invalid bar END =============== */

  /** 更新时间区间的宽度和偏移量x */
  @action updateBarSize(barInfo: Gantt.Bar, { width, x }: { width: number; x: number }) {
    barInfo.width = width
    barInfo.translateX = Math.max(x, 0)
    barInfo.stepGesture = 'moving'
  }

  getMovedDay(ms: number): number {
    return Math.round(ms / ONE_HOUR_MS)
  }

  /** 更新时间 */
  @action async updateTaskDate(
    barInfo: Gantt.Bar,
    oldSize: { width: number; x: number },
    type: 'move' | 'left' | 'right' | 'create'
  ) {
    const { translateX, width, task, record } = barInfo
    const oldStartDate = barInfo.task.startDate
    const oldEndDate = barInfo.task.endDate
    let startDate = oldStartDate
    let endDate = oldEndDate

    if (type === 'move') {
      const moveTime = this.getMovedDay((translateX - oldSize.x) * this.pxUnitAmp)
      // 移动，只根据移动距离偏移
      startDate = dayjs(oldStartDate).add(moveTime, 'hour').format('YYYY-MM-DD HH:mm:ss')
      endDate = dayjs(oldEndDate).add(moveTime, 'hour').hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss')
    } else if (type === 'left') {
      const moveTime = this.getMovedDay((translateX - oldSize.x) * this.pxUnitAmp)
      // 左侧移动，只改变开始时间
      startDate = dayjs(oldStartDate).add(moveTime, 'hour').format('YYYY-MM-DD HH:mm:ss')
    } else if (type === 'right') {
      const moveTime = this.getMovedDay((width - oldSize.width) * this.pxUnitAmp)
      // 右侧移动，只改变结束时间
      endDate = dayjs(oldEndDate).add(moveTime, 'hour').hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss')
      // TODO create
    } else if (type === 'create') {
      // 创建
      startDate = dayjs(translateX * this.pxUnitAmp).format('YYYY-MM-DD HH:mm:ss')
      endDate = dayjs((translateX + width) * this.pxUnitAmp)
        .subtract(1)
        .hour(23)
        .minute(59)
        .second(59)
        .format('YYYY-MM-DD HH:mm:ss')
    }
    if (startDate === oldStartDate && endDate === oldEndDate) return

    runInAction(() => {
      barInfo.loading = true
    })
    // TODO
    const success = await this.onUpdate(toJS(record), startDate, endDate)
    if (success) {
      runInAction(() => {
        task.startDate = startDate
        task.endDate = endDate
      })
    } else {
      barInfo.width = oldSize.width
      barInfo.translateX = oldSize.x
    }
  }

  /** 日期 key 是否为今天 */
  isToday(key: string) {
    const now = dayjs().format('YYYY-MM-DD')
    const target = dayjs(key).format('YYYY-MM-DD')
    return target === now
  }
}

export default GanttStore
