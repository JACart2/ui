import { Matrix, inverse } from "ml-matrix";
import { Vector3 } from "roslib";

const mapProjectionMatrix = new Matrix([
  [-0.00000156, 0.00001108, -78.86214758],
  [-0.00000849, -0.00000137, 38.43388357],
  [0, 0, 1],
]);
const inverseMapProjectionMatrix = inverse(mapProjectionMatrix);

export function rosToMapCoords(
  position: Vector3 | { x: number; y: number; z: number }
) {
  const { x, y } = position;
  const [x2, y2] = mapProjectionMatrix
    .mmul(Matrix.columnVector([x, y, 1]))
    .to1DArray();
  return [x2, y2];
}
export function lngLatToMapCoords(lngLat: { lat: number; lng: number }) {
  const { lat, lng } = lngLat;
  const [x2, y2] = inverseMapProjectionMatrix
    .mmul(Matrix.columnVector([lng, lat, 1]))
    .to1DArray();
  return [x2, y2];
}
