import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, BookOpen, Brain, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, XCircle, Trophy, Map as MapIcon, BookMarked, GraduationCap, Sparkles, ChevronDown, ChevronUp, Lock, Unlock, Grid, Heart, AlertCircle } from 'lucide-react';

// --- AUDIO UTILITY ---
const playSound = (type) => {
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
    }
  } catch (e) {
    console.log("Audio play failed:", e);
  }
};

// --- DATA & LEVELS ---
const LEVELS = [
  {
    id: 1,
    title: 'Greetings',
    subtitle: 'Hello and Names',
    icon: '👋',
    vocab: [
      { id: 1, thai: 'สวัสดี', phonetic: 'sà-wàt-dee', eng: 'Hello', emoji: '👋', structure: 'Low, Low, Mid tone. A universal greeting used at any time of day for hello or goodbye.' },
      { id: 2, thai: 'ขอบคุณ', phonetic: 'kòp-kun', eng: 'Thank you', emoji: '🙏', structure: 'Low, Mid tone. The standard, polite way to express gratitude.' },
      { id: 3, thai: 'ผม', phonetic: 'pǒm', eng: 'I (male)', emoji: '👨', structure: 'Rising tone. The polite pronoun used by males to refer to themselves.' },
      { id: 4, thai: 'ฉัน', phonetic: 'chǎn', eng: 'I (female)', emoji: '👩', structure: 'Rising tone. The polite pronoun used by females to refer to themselves.' },
      { id: 5, thai: 'คุณ', phonetic: 'kun', eng: 'You', emoji: '👉', structure: 'Mid tone. A polite pronoun for "you", placed before names or used on its own.' },
      { id: 6, thai: 'ชื่อ', phonetic: 'chûe', eng: 'Name', emoji: '🏷️', structure: 'Falling tone. Means "name" but also acts as the verb "to be named".' },
      { id: 7, thai: 'อะไร', phonetic: 'a-rai', eng: 'What', emoji: '🤷', structure: 'Low, Mid tone. The question word for "what", usually placed at the very end of a sentence.' },
    ],
    sentences: [
      { eng: "Hello, what is your name?", thai: ["สวัสดี", "คุณ", "ชื่อ", "อะไร"] },
      { eng: "My name is... (Male)", thai: ["ผม", "ชื่อ"] },
      { eng: "My name is... (Female)", thai: ["ฉัน", "ชื่อ"] },
      { eng: "What is my name?", thai: ["ฉัน", "ชื่อ", "อะไร"] },
      { eng: "I thank you. (Male)", thai: ["ผม", "ขอบคุณ"] },
      { eng: "I thank you. (Female)", thai: ["ฉัน", "ขอบคุณ"] }
    ]
  },
  {
    id: 2,
    title: 'Origins',
    subtitle: 'Countries and Cities',
    icon: '🗺️',
    vocab: [
      { id: 201, thai: 'มาจาก', phonetic: 'maa jàak', eng: 'Come from', emoji: '🛫', structure: 'Mid, Low tone. A compound of "maa" (to come) and "jàak" (from).' },
      { id: 202, thai: 'ประเทศ', phonetic: 'bprà-têet', eng: 'Country', emoji: '🗺️', structure: 'Low, Falling tone. Always placed directly before the name of a country (e.g., bprà-têet tai).' },
      { id: 203, thai: 'เมือง', phonetic: 'mueang', eng: 'City', emoji: '🏙️', structure: 'Mid tone. Means city or town, placed before the city name.' },
      { id: 204, thai: 'คน', phonetic: 'kon', eng: 'Person', emoji: '🧍', structure: 'Mid tone. Placed before a country name to denote nationality (e.g., kon tai = Thai person).' },
      { id: 205, thai: 'ไทย', phonetic: 'tai', eng: 'Thai', emoji: '🇹🇭', structure: 'Mid tone. Means Thai or Thailand. Translates literally to "free".' },
      { id: 206, thai: 'อังกฤษ', phonetic: 'ang-grìt', eng: 'England', emoji: '🇬🇧', structure: 'Mid, Low tone. Refers to England or the English language/people.' },
      { id: 207, thai: 'ที่ไหน', phonetic: 'tîi-nǎi', eng: 'Where', emoji: '📍', structure: 'Falling, Rising tone. The question word for "where", placed at the end of the sentence.' },
      { id: 208, thai: 'และ', phonetic: 'láe', eng: 'And', emoji: '➕', structure: 'High tone. Conjunction used strictly to link nouns together, not verbs.' },
    ],
    sentences: [
      { eng: "Where do you come from?", thai: ["คุณ", "มาจาก", "ที่ไหน"] },
      { eng: "I come from Thailand. (Male)", thai: ["ผม", "มาจาก", "ประเทศ", "ไทย"] },
      { eng: "Thai person and English person.", thai: ["คน", "ไทย", "และ", "คน", "อังกฤษ"] },
      { eng: "I come from the city. (Female)", thai: ["ฉัน", "มาจาก", "เมือง"] },
      { eng: "What country do you come from?", thai: ["คุณ", "มาจาก", "ประเทศ", "อะไร"] }
    ]
  },
  {
    id: 3,
    title: 'Basics',
    subtitle: 'To be or not to be',
    icon: '🍲',
    vocab: [
      { id: 301, thai: 'เป็น', phonetic: 'bpen', eng: 'Is/Am/Are', emoji: '🔗', structure: 'Mid tone. Used to link a noun to another noun, e.g., "I am a person".' },
      { id: 302, thai: 'ไม่', phonetic: 'mâi', eng: 'No / Not', emoji: '❌', structure: 'Falling tone. Placed immediately before a verb or adjective to negate it.' },
      { id: 303, thai: 'ใช่', phonetic: 'châi', eng: 'Yes / Correct', emoji: '✅', structure: 'Falling tone. Means correct. Combine with "mâi" (mâi châi) to say "is not".' },
      { id: 304, thai: 'อาหาร', phonetic: 'aa-hǎan', eng: 'Food', emoji: '🍲', structure: 'Mid, Rising tone. Formal word for food, borrowed from ancient Sanskrit.' },
      { id: 305, thai: 'น้ำ', phonetic: 'náam', eng: 'Water', emoji: '💧', structure: 'High tone. Means liquid/water. Placed before other words to name liquids.' },
      { id: 306, thai: 'อร่อย', phonetic: 'a-ròi', eng: 'Delicious', emoji: '😋', structure: 'Low, Low tone. Placed directly after the noun it describes (e.g., food delicious).' },
    ],
    sentences: [
      { eng: "Yes, I am a Thai person. (Female)", thai: ["ใช่", "ฉัน", "เป็น", "คน", "ไทย"] },
      { eng: "I am not an English person. (Male)", thai: ["ผม", "ไม่", "ใช่", "คน", "อังกฤษ"] },
      { eng: "The food is delicious.", thai: ["อาหาร", "อร่อย"] },
      { eng: "Water is not delicious.", thai: ["น้ำ", "ไม่", "อร่อย"] },
      { eng: "You are not a person.", thai: ["คุณ", "ไม่", "ใช่", "คน"] },
      { eng: "What is delicious?", thai: ["อะไร", "อร่อย"] }
    ]
  },
  {
    id: 4,
    title: 'Questions',
    subtitle: 'Who, what, where...',
    icon: '❓',
    vocab: [
      { id: 401, thai: 'ใคร', phonetic: 'krai', eng: 'Who', emoji: '👤', structure: 'Mid tone. Can act as the subject (Who eats?) or object (Eat who?).' },
      { id: 402, thai: 'ทำไม', phonetic: 'tam-mai', eng: 'Why', emoji: '🤔', structure: 'Mid, Mid tone. The question word for "why", usually placed at the start of a sentence.' },
      { id: 403, thai: 'อยู่', phonetic: 'yùu', eng: 'To live/be at', emoji: '🏠', structure: 'Low tone. Indicates physical location. Literally "To be (somewhere)".' },
      { id: 404, thai: 'กิน', phonetic: 'gin', eng: 'Eat/Drink', emoji: '🍽️', structure: 'Mid tone. Means to consume. In Thai, this is used for BOTH eating food and drinking liquids!' },
      { id: 405, thai: 'ชอบ', phonetic: 'chôorb', eng: 'Like', emoji: '❤️', structure: 'Falling tone. Placed before a noun or verb to indicate preference or favor.' },
    ],
    sentences: [
      { eng: "Who likes to drink water?", thai: ["ใคร", "ชอบ", "กิน", "น้ำ"] },
      { eng: "Why do you like to eat?", thai: ["ทำไม", "คุณ", "ชอบ", "กิน"] },
      { eng: "Where do you live?", thai: ["คุณ", "อยู่", "ที่ไหน"] },
      { eng: "I like food and water. (Male)", thai: ["ผม", "ชอบ", "อาหาร", "และ", "น้ำ"] },
      { eng: "Why are you in England?", thai: ["ทำไม", "คุณ", "อยู่", "ประเทศ", "อังกฤษ"] },
      { eng: "Who is a Thai person?", thai: ["ใคร", "เป็น", "คน", "ไทย"] }
    ]
  },
  {
    id: 5,
    title: 'Nature',
    subtitle: 'Animals & the world',
    icon: '🐘',
    vocab: [
      { id: 501, thai: 'แมว', phonetic: 'maew', eng: 'Cat', emoji: '🐈', structure: 'Mid tone. Onomatopoeia - it sounds exactly like a meow!' },
      { id: 502, thai: 'หมา', phonetic: 'mǎa', eng: 'Dog', emoji: '🐕', structure: 'Rising tone. Informal root word for dog.' },
      { id: 503, thai: 'ช้าง', phonetic: 'cháang', eng: 'Elephant', emoji: '🐘', structure: 'High tone. Root word for elephant.' },
      { id: 504, thai: 'นก', phonetic: 'nók', eng: 'Bird', emoji: '🐦', structure: 'High tone. Root word for bird.' },
      { id: 505, thai: 'ปลา', phonetic: 'plaa', eng: 'Fish', emoji: '🐟', structure: 'Mid tone. Root word for fish.' },
      { id: 506, thai: 'ทะเล', phonetic: 'tá-lay', eng: 'Sea / Ocean', emoji: '🌊', structure: 'High, Mid tone. Root word for the sea.' },
      { id: 507, thai: 'ใหญ่', phonetic: 'yài', eng: 'Big', emoji: '⛰️', structure: 'Low tone. An adjective that is always placed AFTER the noun it describes.' },
      { id: 508, thai: 'เล็ก', phonetic: 'lék', eng: 'Small', emoji: '🐜', structure: 'High tone. An adjective that is always placed AFTER the noun it describes.' },
    ],
    sentences: [
      { eng: "A cat is not a dog.", thai: ["แมว", "ไม่", "ใช่", "หมา"] },
      { eng: "Big elephant and small bird.", thai: ["ช้าง", "ใหญ่", "และ", "นก", "เล็ก"] },
      { eng: "Fish live in the sea.", thai: ["ปลา", "อยู่", "ทะเล"] },
      { eng: "Who likes cats?", thai: ["ใคร", "ชอบ", "แมว"] },
      { eng: "The big dog eats food.", thai: ["หมา", "ใหญ่", "กิน", "อาหาร"] },
      { eng: "Why do elephants like water?", thai: ["ทำไม", "ช้าง", "ชอบ", "น้ำ"] }
    ]
  },
  {
    id: 6,
    title: 'Numbers & Shop',
    subtitle: 'Counting and buying',
    icon: '🛒',
    vocab: [
      { id: 601, thai: 'หนึ่ง', phonetic: 'nùeng', eng: 'One', emoji: '1️⃣', structure: 'Low tone. Root number one.' },
      { id: 602, thai: 'สอง', phonetic: 'sǒng', eng: 'Two', emoji: '2️⃣', structure: 'Rising tone. Root number two.' },
      { id: 603, thai: 'สาม', phonetic: 'sǎam', eng: 'Three', emoji: '3️⃣', structure: 'Rising tone. Root number three.' },
      { id: 604, thai: 'ซื้อ', phonetic: 'súe', eng: 'Buy', emoji: '🛍️', structure: 'High tone. Means to purchase something.' },
      { id: 605, thai: 'บาท', phonetic: 'bàat', eng: 'Baht', emoji: '฿', structure: 'Low tone. The official Thai currency.' },
      { id: 606, thai: 'แพง', phonetic: 'paeng', eng: 'Expensive', emoji: '💸', structure: 'Mid tone. Means high cost or pricey.' },
      { id: 607, thai: 'เท่าไหร่', phonetic: 'tâo-rài', eng: 'How much', emoji: '💰', structure: 'Falling, Low tone. The standard question word for asking quantity or price.' },
    ],
    sentences: [
      { eng: "How much is the food?", thai: ["อาหาร", "เท่าไหร่"] },
      { eng: "Buy two cats.", thai: ["ซื้อ", "แมว", "สอง"] },
      { eng: "Three baht is not expensive.", thai: ["สาม", "บาท", "ไม่", "แพง"] },
      { eng: "Why buy expensive water?", thai: ["ทำไม", "ซื้อ", "น้ำ", "แพง"] },
      { eng: "Buy three delicious fish.", thai: ["ซื้อ", "ปลา", "อร่อย", "สาม"] },
      { eng: "How much for one elephant?", thai: ["ช้าง", "หนึ่ง", "เท่าไหร่"] }
    ]
  }
];

