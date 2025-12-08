import { useCenter } from '@hooks/useCenter';
import { gridCoordinate } from '@milgnss/utils';
import { type GridPoint } from '@milgnss/utils/types';
import { useParams } from '@providers/ParamsProvider/ParamsProvider';
import styles from './MobDirection.module.css';

const isXOutOfBounds = (value: number) => value < -412 || value > 412;
const isYOutOfBounds = (value: number) => value < -312 || value > 312;

const isOutOfBounds = (gridPoint: GridPoint) => {
  const { x, y } = gridPoint;

  return isXOutOfBounds(x) || isYOutOfBounds(y);
};

const angle = (xDiff: number, yDiff: number) => {
  const radian = Math.atan2(yDiff, xDiff);
  const degrees = (radian * 180) / Math.PI;

  return degrees;
};

const position = (offset: GridPoint) => {
  const { x, y } = offset;

  let rotation: number | undefined;
  let top = y < 0 ? (300 + y > 0 ? 300 + y : 0) : undefined;
  let right = x > 0 ? (400 - x > 0 ? 400 - x : 0) : undefined;
  let bottom = y > 0 ? (300 - y > 0 ? 300 - y : 0) : undefined;
  let left = x < 0 ? (400 + x > 0 ? 400 + x : 0) : undefined;
  let xDiff = 0;
  let yDiff = 0;
  let transform = `rotate(${rotation}deg)`;

  if (isXOutOfBounds(x)) {
    if (x < 0) {
      left = 0;
      rotation = 270;
      xDiff = Math.abs(400 + offset.x);
    } else {
      right = 0;
      rotation = 90;
      xDiff = offset.x - 400;
    }

    if (isYOutOfBounds(y)) {
      if (y < 0) {
        top = 0;
        yDiff = Math.abs(300 + offset.y);
      } else {
        bottom = 0;
        yDiff = offset.y - 300;
      }

      rotation = angle(xDiff, yDiff);
    }

    // const angle = Math.atan2(yDiff, xDiff);
    // const degrees = Math.trunc((angle * 180) / Math.PI);
    // console.log(offset, xDiff, yDiff);

    // else {
    //   if (y < 0) {
    //     top = 300 + y > 0 ? 300 + y : 0;
    //   } else {
    //     bottom = 300 - y > 0 ? 300 - y : 0;
    //   }
    // }
    // if (isYOutOfBounds(y)) {
    //   if (y < 0) {
    //     top = 0;
    //   } else {
    //     bottom = 0;
    //   }
    // } else {
    //   const percentageY = (y + 330) / 660;
    //   top = percentageY * 100;
    // }
  }

  transform = `rotate(${rotation}deg)`;

  return { top, right, bottom, left, transform };
};

export const MobDirection = () => {
  const size = 24;
  const center = useCenter();
  const { offset } = useParams();

  // useEffect(() => {
  //   const updatePosition = ({ distance }: PositionPayload) => {
  //     console.log(distance);
  //     // Trigger re-render
  //   };
  //   clientSocket.on(ServerEvents.POSITION, updatePosition);

  //   return () => {
  //     clientSocket.off(ServerEvents.POSITION, updatePosition);
  //   };
  // }, []);

  if (!center) return null;

  const { x, y } = gridCoordinate({
    position: center,
    reference: center,
    offset,
  });

  const mobOutOfBounds = isOutOfBounds({ x, y });

  if (!mobOutOfBounds) {
    return null;
  }

  const className = [styles.mobDirection, styles.outOfBounds].join(' ');

  return (
    <svg
      className={className}
      height={size}
      viewBox="0 0 32 32"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ ...position(offset) }}
    >
      <path
        color="currentColor"
        d="m26.71 10.29-10-10a1 1 0 0 0-1.41 0l-10 10 1.41 1.41L15 3.41V32h2V3.41l8.29 8.29z"
      />
    </svg>
  );
};
