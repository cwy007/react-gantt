import React, { useContext, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Context from '../../context';
import './index.less';

/**
 * 返回今日按钮
 *
 * 当今天没有显示在甘特图的可见区域时，会显示今天按钮，点击今天按钮，甘特图中会显示今天对应的坐标
*/
const TimeIndicator: React.FC = () => {
  const { store, prefixCls } = useContext(Context);
  const {
    scrolling,
    translateX,
    tableWidth,
    viewWidth,
    todayTranslateX,
  } = store;
  const prefixClsTimeIndicator = `${prefixCls}-time-indicator`;
  const type = todayTranslateX < translateX ? 'left' : 'right';
  const left = type === 'left' ? tableWidth : 'unset';
  const right = type === 'right' ? 111 : 'unset';

  const display = useMemo(() => {
    const isOverLeft = todayTranslateX < translateX;
    const isOverRight = todayTranslateX > translateX + viewWidth;
    return isOverLeft || isOverRight ? 'block' : 'none';
  }, [todayTranslateX, translateX, viewWidth]);

  const handleClick = useCallback(() => {
    store.scrollToToday();
  }, [store]);

  return (
    <button
      onClick={handleClick}
      className={classNames(prefixClsTimeIndicator, {
        [`${prefixClsTimeIndicator}-scrolling`]: scrolling,
      })}
      type="button"
      data-role="button"
      style={{ left, right, display }}
    >
      <span>今天</span>
    </button>
  );
};

export default observer(TimeIndicator);
