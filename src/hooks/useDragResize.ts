import React, { useCallback, useRef, useState } from 'react';
import { usePersistFn } from 'ahooks'; // TODO ahook v2 -> v3

/**
 * 拖拽相关逻辑
 * @param handleResize 修改 table宽度
 * @param param1 table的初始宽度，最大和最小宽度
 * @returns
 */
export default function useDragResize(
  handleResize: ({ width }: { width: number }) => void,
  {
    initSize,
    minWidth: minWidthConfig,
    maxWidth: maxWidthConfig,
  }: {
    initSize: {
      width: number; // 初始宽度 tableWidth
    };
    minWidth?: number; // table最小宽度
    maxWidth?: number; // table最大宽度
  }
): [(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void, boolean] {
  const [resizing, setResizing] = useState(false);
  const positionRef = useRef({
    left: 0,
  });
  const initSizeRef = useRef(initSize);

  // TODO ahook 3 useMemoizedFn
  // https://ahooks.gitee.io/zh-CN/hooks/use-memoized-fn
  //
  const handleMouseMove = usePersistFn(async (event: MouseEvent) => {
    const distance = event.clientX - positionRef.current.left;
    let width = initSizeRef.current.width + distance;
    if (minWidthConfig !== undefined) {
      width = Math.max(width, minWidthConfig); // 最小是 200
    }
    if (maxWidthConfig !== undefined) {
      width = Math.min(width, maxWidthConfig); // 最大是容器宽度的 60%
    }
    handleResize({ width });
  });

  /**
   * 移除事件监听，改变拖拽状态
   */
  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    setResizing(false); // 收起鼠标，拖拽结束
  }, [handleMouseMove]);

  /**
   * 按下鼠标，添加鼠标移动和收起事件
   */
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      positionRef.current.left = event.clientX; // 按下鼠标时，对应的x坐标
      initSizeRef.current = initSize; // table初始宽度
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      setResizing(true); // 按下鼠标，显示拖拽状态
    },
    [handleMouseMove, handleMouseUp, initSize]
  );

  return [handleMouseDown, resizing];
}
