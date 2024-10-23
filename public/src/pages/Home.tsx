import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, requestNotificationPermission, registerServiceWorker, getFCM } from "../helpers/Firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import { CONSTANTS, STORAGE } from "../helpers/Constants";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | undefined>();
  const dataFetchedReference = useRef(false);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Signed out successfully");
        setUser(undefined);
        localStorage.clear();
      })
      .catch((error) => {
        console.error("Error", error.message, error);
      });
  };

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
              console.log(payload);
            },
            () => {
              setTimeout(function () {
                getFCM().then(async (fcm) => {
                  console.debug(STORAGE.FCM, fcm);
                  localStorage.setItem(STORAGE.FCM, fcm as string);
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
