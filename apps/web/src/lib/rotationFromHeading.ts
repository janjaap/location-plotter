export const rotationDelta = (currentHeading: number, newHeading: number) => {
  // Normalize heading to 0–360 range
  const normalizedHeading = ((newHeading % 360) + 360) % 360;

  // Compute smallest signed angular difference (-180..180)
  return ((normalizedHeading - (currentHeading % 360) + 540) % 360) - 180;
};

export const rotationFromHeading = (
  currentHeading: number,
  newHeading: number,
) => currentHeading + rotationDelta(currentHeading, newHeading);
