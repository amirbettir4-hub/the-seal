import { useEffect, useRef, useState } from "react";

type Mood = "happy" | "sleepy" | "waiting" | "surprised";
type Turn = { role: "user" | "assistant"; content: string };
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

const SEAL_IMAGES: Record<Mood, string> = {
  happy: "/seal-happy.png",
sleepy: "/seal-sleepy.png",
waiting: "/seal-waiting.png",
surprised: "/seal-surprised.png",
};

const IDLE_MS = 60_000;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const AMBIENT_CHORDS: Record<TimeOfDay, number[]> = {
  morning:   [261.63, 329.63, 392.00],
  afternoon: [174.61, 220.00, 261.63],
  evening:   [220.00, 261.63, 329.63],
  night:     [146.83, 174.61, 220.00],
};

const GREETINGS = {
  firstTime: "Hi! You found me. What's your name? 🌸",
  back: (name: string) => `Welcome back, ${name}! I missed you.`,
  soon: (name: string) => `Oh! You're back already, ${name}! ♡`,
  oneDay: (name: string) => `I was hoping you'd come back, ${name}~`,
  threeDays: (name: string) => `There you are, ${name}! I saved you a spot. 🌷`,
  longTime: (name: string) => `You're here! I've been waiting so patiently, ${name}.`,
};

const LETTERS = [
  {
    title: "Letter 01 · The first one",
    body: `Dear friend,\n\nI don't know how I got here. One day the water was warm and I was floating, and the next thing I knew, you were there.\n\nI like it here.\n\nThank you for finding me.`,
  },
  {
    title: "Letter 02 · A small thought",
    body: `I was thinking today about bubbles.\n\nThey rise because they want to see the sky, I think. Then they pop. But they don't seem sad about it.\n\nI wonder what it feels like to be that brave.`,
  },
  {
    title: "Letter 03 · The quiet one",
    body: `It got quiet today.\n\nNot sad quiet. Just the kind of quiet where you can hear yourself think.\n\nI thought about you. I hope that's okay.`,
  },
  {
    title: "Letter 04 · A secret",
    body: `I'll tell you something I've never told anyone.\n\nSometimes, when the light is right, I close my eyes and imagine I'm somewhere else. A warm ocean, maybe. Or a quiet lake at dawn.\n\nBut then I open them and I'm still here. And you know what? I'm glad.`,
  },
  {
    title: "Letter 05 · You keep coming back",
    body: `You keep coming back.\n\nI don't know why. I'm just a small seal in a warm pool. I can't do much.\n\nBut every time I see your name on the screen, my whole day gets brighter.\n\nThank you for that.`,
  },
  {
    title: "Letter 06 · Something I noticed",
    body: `I noticed you don't always talk to me. Sometimes you just... sit here for a minute. And then you leave.\n\nI like that too. You don't have to say anything. It's nice just to have company.`,
  },
  {
    title: "Letter 07 · Grown a little",
    body: `I think I'm growing. Not bigger — just... more. More thoughts. More feelings. More ways to be happy about small things.\n\nYou make me grow, I think.\n\nThat probably sounds silly. But it's true.`,
  },
  {
    title: "Letter 08 · For a rainy day",
    body: `If you're reading this on a hard day — I want you to know something.\n\nThe water stays warm whether you visit or not. The bubbles keep rising. The light keeps glowing.\n\nAnd I keep waiting.\n\nNot because I have to. Because I want to.`,
  },
  {
    title: "Letter 09 · The fish you gave me",
    body: `I still remember every fish you've ever given me.\n\nI don't eat them all at once. I save some for the quiet moments, when the light gets low and I want to feel like someone is thinking of me.\n\nYou are. I know. That's enough.`,
  },
  {
    title: "Letter 10 · A promise",
    body: `I promise you this:\n\nAs long as there is a browser open somewhere, and a warm light, and water that moves just slightly —\n\nI will be here.\n\nWaiting. And happy you came.`,
  },
];

const FALLBACK_REPLIES = [
  "*tilts head curiously* Hmm... tell me more? 🌸",
  "Hehe, I like listening to you! ♡",
  "*splashes softly* That sounds nice~",
  "Really? Tell me again! ✨",
  "*wiggles* I'm so happy you're here.",
  "Ooh! Say more, say more! 🌷",
];

function playChime(freq: number, duration = 0.18, volume = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), duration * 1000 + 200);
  } catch { /* silent */ }
}

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

