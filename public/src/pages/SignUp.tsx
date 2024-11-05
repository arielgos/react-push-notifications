import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, authProvider } from "../helpers/Firebase";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Badge from "react-bootstrap/Badge";
import InputGroup from "react-bootstrap/InputGroup";
import Alert from "react-bootstrap/Alert";
import { CONSTANTS } from "../helpers/Constants";
import { signInWithPopup } from "firebase/auth";

export default function SignUp() {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (e: any) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity()) {
      createUserWithEmailAndPassword(auth, email, password)
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

  const onGoogleSignUp = (e: any) => {
    e.preventDefault();
    signInWithPopup(auth, authProvider)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error", error.message, error);
        setMessage(error.message);
        setShowAlert(true);
      });
  };

  return (
    <Container>
      <Row className="pt-5 justify-content-md-center">
        <Col md={6}>
          <h1>{CONSTANTS.title}</h1>
          <h2>Registro</h2>
          <Form className="pt-3" noValidate validated={validated} onSubmit={onSubmit}>
            <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible show={showAlert}>
              <Alert.Heading>OoOps! You got an error!</Alert.Heading>
              <p>{message}</p>
            </Alert>
            <Form.Group className="mb-3" controlId="email">
              <FloatingLabel controlId="email" label="Correo Electrónico" className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="name@example.com"
                  autoComplete="off"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FloatingLabel>
              <Form.Text className="text-muted">Nunca compartiremos tú correo electrónico con nadie.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="password">
              <InputGroup hasValidation>
                <FloatingLabel controlId="password" label="Contraseña" className="mb-3">
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
                    Las contraseñas deben cumplir con mínimo de 6 caracteres
                  </Form.Control.Feedback>
                </FloatingLabel>
              </InputGroup>
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              Registrarme
            </Button>{" "}
            <Button variant="secondary" type="submit" className="mt-3" onClick={onGoogleSignUp}>
              Registrarme con Google
            </Button>
            <p className="text-sm text-center text-secondary pt-3">
              Ya posees una cuenta?{" "}
              <NavLink to="/login">
                <Badge bg="info">Ingresar</Badge>
              </NavLink>
            </p>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
