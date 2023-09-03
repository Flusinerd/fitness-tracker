export interface Datapoint<T> {
  timestamp: Date;
  value: T;
} 

export function splitIntoEqualWindows<T>(data: Datapoint<T>[], windowLengthMs: number): Datapoint<T>[][] {
  if (data.length === 0 || windowLengthMs <= 0) {
    throw new Error("Invalid input data or window length");
  }

  const windows: Datapoint<T>[][] = [];
  const firstTimestamp = data[0].timestamp.getTime();

  let currentWindowStart = firstTimestamp;
  let currentWindowEnd = currentWindowStart + windowLengthMs;

  let windowData: Datapoint<T>[] = [];

  for (const datapoint of data) {
    const datapointTimestamp = datapoint.timestamp.getTime();

    if (datapointTimestamp >= currentWindowEnd) {
      windows.push(windowData);
      windowData = [];
      currentWindowStart = currentWindowEnd;
      currentWindowEnd = currentWindowStart + windowLengthMs;
    }

    windowData.push(datapoint);
  }

  // Push any remaining data to the last window
  if (windowData.length > 0) {
    windows.push(windowData);
  }

  return windows;
}