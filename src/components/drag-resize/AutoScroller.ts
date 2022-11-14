/** 自动滚动 */
class AutoScroller {
  constructor({
    scroller,
    rate = 5,
    space = 50,
    onAutoScroll,
    reachEdge,
  }: {
    scroller?: HTMLElement; //
    /** 默认值 5 */
    rate?: number;
    /** 默认值 50 */
    space?: number;
    onAutoScroll: (delta: number) => void; //
    reachEdge: (position: 'left' | 'right') => boolean; //
  }) {
    this.scroller = scroller || null;
    this.rate = rate;
    this.space = space;
    this.onAutoScroll = onAutoScroll;
    this.reachEdge = reachEdge;
  }

  /** 移动倍率，每次 5px */
  rate: number;

  /** */
  space: number;

  scroller: HTMLElement | null = null;

  /** 自动滚动的位置，每次触发 mousemove 事件时，向左 -this.rate, 向右 +this.rate */
  autoScrollPos: number = 0;

  /** 当事件被触发时鼠标指针相对于浏览器页面(或客户区)的水平坐标 */
  clientX: number | null = null;

  scrollTimer: number | null = null;

  onAutoScroll: (delta: number) => void;

  reachEdge: (position: 'left' | 'right') => boolean;

  handleDraggingMouseMove = (event: MouseEvent) => {
    console.log('event.clientX', event.clientX)
    this.clientX = event.clientX;
  };

  handleScroll = (position: 'left' | 'right') => {
    if (this.reachEdge(position)) {
      return;
    }
    if (position === 'left') {
      this.autoScrollPos -= this.rate;
      this.onAutoScroll(-this.rate);
    } else if (position === 'right') {
      this.autoScrollPos += this.rate;
      this.onAutoScroll(this.rate);
    }
  };

  /**
   * 开始自动滚动
   *
   * 绑定鼠标事件
   *
   * 动画帧请求
   */
  start = () => {
    this.autoScrollPos = 0;
    document.addEventListener('mousemove', this.handleDraggingMouseMove);

    const scrollFunc = () => {
      if (this.scroller && this.clientX !== null) {
        //
        if (
          this.clientX + this.space >
          this.scroller?.getBoundingClientRect().right // 元素右边到视窗左边的距离
        ) {
          this.handleScroll('right');

        //
        } else if (
          this.clientX - this.space <
          this.scroller?.getBoundingClientRect().left
        ) {
          this.handleScroll('left');
        }
      }

      this.scrollTimer = requestAnimationFrame(scrollFunc);
    };
    this.scrollTimer = requestAnimationFrame(scrollFunc);
  };

  /**
   * 停止自动滚动
   *
   * 移除鼠标事件
   *
   * 取消动画帧请求
   */
  stop = () => {
    document.removeEventListener('mousemove', this.handleDraggingMouseMove);
    if (this.scrollTimer) {
      cancelAnimationFrame(this.scrollTimer);
    }
  };
}

export default AutoScroller;
