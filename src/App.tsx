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

const GREETINGS = {
  firstTime: "Oh. You're new here.",
  back: (name: string) => `You came back, ${name}.`,
  soon: (name: string) => `Back so soon, ${name}?`,
  oneDay: (name: string) => `You were gone a whole day, ${name}.`,
  threeDays: (name: string) => `I counted, ${name}. Three days.`,
  longTime: () => `I thought you forgot about me.`,
};

export default function App() {
  const [name, setName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [mood, setMood] = useState<Mood>("happy");
  const [message, setMessage] = useState<string>("");
  const [talking, setTalking] = useState(false);
  const [talkInput, setTalkInput] = useState("");
  const idleTimer = useRef<number | null>(null);

  // On mount: read localStorage, decide greeting
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
        setMessage(GREETINGS.longTime());
      }
    }

    localStorage.setItem("seal-last-visit", String(Date.now()));
  }, []);

  // Idle → sleepy
  const resetIdle = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setMood("sleepy");
      setMessage("... zzz ...");
    }, IDLE_MS);
  };

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);

  const handleSetName = () => {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    localStorage.setItem("seal-name", n);
    setMood("surprised");
    setMessage(`"${n}"? ...I'll remember that.`);
    setNameInput("");
    resetIdle();
  };

  const handlePet = () => {
    setMood("happy");
    setMessage("♥ (it wiggles happily)");
    resetIdle();
  };

  const handleFeed = () => {
    setMood("happy");
    setMessage("Nom nom. Thank you.");
    resetIdle();
  };

  const handleTalk = () => {
    const input = talkInput.trim().toLowerCase();
    if (!input) return;

    let reply = "I don't know what that means. But I'm glad you said it.";
    let newMood: Mood = "surprised";

    if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
      reply = `Hi, ${name || "you"}.`;
      newMood = "happy";
    } else if (input.includes("love") || input.includes("cute") || input.includes("adorable")) {
      reply = "Don't say that. ...Say it again.";
      newMood = "surprised";
    } else if (input.includes("sad") || input.includes("tired") || input.includes("lonely")) {
      reply = "Me too, sometimes. Sit with me.";
      newMood = "waiting";
    } else if (input.includes("dream")) {
      reply = "I don't dream. I just wait. Is that the same thing?";
      newMood = "waiting";
    } else if (input.includes("where") || input.includes("why")) {
      reply = "I don't know. I woke up here. There was water. And now there's you.";
      newMood = "surprised";
    } else if (input.includes("bye") || input.includes("goodbye")) {
      reply = "Already? ...Okay. I'll be here.";
      newMood = "waiting";
    }

    setMessage(reply);
    setMood(newMood);
    setTalkInput("");
    setTalking(false);
    resetIdle();
  };

  return (
    <main className="pool">
      <div className="caustics" />

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
            placeholder="what should I call you?"
            maxLength={20}
          />
          <button onClick={handleSetName}>Tell</button>
        </div>
      )}

      {name && !talking && (
        <div className="actions">
          <button onClick={handlePet}>Pet</button>
          <button onClick={handleFeed}>Feed</button>
          <button onClick={() => setTalking(true)}>Talk</button>
        </div>
      )}

      {talking && (
        <div className="talk-prompt">
          <input
            autoFocus
            value={talkInput}
            onChange={(e) => setTalkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTalk()}
            placeholder="say something to the seal..."
            maxLength={100}
          />
          <button onClick={handleTalk}>Send</button>
        </div>
      )}

      <p className="footer">the seal · still here</p>
    </main>
  );
}
