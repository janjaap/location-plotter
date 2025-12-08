export const zoomLevelToFactor = (zoomLevel: number): number => 1 + (zoomLevel - 1) * 0.5;
