import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { Subscription } from "expo-sensors/build/Pedometer";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { ACTIVITY } from "./activity";
import { haversine } from "./gps-speed";
import { noSpeedClassifier } from "./no-speed-classifier";
import { speedClassifier } from "./speed-classifier";
import { supabase } from "./supabase";
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

// Push Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig!.extra!.eas.projectId,
    });
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export default function App() {
  const windowLenght = 2000;
  const activityWindowLength = 10000;

  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | false
  >(false);
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
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
  const [activity, setActivity] = useState<ACTIVITY | null>();
  const [location, setLocation] = useState<{
    location: Location.LocationObject;
    timestamp: Date;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeClassifier, setActiveClassifier] =
    useState<ActiveClassifier>("no-speed");
  const [speed, setSpeed] = useState<number | null>(null);
  const activityWindowBuffer = useRef<ACTIVITY[]>([]);
  const activityWindowTimerID = useRef<NodeJS.Timeout | null>(null);
  const [windowedActivity, setWindowedActivity] = useState<ACTIVITY | null>(
    null
  );
  const gpsTimerID = useRef<NodeJS.Timeout | null>(null);
  const prevLocation = useRef<Location.LocationObject | null>(null);
  const lastPositionSent = useRef<Date | null>(null);
  const lastPositionSentTimerID = useRef<NodeJS.Timeout | null>(null);

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
      const dataWindows = splitIntoEqualWindows(accData.current, windowLenght);
      const firstWindow = dataWindows[0];
      const variance = calculateVariance(firstWindow);
      accData.current = [];
      setAccVariance(variance);
    }, windowLenght);
    return () => {
      accDataTimerID.current && clearInterval(accDataTimerID.current);
    };
  }, []);

  useEffect(() => {
    gyroDataTimerID.current = setInterval(() => {
      const dataWindows = splitIntoEqualWindows(gyroData.current, windowLenght);
      const firstWindow = dataWindows[0];
      const variance = calculateVariance(firstWindow);
      setGyroVariance(variance);
      gyroData.current = [];
    }, windowLenght);
    return () => {
      gyroDataTimerID.current && clearInterval(gyroDataTimerID.current);
    };
  }, []);

  useEffect(() => {
    if (!accVariance || !gyroVariance) return;
    if (activeClassifier === "no-speed" || !speed || speed < 0) {
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
        speed: speed,
      })
    );
  }, [accVariance, gyroVariance, activeClassifier]);

  useEffect(() => {
    if (activeClassifier === "no-speed") return;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let currLocation = await Location.getCurrentPositionAsync({});
      setLocation({ location: currLocation, timestamp: new Date() });

      gpsTimerID.current = setInterval(async () => {
        let newLocation = await Location.getCurrentPositionAsync({
          mayShowUserSettingsDialog: true,
          accuracy: Location.Accuracy.BestForNavigation,
        });
        prevLocation.current = Object.assign({}, location?.location) ?? null;
        setLocation({ location: newLocation, timestamp: new Date() });
        if (
          !prevLocation.current ||
          !prevLocation.current.coords ||
          !newLocation ||
          !newLocation.coords
        )
          return;
        const distance = haversine(
          prevLocation.current.coords.latitude,
          prevLocation.current.coords.longitude,
          newLocation.coords.latitude,
          newLocation.coords.longitude
        );
        const timeDiff = newLocation.timestamp - prevLocation.current.timestamp;
        const speed = distance / timeDiff;
        setSpeed(speed);
      }, windowLenght);
    })();

    return () => {
      gpsTimerID.current && clearInterval(gpsTimerID.current);
    };
  }, [activeClassifier]);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  useEffect(() => {
    if (!activity) return;
    // Average activity over 10 seconds
    activityWindowBuffer.current.push(activity);
    activityWindowTimerID.current = setTimeout(() => {
      const activityWindow = activityWindowBuffer.current;
      const activityCount = activityWindow.reduce((acc, curr) => {
        if (acc[curr]) {
          acc[curr] += 1;
        } else {
          acc[curr] = 1;
        }
        return acc;
      }, {} as Record<ACTIVITY, number>);
      const activityWithCount = Object.entries(activityCount).map(
        ([activity, count]) => ({ activity, count })
      );
      const sortedActivity = activityWithCount.sort(
        (a, b) => b.count - a.count
      );
      const mostFrequentActivity = sortedActivity[0].activity;
      setWindowedActivity(mostFrequentActivity as ACTIVITY);
      activityWindowBuffer.current = [];
    }, activityWindowLength);
    return () => {
      activityWindowTimerID.current &&
        clearTimeout(activityWindowTimerID.current);
    };
  }, [activity]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token!.data)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  async function sendLocationToSupabase() {
    if (!location) {
      const presentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        location: presentLocation, 
        timestamp: new Date(),
      });
      return;
    }
    if (!expoPushToken) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        console.error("No token");
        return;
      }
      setExpoPushToken(token.data);
    }
    const lastPositionSentDate = lastPositionSent.current;
    if (
      lastPositionSentDate &&
      lastPositionSentDate.getTime() - new Date().getTime() <
        1000 * 60 * 60 * 24
    ) {
      console.log("Last position sent less than 24 hours ago");
      return;
    }
    lastPositionSent.current = new Date();

    console.log("Sending location to supabase");
    const payload = {
      push_key: expoPushToken,
      last_seen: new Date().toISOString(),
      last_seen_at_lat: location?.location.coords.latitude,
      last_seen_at_lon: location?.location.coords.longitude,
    }
    console.log(payload);
    const { data, error } = await supabase.from("locations").upsert(payload).select();
    console.log("Sent location to supabase", data, error);
  }

  useEffect(() => {
    if (!location || !expoPushToken) return;
    sendLocationToSupabase();
  }, [location, expoPushToken])

  // Update position at least every hour
  useEffect(() => {
    lastPositionSentTimerID.current = setInterval(() => {
      sendLocationToSupabase();
    }, 1000 * 60 * 60);
    return () => {
      lastPositionSentTimerID.current &&
        clearInterval(lastPositionSentTimerID.current);
    };
  }, []);

  // Inital call to send location to supabase
  useEffect(() => {
    sendLocationToSupabase();
  }, []);

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
      <Text>Gyroscope Variance: {gyroVariance?.toFixed(5)} m^2/s^4</Text>
      <Text>Accelerometer Variance: {gyroVariance?.toFixed(5)} m^2/s^4</Text>
      {activeClassifier === "speed" && (
        <Text>Speed: {gyroVariance?.toFixed(3) ?? -1} m/s</Text>
      )}
      <Text>
        Detected mode:{" "}
        <Text style={styles.boldText}>
          {windowedActivity ?? "Keine Aktivität erkannt"}
        </Text>
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