const ALL_VOCAB = LEVELS.flatMap(l => l.vocab);
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

// --- CSS ---
const customStyles = `
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const getPhonetic = (thaiWord) => {
  const wordData = ALL_VOCAB.find(v => v.thai === thaiWord);
  return wordData ? wordData.phonetic : '';
};

// --- MAIN VIEWS ---

const JourneyMap = ({ unlockedLevelId, onSelectLevel }) => {
  return (
    <div className="py-12 px-6 space-y-8 flex flex-col items-center relative min-h-full">
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
                  onClick={() => onSelectLevel(lvl.id)}
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
    <div className="flex flex-col items-center justify-center h-full space-y-6 p-6 pt-10 animation-fade-in">
      <div className="text-center space-y-2 mb-2 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-2">{level.icon}</div>
        <h2 className="text-2xl font-light tracking-tight text-slate-800">{level.title}</h2>
        <p className="text-slate-500 font-medium text-sm">
          {level.vocab.length} Words • Level {level.id}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Core Track</h3>
        <button onClick={() => onSelectMode('lesson')} className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-between group">
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-3 rounded-full group-hover:scale-110 transition-transform"><GraduationCap size={20} /></div>
            <div className="text-left">
              <span className="block text-lg font-semibold">Interactive Lesson</span>
            </div>
          </div>
          <ArrowRight className="text-white/50" />
        </button>

        <button 
          onClick={() => onSelectMode('level-test')} 
          className={`w-full p-5 rounded-[1.5rem] transition-all active:scale-95 flex items-center justify-between group border
            ${isCompleted ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}
          `}
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full transition-transform ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-900 group-hover:scale-110'}`}>
              {isCompleted ? <CheckCircle2 size={20} /> : <Unlock size={20} />}
            </div>
            <div className="text-left">
              <span className="block text-lg font-semibold">Level Test</span>
              <span className="block text-xs font-medium text-slate-500">3-Stage Challenge</span>
            </div>
          </div>
          <ArrowRight className="text-slate-300" />
        </button>
      </div>

      <div className="w-full max-w-sm pt-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Practice Games</h3>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => onSelectMode('flashcards')} className="bg-white text-slate-700 border border-slate-100 p-4 rounded-[1.2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all active:scale-95 flex flex-col items-center justify-center gap-3 hover:border-slate-300">
            <BookOpen size={22} className="text-slate-400" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Cards</span>
          </button>
          <button onClick={() => onSelectMode('quiz')} className="bg-white text-slate-700 border border-slate-100 p-4 rounded-[1.2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all active:scale-95 flex flex-col items-center justify-center gap-3 hover:border-slate-300">
            <Brain size={22} className="text-slate-400" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Quiz</span>
          </button>
          <button onClick={() => onSelectMode('match')} className="bg-white text-slate-700 border border-slate-100 p-4 rounded-[1.2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all active:scale-95 flex flex-col items-center justify-center gap-3 hover:border-slate-300">
            <Grid size={22} className="text-slate-400" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Dictionary = () => {
  const [expandedSection, setExpandedSection] = useState(LEVELS[0].id);
  const toggleSection = (id) => setExpandedSection(prev => prev === id ? null : id);

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
  const [step, setStep] = useState(0);
  const isComplete = step === vocab.length;
  
  if (isComplete) {
    return (
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 text-center absolute inset-0 z-50">
        <Sparkles size={60} className="text-slate-800 mb-6" />
        <h2 className="text-3xl font-light tracking-tight text-slate-800 mb-2">Lesson Complete</h2>
        <p className="text-slate-500 mb-10">You've reviewed all the words. Time to practice!</p>
        <button onClick={onBack} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
          Back to Study Hub
        </button>
      </div>
    );
  }

  const word = vocab[step];

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft size={24} /></button>
        <div className="flex space-x-2 flex-1 mx-6 justify-center">
          {vocab.map((_, i) => (
             <div key={i} className={`h-1 flex-1 max-w-[20px] rounded-full transition-colors ${i <= step ? 'bg-slate-800' : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className="font-semibold text-slate-500 text-sm">{step + 1}/{vocab.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto">
        <div className="w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 flex flex-col items-center text-center">
          <div className="text-6xl mb-8 bg-slate-50 w-24 h-24 flex items-center justify-center rounded-full border border-slate-100">{word.emoji}</div>
          
          <h2 className="text-5xl font-bold text-slate-900 mb-3">{word.thai}</h2>
          <p className="text-lg text-slate-500 font-medium mb-8">"{word.phonetic}"</p>
          
          <div className="w-12 h-px bg-slate-200 mb-8"></div>
          
          <h3 className="text-2xl font-light text-slate-800 mb-8">{word.eng}</h3>
          
          <div className="w-full bg-slate-50 rounded-[1rem] p-5 text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              Usage & Tone
            </p>
            <p className="text-sm font-medium text-slate-700">
              {word.structure}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setStep(s => s + 1)} 
          className="mt-8 w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-semibold text-lg active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Got it <ArrowRight size={20} className="opacity-50" />
        </button>
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
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <span className="font-semibold text-slate-600 text-sm">Card {currentIndex + 1} / {vocab.length}</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 perspective-1000">
        <div onClick={() => setIsFlipped(!isFlipped)} className={`relative w-full max-w-sm h-[24rem] cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 w-full h-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col items-center justify-center p-8 backface-hidden">
            <span className="text-6xl mb-8">{word.emoji}</span>
            <h2 className="text-5xl font-bold text-slate-900 mb-4 text-center">{word.thai}</h2>
            <p className="text-lg text-slate-400">"{word.phonetic}"</p>
          </div>
          <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 text-white">
            <h2 className="text-3xl font-light text-center mb-8">{word.eng}</h2>
            <div className="w-full bg-white/10 rounded-[1rem] p-5 text-left border border-white/5">
               <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">Usage & Tone</p>
               <p className="text-sm font-medium text-slate-200">{word.structure}</p>
            </div>
            <p className="absolute bottom-6 text-xs text-slate-500 uppercase tracking-widest">Tap to flip</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 mt-12">
          <button onClick={handlePrev} className="bg-white p-4 rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"><ArrowLeft size={24} /></button>
          <button onClick={handleNext} className="bg-white p-4 rounded-full shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"><ArrowRight size={24} /></button>
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
      <div className="flex flex-col h-full bg-white items-center justify-center p-6 text-center absolute inset-0 z-50">
        <Trophy size={60} className="text-slate-800 mb-6" />
        <h2 className="text-3xl font-light tracking-tight text-slate-900 mb-2">Quiz Complete</h2>
        <p className="text-slate-500 mb-10">Score: {score} / {questions.length}</p>
        <button onClick={onBack} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">Back to Study Hub</button>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
         <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <div className="flex space-x-1.5 flex-1 mx-4 justify-center">
          {questions.map((_, i) => <div key={i} className={`h-1 flex-1 max-w-[15px] rounded-full ${i < currentQIndex ? 'bg-slate-800' : i === currentQIndex ? 'bg-slate-400' : 'bg-slate-200'}`} />)}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 pt-12">
        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center mb-8">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Translate</p>
          <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentQ.target.thai}</h2>
          <p className="text-lg text-slate-500">"{currentQ.target.phonetic}"</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
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
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50">
       <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100">
         <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
        <div className="font-semibold text-slate-600 text-sm">Moves: {moves}</div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {matched === 6 ? (
           <div className="text-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-sm">
             <Trophy size={50} className="mx-auto text-slate-800 mb-4" />
             <h2 className="text-2xl font-light text-slate-900 mb-6">Completed in {moves} moves</h2>
             <button onClick={onBack} className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-semibold active:scale-95">Done</button>
           </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 w-full max-w-md perspective-1000">
            {cards.map((c, i) => (
              <div key={c.id} onClick={() => handleCardClick(i)} className={`relative w-full aspect-[3/4] cursor-pointer transition-transform duration-500 transform-style-3d ${c.flip || c.match ? 'rotate-y-180' : ''}`}>
                <div className={`absolute inset-0 w-full h-full bg-slate-800 rounded-[1rem] backface-hidden flex items-center justify-center ${c.match ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="text-white/20 text-2xl font-serif">🇹🇭</span>
                </div>
                <div className={`absolute inset-0 w-full h-full rounded-[1rem] shadow-sm backface-hidden rotate-y-180 flex flex-col items-center justify-center p-2 text-center border border-slate-200 ${c.match ? 'bg-slate-100 opacity-50' : 'bg-white'}`}>
                  <span className={`font-bold ${c.type === 't' ? 'text-xl' : 'text-lg'} text-slate-800 leading-tight mb-1`}>{c.text}</span>
                  <span className="text-[10px] text-slate-400">{c.sub}</span>
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
    // Generates 4 questions for the quiz phase
    const generated = shuffleArray(vocab).slice(0, 4).map(target => ({
      target,
      options: shuffleArray([target, ...shuffleArray(ALL_VOCAB.filter(w => w.id !== target.id)).slice(0, 3)])
    }));
    setQuestions(generated);
  }, [vocab]);

  const handleAnswer = (option) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    
    const isCorrect = option.id === questions[currentQIndex].target.id;
    if (isCorrect) {
      playSound('correct');
      setTimeout(() => {
        if (currentQIndex < 3) {
          setCurrentQIndex(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          onComplete(); // Advance to next test phase
        }
      }, 1000);
    } else {
      onIncorrect(); // Triggers life loss in parent
      // Stay on the question but clear it quickly so they can try again if they have lives
      setTimeout(() => setSelectedAnswer(null), 1000);
    }
  };

  if (!questions.length) return null;
  const currentQ = questions[currentQIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto animation-fade-in">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-light text-slate-800">Phase 1: Translate</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentQIndex + 1} of 4</p>
      </div>

      <div className="bg-white w-full rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center mb-8">
        <h2 className="text-5xl font-bold text-slate-900 mb-3">{currentQ.target.thai}</h2>
        <p className="text-lg text-slate-500">"{currentQ.target.phonetic}"</p>
      </div>

      <div className="w-full space-y-3">
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
    // 4 Pairs for Test Matching
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto animation-fade-in">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-light text-slate-800">Phase 2: Connect</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{matchedPairs.length} of 4</p>
      </div>

      <div className="flex w-full gap-4">
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
              <button key={`l-${word.id}`} disabled={isMatched || errorPair} onClick={() => setLeftSelected(word)} className={`p-3 rounded-[1rem] border shadow-sm transition-all flex flex-col items-center justify-center ${btnClass}`}>
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
              <button key={`r-${word.id}`} disabled={isMatched || errorPair} onClick={() => setRightSelected(word)} className={`p-4 rounded-[1rem] border shadow-sm font-bold text-sm transition-all flex items-center justify-center ${btnClass}`}>
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
    setSelectedWords([...selectedWords, word]);
  };

  const handleRemoveWord = (index) => {
    if (status !== 'playing') return;
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
  };

  const checkAnswer = () => {
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
    <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full animation-fade-in">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-light text-slate-800">Phase 3: Build</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentIdx + 1} of 6</p>
      </div>

      <div className="mb-6 text-center">
         <p className="text-xl font-semibold text-slate-800">{sentenceData.eng}</p>
      </div>

      <div className={`min-h-[120px] w-full p-4 rounded-[1.5rem] flex flex-wrap content-start gap-2 border-2 border-dashed transition-colors
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

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
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

      <div className="mt-auto pt-6">
        <button onClick={checkAnswer} disabled={selectedWords.length === 0 || status !== 'playing'} className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white p-5 rounded-[1.5rem] font-semibold text-lg active:scale-95 transition-all">
          Check
        </button>
      </div>
    </div>
  );
}

const LevelTestManager = ({ level, onComplete, onBack }) => {
  const [phase, setPhase] = useState(0); // 0=quiz, 1=match, 2=sentence
  const [lives, setLives] = useState(3);
  const [failed, setFailed] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0); // Used to remount components and reset internal state

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
      <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50 items-center justify-center p-6 text-center">
        <AlertCircle size={80} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-light text-slate-900 mb-2">Test Failed</h2>
        <p className="text-slate-500 mb-10">You ran out of lives. Review the words and try again!</p>
        <div className="w-full max-w-xs space-y-4">
           <button onClick={restartTest} className="w-full bg-slate-900 text-white font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
             Try Again
           </button>
           <button onClick={onBack} className="w-full bg-white text-slate-700 border border-slate-200 font-semibold py-4 rounded-[1.5rem] active:scale-95 transition-all">
             Study Hub
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0 z-50">
      <div className="p-4 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm z-10">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800"><ArrowLeft size={24} /></button>
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

// --- MAIN APP COMPONENT ---

export default function App() {
  const [currentTab, setCurrentTab] = useState('path'); 
  const [unlockedLevelId, setUnlockedLevelId] = useState(1);
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [gameMode, setGameMode] = useState(null); 

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans sm:p-6 text-slate-900">
        
        {/* Mobile Mockup */}
        <div className="w-full h-screen sm:h-[850px] sm:w-[400px] bg-slate-50 sm:rounded-[3rem] sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] sm:border-[10px] sm:border-slate-900 overflow-hidden relative">
          
          <div className="h-full w-full overflow-y-auto hide-scrollbar sm:pt-4 pb-28">
            {currentTab === 'path' && !gameMode && <JourneyMap unlockedLevelId={unlockedLevelId} onSelectLevel={handleSelectMapNode} />}
            {currentTab === 'study' && !gameMode && <StudyHub level={activeLevel} unlockedLevelId={unlockedLevelId} onSelectMode={setGameMode} />}
            {currentTab === 'dictionary' && !gameMode && <Dictionary />}
            
            {/* Fullscreen Overlays */}
            {gameMode === 'lesson' && <Lesson vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'flashcards' && <Flashcards vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'quiz' && <Quiz vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            {gameMode === 'match' && <MatchGame vocab={activeLevel.vocab} onBack={() => setGameMode(null)} />}
            
            {/* The Unified 3-Phase Level Test */}
            {gameMode === 'level-test' && <LevelTestManager level={activeLevel} onComplete={handleLevelComplete} onBack={() => setGameMode(null)} />}
          </div>

          {!gameMode && (
            <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-4 sm:pb-6 flex justify-around items-center z-40">
               {[
                 { id: 'path', icon: MapIcon, label: 'Path' },
                 { id: 'study', icon: GraduationCap, label: 'Study' },
                 { id: 'dictionary', icon: BookMarked, label: 'Vocab' }
               ].map(tab => {
                 const Icon = tab.icon;
                 const isActive = currentTab === tab.id;
                 return (
                   <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex flex-col items-center justify-center space-y-1.5 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                     <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-slate-100 scale-110' : 'bg-transparent'}`}>
                       <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                     </div>
                     <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                   </button>
                 )
               })}
            </div>
          )}
          
          <div className="hidden sm:block absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[35%] h-[5px] bg-slate-800 rounded-full z-50 pointer-events-none"></div>
        </div>
      </div>
    </>
  );
}