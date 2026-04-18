import { useEffect, useState } from 'react';
import { CREAM, INK, TERRA } from './palette';

const STEPS: Array<{ at: number; text: string }> = [
  { at: 0, text: 'Framing subject' },
  { at: 25, text: 'Reading label' },
  { at: 55, text: 'Cross-checking ingredients' },
  { at: 82, text: 'Matching your profile' },
];

export default function ScanningScene({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Framing subject');

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const DUR = 3200;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - t0) / DUR) * 100);
      setProgress(p);
      const s = [...STEPS].reverse().find((st) => p >= st.at);
      if (s) setStatus(s.text);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onComplete, 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: INK,
        color: CREAM,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 45%, #c68750 0%, #8a5a33 40%, transparent 70%),
            radial-gradient(circle at 65% 55%, #d9a066 0%, #a6714a 35%, transparent 65%),
            radial-gradient(circle at 50% 50%, #3a2a1e 0%, #1a1410 100%)
          `,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          mixBlendMode: 'overlay',
          background:
            'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg 2deg, transparent 2deg 4deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 40,
          right: 40,
          bottom: 240,
          pointerEvents: 'none',
        }}
      >
        {[
          { k: 'tl', top: 0, left: 0, isTop: true, isLeft: true },
          { k: 'tr', top: 0, right: 0, isTop: true, isLeft: false },
          { k: 'bl', bottom: 0, left: 0, isTop: false, isLeft: true },
          { k: 'br', bottom: 0, right: 0, isTop: false, isLeft: false },
        ].map((c) => (
          <div
            key={c.k}
            style={{
              position: 'absolute',
              top: c.top,
              left: c.left,
              bottom: c.bottom,
              right: c.right,
              width: 28,
              height: 28,
              borderTop: c.isTop ? `1.5px solid ${CREAM}` : 'none',
              borderBottom: !c.isTop ? `1.5px solid ${CREAM}` : 'none',
              borderLeft: c.isLeft ? `1.5px solid ${CREAM}` : 'none',
              borderRight: !c.isLeft ? `1.5px solid ${CREAM}` : 'none',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${progress}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${TERRA}, transparent)`,
            boxShadow: `0 0 12px ${TERRA}`,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 0,
          right: 0,
          padding: '0 28px',
          fontFamily: '"Inter", system-ui',
          fontSize: 10,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: CREAM,
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: 0.85,
        }}
      >
        <span>● Live scan</span>
        <span>{Math.floor(progress)}%</span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 20,
          right: 20,
          background: 'rgba(20,28,22,0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '0.5px solid rgba(244,241,234,0.15)',
          borderRadius: 22,
          padding: '18px 22px',
        }}
      >
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 10,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: TERRA,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Investigating
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 26,
            color: CREAM,
            lineHeight: 1,
            marginBottom: 14,
            letterSpacing: -0.3,
          }}
        >
          {status}…
        </div>
        <div
          style={{
            height: 2,
            background: 'rgba(244,241,234,0.15)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: TERRA,
              transition: 'width 80ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}
