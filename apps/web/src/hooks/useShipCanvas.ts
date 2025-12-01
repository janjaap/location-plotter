import { type Coordinate, type PositionPayload } from 'socket/types';
// import { zoomLevelToFactor } from '../lib/canvas';
import { trackIndicatorColor } from '../lib/tokens';
import type { CanvasBounds, FromTo, GridPoint } from '../types';
// import { rotationFromHeading } from '../utils/bearingFromHeading';
import { gridCoordinate } from '../utils/gridCoordinate';

const canvasRenderer = (canvas: HTMLCanvasElement) => {
  const CANVAS_PADDING = 10;
  const LABBEL_HEIGHT = 20;
  const LABEL_WIDTH = 80;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get 2D canvas context');
  }

  context.textRendering = 'optimizeLegibility';

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const bounds: CanvasBounds = { top: 0, right: 0, bottom: 0, left: 0 };

  const minZoom = 1;
  const maxZoom = 10;
  let zoomLevel = maxZoom;

  const setBounds = () => {
    bounds.top = (canvas.height / 2 - CANVAS_PADDING) * -1;
    bounds.right = canvas.width / 2 - CANVAS_PADDING;
    bounds.bottom = canvas.height / 2 - LABBEL_HEIGHT;
    bounds.left = (canvas.width / 2 - CANVAS_PADDING - LABEL_WIDTH) * -1;
  };

  const draw = (drawFunc: () => void) => {
    context.save();

    drawFunc();

    context.restore();

    requestAnimationFrame(drawFunc);
  };

  const drawCircle = (center: GridPoint, radius: number, appearance: 'fill' | 'stroke') => {
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    context.closePath();

    if (appearance === 'fill') {
      context.fill();
    } else {
      context.stroke();
    }
  };

  const drawLine = ({ from, to }: FromTo) => {
    context.beginPath();

    if (from) context.moveTo(Math.round(from.x), Math.round(from.y));

    context.lineTo(Math.round(to.x), Math.round(to.y));
    context.closePath();
    context.stroke();
  };

  const recenterContext = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    setBounds();

    context.translate(canvas.width / 2, canvas.height / 2);
  };

  const clearDirtyRectangle = ({ x, y, radius }: GridPoint & { radius: number }) => {
    context.clearRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  const setZoomLevel = (newZoomLevel: number) => {
    zoomLevel = Math.min(Math.max(newZoomLevel, minZoom), maxZoom);
  };

  setBounds();

  return {
    bounds,
    clearDirtyRectangle,
    context,
    draw,
    drawCircle,
    drawLine,
    zoomLevel,
    recenterContext,
    setZoomLevel,
  };
};

export const graticuleRenderer = (canvas: HTMLCanvasElement) => {
  const VISIBLE_MINUTES = 3;
  const VISIBLE_SECONDS = VISIBLE_MINUTES * 60;

  const canvasRendererInstance = canvasRenderer(canvas);
  const { bounds, zoomLevel } = canvasRendererInstance;

  // const zoomFactor = zoomLevelToFactor(zoomLevel);

  const getPixelsPerSecond = (pixels: number) => pixels / VISIBLE_SECONDS;

  // const getPixelsPerLongSecond = () => getPixelsPerSecond(bounds.right - bounds.left);

  // const getPixelsPerLatSecond = () => getPixelsPerSecond(bounds.bottom - bounds.top);

  return {
    pixelsPerLatSecond: getPixelsPerSecond(bounds.right - bounds.left),
    pixelsPerLongSecond: getPixelsPerSecond(bounds.bottom - bounds.top),
  };
};

export const shipRenderer = (canvas: HTMLCanvasElement, startPosition: Coordinate) => {
  const dirtyRegionRadius = 45;
  const canvasRendererInstance = canvasRenderer(canvas);
  const { clearDirtyRectangle, context, draw, drawCircle, drawLine, recenterContext, zoomLevel } =
    canvasRendererInstance;
  const { pixelsPerLatSecond, pixelsPerLongSecond } = graticuleRenderer(canvas);

  let shipHeading: number | undefined;
  let shipPosition: Coordinate = startPosition;

  recenterContext();

  const drawShip = ({ position, heading, speed }: PositionPayload) => {
    const indicatorWidth = 14;
    const indicatorHeight = 6;

    // const bearing = rotationFromHeading(shipHeading ?? heading, heading);

    // console.log({
    //   pixelsPerLatSecond,
    //   pixelsPerLongSecond,
    // });
    const { x, y } = gridCoordinate({
      position,
      reference: startPosition,
      pixelsPerLatSecond,
      pixelsPerLongSecond,
    });

    // debugger;

    clearDirtyRectangle({ x, y, radius: dirtyRegionRadius });

    // TODO: smooth animation from one heading to another
    {
      // console.log(
      //   'drawing ship at',
      //   position,
      //   'heading',
      //   heading,
      //   'point',
      // { x, y },
      //   'bearing',
      //   bearing,
      // );

      draw(() => {
        context.lineWidth = 1;
        context.strokeStyle = trackIndicatorColor;

        context.translate(x, y);
        context.rotate((Math.PI / 180) * bearing);

        drawCircle({ x: 0, y: 0 }, indicatorWidth, 'stroke');
        drawCircle({ x: 0, y: 0 }, indicatorHeight, 'stroke');

        if (speed) {
          drawLine({ from: { x: 0, y: 0 }, to: { x: 0, y: -40 } });
        }
      });
    }

    // TODO: zoom back in when position fits within bounds with zoomLevel plus one

    // if (!this.fitsWithinBounds({ x, y })) {
    //   debugger;
    //     const level = zoomFactorToLevel(this.zoom);
    //     clientSocket.emit(ClientEvents.ZOOM, level - 2);
    // }

    shipHeading = heading;
    shipPosition = position;
  };

  const setZoomLevel = (newZoomLevel: number) => {
    console.log('setting ship zoom to', newZoomLevel);
    canvasRendererInstance.setZoomLevel(newZoomLevel);
    drawShip({ position: shipPosition, heading: shipHeading ?? 0 });
  };

  return {
    drawShip,
    setZoomLevel,
    zoomLevel,
  };
};
