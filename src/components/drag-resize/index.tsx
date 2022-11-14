import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePersistFn } from 'ahooks';
import { observer } from 'mobx-react-lite';
import AutoScroller from './AutoScroller';

interface DragResizeProps extends React.HTMLProps<HTMLDivElement> {
  onResize: ({ width, x }: { width: number; x: number }) => void;
  /* 拖拽前的size */
  onResizeEnd?: ({ width, x }: { width: number; x: number }) => void;
  /** 在左右拖拽前执行 */
  onBeforeResize?: () => void;
  minWidth?: number;
  /** // TODO: ?? */
  type: 'left' | 'right' | 'move';
  /** // TODO: ?? 默认值 undefined */
  grid?: number;
  /** // TODO ??,默认值 undefined */
  scroller?: HTMLElement;
  defaultSize: {
    /** // TODO ?? */
    width: number;
    /**
     * translateX 对应的值，负值向左平移，正值向右平移
     *
     * 始终小于 0
     * */
    x: number;
  };
  /** 默认值 true */
  autoScroll?: boolean;
  onAutoScroll?: (delta: number) => void;
  /** 默认值 () => false */
  reachEdge?: (position: 'left' | 'right') => boolean;
  /** 点击就算开始，默认值为 false */
  clickStart?: boolean;
  /** 是否禁用 */
  disabled?: boolean
}

const snap = (n: number, size: number): number => Math.round(n / size) * size;

/**
 * 控制横轴的左右拖拽，实现左右滚动
*/
const DragResize: React.FC<DragResizeProps> = ({
  type,
  onBeforeResize,
  onResize,
  onResizeEnd,
  minWidth = 0,
  grid,
  defaultSize: { x: defaultX, width: defaultWidth },
  scroller,
  autoScroll: enableAutoScroll = true,
  onAutoScroll,
  reachEdge = () => false,
  clickStart = false,
  children,
  disabled = false,
  ...otherProps
}) => {
  const [resizing, setResizing] = useState(false); // 点击，左右拖拽时会设为true
  /** 鼠标信息 */
  const positionRef = useRef({
    clientX: 0, // 按下鼠标时会更新
    width: defaultWidth,
    x: defaultX,
  });
  /** 移动中鼠标的位置 */
  const moveRef = useRef({
    clientX: 0,
  });

  // TODO ??
  const updateSize = usePersistFn(() => {
    if (disabled) return

    const distance =
      moveRef.current.clientX -
      positionRef.current.clientX +
      autoScroll.autoScrollPos;

    switch (type) {
      case 'left': {
        let width = positionRef.current.width - distance;
        if (minWidth !== undefined) {
          width = Math.max(width, minWidth);
        }
        if (grid) {
          width = snap(width, grid);
        }
        const pos = width - positionRef.current.width;
        const x = positionRef.current.x - pos;
        onResize({ width, x });
        break;
      }
      // 向右，x不变，只变宽度
      case 'right': {
        let width = positionRef.current.width + distance;
        if (minWidth !== undefined) {
          width = Math.max(width, minWidth);
        }
        if (grid) {
          width = snap(width, grid);
        }
        const { x } = positionRef.current;
        onResize({ width, x });
        break;
      }
      case 'move': {
        const { width } = positionRef.current;
        let rightDistance = distance;
        if (grid) {
          rightDistance = snap(distance, grid);
        }
        const x = positionRef.current.x + rightDistance;
        onResize({ width, x });
        break;
      }
    }
  });

  // https://ahooks.gitee.io/zh-CN/hooks/use-memoized-fn
  // useMemoizedFn
  //
  const handleAutoScroll = usePersistFn((delta: number) => {
    updateSize();
    onAutoScroll(delta);
  });

  // TODO persist reachEdge
  // 自动滚动逻辑
  //
  const autoScroll = useMemo(
    () =>
      new AutoScroller({ scroller, onAutoScroll: handleAutoScroll, reachEdge }),
    [handleAutoScroll, scroller, reachEdge]
  );

  const handleMouseMove = usePersistFn((event: MouseEvent) => {
    if (disabled) return // 禁用时直接 return
    if (!resizing) {
      setResizing(true);
      if (!clickStart) {
        onBeforeResize && onBeforeResize();
      }
    }
    moveRef.current.clientX = event.clientX;
    updateSize();
  });

  const handleMouseUp = usePersistFn(() => {
    if (disabled) return
    autoScroll.stop();
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    if (resizing) {
      setResizing(false);
      onResizeEnd &&
        onResizeEnd({
          x: positionRef.current.x,
          width: positionRef.current.width,
        });
    }
  });

  const handleMouseDown = usePersistFn(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (disabled) return // 禁用时直接 return

      event.stopPropagation();

      // TODO ?? scroller
      // 甘特图中有用到
      //
      if (enableAutoScroll && scroller) {
        autoScroll.start();
      }

      // 点击就算开始
      if (clickStart) {
        onBeforeResize && onBeforeResize();
        setResizing(true); // 拖拽中，改变鼠标样式
      }

      positionRef.current.clientX = event.clientX;
      positionRef.current.x = defaultX; // -store.translateX
      positionRef.current.width = defaultWidth; // 0

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  );

  return (
    <div role="none" onMouseDown={handleMouseDown} {...otherProps}>
      {resizing &&
        // 将 div 渲染到body中，覆盖整个页面，改变鼠标样式
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              zIndex: 9999,
              cursor: disabled ? 'not-allowed':'col-resize',
            }}
          />,
          document.body
        )}

      {children}
    </div>
  );
};

export default observer(DragResize);
