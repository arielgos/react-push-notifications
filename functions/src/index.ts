import { onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/storage";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/firestore";
import { initializeApp } from "firebase-admin/app";
import { messaging, firestore } from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { Timestamp } from "firebase-admin/firestore";

export const CONSTANTS = {
  TOPIC: "firebase-react",
  TOKEN: "token",
  NOTIFICATION: "notification",
  CONFIGURATION: "configuration",
};

export const CONFIGURATION = {
  LABEL: "label",
};

initializeApp();

const client = new ImageAnnotatorClient();

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const callCustomModel = onObjectFinalized({ cpu: 2 }, async (event) => {
  logger.log("callCustomModel", event);
  const filePath = event.data.name;
  const bucketName = event.bucket;
  if (!filePath) {
    logger.error("No file path provided.");
    return null;
  }
  try {
    const [result] = await client.labelDetection(`gs://${bucketName}/${filePath}`);
    const labels = result.labelAnnotations;
    if (labels) {
      const labelNames = labels.map((label) => label.description).join(", ");
      await firestore()
        .collection(CONSTANTS.NOTIFICATION)
        .add({
          id: event.id,
          title: filePath,
          message: labelNames,
          time: Timestamp.fromDate(new Date()).toMillis(),
          file: `gs://${bucketName}/${filePath}`,
        });

      const snapshot = await firestore().collection(CONSTANTS.CONFIGURATION).doc(CONFIGURATION.LABEL).get();
      if (snapshot.exists) {
        const data = snapshot.data();
        logger.log("Data", data);
        const value: string[] = data?.value;
        const findings = value.filter((element) => labelNames.toLowerCase().includes(element));
        if (findings.length > 0) {
          const payload = {
            notification: {
              title: filePath,
              body: findings.join(", "),
            },
            topic: CONSTANTS.TOPIC,
          };
          await messaging().send(payload);
        }
      }
    }
  } catch (error) {
    logger.error("Error during label detection:", error);
  }
  return null;
});

export const addToTopic = onDocumentCreated("token/{docId}", async (event) => {
  const document = event.data?.data();
  if (document) {
    logger.log("addToTopic", event.params.docId, document);
    await messaging()
      .subscribeToTopic(document.fcm, CONSTANTS.TOPIC)
      .then((result: any) => {
        logger.log("Successfully subscribed to topic:", CONSTANTS.TOPIC, result);
      })
      .catch((e: any) => {
        logger.error("Error", e);
      });
  }
  return null;
});
