import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, BookOpen, Brain, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, XCircle, Trophy, Map as MapIcon, BookMarked, GraduationCap, Sparkles, ChevronDown, ChevronUp, Lock, Unlock, Grid, Heart, AlertCircle, Zap, Timer } from 'lucide-react';

// --- HAPTIC UTILITY ---
const vibrate = (type = 'tap') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'tap') navigator.vibrate(10);
      else if (type === 'correct') navigator.vibrate([15, 30, 15]);
      else if (type === 'incorrect') navigator.vibrate([30, 50, 30]);
      else if (type === 'win') navigator.vibrate([20, 50, 20, 50, 20]);
      else if (type === 'fail') navigator.vibrate([50, 100, 50]);
    } catch (e) {
      console.log("Vibration failed:", e);
    }
  }
};

// --- AUDIO UTILITY ---
const playSound = (type) => {
  vibrate(type);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'incorrect') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'high-score') {
      osc.type = 'square';
      
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.45);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);

      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    }
  } catch (e) {
    console.log("Audio play failed:", e);
  }
};

// --- DATA & LEVELS ---
const LEVELS = [
  {
    id: 1,
    title: 'The Absolute Basics',
    subtitle: 'Greetings & Politeness',
    icon: '👋',
    vocab: [
      { id: 1, thai: 'สวัสดี', phonetic: 'sà-wàt-dee', eng: 'Hello', emoji: '👋', tone: 'Low, Low, Mid tone', usage: 'A universal greeting used at any time of day for hello or goodbye.' },
      { id: 2, thai: 'ขอบคุณ', phonetic: 'kòp-kun', eng: 'Thank you', emoji: '🙏', tone: 'Low, Mid tone', usage: 'The standard, polite way to express gratitude.' },
      { id: 3, thai: 'ดี', phonetic: 'dee', eng: 'Good', emoji: '👍', tone: 'Mid tone', usage: 'An adjective meaning good, fine, or well.' },
      { id: 4, thai: 'มาก', phonetic: 'mâak', eng: 'Very', emoji: '✨', tone: 'Falling tone', usage: 'Placed AFTER an adjective to amplify it (e.g., Good Very).' },
      { id: 5, thai: 'ใช่', phonetic: 'châi', eng: 'Yes / Correct', emoji: '✅', tone: 'Falling tone', usage: 'Used to confirm something is correct or say "yes".' },
      { id: 6, thai: 'ไม่', phonetic: 'mâi', eng: 'No / Not', emoji: '❌', tone: 'Falling tone', usage: 'Placed before adjectives or verbs to negate them.' },
    ],
    sentences: [
      { eng: "Hello, thank you.", thai: ["สวัสดี", "ขอบคุณ"] },
      { eng: "Very good.", thai: ["ดี", "มาก"] },
      { eng: "Yes, very good.", thai: ["ใช่", "ดี", "มาก"] },
      { eng: "No, thank you.", thai: ["ไม่", "ขอบคุณ"] },
      { eng: "Not good.", thai: ["ไม่", "ดี"] },
      { eng: "Hello, good.", thai: ["สวัสดี", "ดี"] }
    ]
  },
  {
    id: 2,
    title: 'Getting to Know You',
    subtitle: 'Pronouns & Names',
    icon: '🤝',
    vocab: [
      { id: 201, thai: 'ผม', phonetic: 'pǒm', eng: 'I (male)', emoji: '👨', tone: 'Rising tone', usage: 'The polite pronoun used by males to refer to themselves.' },
      { id: 202, thai: 'ฉัน', phonetic: 'chǎn', eng: 'I (female)', emoji: '👩', tone: 'Rising tone', usage: 'The polite pronoun used by females to refer to themselves.' },
      { id: 203, thai: 'คุณ', phonetic: 'kun', eng: 'You', emoji: '👉', tone: 'Mid tone', usage: 'A polite pronoun for "you", placed before names or used on its own.' },
      { id: 204, thai: 'ชื่อ', phonetic: 'chûe', eng: 'Name', emoji: '🏷️', tone: 'Falling tone', usage: 'Means "name" but also acts as the verb "to be named".' },
      { id: 205, thai: 'อะไร', phonetic: 'a-rai', eng: 'What', emoji: '🤷', tone: 'Low, Mid tone', usage: 'The question word for "what", usually placed at the very end of a sentence.' },
      { id: 206, thai: 'ยินดี', phonetic: 'yin-dee', eng: 'Glad/Pleased', emoji: '😊', tone: 'Mid, Mid tone', usage: 'Used to say you are glad or pleased (often to meet someone).' },
    ],
    sentences: [
      { eng: "Hello, what is your name?", thai: ["สวัสดี", "คุณ", "ชื่อ", "อะไร"] },
      { eng: "My name is... (Male)", thai: ["ผม", "ชื่อ"] },
      { eng: "My name is... (Female)", thai: ["ฉัน", "ชื่อ"] },
      { eng: "What is my name?", thai: ["ฉัน", "ชื่อ", "อะไร"] },
      { eng: "Glad, thank you.", thai: ["ยินดี", "ขอบคุณ"] },
      { eng: "You are very good.", thai: ["คุณ", "ดี", "มาก"] }
    ]
  },
  {
    id: 3,
    title: 'Origins',
    subtitle: 'Countries and Cities',
    icon: '🗺️',
    vocab: [
      { id: 301, thai: 'มาจาก', phonetic: 'maa jàak', eng: 'Come from', emoji: '🛫', tone: 'Mid, Low tone', usage: 'A compound of "maa" (to come) and "jàak" (from).' },
      { id: 302, thai: 'ประเทศ', phonetic: 'bprà-têet', eng: 'Country', emoji: '🗺️', tone: 'Low, Falling tone', usage: 'Always placed directly before the name of a country (e.g., bprà-têet tai).' },
      { id: 303, thai: 'เมือง', phonetic: 'mueang', eng: 'City', emoji: '🏙️', tone: 'Mid tone', usage: 'Means city or town, placed before the city name.' },
      { id: 304, thai: 'คน', phonetic: 'kon', eng: 'Person', emoji: '🧍', tone: 'Mid tone', usage: 'Placed before a country name to denote nationality (e.g., kon tai = Thai person).' },
      { id: 305, thai: 'ไทย', phonetic: 'tai', eng: 'Thai', emoji: '🇹🇭', tone: 'Mid tone', usage: 'Means Thai or Thailand. Translates literally to "free".' },
      { id: 306, thai: 'อังกฤษ', phonetic: 'ang-grìt', eng: 'England', emoji: '🇬🇧', tone: 'Mid, Low tone', usage: 'Refers to England or the English language/people.' },
      { id: 307, thai: 'ที่ไหน', phonetic: 'tîi-nǎi', eng: 'Where', emoji: '📍', tone: 'Falling, Rising tone', usage: 'The question word for "where", placed at the end of the sentence.' },
      { id: 308, thai: 'และ', phonetic: 'láe', eng: 'And', emoji: '➕', tone: 'High tone', usage: 'Conjunction used strictly to link nouns together, not verbs.' },
    ],
    sentences: [
      { eng: "Where do you come from?", thai: ["คุณ", "มาจาก", "ที่ไหน"] },
      { eng: "I come from Thailand. (Male)", thai: ["ผม", "มาจาก", "ประเทศ", "ไทย"] },
      { eng: "Thai person and English person.", thai: ["คน", "ไทย", "และ", "คน", "อังกฤษ"] },
      { eng: "I come from the city. (Female)", thai: ["ฉัน", "มาจาก", "เมือง"] },
      { eng: "What country do you come from?", thai: ["คุณ", "มาจาก", "ประเทศ", "อะไร"] },
      { eng: "Where is England?", thai: ["ประเทศ", "อังกฤษ", "ที่ไหน"] }
    ]
  },
  {
    id: 4,
    title: 'Food & Preferences',
    subtitle: 'To be, Eat, Like',
    icon: '🍲',
    vocab: [
      { id: 401, thai: 'เป็น', phonetic: 'bpen', eng: 'Is/Am/Are', emoji: '🔗', tone: 'Mid tone', usage: 'Used to link a noun to another noun, e.g., "I am a person".' },
      { id: 402, thai: 'อาหาร', phonetic: 'aa-hǎan', eng: 'Food', emoji: '🍲', tone: 'Mid, Rising tone', usage: 'Formal word for food, borrowed from ancient Sanskrit.' },
      { id: 403, thai: 'น้ำ', phonetic: 'náam', eng: 'Water', emoji: '💧', tone: 'High tone', usage: 'Means liquid/water. Placed before other words to name liquids.' },
      { id: 404, thai: 'อร่อย', phonetic: 'a-ròi', eng: 'Delicious', emoji: '😋', tone: 'Low, Low tone', usage: 'Placed directly after the noun it describes (e.g., food delicious).' },
      { id: 405, thai: 'กิน', phonetic: 'gin', eng: 'Eat/Drink', emoji: '🍽️', tone: 'Mid tone', usage: 'Means to consume. In Thai, this is used for BOTH eating food and drinking liquids!' },
      { id: 406, thai: 'ชอบ', phonetic: 'chôorb', eng: 'Like', emoji: '❤️', tone: 'Falling tone', usage: 'Placed before a noun or verb to indicate preference or favor.' },
    ],
    sentences: [
      { eng: "The food is very delicious.", thai: ["อาหาร", "อร่อย", "มาก"] },
      { eng: "I like to drink water. (Male)", thai: ["ผม", "ชอบ", "กิน", "น้ำ"] },
      { eng: "I am a Thai person. (Female)", thai: ["ฉัน", "เป็น", "คน", "ไทย"] },
      { eng: "You are not an English person.", thai: ["คุณ", "ไม่", "เป็น", "คน", "อังกฤษ"] },
      { eng: "I like food and water. (Male)", thai: ["ผม", "ชอบ", "อาหาร", "และ", "น้ำ"] },
      { eng: "Water is not delicious.", thai: ["น้ำ", "ไม่", "อร่อย"] }
    ]
  },
  {
    id: 5,
    title: 'Counting 1-5',
    subtitle: 'Numbers (Part 1)',
    icon: '1️⃣',
    vocab: [
      { id: 501, thai: 'หนึ่ง', phonetic: 'nùeng', eng: 'One', emoji: '1️⃣', tone: 'Low tone', usage: 'Root number one.' },
      { id: 502, thai: 'สอง', phonetic: 'sǒng', eng: 'Two', emoji: '2️⃣', tone: 'Rising tone', usage: 'Root number two.' },
      { id: 503, thai: 'สาม', phonetic: 'sǎam', eng: 'Three', emoji: '3️⃣', tone: 'Rising tone', usage: 'Root number three.' },
      { id: 504, thai: 'สี่', phonetic: 'sìi', eng: 'Four', emoji: '4️⃣', tone: 'Falling tone', usage: 'Root number four.' },
      { id: 505, thai: 'ห้า', phonetic: 'hâa', eng: 'Five', emoji: '5️⃣', tone: 'Falling tone', usage: 'Root number five.' },
    ],
    sentences: [
      { eng: "One, two, three.", thai: ["หนึ่ง", "สอง", "สาม"] },
      { eng: "Four and five.", thai: ["สี่", "และ", "ห้า"] },
      { eng: "One water and two foods.", thai: ["น้ำ", "หนึ่ง", "และ", "อาหาร", "สอง"] },
      { eng: "Three Thai people.", thai: ["คน", "ไทย", "สาม", "คน"] },
      { eng: "I eat four. (Female)", thai: ["ฉัน", "กิน", "สี่"] },
      { eng: "Five English people.", thai: ["คน", "อังกฤษ", "ห้า", "คน"] }
    ]
  },
  {
    id: 6,
    title: 'Counting 6-10',
    subtitle: 'Numbers (Part 2)',
    icon: '🔟',
    vocab: [
      { id: 601, thai: 'หก', phonetic: 'hòk', eng: 'Six', emoji: '6️⃣', tone: 'Low tone', usage: 'Root number six.' },
      { id: 602, thai: 'เจ็ด', phonetic: 'jèt', eng: 'Seven', emoji: '7️⃣', tone: 'Low tone', usage: 'Root number seven.' },
      { id: 603, thai: 'แปด', phonetic: 'bpàet', eng: 'Eight', emoji: '8️⃣', tone: 'Low tone', usage: 'Root number eight.' },
      { id: 604, thai: 'เก้า', phonetic: 'gâo', eng: 'Nine', emoji: '9️⃣', tone: 'Falling tone', usage: 'Root number nine.' },
      { id: 605, thai: 'สิบ', phonetic: 'sìp', eng: 'Ten', emoji: '🔟', tone: 'Low tone', usage: 'Root number ten.' },
    ],
    sentences: [
      { eng: "Six, seven, eight.", thai: ["หก", "เจ็ด", "แปด"] },
      { eng: "Nine and ten.", thai: ["เก้า", "และ", "สิบ"] },
      { eng: "I like seven. (Male)", thai: ["ผม", "ชอบ", "เจ็ด"] },
      { eng: "Nine waters and ten foods.", thai: ["น้ำ", "เก้า", "และ", "อาหาร", "สิบ"] },
      { eng: "Ten Thai people.", thai: ["คน", "ไทย", "สิบ", "คน"] },
      { eng: "I eat six. (Female)", thai: ["ฉัน", "กิน", "หก"] }
    ]
  },
  {
    id: 7,
    title: 'Shopping Essentials',
    subtitle: 'Prices and Basics',
    icon: '🛍️',
    vocab: [
      { id: 701, thai: 'ห้องน้ำ', phonetic: 'hông-náam', eng: 'Toilet', emoji: '🚽', tone: 'Falling, High tone', usage: 'The physical room for the toilet/restroom.' },
      { id: 702, thai: 'เท่าไหร่', phonetic: 'tâo-rài', eng: 'How much', emoji: '💰', tone: 'Falling, Low tone', usage: 'Question word for asking price or quantity.' },
      { id: 703, thai: 'บาท', phonetic: 'bàat', eng: 'Baht', emoji: '฿', tone: 'Low tone', usage: 'The official currency of Thailand.' },
      { id: 704, thai: 'เอา', phonetic: 'ao', eng: 'Want/Take', emoji: '🤲', tone: 'Mid tone', usage: 'Used to say "I want" or "I will take" when ordering.' },
      { id: 705, thai: 'อันนี้', phonetic: 'an-níi', eng: 'This one', emoji: '👇', tone: 'Mid, High tone', usage: 'Used to point out a specific item.' },
    ],
    sentences: [
      { eng: "How much is this one?", thai: ["อันนี้", "เท่าไหร่"] },
      { eng: "I want this one. (Female)", thai: ["ฉัน", "เอา", "อันนี้"] },
      { eng: "Ten baht.", thai: ["สิบ", "บาท"] },
      { eng: "Where is the toilet?", thai: ["ห้องน้ำ", "ที่ไหน"] },
      { eng: "I want water, how much? (Male)", thai: ["ผม", "เอา", "น้ำ", "เท่าไหร่"] },
      { eng: "Two foods, how much?", thai: ["อาหาร", "สอง", "เท่าไหร่"] }
    ]
  },
  {
    id: 8,
    title: 'Bargaining',
    subtitle: 'Getting a good deal',
    icon: '💸',
    vocab: [
      { id: 801, thai: 'แพง', phonetic: 'paeng', eng: 'Expensive', emoji: '📈', tone: 'Mid tone', usage: 'Means a price is too high.' },
      { id: 802, thai: 'ลด', phonetic: 'lót', eng: 'Discount', emoji: '📉', tone: 'High tone', usage: 'Means to reduce or discount the price.' },
      { id: 803, thai: 'หน่อย', phonetic: 'nòi', eng: 'A little / Please', emoji: '🤏', tone: 'Low tone', usage: 'Softens a request, making it sound more polite like "please".' },
      { id: 804, thai: 'ได้ไหม', phonetic: 'dâi mǎi', eng: 'Can you?', emoji: '🥺', tone: 'Falling, Rising tone', usage: 'Added to the end of a request to ask "Can you do this?".' },
      { id: 805, thai: 'มี', phonetic: 'mii', eng: 'Have', emoji: '✅', tone: 'Mid tone', usage: 'Indicates possession or existence.' },
      { id: 806, thai: 'ไหม', phonetic: 'mǎi', eng: 'Question (?)', emoji: '❓', tone: 'Rising tone', usage: 'Turns any statement into a Yes/No question.' },
    ],
    sentences: [
      { eng: "Very expensive, can you discount a little?", thai: ["แพง", "มาก", "ลด", "หน่อย", "ได้ไหม"] },
      { eng: "Do you have this one?", thai: ["มี", "อันนี้", "ไหม"] },
      { eng: "Is the food delicious?", thai: ["อาหาร", "อร่อย", "ไหม"] },
      { eng: "Do you have ten baht?", thai: ["มี", "สิบ", "บาท", "ไหม"] },
      { eng: "I don't have water. (Female)", thai: ["ฉัน", "ไม่", "มี", "น้ำ"] },
      { eng: "Can you discount?", thai: ["ลด", "ได้ไหม"] }
    ]
  },
  {
    id: 9,
    title: 'Questions & Verbs',
    subtitle: 'Who, why, go...',
    icon: '❓',
    vocab: [
      { id: 901, thai: 'ใคร', phonetic: 'krai', eng: 'Who', emoji: '👤', tone: 'Mid tone', usage: 'Can act as the subject (Who eats?) or object (Eat who?).' },
      { id: 902, thai: 'ทำไม', phonetic: 'tam-mai', eng: 'Why', emoji: '🤔', tone: 'Mid, Mid tone', usage: 'The question word for "why", usually placed at the start of a sentence.' },
      { id: 903, thai: 'อยู่', phonetic: 'yùu', eng: 'To live/be at', emoji: '🏠', tone: 'Low tone', usage: 'Indicates physical location. Literally "To be (somewhere)".' },
      { id: 904, thai: 'ไป', phonetic: 'bpai', eng: 'Go', emoji: '🚶', tone: 'Mid tone', usage: 'Means to go.' },
      { id: 905, thai: 'อยาก', phonetic: 'yàak', eng: 'Want to', emoji: '🤩', tone: 'Low tone', usage: 'Means to want to (do something), used BEFORE verbs.' },
    ],
    sentences: [
      { eng: "Who wants to go to Thailand?", thai: ["ใคร", "อยาก", "ไป", "ประเทศ", "ไทย"] },
      { eng: "Where do you live?", thai: ["คุณ", "อยู่", "ที่ไหน"] },
      { eng: "Why do you like this one?", thai: ["ทำไม", "คุณ", "ชอบ", "อันนี้"] },
      { eng: "I want to go to the toilet. (Male)", thai: ["ผม", "อยาก", "ไป", "ห้องน้ำ"] },
      { eng: "Why is it expensive?", thai: ["ทำไม", "แพง"] },
      { eng: "Who lives in the city?", thai: ["ใคร", "อยู่", "เมือง"] }
    ]
  },
  {
    id: 10,
    title: 'Nature',
    subtitle: 'Animals & the world',
    icon: '🐘',
    vocab: [
      { id: 1001, thai: 'แมว', phonetic: 'maew', eng: 'Cat', emoji: '🐈', tone: 'Mid tone', usage: 'Onomatopoeia - it sounds exactly like a meow!' },
      { id: 1002, thai: 'หมา', phonetic: 'mǎa', eng: 'Dog', emoji: '🐕', tone: 'Rising tone', usage: 'Informal root word for dog.' },
      { id: 1003, thai: 'ช้าง', phonetic: 'cháang', eng: 'Elephant', emoji: '🐘', tone: 'High tone', usage: 'Root word for elephant.' },
      { id: 1004, thai: 'นก', phonetic: 'nók', eng: 'Bird', emoji: '🐦', tone: 'High tone', usage: 'Root word for bird.' },
      { id: 1005, thai: 'ปลา', phonetic: 'plaa', eng: 'Fish', emoji: '🐟', tone: 'Mid tone', usage: 'Root word for fish.' },
      { id: 1006, thai: 'ทะเล', phonetic: 'tá-lay', eng: 'Sea / Ocean', emoji: '🌊', tone: 'High, Mid tone', usage: 'Root word for the sea.' },
      { id: 1007, thai: 'ใหญ่', phonetic: 'yài', eng: 'Big', emoji: '⛰️', tone: 'Low tone', usage: 'An adjective that is always placed AFTER the noun it describes.' },
      { id: 1008, thai: 'เล็ก', phonetic: 'lék', eng: 'Small', emoji: '🐜', tone: 'High tone', usage: 'An adjective that is always placed AFTER the noun it describes.' },
    ],
    sentences: [
      { eng: "A cat is not a dog.", thai: ["แมว", "ไม่", "เป็น", "หมา"] },
      { eng: "I want to go to the sea. (Female)", thai: ["ฉัน", "อยาก", "ไป", "ทะเล"] },
      { eng: "The big elephant is in the city.", thai: ["ช้าง", "ใหญ่", "อยู่", "เมือง"] },
      { eng: "Do you have a small dog?", thai: ["คุณ", "มี", "หมา", "เล็ก", "ไหม"] },
      { eng: "Why do birds like to eat fish?", thai: ["ทำไม", "นก", "ชอบ", "กิน", "ปลา"] },
      { eng: "Big sea and small fish.", thai: ["ทะเล", "ใหญ่", "และ", "ปลา", "เล็ก"] }
    ]
  }
];

