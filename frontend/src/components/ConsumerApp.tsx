import { useEffect, useRef, useState } from 'react';
import { IOSDevice } from './IOSDevice';

const CREAM = '#f4f1ea';
const INK = '#15211a';
const GREEN = '#1f3d2b';
const TERRA = '#d97757';
const SAFE = '#6e9a5e';
const MUTED = 'rgba(21,33,26,0.55)';

type Tone = 'safe' | 'danger' | 'caution';
type Scene = 'idle' | 'scanning' | 'results';

function FoodScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0c0804', overflow: 'hidden' }}>
      <img
        alt="Pad thai"
        src="https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80"
        onError={(e) => {
          const img = e.currentTarget;
          img.onerror = null;
          img.src = 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=900&q=80';
        }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
    </div>
  );
}

function FriendRow({ name, status, detail, tone, avatar }: { name: string; status: string; detail: string; tone: Tone; avatar: string }) {
  const palette = {
    safe: { bg: 'rgba(110,154,94,0.14)', fg: '#4b7a3f', border: 'rgba(110,154,94,0.35)' },
    danger: { bg: 'rgba(217,119,87,0.14)', fg: '#a1452a', border: 'rgba(217,119,87,0.45)' },
    caution: { bg: 'rgba(217,163,78,0.15)', fg: '#8a6418', border: 'rgba(217,163,78,0.4)' },
  }[tone];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '0.5px solid rgba(21,33,26,0.1)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatar, border: '0.5px solid rgba(21,33,26,0.12)' }} />
      <div>
        <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 19, color: INK, lineHeight: 1.1, letterSpacing: -0.3 }}>{name}</div>
        <div style={{ fontFamily: '"Inter", system-ui', fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.3 }}>{detail}</div>
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: palette.fg, fontWeight: 700, padding: '5px 9px', background: palette.bg, borderRadius: 5, border: `0.5px solid ${palette.border}`, whiteSpace: 'nowrap' }}>{status}</div>
    </div>
  );
}

