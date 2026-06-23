# Hafland X

**Hafland X** — защищённый мессенджер нового поколения на Firebase Realtime Database.

---

## Правовая информация

**Продукт:** Hafland X  
**Правообладатель:** Hafa Studio  
**Разработчик:** Володин Владислав Вадимович  
**Версия:** 1.0  
**Год:** 2025  

Все права на программное обеспечение, дизайн и торговые марки принадлежат Hafa Studio.  
Несанкционированное копирование, распространение или модификация продукта запрещены.

---

## Быстрый старт

### 1. Создайте проект в Firebase

1. Перейдите на [console.firebase.google.com](https://console.firebase.google.com)
2. Нажмите **Add project** → введите название → создайте
3. В меню слева: **Build → Realtime Database → Create database**
4. Выберите регион, установите правила как **test mode**
5. **Project Settings (шестерёнка) → General → Your apps → Web** → зарегистрируйте приложение
6. Скопируйте объект `firebaseConfig`

### 2. Вставьте ключи

Откройте файл **`js/firebase-config.js`** и замените значения:

```js
const firebaseConfig = {
  apiKey:            "ВАШ_API_KEY",
  authDomain:        "ВАШ_PROJECT_ID.firebaseapp.com",
  databaseURL:       "https://ВАШ_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId:         "ВАШ_PROJECT_ID",
  storageBucket:     "ВАШ_PROJECT_ID.appspot.com",
  messagingSenderId: "ВАШ_SENDER_ID",
  appId:             "ВАШ_APP_ID"
};
```

### 3. Правила базы данных

В Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$nick": {
        ".read": "auth == null || true",
        ".write": "auth == null || true"
      }
    },
    "chats": {
      ".read": true,
      ".write": true
    },
    "messages": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 4. Деплой на GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/ВАШ_РЕПО.git
git push -u origin main
```

Затем в настройках репозитория: **Settings → Pages → Source: main / root**.

---

## Структура проекта

```
hafland-x/
├── index.html
├── README.md
├── css/
│   ├── main.css          # Основные стили + брендинг Hafland X
│   └── animations.css    # Анимации
└── js/
    ├── firebase-config.js  # <-- ВСТАВИТЬ КЛЮЧИ СЮДА
    ├── auth.js             # Регистрация / вход / выход
    ├── chat.js             # Работа с сообщениями Firebase
    ├── ui.js               # UI-утилиты
    └── app.js              # Главный контроллер
```

## Функционал

- Регистрация и вход по никнейму + паролю
- Список чатов с реалтайм обновлением
- Отправка и получение сообщений (Firebase Realtime DB)
- Индикатор набора текста
- Статус онлайн/оффлайн
- Поиск по чатам
- Профиль со статистикой
- Полная адаптивность (мобильный)
- Тёмная тема
- Анимации

---

*Hafland X — продукт Hafa Studio. Разработчик: Володин Владислав Вадимович.*
