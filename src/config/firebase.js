
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCuu0cXMLJ2uIcqX_AmswMuyGJGqKVXezA",
  authDomain: "my-portfolio-web-82315.firebaseapp.com",
  projectId: "my-portfolio-web-82315",
  storageBucket: "my-portfolio-web-82315.firebasestorage.app",
  messagingSenderId: "105567315192",
  appId: "1:105567315192:web:7f5f5369578b6355cac70d",
  measurementId: "G-E7BCHYSJFL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