function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ height: '100%', width: '100%', background: CREAM, color: INK, padding: '88px 26px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 30, color: INK, letterSpacing: -0.4, marginBottom: 18 }}>
        <span>aller</span>
        <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${TERRA}`, marginLeft: 2, position: 'relative', top: -1 }}>
          <span style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: TERRA, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </span>
        <span>sight</span>
      </div>
      <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 38, lineHeight: 1.02, letterSpacing: -1, color: INK, textWrap: 'pretty', marginTop: 6 }}>
        <span>Know </span>
        <span style={{ fontStyle: 'italic', color: GREEN }}>exactly </span>
        <span>who can </span>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ fontStyle: 'italic' }}>eat it.</span>
          <span style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 3, background: TERRA, opacity: 0.85, zIndex: -1 }} />
        </span>
      </div>
      <div style={{ fontFamily: '"Inter", system-ui', fontSize: 12.5, color: MUTED, marginTop: 16, lineHeight: 1.5, maxWidth: 290 }}>
        Point the camera at the dish. We'll read the ingredients and cross-check every friend at the table.
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
        <button onClick={onStart} style={{ appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 160, height: 160, borderRadius: '50%', border: `1.5px solid ${GREEN}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1px solid ${TERRA}`, opacity: 0.4, animation: 'alPulse 2.2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: `1px solid ${TERRA}`, opacity: 0.2, animation: 'alPulse 2.2s ease-out infinite', animationDelay: '0.7s' }} />
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: TERRA, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CREAM, fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 24, boxShadow: '0 10px 30px rgba(217,119,87,0.4)' }}>scan</div>
            {[0, 90, 180, 270].map((deg) => (
              <div key={deg} style={{ position: 'absolute', top: '50%', left: '50%', width: 12, height: 1, background: GREEN, transform: `rotate(${deg}deg) translate(76px, 0)`, transformOrigin: '0 0' }} />
            ))}
          </div>
          <div style={{ fontFamily: '"Inter", system-ui', fontSize: 10.5, letterSpacing: 2.2, textTransform: 'uppercase', color: GREEN, fontWeight: 600 }}>Tap to scan</div>
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: '"Inter", system-ui', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: MUTED, fontWeight: 500, marginTop: 6 }}>
        <div><div>3 friends</div><div>at the table</div></div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 17, letterSpacing: 0, textTransform: 'none', color: INK, marginBottom: 2 }}>est. 2026</div>
          <div>One photo,</div><div>whole table</div>
        </div>
      </div>
    </div>
  );
}

function ScanningScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Framing subject');
  const doneRef = useRef(false);

  useEffect(() => {
    const steps = [
      { at: 0, text: 'Framing subject' },
      { at: 22, text: 'Reading the plate' },
      { at: 50, text: 'Cross-checking ingredients' },
      { at: 78, text: 'Matching 3 friend profiles' },
    ];
    let raf = 0;
    const t0 = performance.now();
    const DUR = 3000;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - t0) / DUR) * 100);
      setProgress(p);
      const s = [...steps].reverse().find((s) => p >= s.at);
      if (s) setStatus(s.text);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onComplete, 380);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  type Corner = ['tl' | 'tr' | 'bl' | 'br', number | 'auto', number | 'auto', boolean, boolean];
  const corners: Corner[] = [
    ['tl', 0, 0, true, true],
    ['tr', 0, 'auto', true, false],
    ['bl', 'auto', 0, false, true],
    ['br', 'auto', 'auto', false, false],
  ];

  return (
    <div style={{ height: '100%', width: '100%', background: INK, color: CREAM, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 45%, #c68750 0%, #8a5a33 40%, transparent 70%), radial-gradient(circle at 65% 55%, #d9a066 0%, #a6714a 35%, transparent 65%), radial-gradient(circle at 50% 50%, #3a2a1e 0%, #1a1410 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay', background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg 2deg, transparent 2deg 4deg)' }} />
      <div style={{ position: 'absolute', top: 108, left: 34, right: 34, bottom: 220, pointerEvents: 'none' }}>
        {corners.map(([k, top, left, isTop, isLeft]) => (
          <div
            key={k}
            style={{
              position: 'absolute',
              top: top === 'auto' ? 'auto' : top,
              left: left === 'auto' ? 'auto' : left,
              bottom: top === 'auto' ? 0 : 'auto',
              right: left === 'auto' ? 0 : 'auto',
              width: 26,
              height: 26,
              borderTop: isTop ? `1.5px solid ${CREAM}` : 'none',
              borderBottom: !isTop ? `1.5px solid ${CREAM}` : 'none',
              borderLeft: isLeft ? `1.5px solid ${CREAM}` : 'none',
              borderRight: !isLeft ? `1.5px solid ${CREAM}` : 'none',
            }}
          />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${progress}%`, height: 2, background: `linear-gradient(90deg, transparent, ${TERRA}, transparent)`, boxShadow: `0 0 12px ${TERRA}` }} />
      </div>
      <div style={{ position: 'absolute', top: 68, left: 0, right: 0, padding: '0 26px', fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: CREAM, fontWeight: 500, display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
        <span>● Live scan</span>
        <span>{Math.floor(progress)}%</span>
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 18, right: 18, background: 'rgba(20,28,22,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '0.5px solid rgba(244,241,234,0.15)', borderRadius: 20, padding: '16px 20px' }}>
        <div style={{ fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: TERRA, fontWeight: 600, marginBottom: 6 }}>Investigating</div>
        <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 24, color: CREAM, lineHeight: 1, marginBottom: 12, letterSpacing: -0.3 }}>{status}…</div>
        <div style={{ height: 2, background: 'rgba(244,241,234,0.15)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: TERRA, transition: 'width 80ms linear' }} />
        </div>
      </div>
    </div>
  );
}

function FriendPill({ name, tone, selected, avatar, onClick }: { name: string; tone: Tone; selected: boolean; avatar: string; onClick: () => void }) {
  const border = selected
    ? tone === 'danger'
      ? TERRA
      : tone === 'caution'
        ? '#b8943b'
        : GREEN
    : 'rgba(21,33,26,0.2)';
  const bg = selected
    ? tone === 'danger'
      ? 'rgba(217,119,87,0.14)'
      : tone === 'caution'
        ? 'rgba(217,163,78,0.14)'
        : 'rgba(110,154,94,0.14)'
    : CREAM;
  const dot = tone === 'danger' ? TERRA : tone === 'caution' ? '#b8943b' : SAFE;
  return (
    <button
      onClick={onClick}
      style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, border: `${selected ? 1.2 : 0.5}px solid ${border}`, background: bg, cursor: 'pointer', position: 'relative' }}
    >
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: avatar, border: '0.5px solid rgba(21,33,26,0.12)', position: 'relative' }}>
        <span style={{ position: 'absolute', right: -1, bottom: -1, width: 9, height: 9, borderRadius: '50%', background: dot, border: `1.5px solid ${CREAM}` }} />
      </span>
      <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 15, color: INK, letterSpacing: -0.2, lineHeight: 1 }}>{name}</span>
    </button>
  );
}

