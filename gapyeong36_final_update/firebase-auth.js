import {
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { auth } from "./firebase-config.js";

export async function ensureAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
        return;
      }
      try {
        const result = await signInAnonymously(auth);
        resolve(result.user);
      } catch (error) {
        reject(error);
      }
    });
  });
}
