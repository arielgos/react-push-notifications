import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { NavLink, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Badge from "react-bootstrap/Badge";
import InputGroup from "react-bootstrap/InputGroup";
import Alert from "react-bootstrap/Alert";
import { auth, authProvider, requestNotificationPermission } from "../helpers/Firebase";
import { CONSTANTS } from "../helpers/Constants";

export default function Login() {
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState("");

  const onLogin = async (e: any) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity()) {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          navigate("/");
        })
        .catch((error) => {
          console.error("Error", error.message, error);
          setMessage(error.message);
          setShowAlert(true);
        });
    }
    setValidated(true);
  };

  const onGoogleSignIn = (e: any) => {
    e.preventDefault();
    requestNotificationPermission().then(() => {
      signInWithPopup(auth, authProvider)
        .then(() => {
          navigate("/");
        })
        .catch((error) => {
          console.error("Error", error.message, error);
          setMessage(error.message);
          setShowAlert(true);
        });
    });
  };

  return (
    <Container>
      <Row className="pt-5 justify-content-md-center">
        <Col md={6}>
          <h1>{CONSTANTS.title}</h1>
          <h2>Inicio de Sesión</h2>
          <Form className="pt-3" noValidate validated={validated} onSubmit={onLogin}>
            <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible show={showAlert}>
              <Alert.Heading>OoOps! You got an error!</Alert.Heading>
              <p>{message}</p>
            </Alert>
            <Form.Group className="mb-3" controlId="email">
              <FloatingLabel controlId="email" label="Correo Electrónico" className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="off"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FloatingLabel>
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <InputGroup hasValidation>
                <FloatingLabel controlId="password" label="Password" className="mb-3">
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    autoComplete="off"
                    value={password}
                    required
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must complain with the 6 characters restriction
                  </Form.Control.Feedback>
                </FloatingLabel>
              </InputGroup>
            </Form.Group>
            <p className="text-sm text-center text-secondary">
              Aún no posees una cuenta?{" "}
              <NavLink to="/signup">
                <Badge bg="info">Regístrate</Badge>
              </NavLink>
            </p>
            <Button variant="primary" type="submit" className="mt-3">
              Ingresar
            </Button>{" "}
            <Button variant="secondary" type="submit" className="mt-3" onClick={onGoogleSignIn}>
              Ingresar con Google
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
