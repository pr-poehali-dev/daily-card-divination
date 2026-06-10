import { useState, useRef, useCallback } from "react";

const CARDS = [
  {
    id: 1,
    image: "https://cdn.poehali.dev/projects/ade8ee66-2862-4423-855f-c733c837cee6/bucket/75edcdbb-4e9e-4655-bb0b-9c88284069a9.jpg",
    title: "Зелёный друг подстрахует",
  },
  {
    id: 2,
    image: "https://cdn.poehali.dev/projects/ade8ee66-2862-4423-855f-c733c837cee6/bucket/24b22f57-d847-47aa-9685-abfef4371426.jpg",
    title: "Вижу... удачу на горе найдёшь",
  },
  {
    id: 3,
    image: "https://cdn.poehali.dev/projects/ade8ee66-2862-4423-855f-c733c837cee6/bucket/1bcb53e3-d525-451d-a5c8-473057569289.jpg",
    title: "Придётся жить в коробке",
  },
  {
    id: 4,
    image: "https://cdn.poehali.dev/projects/ade8ee66-2862-4423-855f-c733c837cee6/bucket/4ce9216b-f4ab-48ba-a56c-6d44a7de739a.jpg",
    title: "Сначала подними социальный рейтинг",
  },
  {
    id: 5,
    image: "https://cdn.poehali.dev/projects/ade8ee66-2862-4423-855f-c733c837cee6/bucket/27e39b09-9987-4cc4-9137-0e06142ded04.jpg",
    title: "Всё потеряешь",
  },
  {
    id: 6,
    image: "https://cdn.poehali.dev/projects/e6919357-e05c-48a9-a4cd-6e83bb926f6f/bucket/7faac40b-6c11-45a3-9fcf-514585b97c96.jpg",
    title: "Три дня и всё будет",
  },
  {
    id: 7,
    image: "https://cdn.poehali.dev/projects/e6919357-e05c-48a9-a4cd-6e83bb926f6f/bucket/229a9f6e-7a84-458b-9826-dc8801a29923.jpg",
    title: "Да Вея ограбишь",
  },
  {
    id: 8,
    image: "https://cdn.poehali.dev/projects/e6919357-e05c-48a9-a4cd-6e83bb926f6f/bucket/9e195c0a-cc9b-4480-89e7-23d9795fcded.jpg",
    title: "Всё получишь, но ждать придётся долго",
  },
  {
    id: 9,
    image: "https://cdn.poehali.dev/projects/e6919357-e05c-48a9-a4cd-6e83bb926f6f/bucket/19eea8d7-bffa-4503-9c5c-53c7be8046ad.jpg",
    title: "Удача на твоей стороне",
  },
];

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function getAudioContext(): AudioContext | null {
  const w = window as WebkitWindow;
  const Ctx = window.AudioContext || w.webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

function playFlipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const duration = 0.5;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const freq = 600 + (t / duration) * 800;
    const envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 40));
    const noise = (Math.random() - 0.5) * 0.15;
    data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.3 + noise) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 1.5;
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

function playRevealSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const startTime = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });
}

const StarParticles = () => {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 3 + 1.5,
    delay: Math.random() * 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star-particle"
          style={{
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            "--duration": `${s.duration}s`,
            "--delay": `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default function Index() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState<(typeof CARDS)[0] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const pickRandomCard = useCallback(() => {
    return CARDS[Math.floor(Math.random() * CARDS.length)];
  }, []);

  const flipOpen = useCallback(() => {
    const card = pickRandomCard();
    setCurrentCard(card);
    playFlipSound();
    setIsFlipped(true);
    setTimeout(() => {
      playRevealSound();
      setIsAnimating(false);
    }, 700);
  }, [pickRandomCard]);

  const flipClose = useCallback((callback?: () => void) => {
    playFlipSound();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCard(null);
      if (callback) callback();
      else setIsAnimating(false);
    }, 700);
  }, []);

  const handleCardClick = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (isFlipped) {
      flipClose();
    } else {
      flipOpen();
    }
  }, [isFlipped, isAnimating, flipOpen, flipClose]);

  const handleButtonClick = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (isFlipped) {
      flipClose(() => {
        setTimeout(() => flipOpen(), 200);
      });
    } else {
      flipOpen();
    }
  }, [isFlipped, isAnimating, flipOpen, flipClose]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden stars-bg"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}
    >
      <StarParticles />

      {/* Title */}
      <div className="relative z-10 mb-8 text-center px-4">
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(1.2rem, 4vw, 2rem)",
            letterSpacing: "0.3em",
            color: "var(--gold)",
            textShadow: "0 0 20px rgba(201,168,76,0.5), 0 2px 4px rgba(0,0,0,0.8)",
            fontWeight: 700,
          }}
        >
          ОРАКУЛ СУДЬБЫ
        </h1>
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
            marginTop: "8px",
          }}
        />
        <p
          style={{
            color: "rgba(201,168,76,0.55)",
            fontSize: "0.82rem",
            letterSpacing: "0.15em",
            marginTop: "6px",
            fontStyle: "italic",
          }}
        >
          {isFlipped
            ? "нажми на карту, чтобы закрыть"
            : "нажми на карту, чтобы узнать судьбу"}
        </p>
      </div>

      {/* Card */}
      <div
        className={`relative z-10 card-scene ${!isFlipped ? "card-floating" : ""}`}
        style={{ width: "clamp(200px, 48vw, 290px)", height: "clamp(330px, 78vw, 470px)" }}
        onClick={handleCardClick}
      >
        <div
          ref={cardRef}
          className={`card-inner cursor-pointer ${isFlipped ? "flipped" : ""} ${!isFlipped ? "card-glow" : ""}`}
        >
          {/* Front — рубашка */}
          <div className="card-face gold-border damask-pattern">
            {[
              { top: 6, left: 6 },
              { top: 6, right: 6 },
              { bottom: 6, left: 6 },
              { bottom: 6, right: 6 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2.5px solid var(--gold)",
                  boxShadow: "0 0 6px rgba(201,168,76,0.5)",
                  zIndex: 2,
                  ...pos,
                }}
              />
            ))}

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  border: "2px solid var(--gold)",
                  transform: "rotate(45deg)",
                  boxShadow: "0 0 20px rgba(201,168,76,0.3), inset 0 0 20px rgba(201,168,76,0.05)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 8,
                    border: "1px solid rgba(201,168,76,0.4)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      background: "var(--gold)",
                      borderRadius: "50%",
                      boxShadow: "0 0 10px var(--gold)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.3em",
                  color: "rgba(201,168,76,0.65)",
                  textAlign: "center",
                }}
              >
                ✦ FATE ✦
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                inset: 10,
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 10,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 15,
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: 7,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Back — изображение */}
          <div className="card-face card-back gold-border" style={{ background: "var(--purple-card)" }}>
            {currentCard && (
              <img
                src={currentCard.image}
                alt={currentCard.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 13,
                  display: "block",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="relative z-10 mt-10">
        <button
          className="btn-mystical"
          onClick={handleButtonClick}
          style={{
            padding: "14px 44px",
            borderRadius: 8,
            fontSize: "clamp(0.8rem, 2.5vw, 0.95rem)",
          }}
        >
          ✦ Повезёт или нет? ✦
        </button>
      </div>

      <p
        className="relative z-10 mt-5"
        style={{
          color: "rgba(201,168,76,0.28)",
          fontSize: "0.72rem",
          letterSpacing: "0.15em",
          fontStyle: "italic",
        }}
      >
        судьба уже решена
      </p>
    </div>
  );
}