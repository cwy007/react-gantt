import { Dayjs } from 'dayjs'
import React from 'react'

export type DefaultRecordType = Record<string, any>
export namespace Gantt {
  export interface Major {
    width: number
    left: number
    label: string
    key: string
  }
  export interface MajorAmp {
    label: string
    startDate: Dayjs
    endDate: Dayjs
  }
  export interface Minor {
    width: number
    left: number
    label: string
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

  export interface Bar<RecordType = DefaultRecordType> {
    key: React.Key
    label: string
    width: number
    translateX: number
    translateY: number
    stepGesture: string
    invalidDateRange: boolean
    dateTextFormat: (startX: number) => string
    getDateWidth: (startX: number, endX: number) => string
    task: Item<RecordType>
    record: Record<RecordType>
    loading: boolean
    _group?: boolean
    _collapsed: boolean
    _depth: number
    _index?: number
    _childrenCount: number
    _parent?: Item<RecordType>
  }

  /** 转换过的数据源 - 在组件内部使用 */
  export interface Item<RecordType = DefaultRecordType> {
    record: Record<RecordType>
    key: React.Key
    startDate: string | null
    endDate: string | null
    content: string
    collapsed: boolean
    group?: boolean
    children?: Item<RecordType>[]
    _parent?: Item<RecordType>
    _bar?: Bar<RecordType>
    _depth?: number
    _index?: number
  }

  /** 原有的数据源 - 组件的 data props */
  export type Record<RecordType = DefaultRecordType> = RecordType & {
    group?: boolean
    borderColor?: string
    backgroundColor?: string
    collapsed?: boolean
    children?: Record<RecordType>[]
    disabled?: boolean
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

  export type DependenceType =
   'start_finish' // TODO
   | 'finish_start'
   | 'start_start'
   | 'finish_finish'

  /** 依赖 */
  export interface Dependence {
    from: string
    to: string
    type: DependenceType
  }
}
