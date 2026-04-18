import { CREAM, GREEN, INK, MUTED, TERRA } from './palette';

const FLAGGED = [
  { name: 'Tree nuts', detail: 'Almond flour, hazelnut praline', level: 'danger' as const },
  { name: 'Wheat', detail: 'Contains gluten', level: 'warn' as const },
];
const SAFE = ['Dairy', 'Eggs', 'Soy', 'Peanuts', 'Shellfish', 'Sesame'];
const MACROS = [
  { k: 'Protein', v: 8, target: 120, unit: 'g', col: '#d97757' },
  { k: 'Carbs', v: 46, target: 200, unit: 'g', col: '#e8b84a' },
  { k: 'Fat', v: 21, target: 65, unit: 'g', col: '#8ab880' },
];

export default function ResultsScene({ onRestart }: { onRestart: () => void }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: CREAM,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '90px 28px 20px',
          borderBottom: `0.5px solid rgba(21,33,26,0.15)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: '"Inter", system-ui',
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: MUTED,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          <span>Scan Report №0412</span>
          <span>18 Apr 2026</span>
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 44,
            lineHeight: 0.95,
            letterSpacing: -1.2,
            color: INK,
          }}
        >
          <span>A </span>
          <span style={{ fontStyle: 'italic', color: TERRA }}>croissant,</span>
          <br />
          <span>investigated.</span>
        </div>
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 13,
            color: MUTED,
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          Matched against your profile:{' '}
          <span style={{ color: INK, fontWeight: 500 }}>
            Severe — tree nuts, shellfish
          </span>
        </div>
      </div>

      <div style={{ background: GREEN, color: CREAM, padding: '24px 28px', position: 'relative' }}>
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            fontWeight: 600,
            opacity: 0.7,
            marginBottom: 6,
          }}
        >
          Verdict
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 30,
            lineHeight: 1,
            letterSpacing: -0.5,
          }}
        >
          Do not eat.
        </div>
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 13,
            marginTop: 8,
            opacity: 0.85,
            lineHeight: 1.4,
          }}
        >
          Contains <span style={{ color: TERRA, fontWeight: 600 }}>tree nuts</span> — flagged
          severe on your profile.
        </div>
      </div>

      <div style={{ padding: '28px 28px 12px' }}>
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: MUTED,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Flagged — 2
        </div>
        {FLAGGED.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '14px 0',
              borderTop: i === 0 ? `0.5px solid rgba(21,33,26,0.15)` : 'none',
              borderBottom: `0.5px solid rgba(21,33,26,0.15)`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: f.level === 'danger' ? TERRA : '#b8943b',
                marginTop: 8,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: INK,
                  lineHeight: 1.1,
                  marginBottom: 3,
                }}
              >
                {f.name}
              </div>
              <div
                style={{
                  fontFamily: '"Inter", system-ui',
                  fontSize: 12,
                  color: MUTED,
                  lineHeight: 1.4,
                }}
              >
                {f.detail}
              </div>
            </div>
            <div
              style={{
                fontFamily: '"Inter", system-ui',
                fontSize: 9,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: f.level === 'danger' ? TERRA : '#b8943b',
                fontWeight: 700,
                marginTop: 10,
              }}
            >
              {f.level === 'danger' ? 'Severe' : 'Caution'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '18px 28px 20px' }}>
        <div
          style={{
            fontFamily: '"Inter", system-ui',
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: MUTED,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Clear
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SAFE.map((s) => (
            <div
              key={s}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `0.5px solid rgba(21,33,26,0.2)`,
                fontFamily: '"Inter", system-ui',
                fontSize: 12,
                color: INK,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          margin: '4px 20px 20px',
          padding: '22px 22px 20px',
          background: INK,
          color: CREAM,
          borderRadius: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
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
            }}
          >
            Nutrition · est.
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 30,
              lineHeight: 1,
              letterSpacing: -0.5,
            }}
          >
            406
            <span
              style={{
                fontSize: 13,
                opacity: 0.7,
                marginLeft: 4,
                fontStyle: 'normal',
                fontFamily: '"Inter", system-ui',
              }}
            >
              kcal
            </span>
          </div>
        </div>
        {MACROS.map((m) => (
          <div key={m.k} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: '"Inter", system-ui',
                fontSize: 12,
                color: 'rgba(244,241,234,0.8)',
                marginBottom: 4,
              }}
            >
              <span>{m.k}</span>
              <span>
                <span style={{ color: CREAM, fontWeight: 500 }}>
                  {m.v}
                  {m.unit}
                </span>{' '}
                <span style={{ opacity: 0.5 }}>
                  / {m.target}
                  {m.unit}
                </span>
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: 'rgba(244,241,234,0.12)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(m.v / m.target) * 100}%`,
                  background: m.col,
                }}
              />
            </div>
          </div>
        ))}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '0.5px solid rgba(244,241,234,0.12)',
            fontFamily: '"Inter", system-ui',
            fontSize: 11,
            color: 'rgba(244,241,234,0.65)',
            lineHeight: 1.45,
          }}
        >
          Logs to your daily goal —{' '}
          <span style={{ color: TERRA, fontWeight: 600 }}>1,642 / 2,100 kcal</span> so far today.
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px 60px',
          marginTop: 'auto',
          display: 'flex',
          gap: 10,
        }}
      >
        <button
          onClick={onRestart}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 999,
            background: INK,
            color: CREAM,
            border: 'none',
            fontFamily: '"Inter", system-ui',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.3,
            cursor: 'pointer',
          }}
        >
          Scan another
        </button>
        <button
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'transparent',
            border: `1px solid ${INK}`,
            color: INK,
            cursor: 'pointer',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 20,
          }}
        >
          ♡
        </button>
      </div>
    </div>
  );
}
