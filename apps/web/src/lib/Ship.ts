import type { Coordinate } from 'socket/types';
import { Observable } from './Obserservable';
import { mobMarkerColor } from './tokens';

export class Ship extends Observable {
  constructor(center: Coordinate, canvas: HTMLCanvasElement) {
    super(center, canvas);

    this.init();
  }

  set zoom(zoomLevel: number) {
    const zoomFactor = 1 + (zoomLevel - 1) / 5;
  }

  private reset() {
    this.clearCanvas();
    this.centerContext();
  }

  private init() {
    this.reset();
    this.resizeObserver(this.drawMobMarker);
    this.drawMobMarker();
  }

  private drawMobMarker = () => {
    this.draw(() => {
      this.context.fillStyle = mobMarkerColor;
      this.drawCircle(0, 0, 3, 'fill');
    });
  };
}
