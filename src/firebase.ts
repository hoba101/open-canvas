import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDsekiFcZ0C4TCPlzcp6xPi2Tj_HzjMDM",
  authDomain: "open-canvas-e0906.firebaseapp.com",
  projectId: "open-canvas-e0906",
  storageBucket: "open-canvas-e0906.firebasestorage.app",
  messagingSenderId: "810570211296",
  appId: "1:810570211296:web:748afe68e6944564eb1585",
  measurementId: "G-4WHQRC2JNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, analytics };

