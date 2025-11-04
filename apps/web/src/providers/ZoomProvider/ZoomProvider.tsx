import {
  createContext,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Canvas } from '../../lib/canvas';

type ZoomLevelContext = {
  prevZoomLevel: number;
  zoomLevel: number;
  updateZoomLevel: (value: number) => void;
};

const ZoomContext = createContext<ZoomLevelContext>({
  prevZoomLevel: Canvas.DEFAULT_ZOOM_LEVEL,
  zoomLevel: Canvas.DEFAULT_ZOOM_LEVEL,
  updateZoomLevel: () => {},
});

export const ZoomProvider = ({ children }: PropsWithChildren) => {
  const [zoomLevel, setZoomLevel] = useState(Canvas.DEFAULT_ZOOM_LEVEL);
  const prevZoomLevel = useRef(zoomLevel);

  const updateZoomLevel = (value: number) => {
    prevZoomLevel.current = zoomLevel;
    setZoomLevel(value);
  };

  return (
    <ZoomContext.Provider
      value={{
        prevZoomLevel: prevZoomLevel.current,
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