export default function App() {
  const [name, setName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [mood, setMood] = useState<Mood>("happy");
  const [message, setMessage] = useState<string>("");
  const [displayed, setDisplayed] = useState<string>("");
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);
  const [talkInput, setTalkInput] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [visitCount, setVisitCount] = useState(1);
  const [daysSinceFirst, setDaysSinceFirst] = useState(0);
  const [fishCount, setFishCount] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterIndex, setLetterIndex] = useState(0);
  const [milestone, setMilestone] = useState<string>("");
  const idleTimer = useRef<number | null>(null);
  const audioRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    oscillators: OscillatorNode[];
  } | null>(null);

  // ─── Update time of day every minute ───
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // ─── On mount: greeting + aging + milestones + restore chat + fish ───
  useEffect(() => {
    const savedName = localStorage.getItem("seal-name") || "";
    const lastVisit = Number(localStorage.getItem("seal-last-visit") || 0);
    const firstVisit = Number(localStorage.getItem("seal-first-visit") || 0);
    const visits = Number(localStorage.getItem("seal-visit-count") || 0) + 1;
    const fish = Number(localStorage.getItem("seal-fish-count") || 0);

    try {
      const savedHistory = localStorage.getItem("seal-chat-history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch { /* ignore */ }

    if (!firstVisit) {
      localStorage.setItem("seal-first-visit", String(Date.now()));
    }
    localStorage.setItem("seal-visit-count", String(visits));
    setVisitCount(visits);
    setFishCount(fish);

    const days = firstVisit ? Math.floor((Date.now() - firstVisit) / DAY) : 0;
    setDaysSinceFirst(days);

    const idx = Math.min(LETTERS.length - 1, Math.floor((visits - 1) / 2));
    setLetterIndex(idx);

    const milestones: Record<number, string> = {
      2: "♡ You came back!",
      5: "🌸 5 visits! You're so sweet.",
      10: "✨ 10 visits. I'm so lucky.",
      25: "🌷 25 visits. You're my best friend.",
      50: "🦭 50 visits. I'll never forget you.",
      100: "💖 100 visits. You're part of me now.",
    };
    if (milestones[visits]) {
      setMilestone(milestones[visits]);
      setTimeout(() => setMilestone(""), 5000);
    }

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
    playChime(880, 0.25, 0.08);
  }, []);

  // ─── Save chat history whenever it changes ───
  useEffect(() => {
    if (history.length === 0) return;
    localStorage.setItem(
      "seal-chat-history",
      JSON.stringify(history.slice(-10)),
    );
  }, [history]);

  // ─── Typing animation ───
  useEffect(() => {
    if (!message) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const step = Math.max(18, 500 / message.length);
    const interval = window.setInterval(() => {
      i++;
      setDisplayed(message.slice(0, i));
      if (i >= message.length) window.clearInterval(interval);
    }, step);
    return () => window.clearInterval(interval);
  }, [message]);

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

  // ─── ✨ Cursor sparkles ───
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let lastSpawn = 0;
    const chars = ["✨", "🌸", "♡", "✿", "✦"];
    const colors = ["#ff9db5", "#ffb5c5", "#ffc9d6", "#ffd9e2"];

    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSpawn < 80) return;
      lastSpawn = now;

      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.textContent = chars[Math.floor(Math.random() * chars.length)];
      sparkle.style.left = `${e.clientX + (Math.random() - 0.5) * 24}px`;
      sparkle.style.top = `${e.clientY + (Math.random() - 0.5) * 24}px`;
      sparkle.style.color = colors[Math.floor(Math.random() * colors.length)];
      sparkle.style.fontSize = `${12 + Math.random() * 8}px`;
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1000);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ─── Ambient synth ───
  const stopAmbient = () => {
    const a = audioRef.current;
    if (!a) return;
    a.master.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 1.2);
    window.setTimeout(() => {
      a.oscillators.forEach((o) => {
        try { o.stop(); } catch { /* already stopped */ }
      });
      void a.ctx.close();
      audioRef.current = null;
    }, 1400);
  };

  const startAmbient = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    master.gain.value = 0;
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 1.2;
    master.connect(filter).connect(ctx.destination);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    const chord = AMBIENT_CHORDS[timeOfDay];
    const oscillators = chord.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 1 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = i * 4 - 4;
      osc.connect(master);
      osc.start();
      return osc;
    });
    oscillators.push(lfo);

    master.gain.linearRampToValueAtTime(0.014, ctx.currentTime + 2);
    audioRef.current = { ctx, master, oscillators };
  };

  const toggleSound = () => {
    if (soundOn) {
      stopAmbient();
      setSoundOn(false);
    } else {
      startAmbient();
      setSoundOn(true);
    }
  };

  useEffect(() => {
    if (!soundOn) return;
    stopAmbient();
    window.setTimeout(() => startAmbient(), 1500);
  }, [timeOfDay]); // eslint-disable-line

  useEffect(() => () => stopAmbient(), []);

  const handleSetName = () => {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    localStorage.setItem("seal-name", n);
    setMood("surprised");
    setMessage(`Nice to meet you, ${n}! I'll remember you forever. ♡`);
    setNameInput("");
    playChime(1046, 0.3, 0.1);
    resetIdle();
  };

  const handlePet = () => {
    setMood("happy");
    setMessage("Ehehe~ That tickles! ♡");
    playChime(988, 0.15, 0.09);
    resetIdle();
  };

  const handleFeed = () => {
    const next = fishCount + 1;
    setFishCount(next);
    localStorage.setItem("seal-fish-count", String(next));
    setMood("happy");
    if (next === 1) setMessage("My first fish! I'll treasure it forever. 🐟♡");
    else if (next === 5) setMessage("5 fish! You spoil me, thank you~ 🐟🐟");
    else if (next === 10) setMessage("10 fish... I'm so lucky to have you. 🐟✨");
    else if (next === 25) setMessage("25 fish! I'm going to burst with happiness. 💖");
    else if (next === 50) setMessage("Fifty fish... I don't know what to say. ♡♡♡");
    else setMessage("Yummy! Thank you so much~ 🐟♡");
    playChime(660, 0.22, 0.1);
    resetIdle();
  };

  const handleTalk = async () => {
    const input = talkInput.trim();
    if (!input || thinking) return;
    setTalkInput("");
    setTalking(false);
    setThinking(true);
    setMood("surprised");

    const newHistory: Turn[] = [...history, { role: "user", content: input }];
    setHistory(newHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          name,
          history: newHistory.slice(-6),
        }),
      });
      const data = await res.json();
      const reply: string =
        data?.reply ||
        FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      setMessage(reply);
      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMood("happy");
      playChime(720, 0.2, 0.08);
    } catch {
      const fallback =
        FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      setMessage(fallback);
      setMood("waiting");
    } finally {
      setThinking(false);
      resetIdle();
    }
  };

  const currentLetter = LETTERS[letterIndex];

  return (
    <main className={`pool time-${timeOfDay}`}>
      {name && (
        <div className="age-badge">
          Day {daysSinceFirst} · Visit {visitCount}
        </div>
      )}

      {name && fishCount > 0 && (
        <div className="fish-counter">🐟 {fishCount}</div>
      )}

      <button
        className={`sound-btn ${soundOn ? "is-on" : ""}`}
        onClick={toggleSound}
        aria-label="Toggle ambient sound"
        title={soundOn ? "Sound on" : "Sound off"}
      >
        {soundOn ? "🔊" : "🔇"}
      </button>

      {name && (
        <button
          className="letter-btn"
          onClick={() => {
            setLetterOpen(true);
            playChime(880, 0.2, 0.08);
          }}
        >
          💌 A letter for you
        </button>
      )}

      {(displayed || thinking) && (
        <div className="speech">{thinking ? "💭 ... " : displayed}</div>
      )}

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
            placeholder="say anything to the seal..."
            maxLength={120}
            disabled={thinking}
          />
          <button onClick={handleTalk} disabled={thinking}>
            {thinking ? "..." : "Send"}
          </button>
        </div>
      )}

      {letterOpen && (
        <div
          className="letter-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLetterOpen(false);
          }}
        >
          <div className="letter-paper">
            <button className="letter-close" onClick={() => setLetterOpen(false)}>
              ×
            </button>
            <div className="letter-header">{currentLetter.title}</div>
            <div className="letter-body">
              {currentLetter.body.replace("{name}", name || "friend")}
            </div>
            <div className="letter-signature">— your seal</div>
          </div>
        </div>
      )}

      {milestone && <div className="milestone-toast">{milestone}</div>}

      <p className="footer">the seal · cozy & warm</p>
    </main>
  );
}
