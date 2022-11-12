import React, { useContext, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import useDragResize from '../../hooks/useDragResize'
import Context from '../../context'
import './index.less'

/** 拖拽改变甘特图大小的分割线 */
const Divider: React.FC = () => {
  const { store, tableCollapseAble, prefixCls } = useContext(Context)
  const prefixClsDivider = `${prefixCls}-divider`
  const { tableWidth } = store

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation()
      store.toggleCollapse()
    },
    [store]
  )
  const left = tableWidth // table 的宽度

  const handleResize = useCallback(
    ({ width }: { width: number }) => {
      store.handleResizeTableWidth(width)
    },
    [store]
  )

  const [handleMouseDown, resizing] = useDragResize(handleResize, {
    initSize: {
      width: tableWidth, // 初始宽度
    },
    minWidth: 200, // 最小宽度
    maxWidth: store.width * 0.6, // 最大宽度
  })

  return (
    <div
      role='none'
      className={classNames(prefixClsDivider, {
        [`${prefixClsDivider}_only`]: !tableCollapseAble,
      })}
      style={{ left: left - 1 }} // position absolute
      onMouseDown={tableWidth === 0 ? undefined : handleMouseDown}
    >
      {/* 拖拽时改变鼠标的样式 */}
      {resizing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 9999,
            cursor: 'col-resize',
          }}
        />
      )}

      {/* 拖拽改变table宽度的竖线 */}
      <hr />

      {/* 显示/隐藏数据的箭头 */}
      {tableCollapseAble && (
        <div
          className={`${prefixClsDivider}-icon-wrapper`}
          role='none'
          onMouseDown={e => e.stopPropagation()}
          onClick={handleClick}
        >
          <i
            className={classNames(`${prefixClsDivider}-arrow`, {
              [`${prefixClsDivider}-reverse`]: left <= 0,
            })}
          />
        </div>
      )}
    </div>
  )
}

export default observer(Divider)
