import { db } from './firebase-config.js';
import {
  ref, get, set, update, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ========================
   STATE
======================== */
let currentUser = null;

/* ========================
   HELPERS
======================== */
function hashPassword(password) {
  // Simple hash for demo; use Firebase Auth or bcrypt in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString(36);
}

function sanitizeNick(nick) {
  return nick.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function validateNick(nick) {
  if (!nick) return 'Введите никнейм';
  if (nick.length < 3) return 'Никнейм от 3 символов';
  if (nick.length > 20) return 'Никнейм до 20 символов';
  if (!/^[a-z0-9_]+$/.test(nick)) return 'Только латиница, цифры и _';
  return null;
}

function validatePassword(pass) {
  if (!pass) return 'Введите пароль';
  if (pass.length < 6) return 'Пароль от 6 символов';
  return null;
}

/* ========================
   SESSION
======================== */
function saveSession(user) {
  localStorage.setItem('tg_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('tg_user');
}

function loadSession() {
  try {
    const raw = localStorage.getItem('tg_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ========================
   API
======================== */
async function register(nick, password) {
  nick = sanitizeNick(nick);
  const nickErr = validateNick(nick);
  if (nickErr) throw new Error(nickErr);
  const passErr = validatePassword(password);
  if (passErr) throw new Error(passErr);

  const userRef = ref(db, `users/${nick}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error('Никнейм уже занят');

  const user = {
    nick,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    online: true,
    lastSeen: Date.now()
  };

  await set(userRef, user);
  currentUser = { nick };
  saveSession(currentUser);
  return currentUser;
}

async function login(nick, password) {
  nick = sanitizeNick(nick);
  if (!nick) throw new Error('Введите никнейм');
  if (!password) throw new Error('Введите пароль');

  const userRef = ref(db, `users/${nick}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error('Пользователь не найден');

  const userData = snap.val();
  if (userData.passwordHash !== hashPassword(password)) {
    throw new Error('Неверный пароль');
  }

  // Mark online
  await update(userRef, { online: true, lastSeen: serverTimestamp() });

  currentUser = { nick };
  saveSession(currentUser);
  return currentUser;
}

async function logout() {
  if (currentUser) {
    try {
      await update(ref(db, `users/${currentUser.nick}`), {
        online: false,
        lastSeen: Date.now()
      });
    } catch {}
  }
  currentUser = null;
  clearSession();
}

async function findUser(nick) {
  nick = sanitizeNick(nick);
  if (!nick) throw new Error('Введите никнейм');
  const snap = await get(ref(db, `users/${nick}`));
  if (!snap.exists()) throw new Error('Пользователь не найден');
  return snap.val();
}

function getCurrentUser() {
  if (!currentUser) {
    currentUser = loadSession();
  }
  return currentUser;
}

export { register, login, logout, findUser, getCurrentUser, loadSession };
