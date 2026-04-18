import { INK, TERRA } from './palette';

export default function SceneLogo({ size = 1 }: { size?: number }) {
  const s = size;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: '"Instrument Serif", "Playfair Display", Georgia, serif',
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: 38 * s,
        color: INK,
        letterSpacing: -0.5,
        lineHeight: 1,
      }}
    >
      <span>aller</span>
      <span
        style={{
          display: 'inline-block',
          width: 30 * s,
          height: 30 * s,
          borderRadius: '50%',
          border: `${2 * s}px solid ${TERRA}`,
          marginLeft: 2 * s,
          marginRight: 1 * s,
          position: 'relative',
          top: -2 * s,
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: 6 * s,
            height: 6 * s,
            borderRadius: '50%',
            background: TERRA,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </span>
    </div>
  );
}
