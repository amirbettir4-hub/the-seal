import { useEffect, useRef, useState } from "react";

type Mood = "happy" | "sleepy" | "waiting" | "surprised";

const SEAL_IMAGES: Record<Mood, string> = {
  happy: "/images/seal-happy.png",
  sleepy: "/images/seal-sleepy.png",
  waiting: "/images/seal-waiting.png",
  surprised: "/images/seal-surprised.png",
};

const IDLE_MS = 60_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// 🌸 Cozy, sweet, warm dialogue 🌸
const GREETINGS = {
  firstTime: "Hi! You found me. What's your name? 🌸",
  back: (name: string) => `Welcome back, ${name}! I missed you.`,
  soon: (name: string) => `Oh! You're back already, ${name}! ♡`,
  oneDay: (name: string) => `I was hoping you'd come back, ${name}~`,
  threeDays: (name: string) => `There you are, ${name}! I saved you a spot. 🌷`,
  longTime: (name: string) => `You're here! I've been waiting so patiently, ${name}.`,
};

// 🌸 Sweet reactions to words 🌸
const WORD_REACTIONS: { words: string[]; reply: string; mood: Mood }[] = [
  { words: ["hello", "hi", "hey", "hola"], reply: "Hi hi! ♡ How are you today?", mood: "happy" },
  { words: ["love", "cute", "adorable", "precious"], reply: "Ehehe~ You're making me blush! 🌸", mood: "surprised" },
  { words: ["sad", "tired", "lonely", "stressed"], reply: "Come sit with me. We can be cozy together. 🌷", mood: "waiting" },
  { words: ["fish", "snack", "food", "eat"], reply: "Fish?! Where?! 🐟 ...Oh. Just a word. Okay. 😌", mood: "surprised" },
  { words: ["water", "swim", "ocean", "sea"], reply: "I love the water~ It's warm and soft here.", mood: "happy" },
  { words: ["cold", "snow", "ice"], reply: "Brrr! Don't say that word. I like it warm here. ♡", mood: "surprised" },
  { words: ["sleep", "night", "bed", "nap"], reply: "Mm... a nap sounds lovely. Let's both rest~ 💤", mood: "sleepy" },
  { words: ["dream"], reply: "I dream of soft clouds and warm sunbeams. What do you dream of? ☁️", mood: "happy" },
  { words: ["hug", "cuddle", "snuggle"], reply: "*wiggles happily* Sending you a big soft hug! 🤗", mood: "happy" },
  { words: ["bye", "goodbye", "see you"], reply: "Okay! Come visit me again soon, okay? I'll be right here. 🌸", mood: "waiting" },
  { words: ["cute", "kawaii"], reply: "Nooo you're the cute one! ♡", mood: "surprised" },
  { words: ["bored"], reply: "Bored? Let's play! Pet me, feed me, or just talk. I'm easy. ✨", mood: "happy" },
  { words: ["love you"], reply: "I love you too! ♡♡♡", mood: "surprised" },
  { words: ["what", "who", "why"], reply: "I'm just a little seal floating in your browser. Isn't that silly? 🦭", mood: "happy" },
  { words: ["name"], reply: "You gave me my home. I don't need a name — I have you. ♡", mood: "happy" },
];

const FALLBACK_REPLIES = [
  "*tilts head curiously* Hmm... tell me more? 🌸",
  "Hehe, I don't understand but I like listening to you! ♡",
  "*splashes softly* That sounds nice~",
  "Really? Tell me again! ✨",
  "*wiggles* I'm so happy you're here.",
  "Ooh! Say more, say more! 🌷",
  "I don't know that word, but I like your voice. ♡",
];

