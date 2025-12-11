export type FromTo = {
  from: GridPoint;
  to: GridPoint;
};

export type CanvasBounds = { top: number; right: number; bottom: number; left: number };

export type GridPoint = { x: number; y: number };

export type Dimensions = { width: number; height: number };

export type Orientation = 'lat' | 'long';

/** Socket */
export enum ServerEvents {
  DISCONNECTED = 'disconnected',
  INIT = 'init',
  POSITION = 'position',
  RESET = 'reset',
  STOPPED = 'stopped',
}

export enum ClientEvents {
  CLOSE = 'close',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  INIT = 'init',
  RESET = 'reset',
  START = 'start',
  STOP = 'stop',
}

export type Coordinate = { lat: number; long: number };

export type PositionPayload = {
  position: Coordinate;
  distance?: number;
  heading: number;
  speed?: number;
};

export interface ServerToClientEvents {
  [ServerEvents.DISCONNECTED]: () => void;
  [ServerEvents.INIT]: (payload: PositionPayload) => void;
  [ServerEvents.POSITION]: (payload: PositionPayload) => void;
  [ServerEvents.RESET]: (payload: PositionPayload) => void;
  [ServerEvents.STOPPED]: () => void;
}

export interface ClientToServerEvents {
  [ClientEvents.CLOSE]: () => void;
  [ClientEvents.DISCONNECT]: (reason: string) => void;
  [ClientEvents.ERROR]: (err: Error) => void;
  [ClientEvents.INIT]: (payload: PositionPayload) => void;
  [ClientEvents.RESET]: () => void;
  [ClientEvents.START]: (payload: PositionPayload) => void;
  [ClientEvents.STOP]: () => void;
}

export type DMS = { degrees: number; minutes: number; seconds: number };

export enum ModificationsEnum {
  ZOOM = 'zoom',
  OFFSET = 'offset',
  OFFSET_X = 'offsetX',
  OFFSET_Y = 'offsetY',
}
