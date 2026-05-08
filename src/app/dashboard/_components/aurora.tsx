"use client";
import { useEffect, useRef } from "react";

export function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* blob 1 */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)",
          top: "-200px",
          left: "-100px",
          filter: "blur(80px)",
          animation: "aurora-drift1 18s ease-in-out infinite alternate",
        }}
      />
      {/* blob 2 */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.10) 0%, transparent 70%)",
          top: "100px",
          right: "-80px",
          filter: "blur(70px)",
          animation: "aurora-drift2 22s ease-in-out infinite alternate",
        }}
      />
      {/* blob 3 */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          bottom: "0px",
          left: "30%",
          filter: "blur(60px)",
          animation: "aurora-drift3 26s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes aurora-drift1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(60px, 40px) scale(1.12); }
          100% { transform: translate(20px, 80px) scale(0.95); }
        }
        @keyframes aurora-drift2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-40px, 60px) scale(1.08); }
          100% { transform: translate(-20px, -30px) scale(1.15); }
        }
        @keyframes aurora-drift3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(30px, -50px) scale(0.9); }
          100% { transform: translate(-40px, 20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
