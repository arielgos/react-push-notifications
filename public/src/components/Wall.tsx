import { User } from "firebase/auth";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { STORAGE } from "../helpers/Constants";
import { firestore, storage } from "../helpers/Firebase";
import { collection, orderBy, onSnapshot, query } from "firebase/firestore";
import { Notification } from "../models/Models";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Item from "./Item";
import Compressor from "compressorjs";
import { uploadBytes, ref } from "firebase/storage";

interface WallProps {
  user: User;
}

const Wall: FC<WallProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const reference = collection(firestore, STORAGE.NOTIFICATION);
    const q = query(reference, orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push(doc.data() as Notification);
      });
      setNotifications(notifications);
      if (loading) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loading]);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    let fileName = file.name;
    fileName = Date.now().toString() + fileName.substr(fileName.lastIndexOf("."));
    console.log("Compressing image...");
    new Compressor(file as File, {
      width: 480,
      quality: 0.75,
      async success(result) {
        console.log("Compressed image...");
        console.log("Uploading image...");
        let reference = ref(storage, fileName);
        await uploadBytes(reference, result).then((_) => {
          console.log("Uploaded image!");
          setUploading(false);
        });
      },
      error(err) {
        console.error("Error", err.message);
        setUploading(false);
      },
    });
  };

  if (loading) {
    return (
      <Container>
        <Row className="justify-content-md-center mt-5">
          <Col md={1} className="justify-content-md-center">
            <Spinner animation="grow" role="status" hidden={!loading} className="mt-4" />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      {!uploading && (
        <Form onSubmit={() => {}} className="my-3">
          <Form.Group className="mb-3" controlId="text">
            <Form.Label>Archivo a analizar</Form.Label>
            <Form.Control
              type="file"
              onChange={(event) => handleImage(event as ChangeEvent<HTMLInputElement>)}
              accept="image/*"
            />
          </Form.Group>
        </Form>
      )}
      {uploading && (
        <Row className="justify-content-md-center py-5">
          <Col md={1} className="justify-content-md-center">
            <Spinner animation="grow" role="status" hidden={!uploading} />
          </Col>
        </Row>
      )}
      <Stack gap={3} hidden={loading}>
        {notifications.map((notification) => (
          <Item key={notification.id} notification={notification} />
        ))}
      </Stack>
    </Container>
  );
};

export default Wall;
