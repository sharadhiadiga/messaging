import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDeTOd7mLG8GEwzUqXLMoBFdZKLUGHRsOs",
  authDomain: "skill-trade-messaging.firebaseapp.com",
  projectId: "skill-trade-messaging",
  storageBucket: "skill-trade-messaging.firebasestorage.app",
  messagingSenderId: "879504735439",
  appId: "1:879504735439:web:da55d7faaff7835b83cbba",
  measurementId: "G-MEVZKJ7JBJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM references
const loginContainer = document.getElementById("login-container");
const userListContainer = document.getElementById("user-list-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("login");
const signupBtn = document.getElementById("signup");
const logoutBtn = document.getElementById("logout");
const backBtn = document.getElementById("back");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const userList = document.getElementById("user-list");
const chatWith = document.getElementById("chat-with");
const messagesDiv = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

let currentUser = null;
let selectedUserId = null;
let unsubscribeMessages = null;

loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    authError.textContent = error.message;
  }
};

signupBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (error) {
    authError.textContent = error.message;
  }
};

logoutBtn.onclick = () => {
  signOut(auth);
};

backBtn.onclick = () => {
  chatContainer.classList.add("hidden");
  userListContainer.classList.remove("hidden");
  if (unsubscribeMessages) unsubscribeMessages();
};

messageForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!messageInput.value.trim()) return;

  await addDoc(collection(db, "messages"), {
    text: messageInput.value,
    senderId: currentUser.uid,
    receiverId: selectedUserId,
    name: currentUser.email,
    timestamp: serverTimestamp()
  });

  messageInput.value = "";
};

function showUserList() {
  userList.innerHTML = "";
  getDocs(collection(db, "users")).then((snapshot) => {
    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      if (user.uid !== currentUser.uid) {
        const li = document.createElement("li");
        li.textContent = user.email;
        const btn = document.createElement("button");
        btn.textContent = "Contact Me";
        btn.onclick = () => openChat(user.uid, user.email);
        li.appendChild(btn);
        userList.appendChild(li);
      }
    });
  });
}

function openChat(userId, userEmail) {
  selectedUserId = userId;
  chatWith.textContent = userEmail;
  userListContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
  messagesDiv.innerHTML = "";

  const q = query(
    collection(db, "messages"),
    orderBy("timestamp")
  );

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      if (
        (msg.senderId === currentUser.uid && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === currentUser.uid)
      ) {
        const div = document.createElement("div");
        div.className = msg.senderId === currentUser.uid ? "sent" : "received";
        div.textContent = `${msg.name}: ${msg.text}`;
        messagesDiv.appendChild(div);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginContainer.classList.add("hidden");
    userListContainer.classList.remove("hidden");

    // Add user to "users" collection if not exists
    const userRef = collection(db, "users");
    const snapshot = await getDocs(userRef);
    const exists = snapshot.docs.some(doc => doc.data().uid === user.uid);
    if (!exists) {
      await addDoc(userRef, {
        uid: user.uid,
        email: user.email
      });
    }

    showUserList();
  } else {
    currentUser = null;
    selectedUserId = null;
    loginContainer.classList.remove("hidden");
    userListContainer.classList.add("hidden");
    chatContainer.classList.add("hidden");
  }
});
