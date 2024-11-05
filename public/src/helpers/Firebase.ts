import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  vapidKey: process.env.REACT_APP_FIREBASE_WEB_VAPID_KEY,
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
    url.replace("gs://", "").replace(firebaseConfig.storageBucket ?? "", "") +
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
