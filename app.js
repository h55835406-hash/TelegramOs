import { register, login, logout, findUser, getCurrentUser, loadSession } from './auth.js';
import {
  getOrCreateChat, sendMessage, listenMessages,
  listenUserChats, listenUserOnline,
  setTyping, listenTyping, countUserMessages
} from './chat.js';
import {
  avatarColor, avatarInitials, formatTime,
  showError, hideError, addRipple, setLoading,
  autoResize, scrollToBottom, showToast, animateSend, switchTab
} from './ui.js';

/* ========================
   ELEMENTS
======================== */
const splash       = document.getElementById('splash');
const authScreen   = document.getElementById('authScreen');
const appEl        = document.getElementById('app');

// Auth
const loginForm    = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn     = document.getElementById('loginBtn');
const registerBtn  = document.getElementById('registerBtn');
const loginNick    = document.getElementById('loginNick');
const loginPass    = document.getElementById('loginPass');
const regNick      = document.getElementById('regNick');
const regPass      = document.getElementById('regPass');
const regPass2     = document.getElementById('regPass2');
const loginError   = document.getElementById('loginError');
const loginErrorMsg  = document.getElementById('loginErrorMsg');
const regError     = document.getElementById('regError');
const regErrorMsg  = document.getElementById('regErrorMsg');
const tabBtns      = document.querySelectorAll('.auth__tab');
const tabIndicator = document.querySelector('.auth__tab-indicator');

// App
const sidebar      = document.getElementById('sidebar');
const menuBtn      = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const newChatBtn   = document.getElementById('newChatBtn');
const profileBtn   = document.getElementById('profileBtn');
const logoutBtn    = document.getElementById('logoutBtn');
const searchInput  = document.getElementById('searchInput');
const chatList     = document.getElementById('chatList');
const chatListEmpty = document.getElementById('chatListEmpty');

// New Chat Modal
const newChatModal   = document.getElementById('newChatModal');
const newChatNick    = document.getElementById('newChatNick');
const confirmNewChat = document.getElementById('confirmNewChat');
const cancelNewChat  = document.getElementById('cancelNewChat');
const closeNewChat   = document.getElementById('closeNewChat');
const newChatError   = document.getElementById('newChatError');
const newChatErrorMsg = document.getElementById('newChatErrorMsg');

// Chat
const chatEmpty    = document.getElementById('chatEmpty');
const chatActive   = document.getElementById('chatActive');
const chatMessages = document.getElementById('chatMessages');
const chatNameHeader  = document.getElementById('chatNameHeader');
const chatStatusHeader = document.getElementById('chatStatusHeader');
const chatAvatarHeader = document.getElementById('chatAvatarHeader');
const messageInput = document.getElementById('messageInput');
const sendBtn      = document.getElementById('sendBtn');
const backBtn      = document.getElementById('backBtn');
const typingIndicator = document.getElementById('typingIndicator');
const typingAvatar    = document.getElementById('typingAvatar');

// Profile
const profilePanel = document.getElementById('profilePanel');
const closeProfile = document.getElementById('closeProfile');
const profileAvatar = document.getElementById('profileAvatar');
const profileName   = document.getElementById('profileName');
const profileNickEl = document.getElementById('profileNick');
const statChats     = document.getElementById('statChats');
const statMessages  = document.getElementById('statMessages');

/* ========================
   APP STATE
======================== */
let me = null;
let activeChatId   = null;
let activeChatNick = null;
let unlistenMessages = null;
let unlistenTyping   = null;
let unlistenOnline   = null;
let unlistenChats    = null;
let typingTimer      = null;
let allChats         = [];

/* ========================
   INIT
======================== */
window.addEventListener('DOMContentLoaded', async () => {
  // Splash sequence
  await delay(1800);
  splash.style.animation = 'fadeIn .4s ease reverse';
  await delay(380);
  splash.classList.add('hidden');

  // Check session
  me = loadSession();
  if (me) {
    showApp();
  } else {
    showAuth();
  }
});

/* ========================
   SHOW/HIDE SCREENS
======================== */
function showAuth() {
  authScreen.classList.remove('hidden');
  appEl.classList.add('hidden');
}

