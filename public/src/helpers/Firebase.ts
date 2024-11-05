import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDWaPWPiu-9Zrnl6fl315ffMlHS5zEHLb8",
  authDomain: "pushnotifications-e6b38.firebaseapp.com",
  projectId: "pushnotifications-e6b38",
  storageBucket: "pushnotifications-e6b38.appspot.com",
  messagingSenderId: "152663014685",
  appId: "1:152663014685:web:92573d2a1e439889e535f4",
  measurementId: "G-8VH72Q59J1",
  vapidKey: "BLnDu1Xhh4Eqc7LBIDghJptnJZxjyiEMkt7fdGqPMbMl7KTVEXOMZXxiLu20u-npim_YS6iy_YBFdtqkB_mdhas",
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const authProvider = new GoogleAuthProvider();
let messaging: Messaging | null = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.error(error);
}

export const getPublicUrl = (url: string) => {
  return (
    "https://firebasestorage.googleapis.com/v0/b/" +
    firebaseConfig.storageBucket +
    "/o" +
    url.replace("gs://", "").replace(firebaseConfig.storageBucket, "") +
    "?alt=media"
  );
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (messaging !== null) {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};

export const requestNotificationPermission = () =>
  new Promise((resolve, reject) => {
    if (Notification.permission === "granted") {
      console.debug("Notification permission granted");
      resolve(true);
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.debug("Notification permission granted");
          resolve(true);
        }
        reject(false);
      });
    }
  });

export const getFCM = () =>
  new Promise((resolve, reject) => {
    if (messaging !== null) {
      getToken(messaging, { vapidKey: firebaseConfig.vapidKey })
        .then((currentToken) => {
          if (currentToken) {
            resolve(currentToken);
          }
        })
        .catch((err) => {
          console.error("An error occurred while retrieving token", err);
          reject(err);
        });
    }
  });

export const registerServiceWorker = (messageCallback: (payload: any) => void, fcmCallback: () => void) => {
  if ("serviceWorker" in navigator) {
    isSupported().then((supported) => {
      if (supported) {
        const serviceWorker = navigator.serviceWorker;
        serviceWorker
          .register("./firebase-messaging-sw.js")
          .then((registration) => {
            console.debug("[SW]: SCOPE: ", registration.scope);
            return registration.scope;
          })
          .catch((err) => {
            console.error(err);
          });

        serviceWorker.ready.then((registration) => {
          console.debug("[SW]: READY: ", registration.active?.state);
          fcmCallback();
        });

        serviceWorker.onmessage = (payload) => {
          messageCallback(payload);
        };
      }
    });
  }
};
