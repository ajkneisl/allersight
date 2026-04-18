const STEPS = [
  {
    num: 'Point',
    h: 'Frame your food.',
    p: 'Open the lens. Aim at a dish, a label, or even a handwritten menu. AllerVision works on plates and packaging alike.',
  },
  {
    num: 'Investigate',
    h: 'We read every word.',
    p: 'Our vision model parses ingredients, traces, factory notices and regional aliases — the fine print that hides real risks.',
  },
  {
    num: 'Verdict',
    h: 'Eat or step away.',
    p: 'Cross-checked against your allergen profile in under two seconds, with a clear verdict and every flagged compound explained.',
  },
];

export default function HowItWorks() {
  return (
    <section className="band-how" id="how">
      <div className="inner">
        <h2>
          Three steps between you and a <em>safer bite.</em>
        </h2>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.num} className="step">
              <div className="num">{s.num}</div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
