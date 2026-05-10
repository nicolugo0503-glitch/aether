"use client";
import { useEffect, useState } from "react";

export function Typewriter({
  text, speed = 55, delay = 0, style, cursorColor = "#a78bfa",
}: {
  text: string;
  speed?: number;
  delay?: number;
  style?: React.CSSProperties;
  cursorColor?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, started]);

  return (
    <>
      <style>{`
        @keyframes tw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes tw-fade-cursor {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <span style={style}>
        {displayed}
        {!done && (
          <span style={{
            display: "inline-block",
            width: "0.08em",
            height: "1.1em",
            background: cursorColor,
            marginLeft: "0.05em",
            verticalAlign: "text-bottom",
            borderRadius: 1,
            animation: "tw-blink 0.75s step-end infinite",
          }} />
        )}
      </span>
    </>
  );
}
