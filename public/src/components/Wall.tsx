import { User } from "firebase/auth";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { CONFIGURATION, STORAGE } from "../helpers/Constants";
import { firestore, storage } from "../helpers/Firebase";
import { collection, orderBy, onSnapshot, query, setDoc, doc } from "firebase/firestore";
import { Photo } from "../models/Models";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Item from "./Item";
import Compressor from "compressorjs";
import { uploadBytes, ref } from "firebase/storage";
import { InputGroup } from "react-bootstrap";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Alert } from "react-bootstrap";

interface WallProps {
  user: User;
}

const Wall: FC<WallProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState<Photo[]>([]);
  const [labels, setLabels] = useState("");
  const [prompt, setPrompt] = useState("");
  const [geminiResult, setGeminiResult] = useState("");

  useEffect(() => {
    const reference = collection(firestore, STORAGE.NOTIFICATION);
    const q = query(reference, orderBy("time", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Photo[] = [];
      snapshot.forEach((doc) => {
        notifications.push(doc.data() as Photo);
      });
      setNotifications(notifications);
      if (loading) {
        setLoading(false);
      }
    });

    onSnapshot(query(collection(firestore, STORAGE.CONFIGURATION)), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === CONFIGURATION.LABEL) {
          setLabels(doc.data().value);
        } else {
          setPrompt(doc.data().value);
        }
      });
    });

    return () => unsubscribe();
  }, [loading]);

  const callGemini = async (type: string, file64: string) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY ?? "";
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: type,
                data: file64,
              },
            },
          ],
        },
      ],
    });
    const result = await chatSession.sendMessage(prompt);
    setGeminiResult(result.response.text());
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

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
        convertFileToBase64(result as File).then((base64) => {
          callGemini(result.type, base64.split(",")[1]);
        });
        console.log("Compressed image...");
        console.log("Uploading image...");
        let reference = ref(storage, fileName);
        await uploadBytes(reference, result).then((result) => {
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
      <Form onSubmit={(event) => event.preventDefault()} className="my-3">
        <Form.Group className="mb-3">
          <InputGroup>
            <InputGroup.Text>Gemini Prompt</InputGroup.Text>
            <Form.Control
              as="textarea"
              aria-label="Prompt"
              value={prompt}
              onChange={async (e) => {
                setPrompt(e.target.value);
                await setDoc(doc(firestore, STORAGE.CONFIGURATION, CONFIGURATION.PROMPT), {
                  value: e.target.value.split(","),
                });
              }}
            />
          </InputGroup>
        </Form.Group>
        {!uploading && geminiResult.length > 0 && (
          <Alert variant={geminiResult.includes("ALERT") ? "danger" : "primary"}>{geminiResult}</Alert>
        )}
        <Form.Group className="mb-3">
          <InputGroup>
            <InputGroup.Text>Etiquetas a analizar</InputGroup.Text>
            <Form.Control
              as="textarea"
              aria-label="Etiquetas a Analizar"
              value={labels}
              onChange={async (e) => {
                setLabels(e.target.value);
                await setDoc(doc(firestore, STORAGE.CONFIGURATION, CONFIGURATION.LABEL), {
                  value: e.target.value.split(","),
                });
              }}
            />
          </InputGroup>
        </Form.Group>
      </Form>
      {!uploading && (
        <Form onSubmit={(event) => event.preventDefault()} className="my-3">
          <Form.Group className="mb-3" controlId="text">
            <Form.Label>Subir archivo a Revisión</Form.Label>
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
      <Row hidden={loading} md={2} xs={1}>
        {notifications.map((notification) => (
          <Item key={notification.id} notification={notification} />
        ))}
      </Row>
    </Container>
  );
};

export default Wall;