function showApp() {
  authScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
  initApp();
}

/* ========================
   AUTH TAB SWITCH
======================== */
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    switchTab(tabIndicator, tabBtns, tab);
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
    hideError(loginError);
    hideError(regError);
  });
});

/* ========================
   PASSWORD TOGGLE
======================== */
document.querySelectorAll('.input-toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap  = btn.closest('.input-wrap');
    const input = wrap.querySelector('input');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.querySelector('.eye-icon').style.opacity = isPass ? '.5' : '1';
  });
});

/* ========================
   LOGIN
======================== */
loginBtn.addEventListener('click', async (e) => {
  addRipple(loginBtn, e);
  hideError(loginError);
  const nick = loginNick.value;
  const pass = loginPass.value;
  setLoading(loginBtn, true);
  try {
    me = await login(nick, pass);
    showToast('Добро пожаловать!', 'success');
    showApp();
  } catch (err) {
    showError(loginError, loginErrorMsg, err.message);
  } finally {
    setLoading(loginBtn, false);
  }
});

loginPass.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

/* ========================
   REGISTER
======================== */
registerBtn.addEventListener('click', async (e) => {
  addRipple(registerBtn, e);
  hideError(regError);
  const nick  = regNick.value;
  const pass  = regPass.value;
  const pass2 = regPass2.value;
  if (pass !== pass2) {
    showError(regError, regErrorMsg, 'Пароли не совпадают');
    return;
  }
  setLoading(registerBtn, true);
  try {
    me = await register(nick, pass);
    showToast('Аккаунт создан!', 'success');
    showApp();
  } catch (err) {
    showError(regError, regErrorMsg, err.message);
  } finally {
    setLoading(registerBtn, false);
  }
});

regPass2.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') registerBtn.click();
});

/* ========================
   APP INIT
======================== */
function initApp() {
  if (!me) return;

  // Mobile back button
  if (window.innerWidth <= 700) {
    backBtn.classList.remove('hidden');
  }

  // Listen to chats
  if (unlistenChats) unlistenChats();
  unlistenChats = listenUserChats(me.nick, renderChatList);
}

/* ========================
   CHAT LIST
======================== */
function renderChatList(chats) {
  allChats = chats;
  renderFilteredChats(searchInput.value.trim().toLowerCase());
}

function renderFilteredChats(filter) {
  const filtered = filter
    ? allChats.filter(c => c.otherNick?.includes(filter))
    : allChats;

  // Remove existing items
  chatList.querySelectorAll('.chat-item').forEach(el => el.remove());
  chatListEmpty.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach((chat, i) => {
    const item = createChatItem(chat, i);
    chatList.appendChild(item);
  });
}

function createChatItem(chat, delay = 0) {
  const { id, otherNick, lastMessage, lastSender, lastTime } = chat;
  const el = document.createElement('div');
  el.className = 'chat-item';
  el.dataset.chatId = id;
  el.dataset.nick = otherNick;
  el.style.animationDelay = `${delay * 40}ms`;
  if (id === activeChatId) el.classList.add('active');

  const colorClass = avatarColor(otherNick || '?');
  const initials   = avatarInitials(otherNick || '?');
  const preview    = lastMessage
    ? (lastSender === me.nick ? `Вы: ${lastMessage}` : lastMessage)
    : 'Нет сообщений';

  el.innerHTML = `
    <div class="chat-item__avatar ${colorClass}">
      ${initials}
      <div class="chat-item__online-dot" style="display:none" id="online-${id}"></div>
    </div>
    <div class="chat-item__body">
      <div class="chat-item__row">
        <span class="chat-item__name">${escapeHtml(otherNick || '?')}</span>
        <span class="chat-item__time">${lastTime ? formatTime(lastTime) : ''}</span>
      </div>
      <div class="chat-item__preview">${escapeHtml(preview)}</div>
    </div>
  `;

  el.addEventListener('click', () => openChat(id, otherNick));
  return el;
}

