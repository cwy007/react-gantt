import React, { useContext, useCallback, useState, useRef } from 'react'
import { usePersistFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import Context from '../../context'
import './index.less'

/** 甘特图下方的滚动条 */
const ScrollBar: React.FC = () => {
  const { store, prefixCls } = useContext(Context)
  const { tableWidth, viewWidth } = store
  const width = store.scrollBarWidth
  const prefixClsScrollBar = `${prefixCls}-scroll_bar`
  //
  const [resizing, setResizing] = useState(false)
  const positionRef = useRef({
    left: 0,
    translateX: 0,
  })

  // TODO https://ahooks.gitee.io/zh-CN/hooks/use-memoized-fn
  //
  const handleMouseMove = usePersistFn((event: MouseEvent) => {
    const distance = event.clientX - positionRef.current.left // 鼠标移动的距离
    console.log('distance->', distance)
    // TODO 调整倍率
    // 甘特图下方滚动条拖拽按钮的宽度越小，滚动越快
    store.setTranslateX(distance * (store.viewWidth / store.scrollBarWidth) + positionRef.current.translateX)
  })

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    setResizing(false)
  }, [handleMouseMove])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      positionRef.current.left = event.clientX // 初始坐标
      positionRef.current.translateX = store.translateX // 当前平移距离
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      setResizing(true)
    },
    [handleMouseMove, handleMouseUp, store.translateX]
  )

  return (
    <div
      role='none'
      className={prefixClsScrollBar}
      style={{ left: tableWidth, width: viewWidth }}
      onMouseDown={handleMouseDown}
    >
      {/* 滑动滚动条时，修改鼠标的样式 */}
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

      {/*  */}
      <div
        className={`${prefixClsScrollBar}-thumb`}
        style={{
          width,
          left: store.scrollLeft,
        }}
      />
    </div>
  )
}
export default observer(ScrollBar)
