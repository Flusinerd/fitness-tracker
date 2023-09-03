import { Datapoint } from "./windowing";

export function calculateVariance(windowData: Datapoint<{ x: number; y: number; z: number }>[]): number {
  if (windowData.length === 0) {
    throw new Error("Window data is empty");
  }

  // Calculate the mean (average) of each component (x, y, z) in the window
  const mean = {
    x: windowData.reduce((sum, datapoint) => sum + datapoint.value.x, 0) / windowData.length,
    y: windowData.reduce((sum, datapoint) => sum + datapoint.value.y, 0) / windowData.length,
    z: windowData.reduce((sum, datapoint) => sum + datapoint.value.z, 0) / windowData.length,
  };

  // Calculate the sum of squared differences from the mean for each component
  const squaredDifferencesSum = windowData.reduce((sum, datapoint) => {
    const squaredDiffX = Math.pow(datapoint.value.x - mean.x, 2);
    const squaredDiffY = Math.pow(datapoint.value.y - mean.y, 2);
    const squaredDiffZ = Math.pow(datapoint.value.z - mean.z, 2);
    return sum + squaredDiffX + squaredDiffY + squaredDiffZ;
  }, 0);

  // Calculate the variance
  const variance = squaredDifferencesSum / windowData.length;

  return variance;
}
