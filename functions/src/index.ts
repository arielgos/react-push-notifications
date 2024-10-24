import { onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/storage";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/firestore";
import { initializeApp } from "firebase-admin/app";
import { messaging } from "firebase-admin";

const TOPIC = "firebase-react";

initializeApp();

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const callCustomModel = onObjectFinalized({ cpu: 2 }, async (event) => {
  logger.log("callCustomModel", event);
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
});
