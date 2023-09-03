import { ACTIVITIES, ACTIVITY } from "./activity";

type SpeedClassifierInput = {
  accelerometerVariance: number;
  gyroscopeVariance: number;
  speed: number;
}

export function speedClassifier(input: SpeedClassifierInput): ACTIVITY {
  const { speed, accelerometerVariance, gyroscopeVariance } = input;

  if (speed <= 1.831048) {
    if (speed <= 1.384318) {
      if (gyroscopeVariance <= 0.026769) {
        if (speed <= 1.273679) {
          return ACTIVITIES.WALKING;
        } else {
          if (accelerometerVariance <= 10.981694) {
            return ACTIVITIES.BIKING;
          } else {
            return ACTIVITIES.WALKING;
          }
        }
      } else {
        if (speed <= 0) {
          if (gyroscopeVariance <= 0.120778) {
            return ACTIVITIES.WALKING;
          } else {
            return ACTIVITIES.BIKING;
          }
        } else {
          if (accelerometerVariance <= 18.754174) {
            if (gyroscopeVariance <= 0.12611) {
              if (speed <= 1.101376) {
                if (speed <= 1.079156) {
                  return ACTIVITIES.WALKING;
                } else {
                  return ACTIVITIES.RUNNING;
                }
              } else {
                return ACTIVITIES.WALKING;
              }
            } else {
              return ACTIVITIES.WALKING;
            }
          } else {
            return ACTIVITIES.RUNNING;
          }
        }
      }
    } else {
      if (gyroscopeVariance <= 0.046129) {
        if (accelerometerVariance <= 13.365635) {
          if (accelerometerVariance <= 7.366421) {
            return ACTIVITIES.RUNNING;
          } else {
            if (gyroscopeVariance <= 0.016432) {
              return ACTIVITIES.BIKING;
            } else {
              if (speed <= 1.753143) {
                if (speed <= 1.602058) {
                  return ACTIVITIES.BIKING;
                } else {
                  return ACTIVITIES.RUNNING;
                }
              } else {
                return ACTIVITIES.BIKING;
              }
            }
          }
        } else {
          return ACTIVITIES.RUNNING;
        }
      } else {
        return ACTIVITIES.WALKING;
      }
    }
  } else {
    if (gyroscopeVariance <= 0.048338) {
      if (speed <= 2.104871) {
        if (accelerometerVariance <= 11.624823) {
          if (accelerometerVariance <= 8.516073) {
            return ACTIVITIES.RUNNING;
          } else {
            return ACTIVITIES.BIKING;
          }
        } else {
          return ACTIVITIES.RUNNING;
        }
      } else {
        return ACTIVITIES.BIKING;
      }
    } else {
      if (speed <= 2.399872) {
        return ACTIVITIES.RUNNING;
      } else {
        return ACTIVITIES.BIKING;
      }
    }
  }
}