/* ========================
   OPEN CHAT
======================== */
async function openChat(chatId, otherNick) {
  // Update active state in list
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chatId === chatId);
  });

  activeChatId   = chatId;
  activeChatNick = otherNick;

  // Show chat area
  chatEmpty.classList.add('hidden');
  chatActive.classList.remove('hidden');

  // Header
  const color = avatarColor(otherNick);
  chatAvatarHeader.className = `chat__avatar ${color}`;
  chatAvatarHeader.textContent = avatarInitials(otherNick);
  chatNameHeader.textContent = otherNick;

  // Mobile: hide sidebar
  if (window.innerWidth <= 700) {
    sidebar.classList.add('hidden-mobile');
  }

  // Clear messages
  chatMessages.innerHTML = `
    <div class="chat__date-divider" id="todayDivider">
      <span>Сегодня</span>
    </div>
  `;

  // Unlisten previous
  if (unlistenMessages) unlistenMessages();
  if (unlistenTyping)   unlistenTyping();
  if (unlistenOnline)   unlistenOnline();

  // Listen messages
  unlistenMessages = listenMessages(chatId, msgs => renderMessages(msgs, otherNick));

  // Listen typing
  unlistenTyping = listenTyping(chatId, me.nick, (isTyping) => {
    typingIndicator.classList.toggle('hidden', !isTyping);
    if (isTyping) {
      typingAvatar.className = `typing-avatar ${avatarColor(otherNick)}`;
      typingAvatar.textContent = avatarInitials(otherNick);
      scrollToBottom(chatMessages);
    }
  });

  // Listen online
  unlistenOnline = listenUserOnline(otherNick, (online) => {
    const dot  = chatStatusHeader.querySelector('.status-dot');
    const text = chatStatusHeader.querySelector('.status-text');
    if (online) {
      dot.style.background = 'var(--online)';
      text.textContent = 'онлайн';
      chatStatusHeader.style.color = 'var(--online)';
    } else {
      dot.style.background = 'var(--text-hint)';
      dot.style.animation = 'none';
      text.textContent = 'был(а) недавно';
      chatStatusHeader.style.color = 'var(--text-sec)';
    }
  });

  messageInput.focus();
}

/* ========================
   RENDER MESSAGES
======================== */
function renderMessages(msgs, otherNick) {
  // Remove old messages but keep date divider
  const divider = chatMessages.querySelector('.chat__date-divider');
  chatMessages.innerHTML = '';
  if (divider) chatMessages.appendChild(divider);

  let lastSender = null;

  msgs.forEach((msg, i) => {
    const isOut = msg.sender === me.nick;
    const isLast = i === msgs.length - 1 || msgs[i + 1]?.sender !== msg.sender;
    const el = createMessageEl(msg, isOut, isLast, otherNick);
    el.style.animationDelay = '0ms';
    chatMessages.appendChild(el);
    lastSender = msg.sender;
  });

  scrollToBottom(chatMessages, false);
}

function createMessageEl(msg, isOut, isTail, otherNick) {
  const el = document.createElement('div');
  el.className = `msg ${isOut ? 'msg--out' : 'msg--in'}${isTail ? ' msg--tail' : ''}`;
  el.dataset.id = msg.id;

  const avatarHtml = !isOut ? `
    <div class="msg__avatar ${avatarColor(otherNick)}">
      ${avatarInitials(otherNick)}
    </div>
  ` : '';

  const statusHtml = isOut ? `
    <div class="msg__status msg__status--sent">
      <svg viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
      </svg>
    </div>
  ` : '';

  el.innerHTML = `
    ${avatarHtml}
    <div class="msg__bubble">
      <div class="msg__text">${escapeHtml(msg.text)}</div>
      <div class="msg__meta">
        <span class="msg__time">${formatTime(msg.time)}</span>
        ${statusHtml}
      </div>
    </div>
  `;

  return el;
}

/* ========================
   SEND MESSAGE
======================== */
async function handleSend() {
  const text = messageInput.value.trim();
  if (!text || !activeChatId) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  animateSend(sendBtn);

  // Stop typing
  if (typingTimer) clearTimeout(typingTimer);
  setTyping(activeChatId, me.nick, false);

  try {
    await sendMessage(activeChatId, me.nick, text);
  } catch (err) {
    showToast('Ошибка отправки', 'error');
  }
}

