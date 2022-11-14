import React, { useCallback, useContext, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import Context from '../../context'
import { Gantt } from '../../types'
import './BarThumbList.less'

interface TaskBarProps {
  data: Gantt.Bar
}

/** 排期区间 bar 的缩略图，点击会平移甘特图，显示对应的排期 bar */
const TaskBarThumb: React.FC<TaskBarProps> = ({ data }) => {
  const { store, renderBarThumb, prefixCls, getBarColor } = useContext(Context)
  const prefixClsTaskBarThumb = `${prefixCls}-task-bar-thumb`
  const { translateX: viewTranslateX, viewWidth } = store
  const { translateX, translateY, label, record } = data

  /**
   * 排期区间位于甘特图右侧 type: right
   *
   * 排期区间位于甘特图左侧侧 type: left
   */
  const type = useMemo(() => {
    const rightSide = viewTranslateX + viewWidth // 甘特图右侧
    return translateX - rightSide > 0 ? 'right' : 'left'
  }, [translateX, viewTranslateX, viewWidth])

  const left = useMemo(
    () => (type === 'right' ? viewTranslateX + viewWidth - 5 : viewTranslateX + 2),
    [type, viewTranslateX, viewWidth]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation()
      console.log('scrollToBar data, type', data, type)
      store.scrollToBar(data, type)
    },
    [data, store, type]
  )

  const getBackgroundColor = useMemo(
    () => record.backgroundColor || (getBarColor && getBarColor(record).backgroundColor),
    [record]
  )

  return (
    <div
      role='none'
      className={classNames(prefixClsTaskBarThumb, {
        [`${prefixClsTaskBarThumb}-left`]: type === 'left',
        [`${prefixClsTaskBarThumb}-right`]: type === 'right',
      })}
      style={{
        left,
        top: translateY - 5,
      }}
      onClick={handleClick}
    >
      {type === 'left' && (
        <div className={`${prefixClsTaskBarThumb}-circle-left`} style={{ backgroundColor: getBackgroundColor }} />
      )}
      {renderBarThumb ? renderBarThumb(data.record, type) : label}
      {type === 'right' && (
        <div className={`${prefixClsTaskBarThumb}-circle-right`} style={{ backgroundColor: getBackgroundColor }} />
      )}
    </div>
  )
}
export default observer(TaskBarThumb)
