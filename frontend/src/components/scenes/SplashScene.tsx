import SceneLogo from './SceneLogo';
import { CREAM, GREEN, INK, MUTED, TERRA } from './palette';

export default function SplashScene({ onStart }: { onStart: () => void }) {
  const pad = 40;
  const gap = 32;
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: CREAM,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        padding: `110px ${pad}px 0`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: gap * 0.8 }}>
        <SceneLogo />
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 44,
          lineHeight: 1.04,
          letterSpacing: -1.2,
          color: INK,
          marginTop: gap * 0.4,
          paddingBottom: 6,
        }}
      >
        <span>Know</span>
        <span style={{ fontStyle: 'italic', color: GREEN }}> exactly </span>
        <span>what's on </span>
        <span>your </span>
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ fontStyle: 'italic' }}>plate.</span>
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 4,
              height: 3,
              background: TERRA,
              zIndex: -1,
              opacity: 0.85,
            }}
          />
        </span>
      </div>

      <div
        style={{
          fontFamily: '"Inter", system-ui',
          fontSize: 14,
          color: MUTED,
          marginTop: gap * 1.2,
          lineHeight: 1.5,
          maxWidth: 300,
        }}
      >
        A lens for the food on your table. Point, scan, and read every
        ingredient — so an allergen never reaches your fork by surprise.
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: `${gap * 0.6}px 0`,
          position: 'relative',
        }}
      >
        <button
          onClick={onStart}
          style={{
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: `1.5px solid ${GREEN}`,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: '50%',
                border: `1px solid ${TERRA}`,
                opacity: 0.4,
                animation: 'alPulse 2.2s ease-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -24,
                borderRadius: '50%',
                border: `1px solid ${TERRA}`,
                opacity: 0.2,
                animation: 'alPulse 2.2s ease-out infinite',
                animationDelay: '0.7s',
              }}
            />
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: TERRA,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: CREAM,
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 28,
                boxShadow: `0 10px 30px rgba(217,119,87,0.4)`,
              }}
            >
              scan
            </div>
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 14,
                  height: 1,
                  background: GREEN,
                  transform: `rotate(${deg}deg) translate(85px, 0)`,
                  transformOrigin: '0 0',
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: '"Inter", system-ui',
              fontSize: 11,
              letterSpacing: 2.2,
              textTransform: 'uppercase',
              color: GREEN,
              fontWeight: 600,
            }}
          >
            Tap to investigate
          </div>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: 40,
          fontFamily: '"Inter", system-ui',
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: MUTED,
          fontWeight: 500,
        }}
      >
        <div>
          <div>A safer</div>
          <div>bite,</div>
          <div>every time.</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 20,
              letterSpacing: 0,
              textTransform: 'none',
              color: INK,
              marginBottom: 2,
            }}
          >
            est. 2026
          </div>
          <div>For the</div>
          <div>allergic few</div>
        </div>
      </div>
    </div>
  );
}
