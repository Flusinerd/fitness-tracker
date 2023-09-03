export const ACTIVITIES = {
  WALKING: "walking",
  RUNNING: "running",
  BIKING: "biking",
} as const;

export type ACTIVITY = typeof ACTIVITIES[keyof typeof ACTIVITIES];