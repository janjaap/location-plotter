import type { GridPoint } from '@milgnss/utils/types';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type BaseContext = {
  offset: GridPoint;
};

type ParamsContext = BaseContext & {
  updateOffset: (value: GridPoint) => void;
};

const initialState: BaseContext = {
  offset: { x: 0, y: 0 },
};

const defaultContext: ParamsContext = {
  ...initialState,
  updateOffset: () => {},
};

const ParamsContext = createContext<ParamsContext>(defaultContext);

export const ParamsProvider = ({ children }: PropsWithChildren) => {
  const [offset, setOffset] = useState(initialState.offset);

  const updateOffset = (newOffset: GridPoint) => {
    setOffset(newOffset);
  };

  return (
    <ParamsContext.Provider
      value={{
        offset,
        updateOffset,
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
