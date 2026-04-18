import { useEffect, useRef, useState } from 'react';

type Tone = 'flag' | 'safe' | 'neutral';
type Feed = { tone: Tone; at: number; time: string; title: string; body: string };

const FEED: Feed[] = [
  {
    tone: 'flag',
    at: 0.05,
    time: 'now',
    title: "Don't eat the almond croissant.",
    body:
      'Detected in view. Contains <b>tree nuts</b> — flagged severe on your profile.',
  },
  {
    tone: 'safe',
    at: 0.18,
    time: '1m',
    title: 'Tomato &amp; basil plate is clear.',
    body: 'No allergens from your list. <b>92 kcal</b> logged to today’s total.',
  },
  {
    tone: 'neutral',
    at: 0.32,
    time: '3m',
    title: 'Scanning menu at Fiorella…',
    body: '<b>14 dishes</b> parsed. Cross-checking your profile now.',
  },
  {
    tone: 'safe',
    at: 0.45,
    time: '5m',
    title: '3 dishes cleared to eat.',
    body: 'Miso salmon, burrata, grilled artichoke. Tap to see macros.',
  },
  {
    tone: 'flag',
    at: 0.6,
    time: '9m',
    title: 'Careful with the shared bread.',
    body: 'Bakery note: <b>“may contain sesame.”</b> Flagged moderate for you.',
  },
  {
    tone: 'safe',
    at: 0.78,
    time: '14m',
    title: 'Miso salmon logged.',
    body: 'Clear to eat. <b>28g protein · 340 kcal</b> added to today.',
  },
  {
    tone: 'flag',
    at: 0.92,
    time: '22m',
    title: 'Hidden dairy in the chocolate tart.',
    body: 'Cross-checked with kitchen: <b>milk solids</b> confirmed.',
  },
];

const MAX_VISIBLE = 3;
const SHOW_MS = 5500;

type Shown = { i: number; until: number };

const SPECS = [
  {
    k: 'Hands-free',
    v: 'Look at a plate. That\'s the gesture. A soft chime and a line of text in your periphery — nothing more.',
  },
  {
    k: 'Red & green banners',
    v: "Red lock-screen alert when an allergen's in view. Green confirmation for everything else, auto-logged to today's macros.",
  },
  {
    k: 'Multi-dish',
    v: 'Up to 8 distinct items on a shared table. Family-style, buffets, charcuterie — all tagged at once.',
  },
  {
    k: 'Every surface',
    v: 'Phone, smart glasses, kitchen cam. One profile, one dot, quietly watching wherever you are.',
  },
  {
    k: 'Emergency contacts',
    v: 'If a severe allergen slips through and you open an epi-pen log, trusted contacts are pinged automatically.',
  },
  {
    k: 'Private by default',
    v: 'On-device vision. Quiet hours, travel mode. Frames never leave your glasses unless you long-press to save.',
  },
];

export default function Glasses() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState<Shown[]>([]);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    let raf = 0;
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const section = sectionRef.current;
      if (!section) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh;
      const travelled = vh - r.top;
      const p = Math.max(0, Math.min(1, travelled / total));
      const inView = r.bottom > 0 && r.top < vh;

      // reset when scrolled above the section
      if (r.top > vh) {
        if (lastIndexRef.current !== -1) {
          lastIndexRef.current = -1;
          setShown([]);
        }
        return;
      }
      if (!inView) return;

      const now = performance.now();
      setShown((prev) => {
        let next = [...prev];
        FEED.forEach((n, i) => {
          if (i <= lastIndexRef.current) return;
          if (p >= n.at) {
            lastIndexRef.current = i;
            next.push({ i, until: now + SHOW_MS });
            if (next.length > MAX_VISIBLE) next.shift();
          }
        });
        next = next.filter((s) => now < s.until);
        // avoid a re-render if the set didn't actually change
        if (
          next.length === prev.length &&
          next.every((n, idx) => prev[idx] && prev[idx].i === n.i)
        ) {
          return prev;
        }
        return next;
      });
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const interval = window.setInterval(update, 700);
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="band-glasses" id="glasses" ref={sectionRef}>
      <div className="inner">
        <div>
          <div className="eyebrow">The lens, always on</div>
          <h2>
            It runs in the <em>background.</em>
            <br />
            And lives in your <em>glasses.</em>
          </h2>
          <p className="lede">
            Open AllerVision once. From then on, it's a small green dot in your
            status bar — or a soft amber glow in your HUD. Through your phone
            camera or your Meta-style smart glasses, every dish that enters
            view is silently identified, matched to your profile, and
            announced with a single notification telling you plainly: eat, or
            don't.
          </p>
          <div className="specs">
            {SPECS.map((s) => (
              <div key={s.k} className="spec">
                <div className="k">{s.k}</div>
                <div className="v">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lens-phone" aria-label="AllerVision on a phone lock screen">
          <div className="screen">
            <div className="notch"></div>
            <div className="status-bar">
              <span>13:42</span>
              <div className="right">
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                  <path
                    d="M1 8.5 Q7 2 13 8.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M3.2 8.5 Q7 4.5 10.8 8.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.7"
                  />
                  <circle cx="7" cy="8.2" r="1" fill="currentColor" />
                </svg>
                <span>5G</span>
                <div className="batt">
                  <span></span>
                </div>
              </div>
            </div>

            <div className="lock-time">
              <div className="date">Friday, 18 April</div>
              <div className="clock">13:42</div>
            </div>

            <div className="live-widget" aria-label="AllerVision live">
              <div className="ic"></div>
              <div className="label">
                <div className="k">AllerVision is watching</div>
                <div className="v">Lens · on</div>
              </div>
              <div className="badge">Live</div>
            </div>

            <div className="float-notifs" aria-hidden="true">
              {shown.map((s) => {
                const n = FEED[s.i];
                return <FloatNotif key={s.i} n={n} />;
              })}
            </div>

            <div className="swipe">
              <span className="bar"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatNotif({ n }: { n: Feed }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className={`float-notif ${n.tone}${ready ? ' in' : ''}`}>
      <div className="ic"></div>
      <div>
        <div className="head">
          <span className="app">● AllerVision</span>
        </div>
        <div className="title" dangerouslySetInnerHTML={{ __html: n.title }} />
        <div className="body" dangerouslySetInnerHTML={{ __html: n.body }} />
      </div>
      <div className="time">{n.time}</div>
    </div>
  );
}
