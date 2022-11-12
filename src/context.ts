import React, { createContext } from 'react'
import GanttStore from './store'
import { DefaultRecordType, Gantt } from './types'

/**
 * 规则是什么？
 *
 * 哪些数据应该放在 store 中
 *
 * 哪些数据应该放在 context 中
 */
export interface GanttContext<RecordType = DefaultRecordType> {
  /** 默认值 gantt */
  prefixCls: string
  store: GanttStore
  /** 返回默认条样式 */
  getBarColor?: (record: Gantt.Record<RecordType>) => {
    backgroundColor: string
    borderColor: string
  }
  /** 展示返回今日 */
  showBackToday: boolean
  /** 展示视图切换 */
  showUnitSwitch: boolean
  /** 行事件 */
  onRow?: {
    onClick: (record: Gantt.Record<RecordType>) => void
  }
  /** 表格缩进 */
  tableIndent: number
  barHeight: number
  /** 展开子节点图表 */
  expandIcon?: ({
    level,
    collapsed,
    onClick,
  }: {
    level: number
    collapsed: boolean
    onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  }) => React.ReactNode
  /** 自定义渲染 bar */
  renderBar?: (barInfo: Gantt.Bar<RecordType>, { width, height }: { width: number; height: number }) => React.ReactNode
  /** 自定义渲染拖拽 */
  renderInvalidBar?: (element: React.ReactNode, barInfo: Gantt.Bar<RecordType>) => React.ReactNode
  /** 自定义渲染组 */
  renderGroupBar?: (
    barInfo: Gantt.Bar<RecordType>,
    { width, height }: { width: number; height: number }
  ) => React.ReactNode
  /** 自定义缩略渲染 */
  renderBarThumb?: (item: Gantt.Record<RecordType>, type: 'left' | 'right') => React.ReactNode
  /** 行点击事件 */
  onBarClick?: (record: Gantt.Record<RecordType>) => void
  /** 是否可以显示/隐藏左侧的table，默认值：true */
  tableCollapseAble: boolean
  /** 返回顶部按钮，默认值为true，可以通过这个参数设置返回按钮的样式 */
  scrollTop: boolean | React.CSSProperties
  /** 是否展示左右侧内容 */
  alwaysShowTaskBar?: boolean
  /** 自定义渲染左侧内容区 */
  renderLeftText?: (barInfo: Gantt.Bar<RecordType>) => React.ReactNode
  /** 自定义渲染右侧内容区 */
  renderRightText?: (barInfo: Gantt.Bar<RecordType>) => React.ReactNode
  /** 点击展开图标时触发 */
  onExpand?: (record: Gantt.Record<RecordType>, collapsed: boolean) => void
}

const Context = createContext<GanttContext>({} as GanttContext)

export default Context