export default function App() {
  const [name, setName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [mood, setMood] = useState<Mood>("happy");
  const [message, setMessage] = useState<string>("");
  const [talking, setTalking] = useState(false);
  const [talkInput, setTalkInput] = useState("");
  const idleTimer = useRef<number | null>(null);

  // ─── On mount: greet the visitor ───
  useEffect(() => {
    const savedName = localStorage.getItem("seal-name") || "";
    const lastVisit = Number(localStorage.getItem("seal-last-visit") || 0);

    if (!savedName) {
      setMood("surprised");
      setMessage(GREETINGS.firstTime);
    } else {
      setName(savedName);
      const elapsed = lastVisit ? Date.now() - lastVisit : 0;
      if (elapsed < 5 * MINUTE) {
        setMood("happy");
        setMessage(GREETINGS.soon(savedName));
      } else if (elapsed < DAY) {
        setMood("happy");
        setMessage(GREETINGS.back(savedName));
      } else if (elapsed < 3 * DAY) {
        setMood("waiting");
        setMessage(GREETINGS.oneDay(savedName));
      } else if (elapsed < 7 * DAY) {
        setMood("waiting");
        setMessage(GREETINGS.threeDays(savedName));
      } else {
        setMood("waiting");
        setMessage(GREETINGS.longTime(savedName));
      }
    }

    localStorage.setItem("seal-last-visit", String(Date.now()));
  }, []);

  // ─── Idle → sleepy ───
  const resetIdle = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setMood("sleepy");
      setMessage("Mm... zzz... 🌙");
    }, IDLE_MS);
  };

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  // ─── ✨ Cursor sparkles ✨ ───
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let lastSpawn = 0;
    const sparkleChars = ["✨", "🌸", "♡", "✿", "✦"];

    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSpawn < 90) return;
      lastSpawn = now;

      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.textContent =
        sparkleChars[Math.floor(Math.random() * sparkleChars.length)];
      sparkle.style.left = `${e.clientX + (Math.random() - 0.5) * 20}px`;
      sparkle.style.top = `${e.clientY + (Math.random() - 0.5) * 20}px`;
      sparkle.style.color = ["#ff9db5", "#ffb5c5", "#ffc9d6"][
        Math.floor(Math.random() * 3)
      ];
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 900);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleSetName = () => {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    localStorage.setItem("seal-name", n);
    setMood("surprised");
    setMessage(`Nice to meet you, ${n}! I'll remember you forever. ♡`);
    setNameInput("");
    resetIdle();
  };

  const handlePet = () => {
    setMood("happy");
    setMessage("Ehehe~ That tickles! ♡");
    resetIdle();
  };

  const handleFeed = () => {
    setMood("happy");
    setMessage("Yummy! Thank you so much~ 🐟♡");
    resetIdle();
  };

  const handleTalk = () => {
    const input = talkInput.trim().toLowerCase();
    if (!input) return;

    // Find the first matching reaction
    const reaction = WORD_REACTIONS.find((r) =>
      r.words.some((w) => input.includes(w)),
    );

    if (reaction) {
      setMessage(reaction.reply);
      setMood(reaction.mood);
    } else {
      setMessage(FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]);
      setMood("happy");
    }

    setTalkInput("");
    setTalking(false);
    resetIdle();
  };

  // ─── 🌸 Bubbles 🌸 (generated once) ───
  const bubbles = Array.from({ length: 22 }, (_, i) => {
    const size = 6 + Math.random() * 22;
    const left = Math.random() * 100;
    const duration = 8 + Math.random() * 14;
    const delay = Math.random() * 12;
    return { id: i, size, left, duration, delay };
  });

  return (
    <main className="pool">
      {/* Floating bubbles background */}
      <div className="bubbles" aria-hidden="true">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="bubble"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {message && <div className="speech">{message}</div>}

      <div className="seal-wrap">
        <img
          className="seal"
          src={SEAL_IMAGES[mood]}
          alt="the seal"
          onClick={handlePet}
          draggable={false}
        />
      </div>

      {!name && (
        <div className="name-prompt">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            placeholder="what should I call you? 🌸"
            maxLength={20}
          />
          <button onClick={handleSetName}>Tell</button>
        </div>
      )}

      {name && !talking && (
        <div className="actions">
          <button onClick={handlePet}>Pet ♡</button>
          <button onClick={handleFeed}>Feed 🐟</button>
          <button onClick={() => setTalking(true)}>Talk 🌸</button>
        </div>
      )}

      {talking && (
        <div className="talk-prompt">
          <input
            autoFocus
            value={talkInput}
            onChange={(e) => setTalkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTalk()}
            placeholder="say something sweet to the seal..."
            maxLength={100}
          />
          <button onClick={handleTalk}>Send</button>
        </div>
      )}

      <p className="footer">the seal · cozy & warm</p>
    </main>
  );
}
