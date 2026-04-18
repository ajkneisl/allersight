import { useEffect, useRef } from 'react';
import InHeroPhone from './InHeroPhone';

type Food = {
  depth: number;
  style: React.CSSProperties;
  className?: string;
  label?: string;
  caption?: string;
};

const FOODS: Food[] = [
  {
    depth: 0.25,
    style: {
      width: 120,
      height: 120,
      top: 40,
      left: -20,
      background:
        'radial-gradient(circle at 35% 35%, #f0c28a 0%, #c68750 45%, #8a5a33 100%)',
    },
    label: 'croissant',
  },
  {
    depth: -0.15,
    style: {
      width: 80,
      height: 80,
      top: 90,
      right: 10,
      background:
        'radial-gradient(circle at 40% 30%, #ff9b6a 0%, #d9593a 50%, #8a2e1c 100%)',
    },
    label: 'tomato',
  },
  {
    depth: 0.35,
    style: {
      width: 140,
      height: 140,
      bottom: 60,
      left: 30,
      background:
        'radial-gradient(circle at 50% 30%, #f5e6bd 0%, #d9b66a 45%, #8a6a2e 100%)',
    },
    label: 'almond',
  },
  {
    depth: -0.25,
    style: {
      width: 100,
      height: 100,
      bottom: 120,
      right: -20,
      background:
        'radial-gradient(circle at 40% 35%, #a8d87a 0%, #5a8a3a 50%, #2a4a1c 100%)',
    },
    label: 'basil',
  },
  {
    depth: 0.18,
    style: {
      width: 70,
      height: 70,
      top: '50%',
      left: -40,
      background:
        'radial-gradient(circle at 40% 35%, #e8d8c0 0%, #b89874 50%, #6a5038 100%)',
    },
    label: 'sesame',
  },
  {
    depth: 0.1,
    style: { top: 20, right: 40 },
    className: 'caption',
    caption: 'Subject №04',
  },
  {
    depth: -0.08,
    style: { bottom: 20, left: '50%' },
    className: 'caption',
    caption: 'Scan in progress',
  },
];

export default function PhoneStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = window.scrollY;
    const t0 = performance.now();
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX = (e.clientX - cx) / cx;
      mouseY = (e.clientY - cy) / cy;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      floatRefs.current.forEach((el, i) => {
        if (!el) return;
        const depth = FOODS[i]?.depth ?? 0.2;
        const tx = mouseX * depth * 30 + Math.sin(t * 0.6 + i) * 4;
        const ty =
          mouseY * depth * 30 +
          scrollY * depth * 0.3 +
          Math.cos(t * 0.5 + i * 1.3) * 5;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="phone-stage" ref={stageRef}>
      {FOODS.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            floatRefs.current[i] = el;
          }}
          className={`food-float${f.className ? ` ${f.className}` : ''}`}
          style={f.style}
        >
          {f.label && <div className="label">{f.label}</div>}
          {f.caption}
        </div>
      ))}
      <div className="phone-wrap">
        <InHeroPhone />
      </div>
    </div>
  );
}
