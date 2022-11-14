import { Dayjs } from 'dayjs'
import React from 'react'

export type DefaultRecordType = Record<string, any>
export namespace Gantt {

  /** 时间轴上面大的区间类型 - 像素单位 */
  export interface Major {
    width: number // px
    left: number // px
    label: string
    key: string
  }

  // TODO: Amp 是指 timestamp 或者 amplification 吗
  /** 时间轴上面大的区间类型 - 时间单位 */
  export interface MajorAmp {
    label: string
    startDate: Dayjs
    endDate: Dayjs
  }

  /** 时间轴上面小的区间类型 */
  export interface Minor {
    width: number
    left: number
    label: string
    /** 是否是休假日：默认休假日为周六日 */
    isWeek: boolean
    key: string
  }
  export interface MinorAmp {
    label: string
    startDate: Dayjs
    endDate: Dayjs
  }

  /** x轴单位 */
  export type Sight = 'day' | 'week' | 'month' | 'quarter' | 'halfYear'
  export type MoveType = 'left' | 'right' | 'move' | 'create'

  /**
   * 1px对应的秒数
   *
   * 每格的宽度固定为 30px
   *
   * 视图类型为日day：24 * 60 * 60 / 30 => 2880
   * */
  export enum ESightValues {
    /** x轴单位为天时，1px对应的秒数 */
    day = 2880,
    /** x轴单位为周时，1px对应的秒数 */
    week = 3600, // 24 * 60 * 60 * 7 / 168, 每格宽度 168
    /** x轴单位为月时，1px对应的秒数 */
    month = 14400,
    /** x轴单位为季度时，1px对应的秒数 */
    quarter = 86400,
    /** x轴单位为半年时，1px对应的秒数 */
    halfYear = 115200,
  }

  /** 视图类型配置 */
  export interface SightConfig {
    /** 视图类型 - x轴单位类型 */
    type: Sight
    /** 视图名称 */
    label: string
    /** 1px对应的秒数 */
    value: ESightValues
  }

  /** Record -> Item -> Bar */
  export interface Bar<RecordType = DefaultRecordType> {
    key: React.Key
    /** 格式化数据时设置的 content 字段 */
    label: string
    /** 排期条宽度 */
    width: number
    /** 排期条水平方向偏移量 */
    translateX: number
    /** 排期条垂直方向偏移量 */
    translateY: number
    /** start(开始）、moving(移动)、end(结束) */
    stepGesture: 'start' | 'moving' | 'end'
    /** 是否为有效时间区间 */
    invalidDateRange: boolean
    /** 将横坐标 startX 转换为对应的日期格式 */
    dateTextFormat: (startX: number) => string
    /** 开始时间和结束时间之间相差的天数 */
    getDateWidth: (startX: number, endX: number) => string
    /** 格式化后的数据 */
    task: Item<RecordType>
    /** 格式化前的数据 */
    record: Record<RecordType>
    /** 默认值 false */
    loading: boolean
    /** // TODO ?? */
    _group?: boolean
    /** 是否折叠 */
    _collapsed: boolean
    /** 表示子节点深度 */
    _depth: number
    /** 任务下标位置 */
    _index?: number
    /** 子任务数 */
    _childrenCount: number
    /** 父任务数据 */
    _parent?: Item<RecordType>
  }

  /** 转换过的数据源 - 在组件内部使用 */
  export interface Item<RecordType = DefaultRecordType> {
    /** 数据源对象 */
    record: Record<RecordType>
    key: React.Key
    /** 开始时间 */
    startDate: string | null
    /** 结束时间 */
    endDate: string | null
    /** // TODO: ？？ */
    content: string
    /** 是否是折叠状态 */
    collapsed: boolean
    /** // TODO: ？？ */
    group?: boolean
    /** 子项 */
    children?: Item<RecordType>[]
    /** =========== 下面是扁平化后添加的属性 ============= */
    /** 父级对象 */
    _parent?: Item<RecordType>
    /** // TODO: ？？ */
    _bar?: Bar<RecordType>
    /** 数据对应的层级深度：eg：第一层 0 */
    _depth?: number
    /** 扁平后对应的索引 */
    _index?: number
  }

  /** 原有的数据源 - 组件的 data props */
  export type Record<RecordType = DefaultRecordType> = RecordType & {
    /** // TODO: ？？ */
    group?: boolean
    /** // TODO: ？？ */
    borderColor?: string
    /** // TODO: ？？ */
    backgroundColor?: string
    /** 是否是折叠状态 */
    collapsed?: boolean
    /** 子项 */
    children?: Record<RecordType>[]
    /** // TODO: ？？ */
    disabled?: boolean
    /** id 依赖结构中会使用到 */
    id?: string | number
  }

  export type ColumnAlign = 'center' | 'right' | 'left'

  /** 数据列 */
  export interface Column<RecordType = DefaultRecordType> {
    width?: number
    minWidth?: number
    maxWidth?: number
    /** 不指定宽度时，平分剩余宽度 */
    flex?: number
    name: string
    /** 字段名称 */
    label: string
    /** head-cell 样式 */
    style?: Object
    render?: (item: Record<RecordType>) => React.ReactNode
    /** textAlign 默认 left */
    align?: ColumnAlign
  }

  /** 依赖类型 */
  export type DependenceType =
   'start_finish' // TODO
   | 'finish_start'
   | 'start_start'
   | 'finish_finish'

  /** 依赖 */
  export interface Dependence {
    /** 数据源id */
    from: string
    /** 数据源id */
    to: string
    /** 依赖类型 */
    type: DependenceType
  }
}
