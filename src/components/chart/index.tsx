import { observer } from 'mobx-react-lite'
import React, { useContext, useEffect } from 'react'
import Context from '../../context'
import BarList from '../bar-list'
import BarThumbList from '../bar-thumb-list'
import Dependencies from '../dependencies'
import DragPresent from './DragPresent'
import Today from '../today'
import './index.less'

/** 甘特图-图表 */
const Chart: React.FC = () => {
  const { store, prefixCls } = useContext(Context)
  const {
    tableWidth, viewWidth, bodyScrollHeight, translateX, chartElementRef,
  } = store
  const minorList = store.getMinorList()

  useEffect(() => {
    const element = chartElementRef.current
    if (element) element.addEventListener('wheel', store.handleWheel)

    return () => {
      if (element) element.removeEventListener('wheel', store.handleWheel)
    }
  }, [chartElementRef, store])

  return (
    <div
      ref={chartElementRef}
      className={`${prefixCls}-chart`}
      style={{
        width: viewWidth,
        height: bodyScrollHeight,
      }}
    >
      <svg
        className={`${prefixCls}-chart-svg-renderer`}
        xmlns='http://www.w3.org/2000/svg'
        version='1.1'
        width={viewWidth}
        height={bodyScrollHeight}
        viewBox={`${translateX} 0 ${viewWidth} ${bodyScrollHeight}`}
      >
        <defs>
          <pattern
            id='repeat'
            width='4.5'
            height='10'
            patternUnits='userSpaceOnUse'
            patternTransform='rotate(70 50 50)'
          >
            <line stroke='#c6c6c6' strokeWidth='1px' y2='10' />
          </pattern>
        </defs>

        {/* 画x轴对应的竖线 */}
        {minorList.map(item =>
          item.isWeek ? (
            <g key={item.key} stroke='#f0f0f0'>
              <path d={`M${item.left},0 L${item.left},${bodyScrollHeight}`} />
              <rect
                fill='url(#repeat)'
                opacity='0.5'
                strokeWidth='0'
                x={item.left}
                y={0}
                width={item.width}
                height={bodyScrollHeight}
              />
            </g>
          ) : (
            <g key={item.key} stroke='#f0f0f0'>
              <path d={`M${item.left},0 L${item.left},${bodyScrollHeight}`} />
            </g>
          )
        )}

        {/* 拖动时的提示条 */}
        <DragPresent />

        {/* 依赖路径 */}
        <Dependencies />
      </svg>

      <div
        className={`${prefixCls}-render-chunk`}
        style={{
          height: bodyScrollHeight,
          transform: `translateX(-${translateX}px`,
        }}
      >
        {/* 渲染缩略图列表 */}
        <BarThumbList />

        <BarList />

        {/* 今天对应的辅助线 */}
        <Today />
      </div>
    </div>
  )
}
export default observer(Chart)
