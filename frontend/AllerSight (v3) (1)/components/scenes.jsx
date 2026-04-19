// scenes.jsx — Allerlens splash + scan demo
// Editorial palette: cream #f4f1ea, deep green #1f3d2b, terracotta #d97757

const CREAM = '#f4f1ea';
const GREEN = '#1f3d2b';
const TERRA = '#d97757';
const INK = '#15211a';
const MUTED = 'rgba(21,33,26,0.55)';

// ─────────────────────────────────────────────────────────────
// LOGO — 3 variants. Serif italic "aller" + lens
// ─────────────────────────────────────────────────────────────
function Logo({ variant = 'a', size = 1, color = INK, accent = TERRA }) {
  const s = size;
  if (variant === 'a') {
    // Wordmark: aller·lens with lens-o
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'baseline',
        fontFamily: '"Instrument Serif", "Playfair Display", Georgia, serif',
        fontStyle: 'italic', fontWeight: 400,
        fontSize: 38 * s, color, letterSpacing: -0.5,
        lineHeight: 1,
      }}>
        <span>aller</span>
        <span style={{
          display: 'inline-block',
          width: 30 * s, height: 30 * s,
          borderRadius: '50%',
          border: `${2 * s}px solid ${accent}`,
          marginLeft: 2 * s, marginRight: 1 * s,
          position: 'relative',
          top: -2 * s,
        }}>
          <span style={{
            position: 'absolute',
            width: 6 * s, height: 6 * s, borderRadius: '50%',
            background: accent,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          }} />
        </span>
      </div>
    );
  }
  if (variant === 'b') {
    // Stacked: "aller" over "lens" with monocle
    return (
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
        fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
        color, lineHeight: 0.92,
      }}>
        <span style={{ fontSize: 44 * s, letterSpacing: -1 }}>aller</span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 * s }}>
          <span style={{
            width: 20 * s, height: 20 * s, borderRadius: '50%',
            border: `${1.5 * s}px solid ${accent}`,
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 44 * s, letterSpacing: -1 }}>lens</span>
        </div>
      </div>
    );
  }
  // variant c — mark only, just a serif "a" inside lens
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 64 * s, height: 64 * s, borderRadius: '50%',
      border: `${2 * s}px solid ${color}`,
      fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
      fontSize: 40 * s, color,
      position: 'relative',
    }}>
      <span style={{ marginTop: -3 * s }}>a</span>
      <span style={{
        position: 'absolute', right: -4 * s, bottom: -2 * s,
        width: 14 * s, height: 14 * s, borderRadius: '50%',
        background: accent, border: `${2 * s}px solid ${CREAM}`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPLASH — the inspirational message scene
// ─────────────────────────────────────────────────────────────
function Splash({ logoVariant, density, onStart }) {
  const pad = density === 'spacious' ? 40 : density === 'compact' ? 22 : 30;
  const gap = density === 'spacious' ? 32 : density === 'compact' ? 16 : 22;

  return (
    <div style={{
      height: '100%', width: '100%',
      background: CREAM, color: INK,
      display: 'flex', flexDirection: 'column',
      padding: `110px ${pad}px 0`,
      boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* logo */}
      <div style={{ marginBottom: gap * 0.8 }}>
        <Logo variant={logoVariant} size={1} />
      </div>

      {/* the message — editorial pull quote */}
      <div style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: density === 'compact' ? 38 : 44,
        lineHeight: 1.04, letterSpacing: -1.2,
        color: INK, marginTop: gap * 0.4,
        paddingBottom: 6,
        textWrap: 'pretty',
      }}>
        <span>Know</span>
        <span style={{ fontStyle: 'italic', color: GREEN }}> exactly </span>
        <span>what's on </span>
        <span>your </span>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ fontStyle: 'italic' }}>plate.</span>
          <span style={{
            position: 'absolute', left: 0, right: 0, bottom: 4,
            height: 3, background: TERRA, zIndex: -1, opacity: 0.85,
          }} />
        </span>
      </div>

      <div style={{
        fontFamily: '"Inter", system-ui', fontSize: 14,
        color: MUTED, marginTop: gap * 1.2,
        lineHeight: 1.5, maxWidth: 300,
        textWrap: 'pretty',
      }}>
        A lens for the food on your table.
        Point, scan, and read every ingredient —
        so an allergen never reaches your fork by surprise.
      </div>

      {/* interactive lens — tap to scan */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: `${gap * 0.6}px 0`,
        position: 'relative',
      }}>
        <button
          onClick={onStart}
          style={{
            appearance: 'none', border: 'none', background: 'transparent',
            cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}
        >
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            border: `1.5px solid ${GREEN}`,
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* pulsing ring */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%',
              border: `1px solid ${TERRA}`, opacity: 0.4,
              animation: 'alPulse 2.2s ease-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: -24, borderRadius: '50%',
              border: `1px solid ${TERRA}`, opacity: 0.2,
              animation: 'alPulse 2.2s ease-out infinite',
              animationDelay: '0.7s',
            }} />
            {/* inner dot */}
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: TERRA,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: CREAM, fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic', fontSize: 28,
              boxShadow: `0 10px 30px rgba(217,119,87,0.4)`,
            }}>scan</div>
            {/* crosshair ticks */}
            {[0, 90, 180, 270].map(deg => (
              <div key={deg} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 14, height: 1, background: GREEN,
                transform: `rotate(${deg}deg) translate(85px, 0)`,
                transformOrigin: '0 0',
              }} />
            ))}
          </div>
          <div style={{
            fontFamily: '"Inter", system-ui', fontSize: 11, letterSpacing: 2.2,
            textTransform: 'uppercase', color: GREEN, fontWeight: 600,
          }}>
            Tap to investigate
          </div>
        </button>
      </div>

      {/* footer credits */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingBottom: 40,
        fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 1.5,
        textTransform: 'uppercase', color: MUTED, fontWeight: 500,
      }}>
        <div>
          <div>A safer</div>
          <div>bite,</div>
          <div>every time.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
            fontSize: 20, letterSpacing: 0, textTransform: 'none',
            color: INK, marginBottom: 2,
          }}>est. 2026</div>
          <div>For the</div>
          <div>allergic few</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCANNING — animated scan of a food placeholder