sendBtn.addEventListener('click', handleSend);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

messageInput.addEventListener('input', () => {
  autoResize(messageInput);

  if (!activeChatId) return;
  setTyping(activeChatId, me.nick, true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    setTyping(activeChatId, me.nick, false);
  }, 2000);
});

/* ========================
   SEARCH
======================== */
searchInput.addEventListener('input', () => {
  renderFilteredChats(searchInput.value.trim().toLowerCase());
});

/* ========================
   MENU
======================== */
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !dropdownMenu.classList.contains('hidden');
  dropdownMenu.classList.toggle('hidden', open);
  menuBtn.classList.toggle('open', !open);
});

document.addEventListener('click', (e) => {
  if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
    dropdownMenu.classList.add('hidden');
    menuBtn.classList.remove('open');
  }
});

/* ========================
   NEW CHAT
======================== */
newChatBtn.addEventListener('click', () => {
  dropdownMenu.classList.add('hidden');
  menuBtn.classList.remove('open');
  newChatModal.classList.remove('hidden');
  newChatNick.value = '';
  hideError(newChatError);
  setTimeout(() => newChatNick.focus(), 100);
});

function closeNewChatModal() {
  newChatModal.classList.add('hidden');
}

cancelNewChat.addEventListener('click', closeNewChatModal);
closeNewChat.addEventListener('click', closeNewChatModal);
newChatModal.addEventListener('click', (e) => {
  if (e.target === newChatModal) closeNewChatModal();
});

confirmNewChat.addEventListener('click', async (e) => {
  addRipple(confirmNewChat, e);
  const nick = newChatNick.value.trim().toLowerCase();
  if (!nick) {
    showError(newChatError, newChatErrorMsg, 'Введите никнейм');
    return;
  }
  if (nick === me.nick) {
    showError(newChatError, newChatErrorMsg, 'Нельзя написать самому себе');
    return;
  }
  setLoading(confirmNewChat, true);
  hideError(newChatError);
  try {
    await findUser(nick);
    const chatId = await getOrCreateChat(me.nick, nick);
    closeNewChatModal();
    await openChat(chatId, nick);
  } catch (err) {
    showError(newChatError, newChatErrorMsg, err.message);
  } finally {
    setLoading(confirmNewChat, false);
  }
});

newChatNick.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmNewChat.click();
});

/* ========================
   PROFILE
======================== */
profileBtn.addEventListener('click', async () => {
  dropdownMenu.classList.add('hidden');
  menuBtn.classList.remove('open');
  profilePanel.classList.remove('hidden');

  const color = avatarColor(me.nick);
  profileAvatar.className = `profile-avatar ${color}`;
  profileAvatar.textContent = avatarInitials(me.nick);
  profileName.textContent = me.nick;
  profileNickEl.textContent = `@${me.nick}`;

  statChats.textContent = allChats.length;
  const msgCount = await countUserMessages(me.nick);
  statMessages.textContent = msgCount;
});

closeProfile.addEventListener('click', () => {
  profilePanel.classList.add('hidden');
});

/* ========================
   LOGOUT
======================== */
logoutBtn.addEventListener('click', async () => {
  dropdownMenu.classList.add('hidden');
  menuBtn.classList.remove('open');
  if (unlistenMessages) unlistenMessages();
  if (unlistenTyping)   unlistenTyping();
  if (unlistenOnline)   unlistenOnline();
  if (unlistenChats)    unlistenChats();
  await logout();
  activeChatId = null;
  activeChatNick = null;
  showAuth();
});

/* ========================
   BACK BUTTON (Mobile)
======================== */
backBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden-mobile');
  chatActive.classList.add('hidden');
  chatEmpty.classList.remove('hidden');
  if (unlistenMessages) unlistenMessages();
  if (unlistenTyping) unlistenTyping();
  if (unlistenOnline) unlistenOnline();
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  activeChatId = null;
});

/* ========================
   RIPPLE ON BUTTONS
======================== */
document.querySelectorAll('.btn--primary').forEach(btn => {
  btn.addEventListener('click', (e) => addRipple(btn, e));
});

/* ========================
   HELPERS
======================== */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
