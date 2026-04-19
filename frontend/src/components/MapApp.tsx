import { useState } from 'react';
import { IOSDevice } from './IOSDevice';

const CREAM = '#f4f1ea';
const INK = '#15211a';
const TERRA = '#d97757';

type Pin = { x: number; y: number; r: number; cert: boolean; name: string };

function MapBackground() {
  const pins: Pin[] = [
    { x: 32, y: 18, r: 11, cert: true, name: 'Fiorella' },
    { x: 44, y: 22, r: 9, cert: false, name: 'Taverna 12' },
    { x: 38, y: 30, r: 13, cert: true, name: 'Chloe' },
    { x: 56, y: 24, r: 8, cert: false, name: 'Osaka' },
    { x: 64, y: 32, r: 10, cert: true, name: 'Graines' },
    { x: 52, y: 38, r: 8, cert: false, name: 'Bixby' },
    { x: 24, y: 32, r: 9, cert: true, name: 'Pelé' },
    { x: 70, y: 20, r: 8, cert: false, name: 'Noon' },
    { x: 48, y: 12, r: 7, cert: true, name: 'Rook' },
    { x: 16, y: 24, r: 7, cert: false, name: 'Kome' },
    { x: 78, y: 28, r: 7, cert: false, name: 'Ori' },
  ];
  const roads = [
    'M -2 20 L 102 18',
    'M -2 28 L 102 30',
    'M -2 10 L 102 12',
    'M 18 -2 L 22 50',
    'M 34 -2 L 36 50',
    'M 52 -2 L 50 50',
    'M 68 -2 L 70 50',
    'M 84 -2 L 86 50',
  ];
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#e8e4d7' }} />
      <svg viewBox="0 0 100 45" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '45%' }}>
        <path d="M 8 6 Q 18 2 28 6 Q 30 14 22 16 Q 10 16 8 10 Z" fill="#cfddb8" />
        <path d="M 62 2 Q 78 0 86 8 Q 88 16 78 18 Q 64 16 62 8 Z" fill="#cfddb8" />
        <path d="M 44 30 Q 54 28 58 34 Q 56 40 46 40 Q 40 36 44 30 Z" fill="#cfddb8" />
        <path d="M -4 38 C 18 34, 36 44, 54 40 S 88 36, 106 40 L 106 48 L -4 48 Z" fill="#b9d2d9" />
        {roads.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#cfc9b8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d={d} stroke="#ffffff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <path d="M 4 44 L 24 30 L 48 22 L 78 10" stroke="#f2cf7a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 4 44 L 24 30 L 48 22 L 78 10" stroke="#f7e2a8" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>

      <div style={{ position: 'absolute', top: '6%', left: '14%', fontFamily: 'Inter, system-ui', fontSize: 8.5, letterSpacing: 0.3, color: '#5a7045', fontWeight: 600 }}>Boom Island Park</div>
      <div style={{ position: 'absolute', top: '7%', left: '66%', fontFamily: 'Inter, system-ui', fontSize: 8.5, letterSpacing: 0.3, color: '#5a7045', fontWeight: 600 }}>Nicollet Island</div>
      <div style={{ position: 'absolute', top: '26%', left: '4%', fontFamily: 'Inter, system-ui', fontSize: 8, letterSpacing: 0.3, color: '#7a6b42', fontWeight: 600 }}>Target Field</div>
      <div style={{ position: 'absolute', top: '17%', left: '38%', fontFamily: 'Inter, system-ui', fontSize: 7.5, letterSpacing: 2, color: 'rgba(90,76,50,0.7)', fontWeight: 600, textTransform: 'uppercase' }}>7TH ST</div>
      <div style={{ position: 'absolute', top: '29%', left: '62%', fontFamily: 'Inter, system-ui', fontSize: 7.5, letterSpacing: 2, color: 'rgba(90,76,50,0.7)', fontWeight: 600, textTransform: 'uppercase' }}>SE MAIN</div>

      {pins.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -100%)', zIndex: p.name === 'Chloe' ? 4 : 3 }}>
          <svg width={p.r * 1.8} height={p.r * 2.4} viewBox="0 0 18 24" style={{ display: 'block', filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.35))' }}>
            <path d="M 9 23.5 C 9 23.5, 1 13, 1 8 A 8 8 0 0 1 17 8 C 17 13, 9 23.5, 9 23.5 Z" fill={p.cert ? '#4b8a3e' : '#d93a2a'} stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="9" cy="8" r="3" fill="#ffffff" />
          </svg>
        </div>
      ))}
    </>
  );
}

