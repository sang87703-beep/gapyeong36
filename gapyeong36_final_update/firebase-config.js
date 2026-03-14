import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfxnXx7npAVn5ixGfNNw__xJLV2tTvbgI",
  authDomain: "gp3-6-617cf.firebaseapp.com",
  projectId: "gp3-6-617cf",
  storageBucket: "gp3-6-617cf.firebasestorage.app",
  messagingSenderId: "892620300279",
  appId: "1:892620300279:web:658572d9089e66510918f2",
  measurementId: "G-NRKQSCN0XM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
