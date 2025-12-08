import type { GridPoint } from '@milgnss/utils/types';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type BaseContext = {
  offset: GridPoint;
  zoomFactor: number;
};

type ParamsContext = BaseContext & {
  updateOffset: (value: GridPoint) => void;
  updateZoomFactor: (value: number) => void;
};

const initialState: BaseContext = {
  offset: { x: 0, y: 0 },
  zoomFactor: 1,
};

const defaultContext: ParamsContext = {
  ...initialState,
  updateOffset: () => {},
  updateZoomFactor: () => {},
};

const ParamsContext = createContext<ParamsContext>(defaultContext);

export const ParamsProvider = ({ children }: PropsWithChildren) => {
  const [offset, setOffset] = useState(initialState.offset);
  const [zoomFactor, setZoomFactor] = useState(initialState.zoomFactor);

  const updateOffset = (newOffset: GridPoint) => {
    setOffset(newOffset);
  };

  const updateZoomFactor = (newZoomFactor: number) => {
    setZoomFactor(newZoomFactor);
  };

  return (
    <ParamsContext.Provider
      value={{
        offset,
        updateOffset,
        updateZoomFactor,
        zoomFactor,
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
