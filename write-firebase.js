import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { ensureAuth } from "./firebase-auth.js";

const authorInput = document.getElementById("authorInput");
const categorySelect = document.getElementById("categorySelect");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const submitBtn = document.getElementById("submitBtn");

const bannedWords = [
  "씨발", "시발", "병신", "좆", "존나",
  "개새끼", "미친놈", "미친년", "ㅅㅂ", "ㅂㅅ"
];

function hasBannedWord(text) {
  const lowered = (text || "").toLowerCase();
  return bannedWords.some(word => lowered.includes(word));
}

submitBtn.addEventListener("click", async () => {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "등록 중...";

    const user = await ensureAuth();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const authorName = authorInput.value.trim() || "익명";
    const category = categorySelect.value;

    if (!title || !content) {
      alert("제목과 내용을 입력해줘.");
      return;
    }

    if (hasBannedWord(title) || hasBannedWord(content) || hasBannedWord(authorName)) {
      alert("욕설이나 부적절한 표현은 등록할 수 없어.");
      return;
    }

    await addDoc(collection(db, "posts"), {
      title,
      content,
      category,
      authorName,
      authorUid: user.uid,
      createdAt: serverTimestamp(),
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      deleted: false
    });

    alert("글이 등록됐어.");
    location.href = "community.html";
  } catch (error) {
    console.error("글 등록 실패:", error);
    alert("글 등록 실패: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "등록";
  }
});
