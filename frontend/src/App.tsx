import { HeroPhone } from './components/ConsumerApp';
import { MapApp } from './components/MapApp';

const LensSvg = ({ size = 20 }: { size?: number }) => (
  <svg className="lens-svg" viewBox="0 0 20 20" style={{ width: size, height: size }}><circle cx="10" cy="10" r="8" fill="none" stroke="var(--terra)" strokeWidth="1.5" /><circle cx="10" cy="10" r="3.5" fill="var(--terra)" /></svg>
);

const CheckSvg = () => (
  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="#1f3d2b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const tickerItems = [
  { g: false, text: '12:01 · peanut detected · Osteria Bianca' },
  { g: true, text: '12:05 · knife washed · contamination cleared' },
  { g: false, text: '07:42 · trace sesame · on chef\'s tongs' },
  { g: true, text: '19:18 · table 14 served · profile clean' },
  { g: false, text: '11:26 · egg yolk on prep board' },
  { g: true, text: '14:03 · scan → safe for Priya' },
  { g: false, text: '09:51 · shellfish stock · pan 03' },
  { g: true, text: '20:44 · Q2 audit exported · signed' },
];

const logRows = [
  { cls: 'warn', time: '12:01:04', msg: <><b>Peanut</b> detected · satay glaze, 0.4g prep</>, tag: 'Detect' },
  { cls: 'warn', time: '12:02:18', msg: <><b>Chef's knife</b> picked up · now carries peanut</>, tag: 'Trace' },
  { cls: 'action', time: '12:03:41', msg: <>Chef moved to station 03 · <b>Board A</b> flagged</>, tag: 'Move' },
  { cls: 'clean', time: '12:05:09', msg: <><b>Knife washed</b> at sink 01 · state cleared</>, tag: 'Reset' },
  { cls: 'clean', time: '12:05:52', msg: <>Chef's <b>hands washed</b> · 14 sec · state cleared</>, tag: 'Reset' },
  { cls: 'safe', time: '12:06:33', msg: <>Safe prep resumed · branzino · <b>no allergens in chain</b></>, tag: 'Cleared' },
  { cls: '', time: '12:08:11', msg: <>Plate for table 14 · profile: <b>Marcus · peanut severe</b></>, tag: 'Plate' },
  { cls: 'safe', time: '12:08:14', msg: <>Verdict: <b>safe to serve</b> · signed · hash 0x8f…a3</>, tag: 'Sign' },
];

const kitchens = [
  { name: 'Osteria Bianca', meta: 'Italian · tasting menu · SoHo, New York', safe: '18,402', daily: '420' },
  { name: 'Mei & Son', meta: 'Cantonese · dim sum · Mission, SF', safe: '11,820', daily: '260' },
  { name: 'Fleur & Flint', meta: 'Brasserie · bistro fare · Marylebone, London', safe: '31,208', daily: '510' },
  { name: 'Tanaka / omakase', meta: 'Edo-mae sushi · 8 seats · Shibuya, Tokyo', safe: '4,214', daily: '80' },
  { name: 'Casa Rivière', meta: 'French · two-star · Le Marais, Paris', safe: '26,901', daily: '340' },
  { name: 'North Pier Hotel', meta: 'Group catering · 600 covers/day · Copenhagen', safe: '98,330', daily: '1,240' },
];

export default function App() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <>
      {/* HEADER */}
      <header className="site">
        <div className="nav">
          <a href="#" className="brand">aller<LensSvg />sight</a>
          <ul>
            <li><a href="#kitchens">For kitchens</a></li>
            <li><a href="#proof">Protocol log</a></li>
            <li><a href="#diners">For customers</a></li>
            <li><a href="#trusted">Trusted by</a></li>
          </ul>
          <div className="ctas">
            <a href="#diners" className="btn btn-ghost">Get the app</a>
            <a href="#cta" className="btn btn-primary">Book a kitchen pilot</a>
          </div>
        </div>
      </header>

      {/* §01 HERO */}
      <section className="hero">
        <div className="eyebrow-row">
          <span className="e-left">Introducing AllerSight · Est. 2026</span>
          <span className="mono">No. 01 / 06</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Safe food,<br /><em>proven</em> — from the<br /><span className="swipe">kitchen</span> to the table.</h1>
            <p className="lede">
              AllerSight is a real-time allergen safety system, and it works on two sides of the plate. <b>In the kitchen</b>, smart glasses on the line track every ingredient, every hand, every tool and surface — holding contamination in memory until a wash resets it. For owners, insurers and inspectors, a signed log proves what landed on the plate. <b>In the customer's hand</b>, it's a phone: tell the waiter the allergy in-store and get an answer from the kitchen's live system, or photograph the meal yourself, pick a friend, and know who can eat it.
            </p>
            <div className="hero-ctas">
              <a href="#cta" className="btn btn-primary">Book a kitchen pilot →</a>
              <a href="#diners" className="btn btn-ghost">Download for customers</a>
            </div>
            <div className="hero-trust">
              <span>248 kitchens live</span>
              <span>SOC 2 Type II</span>
              <span>FDA-referenced audit trail</span>
            </div>
          </div>
          <div className="phone-stage">
            <div className="phone-shadow" />
            <HeroPhone width={360} height={720} />
          </div>
        </div>
        <div className="ticker" aria-hidden="true" style={{ marginTop: 80 }}>
          <div className="track">
            {doubled.map((it, i) => {
              const parts = it.text.split(/·/);
              return (
                <span className="item" key={i}>
                  <span className={`d${it.g ? ' g' : ''}`} />
                  {parts[0]}· <em>{parts[1]?.trim()}</em>{parts[2] ? ` · ${parts[2].trim()}` : ''}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* §02 WEARABLE VISION */}
      <section className="band dark" id="kitchens">
        <div className="inner">
          <div className="section-eyebrow">
            <span><span className="num">02</span> &nbsp;· For kitchens</span>
            <span>Wearable vision, on the line</span>
          </div>
          <h2>Wearable vision that<br />sees the risk <em>before</em><br />it plates.</h2>
          <div className="wearable-grid">
            <div className="wearable-copy">
              <p className="lede">Every chef on the line wears a pair of lightweight glasses. As ingredients pass under their hands, AllerSight names each one — <b>peanut, sesame, shellfish, egg</b> — and attaches that state to the hand holding it, the knife cutting it, the board beneath it. The moment risk is visible, it's tracked.</p>
              <div className="feat">
                <div className="item"><div className="k">Ingredient detection</div><div className="v">Recognizes 240+ declared allergens and aliases in situ — raw, plated or mid-prep.</div></div>
                <div className="item"><div className="k">Hands, knives, surfaces</div><div className="v">Contamination state follows the object, not the station. Pick up a knife, it carries what it touched.</div></div>
                <div className="item"><div className="k">Reset on wash</div><div className="v">Hand-wash and tool-rinse are detected visually. The chain breaks the instant the water runs.</div></div>
                <div className="item"><div className="k">Pre-plate alerts</div><div className="v">A soft chime in the glasses, seconds before a contaminated tool meets an allergy-sensitive order.</div></div>
              </div>
            </div>
            <div className="pov-scene">
              <img className="pov-photo" alt="Chef plating a high-end dish" src="https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80" />
              <div className="pov-vignette" />
              <div className="pov-scanlines" />
              <div className="pov-hud">
                <div className="top">
                  <span className="live">Chef G. Ramos · Wearable 02</span>
                  <span className="right"><span>STATION 02</span><span>12:06:41</span></span>
                </div>
                <div className="bracket tl" /><div className="bracket tr" /><div className="bracket bl" /><div className="bracket br" />
                <div className="anno warn" style={{ top:'38%', left:'22%' }}>
                  <div className="pt" /><div className="line" />
                  <div className="card"><span className="k">Peanut · satay glaze</span>severe · unsafe · trace 0.4g</div>
                </div>
                <div className="anno warn right" style={{ top:'15%', right:'22%' }}>
                  <div className="pt" style={{ alignSelf:'flex-end' }} /><div className="line" style={{ alignSelf:'flex-end' }} />
                  <div className="card"><span className="k">Knife · 8" chef's</span>contaminated · last: peanut</div>
                </div>
                <div className="anno safe" style={{ bottom:'36%', left:'58%' }}>
                  <div className="pt" /><div className="line" />
                  <div className="card"><span className="k">Hands · washed 12:04</span>clean · 14 sec</div>
                </div>
              </div>
              <div className="pov-verdict">
                <div className="chip">⚠ Cross-contact</div>
                <div className="line">Knife carries <em>peanut</em> — do not touch plate for table 14.</div>
                <div className="meta">conf.<br />0.98</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §03 CONTAMINATION MEMORY */}
      <section className="band" id="proof" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <div className="section-eyebrow">
            <span><span className="num">03</span> &nbsp;· Contamination memory &amp; proof</span>
            <span>Remembered until washed · signed for court</span>
          </div>
          <h2>What a peanut touches,<br />AllerSight <em>remembers.</em></h2>
          <div className="memory-grid">
            <div className="memory-copy">
              <p className="lede">The glasses keep a running memory of every contaminated hand, knife and surface. <b>Wash a knife, the chain breaks. Rinse your hands, the chain breaks.</b> Until then, the knife is still "peanut." The glove is still "shellfish." And every plate that touches them inherits the risk — prevented before it leaves the pass.</p>
              <div className="memory-track">
                <div className="row"><div className="kt">12:01:04</div><div className="body"><b>Peanut</b> detected — satay prep, Station 02</div></div>
                <div className="row"><div className="kt">12:02:18</div><div className="body">Chef's <b>knife</b> picked up · now carries peanut</div></div>
                <div className="row"><div className="kt">12:03:41</div><div className="body"><b>Board A</b> + right hand enter peanut state</div></div>
                <div className="row cleared"><div className="kt">12:05:09</div><div className="body"><b>Knife washed</b> · hands washed · state cleared</div></div>
                <div className="row cleared"><div className="kt">12:06:33</div><div className="body">Safe prep resumed · branzino, no allergens in chain</div></div>
              </div>
              <div className="memory-cta">
                <span>A <b>protocol log a lawyer would envy.</b> Every detection, every wash, every plate sent out — recorded to a signed, tamper-evident ledger.</span>
                <span>Export a single PDF for a health inspection. Replay <b>any minute of any day</b> for an insurance claim. Prove a negative, in court, with timestamps.</span>
              </div>
            </div>
            <div className="log-panel">
              <div className="log-head">
                <div><div className="t">Protocol log · Station 02</div><div className="station">Osteria Bianca · dinner svc.</div></div>
                <div className="meta"><span className="dot" />signed · Apr 18<br /><span style={{ opacity: 0.7 }}>14 events · 00:12:36</span></div>
              </div>
              <div className="log-body">
                {logRows.map((r, i) => (
                  <div className={`log-row ${r.cls}`} key={i}>
                    <span className="time">{r.time}</span>
                    <span className="marker" />
                    <span className="msg">{r.msg}</span>
                    <span className="tag">{r.tag}</span>
                  </div>
                ))}
              </div>
              <div className="log-foot"><span>Block height 184,221</span><span className="stamp">⬢ chain intact</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* §04 CONSUMER */}
      <section className="band" id="diners" style={{ background: 'var(--cream-2)' }}>
        <div className="inner">
          <div className="section-eyebrow">
            <span><span className="num">04</span> &nbsp;· For customers</span>
            <span>One photo · whole table</span>
          </div>
          <h2>Snap a photo.<br /><em>Know</em> who can eat it.</h2>
          <div className="consumer-grid">
            <div className="consumer-copy">
              <p className="lede">You're at a hangout, a dinner, a takeout night. Point your phone at the food, tap the friends in the room, and <b>know in under two seconds who can safely eat it.</b> No menus to read aloud, no server to flag down, no pretending the allergy isn't that bad.</p>
              <div className="friend-steps">
                {[
                  { n: 'Photograph', title: 'Snap the dish.', body: 'A plate, a pan, a to-go container. Works on menus and packaging too.' },
                  { n: 'Pick friends', title: 'Tag who\'s eating.', body: 'Friends join AllerSight once and set their allergens and safe foods. Their data stays on their phone — you only see names and avatars.' },
                  { n: 'Verdict', title: 'See who\'s safe, instantly.', body: 'Severe allergens in terracotta. Safe in green. Everyone at the table knows, in the same second.' },
                  { n: 'Profile', title: 'Tap a friend to see more.', body: 'Open any friend\'s profile for the full list of what they can and can\'t eat — before you order, or before you offer a bite.' },
                ].map((s, i) => (
                  <div className="step" key={i}><div className="n">{s.n}</div><div><div className="title">{s.title}</div><div className="body">{s.body}</div></div></div>
                ))}
              </div>
            </div>
            <div className="consumer-phone-stage">
              <div className="drop" />
              <MapApp width={380} height={760} />
            </div>
          </div>
        </div>
      </section>

      {/* §05 TRUSTED */}
      <section className="band" id="trusted" style={{ background: 'var(--cream)' }}>
        <div className="inner">
          <div className="section-eyebrow">
            <span><span className="num">05</span> &nbsp;· Trusted by AllerSight</span>
            <span>Verified by AllerSight · real-time allergen tracking</span>
          </div>
          <div className="trusted-head">
            <h2>Kitchens <em>verified</em> by<br />AllerSight.</h2>
            <p className="lede">Every listed kitchen runs AllerSight on their line — real-time allergen tracking across ingredients, hands, tools and surfaces. We verify each one ourselves, to standards we set and publish, on data from their own kitchen. The mark means what it says.</p>
          </div>
          <div className="trusted-grid">
            {kitchens.map((k, i) => (
              <div className="t-card" key={i}>
                <div className="verified"><CheckSvg /> Verified by AllerSight</div>
                <div className="biz-name">{k.name}</div>
                <div className="biz-meta">{k.meta}</div>
                <div className="biz-stats">
                  <div><div className="s">Safe plates</div><div className="v">{k.safe}</div></div>
                  <div><div className="s">Plates/day</div><div className="v"><em>{k.daily}</em></div></div>
                </div>
              </div>
            ))}
          </div>
          <div className="trust-badge">
            <div className="mark"><div className="ring" /></div>
            <div className="m">The <em>AllerSight mark</em> means verified.<span className="sub">Every kitchen with the mark is running AllerSight on their line and has been verified by our team — against standards we set, audit and publish. No stickers, no paperwork in a drawer.</span></div>
            <a href="#cta" className="btn btn-ghost">See how verification works →</a>
          </div>
        </div>
      </section>

      {/* §06 CTA */}
      <section className="cta-band" id="cta">
        <div className="inner">
          <h2>Two products.<br />One <em>safer</em> bite.</h2>
          <p className="lede">Whether you run the kitchen or you're trying to feed a friend without a scare — AllerSight is built for the side of the table you're on.</p>
          <div className="cta-pair">
            <div className="cta-card">
              <div className="k">For restaurants · pilot in 30 days</div>
              <div className="t">Put the glasses on your line.</div>
              <div className="v">Hardware, install and training included. First 90 days audit-ready or your money back.</div>
              <button className="go">Book a kitchen pilot →</button>
            </div>
            <div className="cta-card alt">
              <div className="k">For customers · free, forever</div>
              <div className="t">The app that reads the plate for your friends.</div>
              <div className="v">iOS and Android. No ads, no upsells. Your circle's allergen data stays on-device.</div>
              <button className="go">Download AllerSight →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site">
        <div className="inner">
          <div className="brand-block">
            <div className="logo">aller<LensSvg size={26} />sight</div>
            <p>A real-time allergen safety system that tracks contamination, proves compliance, and connects safe kitchens to the people eating at them.</p>
            <div style={{ fontSize:10, letterSpacing:1.5, textTransform:'uppercase', color:'rgba(244,241,234,0.5)' }}>Est. 2026 · Minneapolis, MN</div>
          </div>
          <div><h5>For kitchens</h5><ul><li><a href="#">Kitchen pilot</a></li><li><a href="#">Protocol log</a></li><li><a href="#">Compliance</a></li><li><a href="#">Hardware</a></li></ul></div>
          <div><h5>For customers</h5><ul><li><a href="#">Get the app</a></li><li><a href="#">Trusted kitchens</a></li><li><a href="#">Friend circles</a></li><li><a href="#">Privacy</a></li></ul></div>
          <div><h5>Company</h5><ul><li><a href="#">Manifesto</a></li><li><a href="#">Science</a></li><li><a href="#">Press</a></li><li><a href="#">Careers</a></li></ul></div>
        </div>
        <div className="legal">
          <span>© 2026 AllerSight, Inc.</span>
          <span>SOC 2 · HIPAA-aligned · FDA-referenced audit trail</span>
        </div>
      </footer>
    </>
  );
}
