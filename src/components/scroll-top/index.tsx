import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react-lite';
import Context from '../../context';
import './index.less';

/** 返回顶部按钮 */
const ScrollTop: React.FC = () => {
  const { store, scrollTop: scrollTopConfig, prefixCls } = useContext(Context);
  const { scrollTop } = store;
  const prefixClsScrollTop = `${prefixCls}-scroll_top`;

  const handleClick = useCallback(() => {
    if (store.mainElementRef.current) {
      store.mainElementRef.current.scrollTop = 0; // TODO
    }
  }, [store.mainElementRef]);

  if (scrollTop <= 100 || !store.mainElementRef.current) {
    return null;
  }

  return (
    <div
      className={prefixClsScrollTop}
      style={scrollTopConfig instanceof Object ? scrollTopConfig : undefined}
      onClick={handleClick}
    />
  );
};
export default observer(ScrollTop);
