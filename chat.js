import { db } from './firebase-config.js';
import {
  ref, push, set, get, onValue, off,
  query, orderByChild, update, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ========================
   CHAT ID GENERATOR
======================== */
function getChatId(nickA, nickB) {
  return [nickA, nickB].sort().join('__');
}

/* ========================
   GET OR CREATE CHAT
======================== */
async function getOrCreateChat(myNick, theirNick) {
  const chatId = getChatId(myNick, theirNick);
  const chatRef = ref(db, `chats/${chatId}`);
  const snap = await get(chatRef);

  if (!snap.exists()) {
    await set(chatRef, {
      members: { [myNick]: true, [theirNick]: true },
      createdAt: Date.now(),
      lastMessage: null,
      lastTime: Date.now()
    });
  }
  return chatId;
}

/* ========================
   SEND MESSAGE
======================== */
async function sendMessage(chatId, senderNick, text) {
  text = text.trim();
  if (!text) return;

  const msgRef  = ref(db, `messages/${chatId}`);
  const newMsgRef = push(msgRef);

  const msg = {
    sender: senderNick,
    text,
    time: Date.now(),
    status: 'sent'
  };

  await set(newMsgRef, msg);

  // Update chat metadata
  await update(ref(db, `chats/${chatId}`), {
    lastMessage: text,
    lastSender: senderNick,
    lastTime: Date.now()
  });

  return newMsgRef.key;
}

/* ========================
   LISTEN TO MESSAGES
======================== */
function listenMessages(chatId, callback) {
  const msgRef = ref(db, `messages/${chatId}`);
  onValue(msgRef, snap => {
    const msgs = [];
    if (snap.exists()) {
      snap.forEach(child => {
        msgs.push({ id: child.key, ...child.val() });
      });
    }
    callback(msgs);
  });
  return () => off(msgRef);
}

/* ========================
   LISTEN TO USER CHATS
======================== */
function listenUserChats(myNick, callback) {
  const chatsRef = ref(db, 'chats');
  onValue(chatsRef, snap => {
    const chats = [];
    if (snap.exists()) {
      snap.forEach(child => {
        const chat = child.val();
        if (chat.members && chat.members[myNick]) {
          const otherNick = Object.keys(chat.members).find(n => n !== myNick);
          chats.push({
            id: child.key,
            otherNick,
            lastMessage: chat.lastMessage,
            lastSender: chat.lastSender,
            lastTime: chat.lastTime
          });
        }
      });
      chats.sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));
    }
    callback(chats);
  });
  return () => off(chatsRef);
}

/* ========================
   LISTEN ONLINE STATUS
======================== */
function listenUserOnline(nick, callback) {
  const r = ref(db, `users/${nick}/online`);
  onValue(r, snap => callback(snap.val()));
  return () => off(r);
}

/* ========================
   SET TYPING
======================== */
function setTyping(chatId, nick, isTyping) {
  update(ref(db, `chats/${chatId}/typing`), { [nick]: isTyping });
}

function listenTyping(chatId, myNick, callback) {
  const r = ref(db, `chats/${chatId}/typing`);
  onValue(r, snap => {
    if (!snap.exists()) return callback(false);
    const data = snap.val();
    const someoneTyping = Object.entries(data)
      .some(([nick, val]) => nick !== myNick && val === true);
    callback(someoneTyping);
  });
  return () => off(r);
}

/* ========================
   COUNT USER MESSAGES
======================== */
async function countUserMessages(nick) {
  const snap = await get(ref(db, 'messages'));
  if (!snap.exists()) return 0;
  let count = 0;
  snap.forEach(chat => {
    chat.forEach(msg => {
      if (msg.val().sender === nick) count++;
    });
  });
  return count;
}

export {
  getChatId, getOrCreateChat, sendMessage,
  listenMessages, listenUserChats,
  listenUserOnline, setTyping, listenTyping,
  countUserMessages
};
