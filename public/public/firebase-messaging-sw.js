importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDWaPWPiu-9Zrnl6fl315ffMlHS5zEHLb8",
    authDomain: "pushnotifications-e6b38.firebaseapp.com",
    projectId: "pushnotifications-e6b38",
    storageBucket: "pushnotifications-e6b38.appspot.com",
    messagingSenderId: "152663014685",
    appId: "1:152663014685:web:92573d2a1e439889e535f4",
    measurementId: "G-8VH72Q59J1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log(payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    return event;
});