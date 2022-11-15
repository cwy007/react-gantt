/** 时间轴 */
import React, { useCallback, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import DragResize from '../drag-resize'
import Context from '../../context'

import './index.less'

/** 甘特图上面的时间横坐标 */
const TimeAxis: React.FC = () => {
  const { store, prefixCls } = useContext(Context)
  const prefixClsTimeAxis = `${prefixCls}-time-axis`
  const { sightConfig, isToday } = store
  const majorList = store.getMajorList()
  const minorList = store.getMinorList()

  const onResize = useCallback(
    ({ x }) => {
      store.handlePanMove(-x)
    },
    [store]
  )

  const onResizeEnd = useCallback(() => {
    store.handlePanEnd()
  }, [store])

  const getIsToday = useCallback(
    item => {
      const { key } = item
      const { type } = sightConfig
      return type === 'day' && isToday(key)
    },
    [sightConfig, isToday]
  )

  return (
    <DragResize
      onResize={onResize}
      onResizeEnd={onResizeEnd}
      defaultSize={{
        x: -store.translateX, // css translateX 的实际值
        width: 0,
      }}
      type='move'
    >
      <div
        className={prefixClsTimeAxis}
        style={{
          // left: store.tableWidth,
          width: store.viewWidth,
        }}
      >
        <div
          className={`${prefixClsTimeAxis}-render-chunk`}
          style={{
            transform: `translateX(-${store.translateX}px`, // -负值向左平移
          }}
        >
          {/* 大的时间区间 */}
          {majorList.map(item => (
            <div key={item.key} className={`${prefixClsTimeAxis}-major`} style={{ width: item.width, left: item.left }}>
              <div className={`${prefixClsTimeAxis}-major-label`}>{item.label}</div>
            </div>
          ))}

          {/* 小的时间区间 */}
          {minorList.map(item => (
            <div
              key={item.key}
              className={classNames(`${prefixClsTimeAxis}-minor`)}
              style={{ width: item.width, left: item.left }}
            >
              <div
                className={classNames(`${prefixClsTimeAxis}-minor-label`, {
                  [`${prefixClsTimeAxis}-today`]: getIsToday(item),
                })}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DragResize>
  )
}

export default observer(TimeAxis)
