import type { Coordinate } from 'socket/types';
import { Canvas } from './canvas';

export class Observable extends Canvas {
  protected canvas: HTMLCanvasElement;
  protected observer: ResizeObserver | null = null;

  private initialCanvasWidth: number;
  private initialCanvasHeight: number;

  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);
    this.canvas = canvas;
    this.initialCanvasWidth = canvas.clientWidth;
    this.initialCanvasHeight = canvas.clientHeight;
  }

  protected resizeObserver(callback: () => void) {
    this.observer = new ResizeObserver(() => {
      if (
        this.canvas.clientWidth === this.initialCanvasWidth &&
        this.canvas.clientHeight === this.initialCanvasHeight
      ) {
        return;
      }

      callback();
    });

    this.observer.observe(this.canvas);
  }

  teardown() {
    this.observer?.disconnect();

    super.teardown();
  }
}
