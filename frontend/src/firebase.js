// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyBcARZ2yiMyHcJLeoLBtAhRM5y_DnIWe-I",
  authDomain: "pawdentify-278f9.firebaseapp.com",
  projectId: "pawdentify-278f9",
  storageBucket: "pawdentify-278f9.firebasestorage.app",
  messagingSenderId: "1012934231523",
  appId: "1:1012934231523:web:936761f9e350b4f99a4cd6",
  measurementId: "G-299R1HGPPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);