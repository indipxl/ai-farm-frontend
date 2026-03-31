import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCE9DiDFNk33aNvIgQNw8tbcmbooY5bprk",
  authDomain: "gaia-sabah-c3-group2-aifarm.firebaseapp.com",
  projectId: "gaia-sabah-c3-group2-aifarm",
  storageBucket: "gaia-sabah-c3-group2-aifarm.firebasestorage.app",
  messagingSenderId: "562185009562",
  appId: "1:562185009562:web:eac216c70506d7656da223",
  measurementId: "G-GQV6CYJD9Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