function ResultsScreen({ onRestart }: { onRestart: () => void }) {
  const friends: { name: string; tone: Tone; avatar: string }[] = [
    { name: 'Priya', tone: 'safe', avatar: 'radial-gradient(circle at 40% 35%, #e9c59a 0%, #b88858 50%, #6a3e1e 100%)' },
    { name: 'Marcus', tone: 'danger', avatar: 'radial-gradient(circle at 40% 35%, #d4a578 0%, #8a5432 50%, #4a2818 100%)' },
    { name: 'June', tone: 'safe', avatar: 'radial-gradient(circle at 40% 35%, #f0d4b0 0%, #a8764a 50%, #5a3a20 100%)' },
    { name: 'Theo', tone: 'caution', avatar: 'radial-gradient(circle at 40% 35%, #c99a6a 0%, #7a4e28 50%, #3a2010 100%)' },
    { name: 'Anya', tone: 'safe', avatar: 'radial-gradient(circle at 40% 35%, #ead0a8 0%, #a87044 50%, #5a3218 100%)' },
  ];
  const details: Record<string, { status: string; detail: string }> = {
    Priya: { status: 'Safe', detail: 'no allergens in this dish' },
    Marcus: { status: 'Do not', detail: 'peanut · severe — trace oil in wok' },
    June: { status: 'Safe', detail: 'gluten — noodles are rice · confirmed' },
    Theo: { status: 'Check', detail: 'shellfish — fish-sauce base flagged' },
    Anya: { status: 'Safe', detail: 'profile clear against this dish' },
  };
  const [selected, setSelected] = useState('Marcus');
  const sel = friends.find((f) => f.name === selected)!;

  return (
    <div style={{ height: '100%', width: '100%', background: CREAM, color: INK, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ marginTop: 58, height: 200, position: 'relative', overflow: 'hidden' }}>
        <FoodScene />
        <div style={{ position: 'absolute', top: 40, left: '52%', display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.4px solid #fff', background: 'rgba(217,119,87,0.75)', boxShadow: '0 0 0 2px rgba(217,119,87,0.22), 0 0 14px rgba(217,119,87,0.55)' }} />
          <div style={{ width: 1, height: 14, background: 'rgba(244,241,234,0.45)', marginLeft: 4 }} />
          <div style={{ background: 'rgba(10,16,13,0.85)', backdropFilter: 'blur(10px)', border: '0.5px solid rgba(217,119,87,0.5)', borderRadius: 8, padding: '5px 9px', fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#f0b89a', fontWeight: 600, whiteSpace: 'nowrap' }}>Peanut · detected</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, background: 'rgba(14,22,17,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '0.5px solid rgba(244,241,234,0.18)', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: '"Inter", system-ui', fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(244,241,234,0.55)', fontWeight: 600 }}>Identified</div>
            <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 20, color: CREAM, letterSpacing: -0.3, lineHeight: 1.1, marginTop: 3, whiteSpace: 'nowrap' }}>Pad thai</div>
          </div>
          <div style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(110,154,94,0.2)', border: '0.5px solid rgba(110,154,94,0.45)', color: '#9dc08e', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>3 / 5 safe</div>
        </div>
      </div>

      <div style={{ padding: '18px 20px 2px' }}>
        <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 26, color: INK, letterSpacing: -0.6, lineHeight: 1.15 }}>
          Who can <span style={{ color: TERRA }}>eat this?</span>
        </div>
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: MUTED, marginTop: 4 }}>Tap a friend to see their verdict</div>
      </div>

      <div style={{ marginTop: 12, padding: '0 20px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <style>{`.no-sb::-webkit-scrollbar{display:none}`}</style>
        <div className="no-sb" style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          {friends.map((f) => (
            <FriendPill key={f.name} name={f.name} tone={f.tone} avatar={f.avatar} selected={f.name === selected} onClick={() => setSelected(f.name)} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <FriendRow name={sel.name} status={details[sel.name].status} detail={details[sel.name].detail} tone={sel.tone} avatar={sel.avatar} />
      </div>

      <div style={{ padding: '18px 20px 28px', marginTop: 'auto', display: 'flex', gap: 10 }}>
        <button onClick={onRestart} style={{ flex: 1, height: 46, borderRadius: 999, background: INK, color: CREAM, border: 'none', fontFamily: '"Inter", system-ui', fontSize: 13, fontWeight: 600, letterSpacing: 0.3, cursor: 'pointer' }}>Scan another</button>
        <button style={{ width: 46, height: 46, borderRadius: '50%', background: 'transparent', border: `1px solid ${INK}`, color: INK, fontSize: 18, fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', cursor: 'pointer' }}>♡</button>
      </div>
    </div>
  );
}

export function ConsumerApp({ width = 360, height = 720, initial = 'idle' }: { width?: number; height?: number; initial?: Scene }) {
  const [scene, setScene] = useState<Scene>(initial);
  return (
    <IOSDevice width={width} height={height}>
      {scene === 'idle' && <IdleScreen onStart={() => setScene('scanning')} />}
      {scene === 'scanning' && <ScanningScreen onComplete={() => setScene('results')} />}
      {scene === 'results' && <ResultsScreen onRestart={() => setScene('idle')} />}
    </IOSDevice>
  );
}

export function HeroPhone({ width = 360, height = 720 }: { width?: number; height?: number }) {
  return <ConsumerApp width={width} height={height} initial="results" />;
}