const ALL_VOCAB = LEVELS.flatMap(l => l.vocab);
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

// --- CSS ---
const customStyles = `
  body { overscroll-behavior-y: none; }
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  @keyframes confettiFall {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;

const getPhonetic = (thaiWord) => {
  const wordData = ALL_VOCAB.find(v => v.thai === thaiWord);
  return wordData ? wordData.phonetic : '';
};

// --- MAIN VIEWS ---

const JourneyMap = ({ unlockedLevelId, onSelectLevel }) => {
  return (
    <div className="py-12 px-6 space-y-8 flex flex-col items-center relative min-h-full overflow-x-hidden">
      <div className="text-center mb-8 z-10 w-full">
        <h1 className="text-3xl font-light tracking-tight text-slate-800 mb-2">Your Path</h1>
        <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Unlock new levels</p>
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center pb-12">
         <div className="absolute top-12 bottom-12 w-0.5 bg-slate-200 left-1/2 transform -translate-x-1/2 z-0"></div>

         {LEVELS.map((lvl, idx) => {
           const isUnlocked = lvl.id <= unlockedLevelId;
           const isCurrent = lvl.id === unlockedLevelId;
           const offset = idx % 2 === 0 ? '-translate-x-12' : 'translate-x-12';
           const tooltipPos = idx % 2 === 0 ? 'left-[calc(50%+4rem)]' : 'right-[calc(50%+4rem)]';
           
           return (
             <div key={lvl.id} className={`relative z-10 w-full flex justify-center mb-12 ${offset}`}>
                <button 
                  disabled={!isUnlocked}
                  onClick={() => { vibrate('tap'); onSelectLevel(lvl.id); }}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 z-10
                    ${isUnlocked 
                      ? 'bg-slate-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                    }
                    ${isCurrent ? 'ring-4 ring-slate-900/10 scale-105' : ''}
                  `}
                >
                  {isUnlocked ? lvl.icon : <Lock size={28} className="text-slate-300" />}
                </button>
                
                <div className={`absolute top-1/2 -translate-y-1/2 ${tooltipPos} bg-white px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-slate-100 min-w-[160px]`}>
                   <p className={`font-semibold text-sm ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>{lvl.title}</p>
                   <p className="text-[11px] text-slate-500 mt-1">{lvl.subtitle}</p>
                   {isCurrent && <div className="mt-2 text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1"><Sparkles size={10}/> Next Up</div>}
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};

const StudyHub = ({ level, unlockedLevelId, onSelectMode }) => {
  const isCompleted = level.id < unlockedLevelId;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 animation-fade-in pb-20 sm:pb-24">
      <div className="w-full max-w-sm flex flex-col h-full justify-center gap-3 sm:gap-5">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center w-full mb-1 shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center text-3xl sm:text-4xl border border-slate-200 mb-3 sm:mb-4">
            {level.icon}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">{level.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Level {level.id} • {level.vocab.length} Words</p>
        </div>

        <div className="space-y-2 sm:space-y-3 shrink">
           <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2">Study Plan</h3>
           
           {/* Step 1: Interactive Lesson */}
           <button onClick={() => { vibrate('tap'); onSelectMode('lesson'); }} className="w-full bg-slate-800 text-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-md active:scale-95 transition-all flex items-center justify-between group">
             <div className="flex items-center gap-3 sm:gap-4">
               <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform"><GraduationCap size={22} className="sm:w-6 sm:h-6" /></div>
               <div className="text-left">
                 <span className="block text-base sm:text-lg font-bold">Interactive Lesson</span>
                 <span className="block text-[10px] sm:text-xs font-medium text-slate-300 mt-0.5">Learn words & tones</span>
               </div>
             </div>
             <ArrowRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
           </button>

           {/* Step 2: Quiz (Full Width) */}
           <button onClick={() => { vibrate('tap'); onSelectMode('quiz'); }} className="w-full bg-slate-700 text-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] shadow-md active:scale-95 transition-all flex items-center justify-between group">
             <div className="flex items-center gap-3 sm:gap-4">
               <div className="bg-white/10 p-3 rounded-2xl group-hover:scale-110 transition-transform"><Brain size={22} className="sm:w-6 sm:h-6" /></div>
               <div className="text-left">
                 <span className="block text-base sm:text-lg font-bold">Quick Quiz</span>
                 <span className="block text-[10px] sm:text-xs font-medium text-slate-300 mt-0.5">Test your memory</span>
               </div>
             </div>
             <ArrowRight size={20} className="text-slate-400 group-hover:text-white transition-colors" />
           </button>

           {/* Step 3: Practice Minigames (Cards & Match) */}
           <div className="grid grid-cols-2 gap-2 sm:gap-3">
             <button onClick={() => { vibrate('tap'); onSelectMode('flashcards'); }} className="bg-slate-600 text-white p-3 sm:p-4 rounded-[1.25rem] shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-slate-500">
               <BookOpen size={22} className="text-white/90 sm:w-6 sm:h-6" />
               <span className="font-bold text-[10px] sm:text-[11px] uppercase tracking-widest mt-1">Cards</span>
             </button>
             <button onClick={() => { vibrate('tap'); onSelectMode('match'); }} className="bg-slate-600 text-white p-3 sm:p-4 rounded-[1.25rem] shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-slate-500">
               <Grid size={22} className="text-white/90 sm:w-6 sm:h-6" />
               <span className="font-bold text-[10px] sm:text-[11px] uppercase tracking-widest mt-1">Match</span>
             </button>
           </div>
        </div>

        {/* Step 4: Level Test */}
        <div className="pt-1 sm:pt-2 shrink-0">
           <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 sm:mb-3">Final Challenge</h3>
           <button 
             onClick={() => { vibrate('tap'); onSelectMode('level-test'); }} 
             className={`w-full p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all active:scale-95 flex items-center justify-between group
               ${isCompleted ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white shadow-lg hover:bg-black'}
             `}
           >
             <div className="flex items-center gap-3 sm:gap-4">
               <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${isCompleted ? 'bg-white shadow-sm' : 'bg-white/10'}`}>
                 {isCompleted ? <CheckCircle2 size={22} className="text-slate-600 sm:w-6 sm:h-6"/> : <Unlock size={22} className="sm:w-6 sm:h-6" />}
               </div>
               <div className="text-left">
                 <span className="block text-base sm:text-lg font-bold">Level Test</span>
                 <span className={`block text-[10px] sm:text-xs font-medium mt-0.5 ${isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>Pass to unlock next level</span>
               </div>
             </div>
             <ArrowRight size={20} className={isCompleted ? "text-slate-400" : "text-slate-400 group-hover:text-white"} />
           </button>
        </div>

      </div>
    </div>
  );
};

const Dictionary = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const toggleSection = (id) => { vibrate('tap'); setExpandedSection(prev => prev === id ? null : id); };

  return (
    <div className="p-6 pb-8 max-w-md mx-auto">
       <h1 className="text-3xl font-light tracking-tight text-slate-800 mb-8 text-center pt-4">Vocabulary</h1>
       <div className="space-y-4">
         {LEVELS.map(lvl => {
            const isExpanded = expandedSection === lvl.id;
            return (
              <div key={lvl.id} className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden transition-all">
                <button 
                  onClick={() => toggleSection(lvl.id)}
                  className={`w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl bg-white shadow-sm w-12 h-12 flex items-center justify-center rounded-full border border-slate-100">{lvl.icon}</span>
                    <div>
                      <h2 className="font-semibold text-slate-800 text-lg">{lvl.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{lvl.vocab.length} words</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="animation-fade-in divide-y divide-slate-50 bg-white">
                    {lvl.vocab.map((word) => (
                        <div key={word.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-4">
                              <span className="text-2xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-[1rem] border border-slate-100">{word.emoji}</span>
                              <div>
                                <div className="font-semibold text-lg text-slate-800">{word.thai}</div>
                                <div className="text-xs text-slate-400 mt-1 font-medium">{word.phonetic}</div>
                              </div>
                          </div>
                          <div className="font-medium text-slate-600 text-right text-sm">{word.eng}</div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )
         })}
       </div>
    </div>
  )
}

// --- STANDALONE GAMES (PRACTICE) ---

const Lesson = ({ vocab, onBack }) => {
  const [phase, setPhase] = useState('learn'); 
  const [step, setStep] = useState(0);

  const [gameScore, setGameScore] = useState(0);
  const [currentG, setCurrentG] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const generateGameQuestion = useCallback(() => {
    const word = vocab[Math.floor(Math.random() * vocab.length)];
    let isMatch = Math.random() > 0.5;
    let displayEng = word.eng;
    
    if (!isMatch) {
       const others = vocab.filter(v => v.id !== word.id);
       if (others.length > 0) {
         displayEng = others[Math.floor(Math.random() * others.length)].eng;
       } else {
         isMatch = true; 
       }
    }
    setCurrentG({ word, displayEng, isMatch });
  }, [vocab]);

  useEffect(() => {
    if (phase === 'game' && !currentG) generateGameQuestion();
  }, [phase, currentG, generateGameQuestion]);

  const handleGameGuess = (guessTrue) => {
    if (feedback) return;
    if (guessTrue === currentG.isMatch) {
      setFeedback('correct');
      playSound('correct');
      setTimeout(() => {
         setFeedback(null);
         const newScore = gameScore + 1;
         setGameScore(newScore);
         if (newScore >= 5) { 
            playSound('win');
            setPhase('complete');
         } else {
            generateGameQuestion();
         }
      }, 600);
    } else {
      setFeedback('incorrect');
      playSound('incorrect');
      setTimeout(() => {
         setFeedback(null);
         generateGameQuestion(); 
      }, 800);
    }
  };

  const handleNextLearn = () => {
    vibrate('tap');
    if (step < vocab.length - 1) {
      setStep(s => s + 1);
    } else {
      setPhase('game');
    }
  };

  const handlePrevLearn = () => {
    vibrate('tap');
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  if (phase === 'complete') {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 text-center absolute inset-0 z-40 animation-fade-in pb-28 sm:pb-28">
        <Sparkles size={60} className="text-slate-800 mb-6" />
        <h2 className="text-3xl font-light tracking-tight text-slate-800 mb-2">Lesson Complete</h2>
        <p className="text-slate-500 mb-10">You've reviewed all the words and passed the speed check!</p>
        <button onClick={() => { vibrate('tap'); onBack(); }} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
          Back to Study Hub
        </button>
      </div>
    );
  }

  if (phase === 'game' && currentG) {
    let containerClass = "bg-white border-slate-100";
    if (feedback === 'correct') containerClass = "bg-green-50 border-green-200";
    if (feedback === 'incorrect') containerClass = "bg-red-50 border-red-200 animate-pulse";

    return (
      <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40 animation-fade-in">
        <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shrink-0 z-20">
          <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft size={24} /></button>
          <div className="flex space-x-1.5 flex-1 mx-4 justify-center">
            {[0,1,2,3,4].map((i) => (
               <div key={i} className={`h-1.5 flex-1 max-w-[20px] rounded-full transition-colors ${i < gameScore ? 'bg-green-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <Zap size={20} className="text-amber-500 fill-amber-500" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto overflow-hidden pb-28 sm:pb-28">
          <div className="mb-4 text-center shrink-0">
             <h3 className="text-xl font-light text-slate-800">Speed Check</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Does this match?</p>
          </div>

          <div className={`w-full rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 p-8 flex flex-col items-center text-center transition-colors duration-300 shrink-0 ${containerClass}`}>
            <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentG.word.thai}</h2>
            <p className="text-lg text-slate-500 font-medium mb-6">"{currentG.word.phonetic}"</p>
            
            <div className="w-12 h-px bg-slate-200 mb-6"></div>
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Means</p>
            <h3 className="text-3xl font-light text-slate-800">{currentG.displayEng}</h3>
          </div>

          <div className="mt-8 w-full flex gap-4 shrink-0">
            <button 
              onClick={() => handleGameGuess(false)} 
              disabled={feedback !== null}
              className="flex-1 bg-white text-red-500 border border-slate-200 p-5 rounded-[1.5rem] font-semibold text-lg active:scale-95 transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              <XCircle size={20} /> False
            </button>
            <button 
              onClick={() => handleGameGuess(true)} 
              disabled={feedback !== null}
              className="flex-1 bg-slate-900 text-white p-5 rounded-[1.5rem] font-semibold text-lg active:scale-95 transition-all flex justify-center items-center gap-2 shadow-sm"
            >
              <CheckCircle2 size={20} /> True
            </button>
          </div>
        </div>
      </div>
    );
  }

  const word = vocab[step];

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40 animation-fade-in overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shrink-0 z-20">
        <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft size={24} /></button>
        <div className="flex space-x-2 flex-1 mx-6 justify-center">
          {vocab.map((_, i) => (
             <div key={i} className={`h-1 flex-1 max-w-[20px] rounded-full transition-colors ${i <= step ? 'bg-slate-800' : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className="font-semibold text-slate-500 text-sm">{step + 1}/{vocab.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-6 pb-28 sm:pb-28 w-full max-w-sm mx-auto overflow-y-auto hide-scrollbar">
        
        <div className="w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col items-center text-center z-10 shrink-0 my-auto">
          <div className="text-6xl mb-8 bg-slate-50 w-24 h-24 flex items-center justify-center rounded-full border border-slate-100 shrink-0">{word.emoji}</div>
          
          <h2 className="text-5xl font-bold text-slate-900 mb-3">{word.thai}</h2>
          <p className="text-lg text-slate-500 font-medium mb-8">"{word.phonetic}"</p>
          
          <div className="w-12 h-px bg-slate-200 mb-8 shrink-0"></div>
          
          <h3 className="text-2xl font-light text-slate-800 mb-8">{word.eng}</h3>
          
          <div className="w-full space-y-3">
            <div className="w-full bg-slate-50 rounded-[1rem] p-4 text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                Usage
              </p>
              <p className="text-sm font-medium text-slate-700">
                {word.usage}
              </p>
            </div>
            <div className="w-full bg-indigo-50/50 border border-indigo-50 rounded-[1rem] p-4 text-left">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                Tone
              </p>
              <p className="text-sm font-medium text-indigo-900">
                {word.tone}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-between items-center mt-6 pt-2 shrink-0">
          <button 
            onClick={handlePrevLearn} 
            disabled={step === 0} 
            className={`px-5 py-4 rounded-[1.25rem] font-bold flex items-center gap-2 transition-all ${step === 0 ? 'opacity-30' : 'bg-white text-slate-700 shadow-sm border border-slate-200 active:scale-95'}`}
          >
            <ArrowLeft size={20} /> Back
          </button>
          
          <button 
            onClick={handleNextLearn} 
            className="px-6 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2"
          >
            {step < vocab.length - 1 ? 'Next' : 'Take Test'} <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

const Flashcards = ({ vocab, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const word = vocab[currentIndex];

  const handleNext = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % vocab.length), 150); };
  const handlePrev = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + vocab.length) % vocab.length), 150); };

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
        <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <span className="font-semibold text-slate-600 text-sm">Card {currentIndex + 1} / {vocab.length}</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-28 sm:pb-28 perspective-1000 overflow-y-auto hide-scrollbar">
        <div onClick={() => { vibrate('tap'); setIsFlipped(!isFlipped); }} className={`relative w-full max-w-sm h-[24rem] shrink-0 cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col items-center justify-center p-8 backface-hidden">
            <span className="text-6xl mb-8">{word.emoji}</span>
            <h2 className="text-5xl font-bold text-slate-900 mb-4 text-center">{word.thai}</h2>
            <p className="text-lg text-slate-400">"{word.phonetic}"</p>
          </div>
          <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 text-white">
            <h2 className="text-3xl font-light text-center mb-8">{word.eng}</h2>
            <div className="w-full bg-white/10 rounded-[1rem] p-4 text-left border border-white/5 space-y-3">
               <div>
                 <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Usage</p>
                 <p className="text-sm font-medium text-slate-200 leading-tight">{word.usage}</p>
               </div>
               <div className="border-t border-white/10 pt-3">
                 <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Tone</p>
                 <p className="text-sm font-medium text-slate-200 leading-tight">{word.tone}</p>
               </div>
            </div>
            <p className="absolute bottom-6 text-xs text-slate-500 uppercase tracking-widest">Tap to flip</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 mt-12 shrink-0">
          <button onClick={() => { vibrate('tap'); handlePrev(); }} className="bg-white p-4 rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"><ArrowLeft size={24} /></button>
          <button onClick={() => { vibrate('tap'); handleNext(); }} className="bg-white p-4 rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"><ArrowRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

const Quiz = ({ vocab, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const numQ = Math.min(vocab.length, 10);
    const generated = shuffleArray(vocab).slice(0, numQ).map(target => ({
      target,
      options: shuffleArray([target, ...shuffleArray(ALL_VOCAB.filter(w => w.id !== target.id)).slice(0, 3)])
    }));
    setQuestions(generated);
  }, [vocab]);

  const handleAnswer = (option) => {
    if (selectedAnswer) return;
    vibrate('tap');
    setSelectedAnswer(option);
    const isCorrect = option.id === questions[currentQIndex].target.id;
    if (isCorrect) { setScore(s => s + 1); playSound('correct'); } else playSound('incorrect');
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) { setCurrentQIndex(prev => prev + 1); setSelectedAnswer(null); } 
      else { playSound('win'); setIsGameOver(true); }
    }, 1200);
  };

  if (questions.length === 0) return null;

  if (isGameOver) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 pb-28 sm:pb-28 text-center absolute inset-0 z-40">
        <Trophy size={60} className="text-slate-800 mb-6" />
        <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-2">Quiz Complete</h2>
        <p className="text-slate-500 mb-10">Score: {score} / {questions.length}</p>
        <button onClick={() => { vibrate('tap'); onBack(); }} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">Back to Study Hub</button>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
         <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <div className="flex space-x-1.5 flex-1 mx-4 justify-center">
          {questions.map((_, i) => <div key={i} className={`h-1 flex-1 max-w-[15px] rounded-full ${i < currentQIndex ? 'bg-slate-800' : i === currentQIndex ? 'bg-slate-400' : 'bg-slate-200'}`} />)}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 pt-12 pb-28 sm:pb-28 overflow-y-auto hide-scrollbar">
        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center mb-8 shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Translate</p>
          <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentQ.target.thai}</h2>
          <p className="text-lg text-slate-500">"{currentQ.target.phonetic}"</p>
        </div>

        <div className="w-full max-w-sm space-y-3 shrink-0">
          {currentQ.options.map((opt) => {
            let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm";
            let Icon = null;
            if (selectedAnswer) {
              if (opt.id === currentQ.target.id) { btnClass = "bg-slate-900 border-slate-900 text-white scale-[1.02]"; Icon = <CheckCircle2 size={20} />; }
              else if (selectedAnswer.id === opt.id) { btnClass = "bg-red-50 border-red-200 text-red-700"; Icon = <XCircle size={20} />; }
              else { btnClass = "bg-white border-slate-100 text-slate-300 opacity-50"; }
            }
            return (
              <button key={opt.id} onClick={() => handleAnswer(opt)} disabled={selectedAnswer !== null} className={`w-full p-5 rounded-[1.5rem] font-semibold transition-all flex items-center justify-between ${btnClass}`}>
                <span>{opt.eng}</span>{Icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MatchGame = ({ vocab, onBack }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    let pool = shuffleArray([...vocab]);
    if (pool.length < 6) pool = [...pool, ...shuffleArray(ALL_VOCAB.filter(v => !pool.find(s => s.id === v.id)))].slice(0, 6);
    else pool = pool.slice(0, 6);
    
    const initial = pool.flatMap(w => [
      { id: `t-${w.id}`, pair: w.id, text: w.thai, sub: w.phonetic, type: 't', flip: false, match: false },
      { id: `e-${w.id}`, pair: w.id, text: w.eng, sub: w.emoji, type: 'e', flip: false, match: false }
    ]);
    setCards(shuffleArray(initial));
    setFlipped([]); setMatched(0); setMoves(0);
  }, [vocab]);

  const handleCardClick = (i) => {
    if (flipped.length === 2 || cards[i].flip || cards[i].match) return;
    vibrate('tap');
    const newC = [...cards]; newC[i].flip = true; setCards(newC);
    const newF = [...flipped, i]; setFlipped(newF);

    if (newF.length === 2) {
      setMoves(m => m + 1);
      if (newC[newF[0]].pair === newC[newF[1]].pair) {
        playSound('correct');
        setTimeout(() => {
          const mC = [...newC]; mC[newF[0]].match = true; mC[newF[1]].match = true;
          setCards(mC); setFlipped([]); setMatched(p => { if (p+1===6) playSound('win'); return p+1; });
        }, 500);
      } else {
        playSound('incorrect');
        setTimeout(() => {
          const uC = [...newC]; uC[newF[0]].flip = false; uC[newF[1]].flip = false;
          setCards(uC); setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40">
       <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shrink-0">
         <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <div className="font-semibold text-slate-600 text-sm">Moves: {moves}</div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-28 sm:pb-28 overflow-hidden w-full">
        {matched === 6 ? (
           <div className="text-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-sm shrink-0">
             <Trophy size={50} className="mx-auto text-slate-800 mb-4" />
             <h2 className="text-2xl font-light text-slate-900 mb-6">Completed in {moves} moves</h2>
             <button onClick={() => { vibrate('tap'); onBack(); }} className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-semibold active:scale-95">Done</button>
           </div>
        ) : (
          <div className="grid grid-cols-3 grid-rows-4 gap-2.5 w-full max-w-md h-full perspective-1000 my-auto">
            {cards.map((c, i) => (
              <div key={c.id} onClick={() => handleCardClick(i)} className={`relative w-full h-full cursor-pointer transition-transform duration-500 transform-style-3d ${c.flip || c.match ? 'rotate-y-180' : ''}`}>
                <div className={`absolute inset-0 w-full h-full bg-slate-800 rounded-[1rem] backface-hidden flex items-center justify-center ${c.match ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="text-white/20 text-2xl font-serif">🇹🇭</span>
                </div>
                <div className={`absolute inset-0 w-full h-full rounded-[1rem] shadow-sm backface-hidden rotate-y-180 flex flex-col items-center justify-center p-2 text-center border border-slate-200 overflow-hidden ${c.match ? 'bg-slate-100 opacity-50' : 'bg-white'}`}>
                  <span className={`font-bold ${c.type === 't' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'} text-slate-800 leading-tight mb-1`}>{c.text}</span>
                  <span className="text-[10px] text-slate-400 leading-none">{c.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- LEVEL TEST MINI-GAMES ---

const TestQuiz = ({ vocab, onIncorrect, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const generated = shuffleArray(vocab).slice(0, 4).map(target => ({
      target,
      options: shuffleArray([target, ...shuffleArray(ALL_VOCAB.filter(w => w.id !== target.id)).slice(0, 3)])
    }));
    setQuestions(generated);
  }, [vocab]);

  const handleAnswer = (option) => {
    if (selectedAnswer) return;
    vibrate('tap');
    setSelectedAnswer(option);
    
    const isCorrect = option.id === questions[currentQIndex].target.id;
    if (isCorrect) {
      playSound('correct');
      setTimeout(() => {
        if (currentQIndex < 3) {
          setCurrentQIndex(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          onComplete(); 
        }
      }, 1000);
    } else {
      onIncorrect(); 
      setTimeout(() => setSelectedAnswer(null), 1000);
    }
  };

  if (!questions.length) return null;
  const currentQ = questions[currentQIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-28 sm:pb-28 w-full max-w-sm mx-auto animation-fade-in overflow-y-auto hide-scrollbar">
      <div className="mb-4 text-center shrink-0">
        <h3 className="text-xl font-light text-slate-800">Phase 1: Translate</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentQIndex + 1} of 4</p>
      </div>

      <div className="bg-white w-full rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center mb-8 shrink-0">
        <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentQ.target.thai}</h2>
        <p className="text-lg text-slate-500">"{currentQ.target.phonetic}"</p>
      </div>

      <div className="w-full space-y-3 shrink-0">
        {currentQ.options.map((opt) => {
          let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm";
          if (selectedAnswer) {
            if (opt.id === currentQ.target.id) btnClass = "bg-green-500 border-green-500 text-white scale-[1.02]";
            else if (selectedAnswer.id === opt.id) btnClass = "bg-red-500 border-red-500 text-white";
            else btnClass = "bg-white border-slate-100 text-slate-300 opacity-50";
          }
          return (
            <button key={opt.id} onClick={() => handleAnswer(opt)} disabled={selectedAnswer !== null} className={`w-full p-4 rounded-[1.5rem] font-semibold transition-all flex items-center justify-center ${btnClass}`}>
              {opt.eng}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TestMatch = ({ vocab, onIncorrect, onComplete }) => {
  const [leftWords, setLeftWords] = useState([]);
  const [rightWords, setRightWords] = useState([]);
  const [leftSelected, setLeftSelected] = useState(null);
  const [rightSelected, setRightSelected] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [errorPair, setErrorPair] = useState(false);

  useEffect(() => {
    const pool = shuffleArray(vocab).slice(0, 4);
    setLeftWords(shuffleArray([...pool]));
    setRightWords(shuffleArray([...pool]));
  }, [vocab]);

  useEffect(() => {
    if (leftSelected && rightSelected) {
      if (leftSelected.id === rightSelected.id) {
        playSound('correct');
        setMatchedPairs(prev => [...prev, leftSelected.id]);
        setLeftSelected(null);
        setRightSelected(null);
        
        if (matchedPairs.length + 1 === 4) {
          setTimeout(onComplete, 1000);
        }
      } else {
        onIncorrect();
        setErrorPair(true);
        setTimeout(() => {
          setLeftSelected(null);
          setRightSelected(null);
          setErrorPair(false);
        }, 1000);
      }
    }
  }, [leftSelected, rightSelected]);

  if (!leftWords.length) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-28 sm:pb-28 w-full max-w-sm mx-auto animation-fade-in overflow-y-auto hide-scrollbar">
      <div className="mb-6 text-center shrink-0">
        <h3 className="text-xl font-light text-slate-800">Phase 2: Connect</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{matchedPairs.length} of 4</p>
      </div>

      <div className="flex w-full gap-4 shrink-0">
        <div className="flex-1 flex flex-col gap-3">
          {leftWords.map(word => {
            const isMatched = matchedPairs.includes(word.id);
            const isSelected = leftSelected?.id === word.id;
            let btnClass = "bg-white border-slate-200 text-slate-800 hover:border-slate-400";
            if (isMatched) btnClass = "bg-slate-100 border-slate-100 text-slate-300 opacity-50";
            else if (isSelected) {
               btnClass = errorPair ? "bg-red-500 border-red-500 text-white" : "bg-slate-800 border-slate-800 text-white scale-105";
            }
            return (
              <button key={`l-${word.id}`} disabled={isMatched || errorPair} onClick={() => { vibrate('tap'); setLeftSelected(word); }} className={`p-3 rounded-[1rem] border shadow-sm transition-all flex flex-col items-center justify-center ${btnClass}`}>
                <span className="font-bold text-lg leading-tight">{word.thai}</span>
                <span className={`text-[10px] font-normal mt-0.5 ${isSelected && !errorPair ? 'text-slate-300' : isMatched ? 'text-slate-300' : 'text-slate-400'}`}>
                  {word.phonetic}
                </span>
              </button>
            )
          })}
        </div>
        
        <div className="flex-1 flex flex-col gap-3">
          {rightWords.map(word => {
            const isMatched = matchedPairs.includes(word.id);
            const isSelected = rightSelected?.id === word.id;
            let btnClass = "bg-white border-slate-200 text-slate-800 hover:border-slate-400";
            if (isMatched) btnClass = "bg-slate-100 border-slate-100 text-slate-300 opacity-50";
            else if (isSelected) {
               btnClass = errorPair ? "bg-red-500 border-red-500 text-white" : "bg-slate-800 border-slate-800 text-white scale-105";
            }
            return (
              <button key={`r-${word.id}`} disabled={isMatched || errorPair} onClick={() => { vibrate('tap'); setRightSelected(word); }} className={`p-4 rounded-[1rem] border shadow-sm font-bold text-sm transition-all flex items-center justify-center ${btnClass}`}>
                {word.eng}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const TestSentenceBuilder = ({ level, onIncorrect, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [status, setStatus] = useState('playing'); 
  const [flashIndices, setFlashIndices] = useState([]); 

  const sentenceData = level.sentences[currentIdx];
  const expectedThai = sentenceData.thai;

  const wordBank = useMemo(() => {
    const distractors = shuffleArray(ALL_VOCAB.filter(v => !expectedThai.includes(v.thai))).slice(0, 3).map(v => v.thai);
    return shuffleArray([...expectedThai, ...distractors]);
  }, [currentIdx, expectedThai]);

  const handleSelectWord = (word) => {
    if (status !== 'playing') return;
    vibrate('tap');
    setSelectedWords([...selectedWords, word]);
  };

  const handleRemoveWord = (index) => {
    if (status !== 'playing') return;
    vibrate('tap');
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
  };

  const checkAnswer = () => {
    vibrate('tap');
    const isMatch = selectedWords.join('') === expectedThai.join('');
    if (isMatch) {
      setStatus('correct');
      playSound('correct');
      setTimeout(() => {
        if (currentIdx < level.sentences.length - 1) {
          setCurrentIdx(prev => prev + 1);
          setSelectedWords([]);
          setStatus('playing');
        } else {
          onComplete(); 
        }
      }, 1500);
    } else {
      onIncorrect(); 
      const correctPos = [];
      selectedWords.forEach((word, idx) => {
        if (word === expectedThai[idx]) correctPos.push(idx);
      });
      setFlashIndices(correctPos);
      setStatus('incorrect');

      setTimeout(() => {
        setSelectedWords([]);
        setFlashIndices([]);
        setStatus('playing');
      }, 2000); 
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 pb-28 sm:pb-28 max-w-md mx-auto w-full animation-fade-in overflow-y-auto hide-scrollbar">
      <div className="mb-4 text-center shrink-0">
        <h3 className="text-xl font-light text-slate-800">Phase 3: Build</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentIdx + 1} of 6</p>
      </div>

      <div className="mb-6 text-center shrink-0">
         <p className="text-xl font-semibold text-slate-800">{sentenceData.eng}</p>
      </div>

      <div className={`min-h-[120px] w-full p-4 rounded-[1.5rem] flex flex-wrap content-start gap-2 border-2 border-dashed transition-colors shrink-0
         ${status === 'correct' ? 'border-green-400 bg-green-50' : status === 'incorrect' ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
      `}>
        {selectedWords.length === 0 && status === 'playing' && (
          <span className="text-slate-300 font-medium w-full text-center mt-8">Tap words to build</span>
        )}
        {selectedWords.map((word, idx) => {
          let btnClass = 'bg-slate-800 text-white';
          if (status === 'correct') btnClass = 'bg-green-500 text-white';
          else if (status === 'incorrect') {
            if (flashIndices.includes(idx)) btnClass = 'bg-green-500 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]';
            else btnClass = 'bg-red-500 text-white';
          }
          return (
            <button key={idx} onClick={() => handleRemoveWord(idx)} className={`px-4 py-2 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center min-w-[4.5rem] ${btnClass}`}>
              <span>{word}</span><span className="text-[10px] font-normal opacity-70 leading-none mt-1">{getPhonetic(word)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-center shrink-0">
         {wordBank.map((word, idx) => {
           const usedCount = selectedWords.filter(w => w === word).length;
           const bankCount = wordBank.filter(w => w === word).length;
           const fullyUsed = usedCount >= bankCount;
           return (
             <button key={idx} disabled={fullyUsed || status !== 'playing'} onClick={() => handleSelectWord(word)} className={`px-4 py-2 rounded-xl font-bold text-lg border transition-all flex flex-col items-center justify-center min-w-[4.5rem] ${fullyUsed ? 'bg-slate-100 text-slate-300 border-slate-200 shadow-none' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:border-slate-400 active:scale-95'}`}>
               <span>{word}</span><span className={`text-[10px] font-normal leading-none mt-1 ${fullyUsed ? 'opacity-50' : 'text-slate-400'}`}>{getPhonetic(word)}</span>
             </button>
           )
         })}
      </div>

      <div className="mt-auto pt-6 shrink-0 w-full">
        <button onClick={checkAnswer} disabled={selectedWords.length === 0 || status !== 'playing'} className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white p-5 rounded-[1.5rem] font-semibold text-lg active:scale-95 transition-all">
          Check
        </button>
      </div>
    </div>
  );
}

const LevelTestManager = ({ level, onComplete, onBack }) => {
  const [phase, setPhase] = useState(0); 
  const [lives, setLives] = useState(3);
  const [failed, setFailed] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0); 

  const handleIncorrect = useCallback(() => {
    if (lives > 1) {
      setLives(lives - 1);
    } else {
      setLives(0);
      playSound('fail');
      setFailed(true);
    }
  }, [lives]);

  const restartTest = () => {
    vibrate('tap');
    setLives(3);
    setPhase(0);
    setFailed(false);
    setAttemptCount(prev => prev + 1);
  };

  const handleTestPass = () => {
    playSound('win');
    onComplete();
  };

  if (failed) {
    return (
      <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40 items-center justify-center p-6 text-center pb-28 sm:pb-28">
        <AlertCircle size={80} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-light text-slate-900 mb-2">Test Failed</h2>
        <p className="text-slate-500 mb-10">You ran out of lives. Review the words and try again!</p>
        <div className="w-full max-w-xs space-y-4">
           <button onClick={restartTest} className="w-full bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
             Try Again
           </button>
           <button onClick={() => { vibrate('tap'); onBack(); }} className="w-full bg-white text-slate-700 border border-slate-200 font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
             Study Hub
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-40">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm z-10 shrink-0">
        <button onClick={() => { vibrate('tap'); onBack(); }} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <div className="flex space-x-2 flex-1 mx-6 justify-center">
          {[0, 1, 2].map((p) => (
             <div key={p} className={`h-1.5 flex-1 max-w-[30px] rounded-full transition-colors ${p < phase ? 'bg-green-500' : p === phase ? 'bg-slate-800' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3].map(heartNum => (
            <Heart key={heartNum} size={20} className={`transition-all duration-300 ${lives >= heartNum ? 'text-red-500 fill-red-500' : 'text-slate-200 fill-slate-100'}`} />
          ))}
        </div>
      </div>

      {phase === 0 && <TestQuiz key={`quiz-${attemptCount}`} vocab={level.vocab} onIncorrect={handleIncorrect} onComplete={() => setPhase(1)} />}
      {phase === 1 && <TestMatch key={`match-${attemptCount}`} vocab={level.vocab} onIncorrect={handleIncorrect} onComplete={() => setPhase(2)} />}
      {phase === 2 && <TestSentenceBuilder key={`sent-${attemptCount}`} level={level} onIncorrect={handleIncorrect} onComplete={handleTestPass} />}
    </div>
  )
};

// --- NEW FEATURE: QUICK MATCH ---

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <div 
          key={i} 
          className="absolute animate-[confettiFall_3s_ease-in-out_forwards]"
          style={{
            top: '-10%',
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
            width: `${Math.random() * 8 + 6}px`,
            height: `${Math.random() * 16 + 10}px`,
            animationDelay: `${Math.random() * 1.5}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );
};

const QuickMatch = ({ unlockedLevelId, highScore, setHighScore }) => {
  const [gameState, setGameState] = useState('start'); 
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const activeVocab = useMemo(() => {
    return LEVELS.filter(l => l.id <= unlockedLevelId).flatMap(l => l.vocab);
  }, [unlockedLevelId]);

  const generateQuestion = useCallback(() => {
    const target = activeVocab[Math.floor(Math.random() * activeVocab.length)];
    const distractors = shuffleArray(ALL_VOCAB.filter(w => w.id !== target.id)).slice(0, 5);
    setOptions(shuffleArray([target, ...distractors]));
    setCurrentWord(target);
    setSelectedAnswer(null);
  }, [activeVocab]);

  const startGame = () => {
    vibrate('tap');
    setScore(0);
    setTimeLeft(60);
    setIsNewHighScore(false);
    setGameState('playing');
    generateQuestion();
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      if (score > highScore && score > 0) {
        setIsNewHighScore(true);
        setHighScore(score);
        playSound('high-score');
      } else {
        playSound('win');
      }
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, highScore]);

  const handleAnswer = (opt) => {
    if (selectedAnswer) return;
    vibrate('tap');
    setSelectedAnswer(opt);
    
    if (opt.id === currentWord.id) {
      playSound('correct');
      setScore(s => s + 10);
      setTimeout(generateQuestion, 400);
    } else {
      playSound('incorrect');
      setTimeout(generateQuestion, 600);
    }
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 pb-28 animation-fade-in text-center max-w-md mx-auto w-full">
        <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-lg shrink-0">
          <Timer size={48} />
        </div>
        <h2 className="text-3xl font-light tracking-tight text-slate-800 mb-2 shrink-0">Quick Match</h2>
        <p className="text-slate-500 mb-6 max-w-[250px] shrink-0">60 seconds. Match as many words as you can. Vocab drawn from your unlocked levels.</p>
        
        {highScore > 0 && (
          <div className="mb-8 flex items-center gap-2 bg-amber-50 px-5 py-2.5 rounded-full text-amber-700 font-bold text-sm border border-amber-100 shadow-sm shrink-0">
            <Trophy size={18} className="text-amber-500" />
            High Score: {highScore}
          </div>
        )}

        <button onClick={startGame} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0">
          <Play size={20} className="fill-current" /> Start Rush
        </button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animation-fade-in text-center relative z-10 pb-28 max-w-md mx-auto w-full">
        {isNewHighScore && <Confetti />}
        <Trophy size={60} className={`${isNewHighScore ? 'text-amber-500 animate-bounce' : 'text-slate-800'} mb-6`} />
        <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-2">
          {isNewHighScore ? 'New High Score!' : "Time's Up!"}
        </h2>
        <p className="text-slate-500 mb-4">You scored <span className="font-bold text-slate-800">{score}</span> points.</p>
        
        {highScore > 0 && !isNewHighScore && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">High Score: {highScore}</p>}
        {isNewHighScore && <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-10">Previous Best Beaten!</p>}
        
        <button onClick={startGame} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all mb-3">
          Play Again
        </button>
        <button onClick={() => setGameState('start')} className="w-full max-w-xs bg-white text-slate-700 border border-slate-200 font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 pt-6 pb-28 sm:pb-28 animation-fade-in max-w-md mx-auto w-full justify-between">
      
      {/* Top Bar Area */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between bg-white p-2.5 sm:p-4 rounded-[1.5rem] shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => { vibrate('tap'); setGameState('start'); }} className="p-1 sm:p-2 text-slate-400 hover:text-slate-800 transition-colors shrink-0">
               <ArrowLeft size={22} />
             </button>
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Score</span>
                <div className="flex items-center gap-1.5">
                  <Trophy size={16} className="text-amber-500" />
                  <span className="font-bold text-slate-800 text-lg sm:text-xl leading-none">{score}</span>
                </div>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Best</span>
                <span className="font-bold text-slate-600 text-lg leading-none">{highScore}</span>
             </div>
           </div>
           
           <div className={`flex items-center gap-2 px-4 py-2 rounded-[1rem] font-bold ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
              <Timer size={18} />
              <span>0:{timeLeft.toString().padStart(2, '0')}</span>
           </div>
        </div>
      </div>

      {/* Middle Playing Card */}
      <div className="flex-1 flex items-center justify-center my-4 min-h-[160px]">
        <div className="bg-white w-full rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-8 text-center shrink-0">
          <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentWord.thai}</h2>
          <p className="text-lg text-slate-500 font-medium">"{currentWord.phonetic}"</p>
        </div>
      </div>

      {/* Bottom Option Grid */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        {options.map((opt) => {
          let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm";
          if (selectedAnswer) {
            if (opt.id === currentWord.id) btnClass = "bg-green-500 border-green-500 text-white scale-[1.02] shadow-md z-10";
            else if (selectedAnswer.id === opt.id) btnClass = "bg-red-500 border-red-500 text-white";
            else btnClass = "bg-white border-slate-100 text-slate-300 opacity-50";
          }
          return (
            <button 
              key={opt.id} 
              onClick={() => handleAnswer(opt)} 
              disabled={selectedAnswer !== null} 
              className={`w-full p-4 rounded-[1.25rem] font-semibold text-sm transition-all flex items-center justify-center min-h-[4.5rem] ${btnClass}`}
            >
              {opt.eng}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [currentTab, setCurrentTab] = useState('path'); 
  const [unlockedLevelId, setUnlockedLevelId] = useState(LEVELS.length); // Unlocked all levels for development
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [gameMode, setGameMode] = useState(null); 
  const [quickHighScore, setQuickHighScore] = useState(0);

  const activeLevel = LEVELS.find(l => l.id === activeLevelId);

  const handleSelectMapNode = (id) => {
    setActiveLevelId(id);
    setCurrentTab('study');
  };

  const handleLevelComplete = () => {
    if (activeLevelId === unlockedLevelId && unlockedLevelId < LEVELS.length) {
      setUnlockedLevelId(prev => prev + 1);
    }
    setGameMode(null);
    setCurrentTab('path'); 
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="fixed inset-0 h-[100dvh] w-full bg-slate-100 flex items-center justify-center font-sans sm:p-6 text-slate-900">
        
        {/* Mobile Mockup */}
        <div className="w-full h-full sm:h-[850px] sm:w-[400px] bg-slate-50 sm:rounded-[3rem] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] sm:border-[10px] sm:border-slate-900 overflow-hidden relative flex flex-col">
          
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden hide-scrollbar sm:pt-4 pb-24">
            {currentTab === 'path' && !gameMode && <JourneyMap unlockedLevelId={unlockedLevelId} onSelectLevel={handleSelectMapNode} />}
            {currentTab === 'study' && !gameMode && <StudyHub level={activeLevel} unlockedLevelId={unlockedLevelId} onSelectMode={setGameMode} />}
            {currentTab === 'quick' && !gameMode && <QuickMatch unlockedLevelId={unlockedLevelId} highScore={quickHighScore} setHighScore={setQuickHighScore} />}
            {currentTab === 'dictionary' && !gameMode && <Dictionary />}
            
            {/* Fullscreen Overlays */}
            {gameMode === 'lesson' && <Lesson vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'flashcards' && <Flashcards vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'quiz' && <Quiz vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'match' && <MatchGame vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            
            {/* The Unified 3-Phase Level Test */}
            {gameMode === 'level-test' && <LevelTestManager level={activeLevel} onComplete={handleLevelComplete} onBack={() => setGameMode(null)} />}
          </div>

          <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-4 pb-6 sm:pb-6 flex justify-around items-center z-[60] shrink-0">
             {[
               { id: 'path', icon: MapIcon, label: 'Path' },
               { id: 'study', icon: GraduationCap, label: 'Study' },
               { id: 'quick', icon: Timer, label: 'Quick' },
               { id: 'dictionary', icon: BookMarked, label: 'Vocab' }
             ].map(tab => {
               const Icon = tab.icon;
               const isActive = currentTab === tab.id;
               return (
                 <button key={tab.id} onClick={() => { vibrate('tap'); setCurrentTab(tab.id); setGameMode(null); }} className={`flex flex-col items-center justify-center space-y-1.5 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                   <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-slate-100 scale-110' : 'bg-transparent'}`}>
                     <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                   </div>
                   <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                 </button>
               )
             })}
          </div>
          
          <div className="hidden sm:block absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[35%] h-[5px] bg-slate-800 rounded-full z-[70] pointer-events-none"></div>
        </div>
      </div>
    </>
  );
}