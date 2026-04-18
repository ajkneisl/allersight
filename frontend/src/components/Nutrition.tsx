const BULLETS = [
  {
    tag: 'Calories',
    body: (
      <>
        Portion-aware estimates for restaurant plates, packaged foods, and home
        cooking. <b>Within ±8% of a dietitian's weigh-in,</b> on average.
      </>
    ),
  },
  {
    tag: 'Macros',
    body: (
      <>
        Protein, carbs and fat tallied into your daily ring. Set a target — cut,
        maintain, build — and watch the gap close across the day.
      </>
    ),
  },
  {
    tag: 'Goals',
    body: (
      <>
        Pick a plan or build your own:{' '}
        <b>Mediterranean, high-protein, low-FODMAP, 16:8,</b> or custom ratios.
        The app coaches toward it without nagging.
      </>
    ),
  },
  {
    tag: 'Micros',
    body: (
      <>
        Flag low iron, vitamin D, B12 and fiber weeks before your body does —
        and suggest allergen-safe foods to patch the gaps.
      </>
    ),
  },
];

const KPIS = [
  { label: 'Protein', val: '86g', target: '120g', pct: 72, color: '#d97757' },
  { label: 'Carbs', val: '134g', target: '200g', pct: 67, color: '#e8b84a' },
  { label: 'Fat', val: '48g', target: '65g', pct: 74, color: '#8ab880' },
  { label: 'Fiber', val: '22g', target: '30g', pct: 73, color: '#a8d4f0' },
];

const MEALS = [
  { t: 'Breakfast', n: 'Oat bowl, berries', k: '412 kcal · scanned 08:12' },
  { t: 'Lunch', n: 'Miso salmon, rice', k: '624 kcal · scanned 13:04' },
  { t: 'Snack', n: 'Croissant, flagged', k: '406 kcal · scanned 15:38' },
];

export default function Nutrition() {
  return (
    <section className="band-nutri" id="nutrition">
      <div className="inner">
        <div>
          <div className="eyebrow">More than allergens</div>
          <h2>
            Also a quiet coach for your <em>diet goals.</em>
          </h2>
          <p className="lede">
            Every scan doubles as a food log. AllerVision estimates calories and
            macros from the same photo it reads your allergens from — so hitting
            a goal doesn't mean a second app, a second tap, or a second thought.
          </p>
          <ul className="bullets">
            {BULLETS.map((b) => (
              <li key={b.tag}>
                <span className="tag">{b.tag}</span>
                <span className="body">{b.body}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash">
          <div className="head">
            <span className="small">Today · Fri 18 Apr</span>
            <span className="date">1,642 / 2,100 kcal</span>
          </div>
          <div className="ring-row">
            <div className="ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  stroke="rgba(244,241,234,0.1)"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  stroke="#d97757"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="377"
                  strokeDashoffset="83"
                  strokeLinecap="round"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="46"
                  stroke="rgba(244,241,234,0.1)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="46"
                  stroke="#e8b84a"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="289"
                  strokeDashoffset="95"
                  strokeLinecap="round"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="34"
                  stroke="rgba(244,241,234,0.1)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="34"
                  stroke="#8ab880"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="214"
                  strokeDashoffset="64"
                  strokeLinecap="round"
                />
              </svg>
              <div className="center">
                <span className="big">78%</span>
                <span className="lab">Of daily goal</span>
              </div>
            </div>
            <div className="kpis">
              {KPIS.map((k) => (
                <div className="kpi" key={k.label}>
                  <div className="row">
                    <span>{k.label}</span>
                    <span>
                      <b style={{ color: '#fff', fontWeight: 500 }}>{k.val}</b>{' '}
                      <span style={{ opacity: 0.5 }}>/ {k.target}</span>
                    </span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${k.pct}%`, background: k.color }}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="today">
            {MEALS.map((m) => (
              <div className="meal" key={m.t}>
                <div className="t">{m.t}</div>
                <div className="n">{m.n}</div>
                <div className="k">{m.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
