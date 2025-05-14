import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

const adminApp = !getApps().length ? initializeApp(firebaseAdminConfig) : getApp();
const storage = getAdminStorage(adminApp);

export { adminApp, storage };
