import * as Location from "expo-location";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { Subscription } from "expo-sensors/build/Pedometer";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { noSpeedClassifier } from "./no-speed-classifier";
import { speedClassifier } from "./speed-classifier";
import { calculateVariance } from "./variance";
import { splitIntoEqualWindows } from "./windowing";

type AccelerometerData = {
  value: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: Date;
};

type ActiveClassifier = "no-speed" | "speed";

export default function App() {
  const [{ x: accX, y: accY, z: accZ }, setData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [{ x: gyroX, y: gyroY, z: gyroZ }, setGyroData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [accSubscription, setAccSubscription] = useState<Subscription | null>(
    null
  );
  const [gyroSubscription, setGyroSubscription] = useState<Subscription | null>(
    null
  );
  const accData = useRef<AccelerometerData[]>([]);
  const accDataTimerID = useRef<NodeJS.Timeout | null>(null);
  const gyroData = useRef<AccelerometerData[]>([]);
  const gyroDataTimerID = useRef<NodeJS.Timeout | null>(null);
  const [accVariance, setAccVariance] = useState<number>();
  const [gyroVariance, setGyroVariance] = useState<number>();
  const [activity, setActivity] = useState<string>("");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeClassifier, setActiveClassifier] =
    useState<ActiveClassifier>("no-speed");
  const speed = useRef<number | null>(null);

  Accelerometer.setUpdateInterval(16);
  Gyroscope.setUpdateInterval(16);

  const _subscribeAcc = () => {
    setAccSubscription(Accelerometer.addListener(setData));
  };

  const _unsubscribeAcc = () => {
    accSubscription && accSubscription.remove();
    setAccSubscription(null);
  };

  const _subscribeGyro = () => {
    setGyroSubscription(Gyroscope.addListener(setGyroData));
  };

  const _unsubscribeGyro = () => {
    gyroSubscription && gyroSubscription.remove();
    setGyroSubscription(null);
  };

  useEffect(() => {
    _subscribeAcc();
    return () => _unsubscribeAcc();
  }, []);

  useEffect(() => {
    _subscribeGyro();
    return () => _unsubscribeGyro();
  }, []);

  useEffect(() => {
    accData.current.push({
      value: { x: accX * 9.81, y: accY * 9.81, z: accZ * 9.81 },
      timestamp: new Date(),
    });
  }, [accX, accY, accZ]);

  useEffect(() => {
    gyroData.current.push({
      value: { x: gyroX, y: gyroY, z: gyroZ },
      timestamp: new Date(),
    });
  }, [gyroX, gyroY, gyroZ]);

  useEffect(() => {
    accDataTimerID.current = setInterval(() => {
      const dataWindows = splitIntoEqualWindows(accData.current, 1000);
      const firstWindow = dataWindows[0];
      const variance = calculateVariance(firstWindow);
      accData.current = [];
      setAccVariance(variance);
    }, 1000);
    return () => {
      accDataTimerID.current && clearInterval(accDataTimerID.current);
    };
  }, []);

  useEffect(() => {
    gyroDataTimerID.current = setInterval(() => {
      const dataWindows = splitIntoEqualWindows(gyroData.current, 1000);
      const firstWindow = dataWindows[0];
      const variance = calculateVariance(firstWindow);
      setGyroVariance(variance);
      gyroData.current = [];
    }, 1000);
    return () => {
      gyroDataTimerID.current && clearInterval(gyroDataTimerID.current);
    };
  }, []);

  useEffect(() => {
    if (!accVariance || !gyroVariance) return;
    if (
      activeClassifier === "no-speed" ||
      !speed.current ||
      speed.current < 0
    ) {
      setActivity(
        noSpeedClassifier({
          accelerometerVariance: accVariance,
          gyroscopeVariance: gyroVariance,
        })
      );
      return;
    }

    setActivity(
      speedClassifier({
        accelerometerVariance: accVariance,
        gyroscopeVariance: gyroVariance,
        speed: speed.current,
      })
    );
  }, [accVariance, gyroVariance, activeClassifier]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  useEffect(() => {
    if (!location) return;
    speed.current = location.coords.speed;
  }, [location]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text>Speed Classifier:</Text>
        <Switch
          onValueChange={() => {
            setActiveClassifier((prev) =>
              prev === "no-speed" ? "speed" : "no-speed"
            );
          }}
          value={activeClassifier === "speed"}
        ></Switch>
      </View>
      <Text>Gyroscope Variance: {gyroVariance}</Text>
      <Text>Accelerometer Variance: {accVariance}</Text>
      {activeClassifier === "speed" && <Text>Speed: {speed.current}</Text>}
      <Text>
        Detected mode: <Text style={styles.boldText}>{activity}</Text>
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  boldText: {
    fontWeight: "bold",
  },
});
