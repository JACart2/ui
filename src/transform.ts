import { Matrix, inverse } from "ml-matrix";

let A = new Matrix([
  [-0.00000156, 0.00001108, -78.86214758],
  [-0.00000849, -0.00000137, 38.43388357],
  [0, 0, 1],
]);
let B = inverse(A);
export function T(position) {
  const { x, y } = position;
  const [x2, y2, z] = A.mmul(Matrix.columnVector([x, y, 1])).to1DArray();
  return [x2, y2];
}
export function Y(lngLat) {
  const { lat, lng } = lngLat;
  const [x2, y2, z] = B.mmul(Matrix.columnVector([lng, lat, 1])).to1DArray();
  return [x2, y2];
}
