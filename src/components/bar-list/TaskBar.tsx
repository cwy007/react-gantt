import React, { useCallback, useContext, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useMemoizedFn } from 'ahooks'
import Context from '../../context'
import { Gantt } from '../../types'
import DragResize from '../drag-resize'
import { TOP_PADDING } from '../../constants'
import { ONE_HOUR_MS } from '../../store'
import './TaskBar.less'

interface TaskBarProps {
  data: Gantt.Bar
}

const TaskBar: React.FC<TaskBarProps> = ({ data }) => {
  const {
    store,
    // getBarColor,
    renderBar,
    onBarClick,
    prefixCls,
    barHeight,
    alwaysShowTaskBar,
    renderLeftText,
    renderRightText,
  } = useContext(Context)
  const {
    width,
    translateX,
    translateY,
    invalidDateRange,
    stepGesture,
    dateTextFormat,
    record,
    loading,
    // getDateWidth,
  } = data

  const { disabled = false } = record || {}

  const prefixClsTaskBar = `${prefixCls}-task-bar`

  const { selectionIndicatorTop, showSelectionIndicator, rowHeight } = store

  /** 通过鼠标 hover 效果位置和 bar.translateY 判断是否显示左右拖拽元素 */
  const showDragBar = useMemo(() => {
    if (!showSelectionIndicator) return false
    // 差值
    const baseTop = TOP_PADDING + rowHeight / 2 - barHeight / 2
    return selectionIndicatorTop === translateY - baseTop
  }, [showSelectionIndicator, selectionIndicatorTop, translateY, rowHeight, barHeight])

  // const themeColor = useMemo(() => {
  //   // 未预期
  //   if (translateX + width >= dayjs().valueOf() / store.pxUnitAmp) return ['#95DDFF', '#64C7FE']
  //   //  预期对应的颜色
  //   return ['#FD998F', '#F96B5D'] // TODO
  // }, [store.pxUnitAmp, translateX, width])

  const handleBeforeResize = (type: Gantt.MoveType) => () => {
    if (disabled) return
    store.handleDragStart(data, type)
  }

  const handleResize = useCallback(
    ({ width: newWidth, x }) => {
      if (disabled) return // 禁用时
      store.updateBarSize(data, { width: newWidth, x })
    },
    [data, store, disabled]
  )

  /** 左侧拖拽结束 - mouseup */
  const handleLeftResizeEnd = useCallback(
    (oldSize: { width: number; x: number }) => {
      store.handleDragEnd()
      store.updateTaskDate(data, oldSize, 'left')
    },
    [data, store]
  )

  /** 右侧拖拽结束 - mouseup */
  const handleRightResizeEnd = useCallback(
    (oldSize: { width: number; x: number }) => {
      store.handleDragEnd()
      store.updateTaskDate(data, oldSize, 'right')
    },
    [data, store]
  )

  /** 时间区间拖拽结束 - mouseup */
  const handleMoveEnd = useCallback(
    (oldSize: { width: number; x: number }) => {
      store.handleDragEnd()
      store.updateTaskDate(data, oldSize, 'move')
    },
    [data, store]
  )

  const handleAutoScroll = useCallback(
    (delta: number) => {
      store.setTranslateX(store.translateX + delta)
    },
    [store]
  )
  // TODO
  const allowDrag = showDragBar && !loading
  // const allowDrag = true

  /** 点击时间区间 */
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
      e.stopPropagation()
      if (onBarClick) onBarClick(data.record)
      console.log('test click bar')
    },
    [data.record, onBarClick]
  )

  /** 是否到最左边了 */
  const reachEdge = useMemoizedFn((position: 'left' | 'right') => position === 'left' && store.translateX <= 0)
  // TODO:
  // 根据不同的视图确定拖动时的单位，在任何视图下都以小时为单位
  const grid = useMemo(() => ONE_HOUR_MS / store.pxUnitAmp, [store.pxUnitAmp])

  // TODO ??
  // -0.00007291666666666667
  const moveCalc = -(width / store.pxUnitAmp)

  return (
    // TODO Popover 鼠标 hover 提示
    <div
      role='none'
      className={classNames(prefixClsTaskBar, {
        [`${prefixClsTaskBar}-invalid-date-range`]: invalidDateRange, // 无效的时间区间时会隐藏掉
      })}
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
      }}
    >
      {loading && <div className={`${prefixClsTaskBar}-loading`} />}
      <div>
        {allowDrag && (
          <>
            <DragResize
              className={classNames(`${prefixClsTaskBar}-resize-handle`,
                `${prefixClsTaskBar}-resize-handle-left`, {
                [`${prefixClsTaskBar}-resize-handle-disabled`]: disabled,
              })}
              onResize={handleResize}
              onResizeEnd={handleLeftResizeEnd}
              defaultSize={{
                x: translateX, // 时间区间起点的偏移量
                width,
              }}
              // minWidth={24}
              grid={grid}
              type='left'
              scroller={store.chartElementRef.current || undefined}
              onAutoScroll={handleAutoScroll}
              reachEdge={reachEdge}
              onBeforeResize={handleBeforeResize('left')}
              disabled={disabled}
            />
            <DragResize
              className={classNames(`${prefixClsTaskBar}-resize-handle`,
                `${prefixClsTaskBar}-resize-handle-right`, {
                [`${prefixClsTaskBar}-resize-handle-disabled`]: disabled,
              })}
              style={{ left: width - 10 }}
              onResize={handleResize}
              onResizeEnd={handleRightResizeEnd}
              defaultSize={{
                x: translateX,
                width,
              }}
              // minWidth={24}
              grid={grid}
              type='right'
              scroller={store.chartElementRef.current || undefined}
              onAutoScroll={handleAutoScroll}
              reachEdge={reachEdge}
              onBeforeResize={handleBeforeResize('right')}
              disabled={disabled}
            />

            {/* 拖拽背景 */}
            {/* <div
              className={classNames(`${prefixClsTaskBar}-resize-bg`, `${prefixClsTaskBar}-resize-bg-compact`)}
              style={{ width }}
              // style={{ width: width + 30, left: -14 }}
            /> */}
          </>
        )}

        {/* 时间区间 */}
        <DragResize
          className={classNames(`${prefixClsTaskBar}-bar`, {
            [`${prefixClsTaskBar}-bar-hover`]: store.getHovered(translateY)
          })}
          onResize={handleResize}
          onResizeEnd={handleMoveEnd}
          defaultSize={{
            x: translateX,
            width,
          }}
          minWidth={24}
          grid={grid}
          type='move'
          scroller={store.chartElementRef.current || undefined}
          onAutoScroll={handleAutoScroll}
          reachEdge={reachEdge}
          onBeforeResize={handleBeforeResize('move')}
        >
          {renderBar ? (
            renderBar(data, {
              width: width + 1,
              height: barHeight + 1,
            })
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              version='1.1'
              width={width + 1}
              height={barHeight + 1}
              viewBox={`0 0 ${width + 1} ${barHeight + 1}`}
            >
              <rect
                x={0}
                y={0}
                rx={12}
                ry={12}
                width={width}
                height={barHeight}
                fill='#1463FF'
                fillOpacity={1}
                stroke={'black'}
                strokeOpacity={0}
                onClick={handleClick}
                // className={}
                // onClick={() => {
                //   if (nodeClickArr && nodeClickArr.length > 0) {
                //     const currentClientFunc = nodeClickArr.find(
                //       (v) => v.distribute === value?.distribute,
                //     );
                //     if (currentClientFunc) {
                //       currentClientFunc?.onNodeClick(value, row);
                //     }
                //   }
                // }}
              />
              {/* <path
                // TODO
                // 本次排程颜色 #1463FF
                // 已排程颜色 #25D44F
                fill={record.backgroundColor || (getBarColor && getBarColor(record).backgroundColor) || '#1463FF'}
                stroke={record.borderColor || (getBarColor && getBarColor(record).borderColor) || '#1463FF'}
                // fill={record.backgroundColor || (getBarColor && getBarColor(record).backgroundColor) || themeColor[0]}
                // stroke={record.borderColor || (getBarColor && getBarColor(record).borderColor) || themeColor[1]}
                d={`
                  M${width - 2},0.5
                  l-${width - 5},0
                  c-0.41421,0 -0.78921,0.16789 -1.06066,0.43934
                  c-0.27145,0.27145 -0.43934,0.64645 -0.43934,1.06066
                  l0,5.3

                  c0.03256,0.38255 0.20896,0.724 0.47457,0.97045
                  c0.26763,0.24834 0.62607,0.40013 1.01995,0.40013
                  l4,0

                  l${width - 12},0

                  l4,0
                  c0.41421,0 0.78921,-0.16789 1.06066,-0.43934
                  c0.27145,-0.27145 0.43934,-0.64645 0.43934,-1.06066

                  l0,-5.3
                  c-0.03256,-0.38255 -0.20896,-0.724 -0.47457,-0.97045
                  c-0.26763,-0.24834 -0.62607,-0.40013 -1.01995,-0.40013z
                `}
              /> */}
            </svg>
          )}
        </DragResize>

        {/* TODO 编辑，复制，删除 */}
      </div>

      {/* {(allowDrag || disabled || alwaysShowTaskBar) && (
        <div className={`${prefixClsTaskBar}-label`} style={{ left: width / 2 - 10 }}>
          {getDateWidth(translateX + width + moveCalc, translateX)}天
        </div>
      )} */}

      {(stepGesture === 'moving' || allowDrag || alwaysShowTaskBar) && (
        <>
          <div className={`${prefixClsTaskBar}-date-text`} style={{ left: width + 16 }}>
            {renderRightText ? renderRightText(data) : dateTextFormat(translateX + width + moveCalc)}
          </div>
          <div className={`${prefixClsTaskBar}-date-text`} style={{ right: width + 16 }}>
            {renderLeftText ? renderLeftText(data) : dateTextFormat(translateX)}
          </div>
        </>
      )}
    </div>
  )
}
export default observer(TaskBar)
