import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, requestNotificationPermission, registerServiceWorker, getFCM, firestore } from "../helpers/Firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import { CONSTANTS, STORAGE } from "../helpers/Constants";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { Photo } from "../models/Models";
import Wall from "../components/Wall";
import { Alert } from "react-bootstrap";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | undefined>();
  const [fcm, setFcm] = useState("");
  const dataFetchedReference = useRef(false);
  const [notifications, setNotifications] = useState<Photo[]>([]);
  const pushEnabled = Notification.permission === "granted";

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

  const enabledPushNotifications = () => {
    requestNotificationPermission().then((_) => {
      navigate(0);
    });
  };

  useEffect(() => {
    if (!user) return;
    if (!pushEnabled) return;
    if (fcm.length < 1) return;
    addDoc(collection(firestore, STORAGE.TOKEN), {
      user: user?.email,
      fcm: fcm,
      time: Timestamp.fromDate(new Date()).toMillis(),
    });
  }, [user, fcm]);

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
      if (!pushEnabled) return;
      requestNotificationPermission().then((hasPermissions) => {
        if (hasPermissions) {
          registerServiceWorker(
            (payload) => {
              setNotifications((list) => [
                ...list,
                {
                  id: payload.data.fcmMessageId,
                  title: payload.data.notification.title,
                  message: payload.data.notification.body,
                  time: Timestamp.fromDate(new Date()).toMillis(),
                  file: undefined,
                },
              ]);
            },
            () => {
              const timer = setTimeout(function () {
                getFCM()
                  .then(async (fcm) => {
                    const token = fcm as string;
                    console.debug(STORAGE.FCM, token);
                    localStorage.setItem(STORAGE.FCM, token);
                    setFcm(token);
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
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <ToastContainer className="p-3" position={"top-center"} style={{ zIndex: 1 }}>
          {notifications.map((notification: Photo) => {
            return (
              <Toast
                onClose={() => setNotifications(notifications.filter((obj) => obj.id !== notification.id))}
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
      {!pushEnabled && (
        <Container className="mt-3">
          <Alert variant="warning" onClick={enabledPushNotifications}>
            Habilitar Notificaciones (Click Aquí)
          </Alert>
        </Container>
      )}
      {user && <Wall user={user} />}
    </>
  );
}
