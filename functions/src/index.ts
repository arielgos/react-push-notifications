import { onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/storage";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/firestore";
import { initializeApp } from "firebase-admin/app";
import { messaging, firestore } from "firebase-admin";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { Timestamp } from "firebase-admin/firestore";

const TOPIC = "firebase-react";
const NOTIFICATION = "notification";

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
        .collection(NOTIFICATION)
        .add({
          id: event.id,
          title: filePath,
          message: labelNames,
          time: Timestamp.fromDate(new Date()).toMillis(),
          file: `gs://${bucketName}/${filePath}`,
        });

      if (labelNames.toLowerCase().includes("fire") || labelNames.toLowerCase().includes("flame")) {
        const payload = {
          notification: {
            title: filePath,
            body: labelNames,
          },
          topic: TOPIC,
        };
        await messaging().send(payload);
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
      .subscribeToTopic(document.fcm, TOPIC)
      .then((result: any) => {
        logger.log("Successfully subscribed to topic:", TOPIC, result);
      })
      .catch((e: any) => {
        logger.error("Error", e);
      });
  }
  return null;
});
