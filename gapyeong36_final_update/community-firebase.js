import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { ensureAuth } from "./firebase-auth.js";

const postList = document.getElementById("postList");
const bestPosts = document.getElementById("bestPosts");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const chips = document.querySelectorAll(".chip");

let currentCategory = "all";

async function fetchPosts() {
  let q;

  if (sortSelect.value === "likes") {
    q = query(collection(db, "posts"), orderBy("likeCount", "desc"));
  } else if (sortSelect.value === "views") {
    q = query(collection(db, "posts"), orderBy("viewCount", "desc"));
  } else {
    q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function fetchBestPosts() {
  const q = query(collection(db, "posts"), orderBy("likeCount", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(post => post.deleted !== true)
    .slice(0, 3);
}

function renderBest(posts) {
  bestPosts.innerHTML = "";

  if (!posts.length) {
    bestPosts.innerHTML = '<div class="best-item">아직 베스트 글이 없어.</div>';
    return;
  }

  posts.forEach(post => {
    const a = document.createElement("a");
    a.href = `post.html?id=${post.id}`;
    a.className = "best-item";
    a.innerHTML = `
      <div class="best-item-title">${post.title || ""}</div>
      <div class="best-item-meta">좋아요 ${post.likeCount || 0} · 조회 ${post.viewCount || 0}</div>
    `;
    bestPosts.appendChild(a);
  });
}

function renderPosts(posts) {
  const keyword = searchInput.value.trim().toLowerCase();

  let filtered = [...posts];
  filtered = filtered.filter(post => post.deleted !== true);

  if (currentCategory !== "all") {
    filtered = filtered.filter(post => post.category === currentCategory);
  }

  if (keyword) {
    filtered = filtered.filter(post =>
      (post.title || "").toLowerCase().includes(keyword) ||
      (post.content || "").toLowerCase().includes(keyword)
    );
  }

  postList.innerHTML = "";

  if (!filtered.length) {
    postList.innerHTML = '<div class="white-card">게시글이 아직 없어.</div>';
    return;
  }

  filtered.forEach(post => {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = `post.html?id=${post.id}`;
    card.innerHTML = `
      <div class="post-top">
        <span class="post-category">${post.category || "자유"}</span>
      </div>
      <div class="post-title">${post.title || ""}</div>
      <div class="post-preview">${(post.content || "").slice(0, 70)}</div>
      <div class="post-meta">
        <span>${post.authorName || "익명"}</span>
        <span>조회 ${post.viewCount || 0}</span>
        <span>좋아요 ${post.likeCount || 0}</span>
        <span>싫어요 ${post.dislikeCount || 0}</span>
      </div>
    `;
    postList.appendChild(card);
  });
}

async function loadAndRender() {
  try {
    await ensureAuth();
    const [posts, best] = await Promise.all([fetchPosts(), fetchBestPosts()]);
    renderBest(best);
    renderPosts(posts);
  } catch (error) {
    console.error("목록 불러오기 실패:", error);
    postList.innerHTML = `<div class="white-card">목록 불러오기 실패: ${error.message}</div>`;
  }
}

sortSelect.addEventListener("change", loadAndRender);
searchInput.addEventListener("input", loadAndRender);

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentCategory = chip.dataset.category;
    loadAndRender();
  });
});

loadAndRender();