// ─────────────────────────────────────────────────────────────
function Scanning({ onComplete }) {
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState('Framing subject');

  React.useEffect(() => {
    const steps = [
      { at: 0, text: 'Framing subject' },
      { at: 25, text: 'Reading label' },
      { at: 55, text: 'Cross-checking ingredients' },
      { at: 82, text: 'Matching your profile' },
    ];
    let raf;
    const t0 = performance.now();
    const DUR = 3200;
    const tick = (t) => {
      const p = Math.min(100, ((t - t0) / DUR) * 100);
      setProgress(p);
      const s = [...steps].reverse().find(s => p >= s.at);
      if (s) setStatus(s.text);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onComplete, 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      height: '100%', width: '100%', background: INK, color: CREAM,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* food photo placeholder — warm gradient standing in for pastry */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 30% 45%, #c68750 0%, #8a5a33 40%, transparent 70%),
          radial-gradient(circle at 65% 55%, #d9a066 0%, #a6714a 35%, transparent 65%),
          radial-gradient(circle at 50% 50%, #3a2a1e 0%, #1a1410 100%)
        `,
      }} />

      {/* noise overlay for photo feel */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay',
        background: `repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg 2deg, transparent 2deg 4deg)`,
      }} />

      {/* corner brackets + crosshair */}
      <div style={{
        position: 'absolute', top: 110, left: 40, right: 40, bottom: 240,
        pointerEvents: 'none',
      }}>
        {[['tl', 0, 0, true, true], ['tr', 0, 'auto', true, false], ['bl', 'auto', 0, false, true], ['br', 'auto', 'auto', false, false]]
          .map(([k, top, left, isTop, isLeft]) => (
          <div key={k} style={{
            position: 'absolute',
            top: top === 'auto' ? 'auto' : top, left: left === 'auto' ? 'auto' : left,
            bottom: top === 'auto' ? 0 : 'auto', right: left === 'auto' ? 0 : 'auto',
            width: 28, height: 28,
            borderTop: isTop ? `1.5px solid ${CREAM}` : 'none',
            borderBottom: !isTop ? `1.5px solid ${CREAM}` : 'none',
            borderLeft: isLeft ? `1.5px solid ${CREAM}` : 'none',
            borderRight: !isLeft ? `1.5px solid ${CREAM}` : 'none',
          }} />
        ))}
        {/* scanning line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${progress}%`, height: 2,
          background: `linear-gradient(90deg, transparent, ${TERRA}, transparent)`,
          boxShadow: `0 0 12px ${TERRA}`,
        }} />
      </div>

      {/* top overlay */}
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0,
        padding: '0 28px',
        fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.4,
        textTransform: 'uppercase', color: CREAM, fontWeight: 500,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: 0.85,
      }}>
        <span>● Live scan</span>
        <span>{Math.floor(progress)}%</span>
      </div>

      {/* bottom status panel */}
      <div style={{
        position: 'absolute', bottom: 70, left: 20, right: 20,
        background: 'rgba(20,28,22,0.78)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '0.5px solid rgba(244,241,234,0.15)',
        borderRadius: 22, padding: '18px 22px',
      }}>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.2,
          textTransform: 'uppercase', color: TERRA, fontWeight: 600,
          marginBottom: 8,
        }}>Investigating</div>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
          fontSize: 26, color: CREAM, lineHeight: 1, marginBottom: 14,
          letterSpacing: -0.3,
        }}>{status}…</div>
        <div style={{
          height: 2, background: 'rgba(244,241,234,0.15)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: TERRA, transition: 'width 80ms linear',
          }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS — editorial allergen report
// ─────────────────────────────────────────────────────────────
function Results({ onRestart }) {
  const flagged = [
    { name: 'Tree nuts', detail: 'Almond flour, hazelnut praline', level: 'danger' },
    { name: 'Wheat', detail: 'Contains gluten', level: 'warn' },
  ];
  const safe = ['Dairy', 'Eggs', 'Soy', 'Peanuts', 'Shellfish', 'Sesame'];

  return (
    <div style={{
      height: '100%', width: '100%',
      background: CREAM, color: INK,
      display: 'flex', flexDirection: 'column',
      overflow: 'auto',
    }}>
      {/* hero band */}
      <div style={{
        padding: '90px 28px 20px',
        borderBottom: `0.5px solid rgba(21,33,26,0.15)`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.4,
          textTransform: 'uppercase', color: MUTED, fontWeight: 500,
          marginBottom: 16,
        }}>
          <span>Scan Report №0412</span>
          <span>18 Apr 2026</span>
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 44,
          lineHeight: 0.95, letterSpacing: -1.2, color: INK,
          textWrap: 'pretty',
        }}>
          <span>A </span>
          <span style={{ fontStyle: 'italic', color: TERRA }}>croissant,</span>
          <br/>
          <span>investigated.</span>
        </div>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 13,
          color: MUTED, marginTop: 12, lineHeight: 1.5,
        }}>
          Matched against your profile: <span style={{ color: INK, fontWeight: 500 }}>Severe — tree nuts, shellfish</span>
        </div>
      </div>

      {/* verdict */}
      <div style={{
        background: GREEN, color: CREAM,
        padding: '24px 28px', position: 'relative',
      }}>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.4,
          textTransform: 'uppercase', fontWeight: 600, opacity: 0.7,
          marginBottom: 6,
        }}>Verdict</div>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
          fontSize: 30, lineHeight: 1, letterSpacing: -0.5,
        }}>Do not eat.</div>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 13,
          marginTop: 8, opacity: 0.85, lineHeight: 1.4,
        }}>
          Contains <span style={{ color: TERRA, fontWeight: 600 }}>tree nuts</span> —
          flagged severe on your profile.
        </div>
      </div>

      {/* flagged list */}
      <div style={{ padding: '28px 28px 12px' }}>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.4,
          textTransform: 'uppercase', color: MUTED, fontWeight: 600,
          marginBottom: 14,
        }}>Flagged — 2</div>
        {flagged.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 0',
            borderTop: i === 0 ? `0.5px solid rgba(21,33,26,0.15)` : 'none',
            borderBottom: `0.5px solid rgba(21,33,26,0.15)`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: f.level === 'danger' ? TERRA : '#b8943b',
              marginTop: 8, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
                fontSize: 22, color: INK, lineHeight: 1.1, marginBottom: 3,
              }}>{f.name}</div>
              <div style={{
                fontFamily: '"Inter", system-ui', fontSize: 12,
                color: MUTED, lineHeight: 1.4,
              }}>{f.detail}</div>
            </div>
            <div style={{
              fontFamily: '"Inter", system-ui', fontSize: 9, letterSpacing: 2,
              textTransform: 'uppercase', color: f.level === 'danger' ? TERRA : '#b8943b',
              fontWeight: 700, marginTop: 10,
            }}>
              {f.level === 'danger' ? 'Severe' : 'Caution'}
            </div>
          </div>
        ))}
      </div>

      {/* safe list */}
      <div style={{ padding: '18px 28px 20px' }}>
        <div style={{
          fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.4,
          textTransform: 'uppercase', color: MUTED, fontWeight: 600,
          marginBottom: 12,
        }}>Clear</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {safe.map(s => (
            <div key={s} style={{
              padding: '6px 12px', borderRadius: 999,
              border: `0.5px solid rgba(21,33,26,0.2)`,
              fontFamily: '"Inter", system-ui', fontSize: 12,
              color: INK,
            }}>{s}</div>
          ))}
        </div>
      </div>

      {/* nutrition panel */}
      <div style={{
        margin: '4px 20px 20px', padding: '22px 22px 20px',
        background: INK, color: CREAM, borderRadius: 22,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 14,
        }}>
          <div style={{
            fontFamily: '"Inter", system-ui', fontSize: 10, letterSpacing: 2.2,
            textTransform: 'uppercase', color: TERRA, fontWeight: 600,
          }}>Nutrition · est.</div>
          <div style={{
            fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
            fontSize: 30, lineHeight: 1, letterSpacing: -0.5,
          }}>406<span style={{ fontSize: 13, opacity: 0.7, marginLeft: 4, fontStyle: 'normal', fontFamily: '"Inter", system-ui' }}>kcal</span></div>
        </div>
        {[
          { k: 'Protein',  v: 8,  target: 120, unit: 'g', col: '#d97757' },
          { k: 'Carbs',    v: 46, target: 200, unit: 'g', col: '#e8b84a' },
          { k: 'Fat',      v: 21, target: 65,  unit: 'g', col: '#8ab880' },
        ].map(m => (
          <div key={m.k} style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: '"Inter", system-ui', fontSize: 12,
              color: 'rgba(244,241,234,0.8)', marginBottom: 4,
            }}>
              <span>{m.k}</span>
              <span><span style={{ color: CREAM, fontWeight: 500 }}>{m.v}{m.unit}</span> <span style={{ opacity: 0.5 }}>/ {m.target}{m.unit}</span></span>
            </div>
            <div style={{ height: 3, background: 'rgba(244,241,234,0.12)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(m.v / m.target) * 100}%`, background: m.col }} />
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: '0.5px solid rgba(244,241,234,0.12)',
          fontFamily: '"Inter", system-ui', fontSize: 11,
          color: 'rgba(244,241,234,0.65)', lineHeight: 1.45,
        }}>
          Logs to your daily goal — <span style={{ color: TERRA, fontWeight: 600 }}>1,642 / 2,100 kcal</span> so far today.
        </div>
      </div>

      {/* actions */}
      <div style={{
        padding: '12px 20px 60px', marginTop: 'auto',
        display: 'flex', gap: 10,
      }}>
        <button onClick={onRestart} style={{
          flex: 1, height: 52, borderRadius: 999,
          background: INK, color: CREAM, border: 'none',
          fontFamily: '"Inter", system-ui', fontSize: 14, fontWeight: 600,
          letterSpacing: 0.3, cursor: 'pointer',
        }}>Scan another</button>
        <button style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'transparent', border: `1px solid ${INK}`,
          color: INK, cursor: 'pointer',
          fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic',
          fontSize: 20,
        }}>♡</button>
      </div>
    </div>
  );
}

Object.assign(window, { Logo, Splash, Scanning, Results });
