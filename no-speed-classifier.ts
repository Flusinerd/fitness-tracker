import { ACTIVITIES, ACTIVITY } from "./activity";

type NoSpeedClassifierInput = {
  accelerometerVariance: number;
  gyroscopeVariance: number;
}

export function noSpeedClassifier(input: NoSpeedClassifierInput): ACTIVITY {
  const { accelerometerVariance, gyroscopeVariance } = input;

  if (gyroscopeVariance <= 0.028435) {
    if (accelerometerVariance <= 12.528617) {
      if (accelerometerVariance <= 7.394629) {
        if (accelerometerVariance <= 5.579906) {
          return ACTIVITIES.WALKING;
        } else {
          if (gyroscopeVariance <= 0.01848) {
            return ACTIVITIES.BIKING;
          } else {
            return ACTIVITIES.WALKING;
          }
        }
      } else {
        return ACTIVITIES.BIKING;
      }
    } else {
      if (accelerometerVariance <= 20.276257) {
        return ACTIVITIES.WALKING;
      } else {
        return ACTIVITIES.RUNNING;
      }
    }
  } else {
    if (accelerometerVariance <= 14.264379) {
      if (accelerometerVariance <= 7.00506) {
        if (gyroscopeVariance <= 0.047254) {
          if (accelerometerVariance <= 5.11655) {
            return ACTIVITIES.WALKING;
          } else {
            return ACTIVITIES.RUNNING;
          }
        } else {
          if (accelerometerVariance <= 3.179329) {
            return ACTIVITIES.RUNNING;
          } else {
            return ACTIVITIES.WALKING;
          }
        }
      } else {
        if (gyroscopeVariance <= 0.045492) {
          if (accelerometerVariance <= 11.739886) {
            return ACTIVITIES.BIKING;
          } else {
            return ACTIVITIES.WALKING;
          }
        } else {
          if (accelerometerVariance <= 11.637749) {
            if (gyroscopeVariance <= 0.122684) {
              if (accelerometerVariance <= 8.320872) {
                return ACTIVITIES.RUNNING;
              } else {
                return ACTIVITIES.BIKING;
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
      if (accelerometerVariance <= 18.754174) {
        if (gyroscopeVariance <= 0.075309) {
          return ACTIVITIES.WALKING;
        } else {
          return ACTIVITIES.RUNNING;
        }
      } else {
       return ACTIVITIES.RUNNING;
      }
    }
  }
}


