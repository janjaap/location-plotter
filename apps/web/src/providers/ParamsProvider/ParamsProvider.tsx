import type { GridPoint } from '@milgnss/utils/types';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type BaseContext = {
  offset: GridPoint;
  zoomLevel: number;
};

type ParamsContext = BaseContext & {
  updateOffset: (value: GridPoint) => void;
  updateZoomLevel: (value: number) => void;
};

const initialState: BaseContext = {
  offset: { x: 0, y: 0 },
  zoomLevel: 1,
};

const defaultContext: ParamsContext = {
  ...initialState,
  updateOffset: () => {},
  updateZoomLevel: () => {},
};

const ParamsContext = createContext<ParamsContext>(defaultContext);

export const ParamsProvider = ({ children }: PropsWithChildren) => {
  const [offset, setOffset] = useState(initialState.offset);
  const [zoomLevel, setZoomLevel] = useState(initialState.zoomLevel);

  const updateOffset = (newOffset: GridPoint) => {
    setOffset(newOffset);
  };

  const updateZoomLevel = (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
  };

  return (
    <ParamsContext.Provider
      value={{
        offset,
        updateOffset,
        updateZoomLevel,
        zoomLevel,
      }}
    >
      {children}
    </ParamsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useParams = () => {
  const context = useContext(ParamsContext);

  if (!context) {
    throw new Error('useParams must be used within a ParamsProvider');
  }

  return context;
};
