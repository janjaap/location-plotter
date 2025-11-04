import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';

type ZoomLevelContext = {
  zoomLevel: number;
  updateZoomLevel: (value: number) => void;
};

const ZoomContext = createContext<ZoomLevelContext>({
  zoomLevel: 1,
  updateZoomLevel: () => {},
});

export const ZoomProvider = ({ children }: PropsWithChildren) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const updateZoomLevel = (value: number) => {
    setZoomLevel(value);
  };

  return (
    <ZoomContext.Provider
      value={{
        zoomLevel,
        updateZoomLevel,
      }}
    >
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
