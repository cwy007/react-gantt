import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMemoizedFn } from 'ahooks';
import { observer } from 'mobx-react-lite';
import AutoScroller from './AutoScroller';

interface DragResizeProps extends React.HTMLProps<HTMLDivElement> {
  onResize: ({ width, x }: { width: number; x: number }) => void;
  /** 拖拽结束 mouseup */
  onResizeEnd?: ({ width, x }: { width: number; x: number }) => void;
  /** 在左右拖拽前执行 */
  onBeforeResize?: () => void;
  /** 左右拖拽时时间区间的最小宽度 */
  minWidth?: number;
  /** 缩放的类型：left拖拽左侧拖柄，right拖拽右侧的拖柄，move移动时间区间  */
  type: 'left' | 'right' | 'move';
  /** // TODO: ?? 默认值 undefined */
  grid?: number;
  /** gantt-chart element ref */
  scroller?: HTMLElement;
  defaultSize: {
    /** 时间区间的宽度，对应 bar.width */
    width: number;
    /**
     * bar.translateX 对应的值
     * */
    x: number;
  };
  /** 默认值 true */
  autoScroll?: boolean;
  onAutoScroll?: (delta: number) => void;
  /** 是否到最左边了，默认值 () => false */
  reachEdge?: (position: 'left' | 'right') => boolean;
  /** 点击就算开始，默认值为 false */
  clickStart?: boolean;
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 返回视图单位的整数倍
 * @param width 拖拽后时间区间的长度，单位像素
 * @param grid 天对应的长度，单位像素
 * @returns
 */
const snap = (width: number, grid: number): number => Math.round(width / grid) * grid;

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
  const updateSize = useMemoizedFn(() => {
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
          width = snap(width, grid); // grid 的整数倍
        }
        const pos = width - positionRef.current.width;
        const x = positionRef.current.x - pos;
        onResize({
          width, // 时间区间的宽度
          x // 时间区间起点偏移量
        });
        break;
      }
      // 向右，x不变，只变宽度
      case 'right': {
        let width = positionRef.current.width + distance;
        if (minWidth !== undefined) {
          width = Math.max(width, minWidth);
        }

        // grid 在任何视图下都以小时为单位
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

  const handleAutoScroll = useMemoizedFn((delta: number) => {
    updateSize();
    onAutoScroll(delta);
  });

  const autoScroll = useMemo(
    () =>
      new AutoScroller({ scroller, onAutoScroll: handleAutoScroll, reachEdge }),
    [handleAutoScroll, scroller, reachEdge]
  );

  const handleMouseMove = useMemoizedFn((event: MouseEvent) => {
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

  const handleMouseUp = useMemoizedFn(() => {
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

  const handleMouseDown = useMemoizedFn(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (disabled) return // 禁用时直接 return

      event.stopPropagation();
      if (enableAutoScroll && scroller) {
        autoScroll.start();
      }

      // 点击就算开始
      if (clickStart) {
        onBeforeResize && onBeforeResize();
        setResizing(true); // 拖拽中，改变鼠标样式
      }

      positionRef.current.clientX = event.clientX; // 鼠标指针相对于浏览器页面的水平坐标
      positionRef.current.x = defaultX; // 其实值
      positionRef.current.width = defaultWidth; // 宽度
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