export function MapApp({ width = 380, height = 760 }: { width?: number; height?: number }) {
  const [open, setOpen] = useState(true);
  const items = [
    { name: 'Grilled House Bread', tags: [{ t: 'gluten', warn: true }] },
    { name: 'Castelvetrano & Kalamata Olives', tags: [{ t: 'No allergens', warn: false }] },
    { name: 'Hamachi Crudo', tags: [{ t: 'fish', warn: true }] },
    { name: 'Fresh Ricotta', tags: [{ t: 'dairy', warn: true }, { t: 'gluten', warn: true }] },
  ];
  return (
    <IOSDevice width={width} height={height}>
      <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden', background: '#e8e4d7' }}>
        <MapBackground />

        <div style={{ position: 'absolute', top: 14, left: 18, right: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, system-ui', fontSize: 13, color: INK, fontWeight: 600, zIndex: 6 }}>
          <span>10:18</span>
          <span style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(21,33,26,0.7)' }}>●●●● ⟋ ▮86</span>
        </div>

        <div style={{ position: 'absolute', top: 56, left: 14, background: 'rgba(244,241,234,0.95)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(21,33,26,0.12)', borderRadius: 12, padding: '10px 14px 11px', fontFamily: 'Inter, system-ui', fontSize: 11, color: INK, lineHeight: 1.55, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4b8a3e' }} />
            <span>Allersight Certified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d93a2a' }} />
            <span>Restaurant</span>
          </div>
        </div>

        <div
          key={open ? 'open' : 'peek'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: open ? '35%' : '82%',
            bottom: 0,
            background: CREAM,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: '10px 18px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -18px 40px rgba(0,0,0,0.22)',
            transition: 'top 420ms cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
          }}
        >
          <button onClick={() => setOpen((v) => !v)} style={{ background: 'transparent', border: 'none', padding: '4px 0 10px', cursor: 'pointer', display: 'block', width: '100%' }}>
            <div style={{ width: 36, height: 4, background: 'rgba(21,33,26,0.22)', borderRadius: 999, margin: '6px auto 0' }} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 2px 14px' }}>
            <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 32, color: INK, letterSpacing: -0.6, lineHeight: 1 }}>Chloe</div>
            <div style={{ border: `1px solid ${TERRA}`, borderRadius: 10, padding: '5px 14px 4px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontFamily: 'Inter, system-ui', fontWeight: 700, fontSize: 20, color: TERRA, letterSpacing: -0.3, lineHeight: 1 }}>61</div>
              <div style={{ fontFamily: 'Inter, system-ui', fontSize: 8, letterSpacing: 1.5, color: TERRA, fontWeight: 600, marginTop: 3 }}>ALLERSENSE</div>
            </div>
          </div>

          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: TERRA, fontWeight: 700, marginBottom: 8 }}>Menu analysis</div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
            {items.map((it, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '11px 14px', boxShadow: '0 1px 2px rgba(21,33,26,0.04)', border: '0.5px solid rgba(21,33,26,0.06)' }}>
                <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, fontWeight: 700, color: INK, letterSpacing: -0.1, marginBottom: 6 }}>{it.name}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {it.tags.map((tg, j) => (
                    <span key={j} style={{ padding: '3px 9px', borderRadius: 999, fontFamily: 'Inter, system-ui', fontSize: 10.5, fontWeight: 500, background: tg.warn ? 'rgba(217,119,87,0.18)' : 'rgba(21,33,26,0.08)', color: tg.warn ? '#a1452a' : 'rgba(21,33,26,0.75)' }}>
                      {tg.t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{ marginTop: 14, height: 44, borderRadius: 999, background: INK, color: CREAM, border: 'none', fontFamily: 'Inter, system-ui', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </IOSDevice>
  );
}
