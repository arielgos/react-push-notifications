import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, requestNotificationPermission, registerServiceWorker, getFCM, firestore } from "../helpers/Firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import { CONSTANTS, STORAGE } from "../helpers/Constants";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { Notification } from "../models/Models";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | undefined>();
  const dataFetchedReference = useRef(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Signed out successfully");
        setUser(undefined);
        localStorage.clear();
      })
      .catch((error) => {
        console.error("Error", error);
      });
  };

  useEffect(() => {
    if (!user) return;
    setDoc(doc(firestore, STORAGE.TOKEN, user?.uid), {
      user: user?.email,
      fcm: localStorage.getItem(STORAGE.FCM) ?? "",
      time: Timestamp.fromDate(new Date()).toMillis(),
    });
  }, [user]);

  useEffect(() => {
    if (dataFetchedReference.current) return;
    dataFetchedReference.current = true;

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        console.log("user is logged out");
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      requestNotificationPermission().then((hasPermissions) => {
        if (hasPermissions) {
          registerServiceWorker(
            (payload) => {
              setNotifications([
                ...notifications,
                {
                  id: payload.data.fcmMessageId,
                  title: payload.data.notification.title,
                  message: payload.data.notification.body,
                },
              ]);
            },
            () => {
              const timer = setTimeout(function () {
                getFCM()
                  .then(async (fcm) => {
                    console.debug(STORAGE.FCM, fcm);
                    localStorage.setItem(STORAGE.FCM, fcm as string);
                    clearTimeout(timer);
                  })
                  .catch((error) => {
                    console.error("Error", error);
                  });
              }, 3500);
            }
          );
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <ToastContainer className="p-3" position={"top-center"} style={{ zIndex: 1 }}>
        {notifications.map((notification: Notification) => {
          return (
            <Toast
              onClose={() => setNotifications(notifications.filter((obj) => obj.id != notification.id))}
              key={notification.id}
            >
              <Toast.Header>
                <strong className="me-auto">{notification.title}</strong>
              </Toast.Header>
              <Toast.Body>{notification.message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
      <Container>
        <Navbar.Brand href="#home">{CONSTANTS.title}</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text>
            Bienvenid@:{" "}
            <span onClick={handleLogout} title="Click para cerrar sesión">
              {user != null ? user.email : ""}
            </span>
          </Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
