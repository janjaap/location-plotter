import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type ZoomLevelContext = {
  zoomLevel: number;
  updateZoomLevel: (value: number) => void;
  resetZoomLevel: () => void;
};

const defaultContext: ZoomLevelContext = {
  zoomLevel: 10,
  updateZoomLevel: () => {},
  resetZoomLevel: () => {},
};

const ZoomContext = createContext<ZoomLevelContext>(defaultContext);

export const ZoomProvider = ({ children }: PropsWithChildren) => {
  const [zoomLevel, setZoomLevel] = useState(defaultContext.zoomLevel);

  const updateZoomLevel = (value: number) => {
    setZoomLevel(value);
  };

  const resetZoomLevel = () => {
    setZoomLevel(defaultContext.zoomLevel);
  };

  return (
    <ZoomContext.Provider
      value={{
        zoomLevel,
        updateZoomLevel,
        resetZoomLevel,
      }}>
      {children}
    </ZoomContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useZoom = () => {
  const context = useContext(ZoomContext);

  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }

  return context;
};
