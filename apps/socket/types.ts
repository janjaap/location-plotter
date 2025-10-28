export enum ServerEvents {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  INIT = 'init',
  MARKER = 'marker',
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
export type StartPositionPayload = {
  lat: number;
  long: number;
  speed: number;
  heading: number;
};
export type PositionPayload = {
  position: Coordinate;
  distance: number;
  heading: number;
};

export interface ServerToClientEvents {
  [ServerEvents.CONNECTED]: () => void;
  [ServerEvents.DISCONNECTED]: () => void;
  [ServerEvents.MARKER]: (marker: Coordinate) => void;
  [ServerEvents.INIT]: (
    position: Coordinate,
    distance: number,
    heading: number,
  ) => void;
  [ServerEvents.POSITION]: (payload: PositionPayload) => void;
  [ServerEvents.RESET]: (payload: StartPositionPayload) => void;
  [ServerEvents.STOPPED]: () => void;
}

export interface ClientToServerEvents {
  [ClientEvents.CLOSE]: () => void;
  [ClientEvents.DISCONNECT]: (reason: string) => void;
  [ClientEvents.ERROR]: (err: Error) => void;
  [ClientEvents.INIT]: (payload: StartPositionPayload) => void;
  [ClientEvents.RESET]: () => void;
  [ClientEvents.START]: (payload: StartPositionPayload) => void;
  [ClientEvents.STOP]: () => void;
}
