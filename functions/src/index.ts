import { onRequest } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/storage";
import * as logger from "firebase-functions/logger";

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

export const callCustomModel = onObjectFinalized({ cpu: 2 }, async (event) => {
  logger.log("callCustomModel", event);
});
