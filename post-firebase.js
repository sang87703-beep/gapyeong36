import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { ensureAuth } from "./firebase-auth.js";

const ADMIN_PASSWORD = "gapyeong3-6";

const params = new URLSearchParams(location.search);
const postId = params.get("id");

const detailCategory = document.getElementById("detailCategory");
const detailTitle = document.getElementById("detailTitle");
const detailAuthor = document.getElementById("detailAuthor");
const detailDate = document.getElementById("detailDate");
const detailViews = document.getElementById("detailViews");
const detailContent = document.getElementById("detailContent");
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const likeCount = document.getElementById("likeCount");
const dislikeCount = document.getElementById("dislikeCount");
const deleteBtn = document.getElementById("deleteBtn");

const commentAuthorInput = document.getElementById("commentAuthorInput");
const commentContentInput = document.getElementById("commentContentInput");
const commentSubmitBtn = document.getElementById("commentSubmitBtn");
const commentList = document.getElementById("commentList");

const bannedWords = [
  "씨발", "시발", "병신", "좆", "존나",
  "개새끼", "미친놈", "미친년", "ㅅㅂ", "ㅂㅅ"
];

function hasBannedWord(text) {
  const lowered = (text || "").toLowerCase();
  return bannedWords.some(word => lowered.includes(word));
}

async function loadPost() {
  await ensureAuth();

  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);

  if (!snap.exists() || snap.data().deleted) {
    detailTitle.textContent = "게시글을 찾을 수 없어";
    detailContent.textContent = "삭제되었거나 없는 글이야.";
    likeBtn.disabled = true;
    dislikeBtn.disabled = true;
    commentSubmitBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }

  const post = snap.data();

  await updateDoc(postRef, { viewCount: increment(1) });

  detailCategory.textContent = post.category || "자유";
  detailTitle.textContent = post.title || "";
  detailAuthor.textContent = post.authorName || "익명";
  detailDate.textContent = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleString("ko-KR")
    : "";
  detailViews.textContent = `조회 ${(post.viewCount || 0) + 1}`;
  detailContent.textContent = post.content || "";
  likeCount.textContent = post.likeCount || 0;
  dislikeCount.textContent = post.dislikeCount || 0;
}

function voteDocId(userUid) {
  return `${postId}_${userUid}`;
}

async function react(type) {
  try {
    const user = await ensureAuth();
    const voteRef = doc(db, "votes", voteDocId(user.uid));
    const voteSnap = await getDoc(voteRef);
    const postRef = doc(db, "posts", postId);

    if (!voteSnap.exists()) {
      if (type === "like") {
        await updateDoc(postRef, { likeCount: increment(1) });
      } else {
        await updateDoc(postRef, { dislikeCount: increment(1) });
      }

      await setDoc(voteRef, {
        postId,
        userUid: user.uid,
        type,
        createdAt: serverTimestamp()
      });

      location.reload();
      return;
    }

    const previousType = voteSnap.data().type;

    if (previousType === type) {
      if (type === "like") {
        await updateDoc(postRef, { likeCount: increment(-1) });
      } else {
        await updateDoc(postRef, { dislikeCount: increment(-1) });
      }

      await deleteDoc(voteRef);
      location.reload();
      return;
    }

    if (previousType === "like" && type === "dislike") {
      await updateDoc(postRef, {
        likeCount: increment(-1),
        dislikeCount: increment(1)
      });
    } else if (previousType === "dislike" && type === "like") {
      await updateDoc(postRef, {
        dislikeCount: increment(-1),
        likeCount: increment(1)
      });
    }

    await setDoc(voteRef, {
      postId,
      userUid: user.uid,
      type,
      createdAt: serverTimestamp()
    });

    location.reload();
  } catch (error) {
    console.error(error);
    alert("반응 등록 실패: " + error.message);
  }
}

async function removePost() {
  const password = prompt("관리자 비밀번호를 입력해");
  if (password !== ADMIN_PASSWORD) {
    alert("비밀번호가 틀렸어.");
    return;
  }

  await updateDoc(doc(db, "posts", postId), { deleted: true });
  location.href = "community.html";
}

async function submitComment() {
  try {
    const user = await ensureAuth();
    const authorName = commentAuthorInput.value.trim() || "익명";
    const content = commentContentInput.value.trim();

    if (!content) {
      alert("댓글 내용을 입력해줘.");
      return;
    }

    if (hasBannedWord(content) || hasBannedWord(authorName)) {
      alert("욕설이나 부적절한 표현은 댓글에 쓸 수 없어.");
      return;
    }

    await addDoc(collection(db, "comments"), {
      postId,
      authorName,
      authorUid: user.uid,
      content,
      createdAt: serverTimestamp()
    });

    commentContentInput.value = "";
    await loadComments();
  } catch (error) {
    console.error(error);
    alert("댓글 등록 실패: " + error.message);
  }
}

async function loadComments() {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId)
  );

  const snapshot = await getDocs(q);

  commentList.innerHTML = "";

  if (snapshot.empty) {
    commentList.innerHTML = '<div class="comment-item">댓글이 아직 없어.</div>';
    return;
  }

  const comments = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  comments.sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return aTime - bTime;
  });

  comments.forEach(data => {
    const div = document.createElement("div");
    div.className = "comment-item";

    const dateText = data.createdAt?.toDate
      ? data.createdAt.toDate().toLocaleString("ko-KR")
      : "";

    div.innerHTML = `
      <div class="comment-author">${data.authorName || "익명"}</div>
      <div class="comment-meta">${dateText}</div>
      <div class="comment-content">${data.content || ""}</div>
    `;

    commentList.appendChild(div);
  });
}

likeBtn.addEventListener("click", () => react("like"));
dislikeBtn.addEventListener("click", () => react("dislike"));
deleteBtn.addEventListener("click", removePost);
commentSubmitBtn.addEventListener("click", submitComment);

await loadPost();
await loadComments();
