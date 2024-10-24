importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');
importScripts('./firebase.config.js');

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
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