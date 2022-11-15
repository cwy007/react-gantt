import { useSize } from 'ahooks'
import { Dayjs } from 'dayjs'
import { toJS } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { TableScene } from 'newcore-table-scene'
import React, {
  useContext, useEffect, useImperativeHandle, useMemo, useRef, useCallback,
} from 'react'
import Chart from './components/chart'
import Divider from './components/divider'
import ScrollBar from './components/scroll-bar'
import ScrollTop from './components/scroll-top'
import SelectionIndicator from './components/selection-indicator'
import TableBody from './components/table-body'
import TableHeader from './components/table-header'
import TimeAxis from './components/time-axis'
import TimeAxisScaleSelect from './components/time-axis-scale-select'
import TimeIndicator from './components/time-indicator'
import { BAR_HEIGHT, INIT_TABLE_WIDTH, ROW_HEIGHT, TABLE_INDENT } from './constants'
import Context, { GanttContext } from './context'
import './Gantt.less'
import GanttStore from './store'
import { DefaultRecordType, Gantt } from './types'

const prefixCls = 'gantt' // TODO 这个变量迁移后可以删除

/** 响应最外层容器组件的缩放 */
const Body: React.FC = ({ children }) => {
  const { store } = useContext(Context)
  const reference = useRef<HTMLDivElement>(null)
  const size = useSize(reference)

  useEffect(() => {
    store.syncSize(size)
  }, [size, store])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.persist()
      store.handleMouseMove(event)
    },
    [store]
  )

  const handleMouseLeave = useCallback(() => {
    store.handleMouseLeave()
  }, [store])

  return (
    <div
      className={`${prefixCls}-body`}
      ref={reference}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

/** 甘特图组件的属性 */
export interface GanttProps<RecordType = DefaultRecordType> {
  /** 数据源 */
  data: Gantt.Record<RecordType>[]
  /** 数据列 */
  columns: Gantt.Column[]
  /**
   * 依赖数组
   */
  dependencies?: Gantt.Dependence[]
  /**
   * 修改回调 - 拖拽排期区间的时候会触发
   * @param record 当前操作的数据源
   * @param startDate 起点时间 // TODO 拖拽的进度，可否到小时
   * @param endDate 结束时间
   * @returns
   */
  onUpdate: (record: Gantt.Record<RecordType>, startDate: string, endDate: string) => Promise<boolean>
  /**
   * 开始时间属性 key，默认值 startDate
  */
  startDateKey?: string
  /**
   * 结束时间属性 key，默认值 endDate
  */
  endDateKey?: string
  /** 返回是否是节假日 - 默认周六，周日 */
  isRestDay?: (date: string) => boolean
  /** 当前视图 */
  unit?: Gantt.Sight
  /** 行高 */
  rowHeight?: number
  /** 获取组件的方法 */
  innerRef?: React.MutableRefObject<GanttRef>
  /** 返回默认条样式 */
  getBarColor?: GanttContext<RecordType>['getBarColor']
  /** 展示返回今日，默认值true */
  showBackToday?: GanttContext<RecordType>['showBackToday']
  /** 展示视图切换，默认值true */
  showUnitSwitch?: GanttContext<RecordType>['showUnitSwitch']
  onRow?: GanttContext<RecordType>['onRow']
  tableIndent?: GanttContext<RecordType>['tableIndent']
  expandIcon?: GanttContext<RecordType>['expandIcon']
  renderBar?: GanttContext<RecordType>['renderBar']
  renderGroupBar?: GanttContext<RecordType>['renderGroupBar']
  renderInvalidBar?: GanttContext<RecordType>['renderInvalidBar']
  renderBarThumb?: GanttContext<RecordType>['renderBarThumb']
  onBarClick?: GanttContext<RecordType>['onBarClick']
  /** 是否可以显示/隐藏左侧的table */
  tableCollapseAble?: GanttContext<RecordType>['tableCollapseAble']
  /** 返回顶部按钮，默认值为true，可以通过这个参数设置返回按钮的样式 */
  scrollTop?: GanttContext<RecordType>['scrollTop']
  /** 是否禁用图表 */
  disabled?: boolean
  alwaysShowTaskBar?: boolean
  renderLeftText?: GanttContext<RecordType>['renderLeftText']
  renderRightText?: GanttContext<RecordType>['renderLeftText']
  onExpand?: GanttContext<RecordType>['onExpand']
  /**
   * 自定义日期筛选维度
   */
  customSights?: Gantt.SightConfig[]
}

/** 甘特图组件的方法 */
export interface GanttRef {
  /** 返回今日 */
  backToday: () => void
  getWidthByDate: (startDate: Dayjs, endDate: Dayjs) => number
}

const GanttComponent = <RecordType extends DefaultRecordType>(props: GanttProps<RecordType>) => {
  const {
    data,
    columns,
    dependencies = [],
    onUpdate,
    startDateKey = 'startDate',
    endDateKey = 'endDate',
    isRestDay,
    getBarColor, //
    showBackToday = true, //
    showUnitSwitch = true, //
    unit,
    onRow, //
    tableIndent = TABLE_INDENT, // 表格缩紧，默认值30
    expandIcon, //
    renderBar, //
    renderInvalidBar, //
    renderGroupBar, //
    onBarClick, //
    tableCollapseAble = true, //
    renderBarThumb, //
    scrollTop = true, //
    rowHeight = ROW_HEIGHT,
    innerRef,
    disabled = false,
    alwaysShowTaskBar = true, //
    renderLeftText, //
    renderRightText, //
    onExpand, //
    customSights = [],
  } = props

  // Memo 实例化store
  const store = useMemo(
    () => new GanttStore({ rowHeight, disabled, customSights }),
    [rowHeight, customSights],
  )

  // Effect
  useEffect(() => {
    store.setData(data, startDateKey, endDateKey)
  }, [data, endDateKey, startDateKey, store])

  useEffect(() => {
    store.setColumns(columns)
  }, [columns, store])

  useEffect(() => {
    store.setOnUpdate(onUpdate)
  }, [onUpdate, store])

  useEffect(() => {
    store.setDependencies(dependencies)
  }, [dependencies, store])

  useEffect(() => {
    if (isRestDay) store.setIsRestDay(isRestDay)
  }, [isRestDay, store])

  useEffect(() => {
    if (unit) store.switchSight(unit)
  }, [unit, store])

  // Ref
  useImperativeHandle(innerRef, () => ({
    backToday: () => store.scrollToToday(),
    getWidthByDate: store.getWidthByDate,
  }))

  const ContextValue = React.useMemo(
    () => ({
      prefixCls, // TODO 可以删除
      store, // store 值通过 context 传递
      getBarColor,
      showBackToday,
      showUnitSwitch,
      onRow,
      tableIndent,
      expandIcon,
      renderBar,
      renderInvalidBar,
      renderGroupBar,
      onBarClick,
      tableCollapseAble,
      renderBarThumb,
      scrollTop,
      barHeight: BAR_HEIGHT,
      alwaysShowTaskBar,
      renderLeftText,
      renderRightText,
      onExpand,
    }),
    [
      store,
      getBarColor,
      showBackToday,
      showUnitSwitch,
      onRow,
      tableIndent,
      expandIcon,
      renderBar,
      renderInvalidBar,
      renderGroupBar,
      onBarClick,
      tableCollapseAble,
      renderBarThumb,
      scrollTop,
      alwaysShowTaskBar,
      renderLeftText,
      renderRightText,
      onExpand,
    ]
  )

  console.log('store-->', toJS(store))
  return (
    <Observer>
      {() => (
        <Context.Provider value={ContextValue}>
          <Body>
            {/* TODO 使用 css module 修改样式 */}
            <div
              className={`${prefixCls}-body-left`}
              style={{
                width: store.tableWidth,
                height: '100%',
              }}
            >
              <TableScene
                namespace="newcoreTableSceneTree"
                simple
                exportConfig
                columns={columns as any}
                type="normal"
                tree
                treeCheckbox
                dataSource={data}
                // serverSideDataSource={(_f, _s, pagination) =>
                //   getDataSource(pagination).then((res: any) => ({
                //     dataSource: res.dataSource || [],
                //     total: res.total || 0,
                //     childTotal: res.childTotal,
                //   }))
                // }
                rowKey={(record: any) => `${record.key}-${record.level}`}
                scroll={{
                  y: '50vh',
                }}
                expandable={{
                  defaultExpandAllRows: true,
                }}
                treeExpandable={{
                  defaultExpandAllRows: false,
                }}
                virtual
                resizable
                rowSelection={{
                  type: 'multiple',
                  onChange(rows) {
                    console.log(rows);
                  },
                }}
              />

            </div>

            {/* gantt-chart */}
            <div
              className={`${prefixCls}-body-right`}
              style={{
                width: store.viewWidth,
              }}
            >
              {/* <TableHeader /> */}
              <header>
                <TimeAxis />
              </header>

              <main
                ref={store.mainElementRef}
                onScroll={store.handleScroll}
              >
                {/* 鼠标hover效果*/}
                <SelectionIndicator />

                {/* table */}
                {/* <TableBody /> */}

                {/* 甘特图 */}
                <Chart />
              </main>
            </div>

            {/* 拖拽改变甘特图大小的分割线 */}
            <Divider />

            {/*
              返回今日按钮
              当今天没有显示在甘特图的可见区域时，会显示今天按钮
              点击今天按钮，甘特图中会显示今天对应的坐标
            */}
            {showBackToday && <TimeIndicator />}

            {/* 展示视图切换 */}
            {showUnitSwitch && <TimeAxisScaleSelect />}

            {/* 甘特图下方的滚动条 */}
            <ScrollBar />

            {/* 返回顶部按钮 */}
            {scrollTop && <ScrollTop />}
          </Body>
        </Context.Provider>
      )}
    </Observer>
  )
}

export default GanttComponent
