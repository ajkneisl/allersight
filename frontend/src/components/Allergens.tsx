const CELLS = [
  { n: '01', hint: '80+ tree & seed variants', name: 'Tree nuts' },
  { n: '02', hint: 'Including lecithin & oil', name: 'Peanuts' },
  { n: '03', hint: 'Crustacean & mollusk', name: 'Shellfish' },
  { n: '04', hint: 'All finfish species', name: 'Fish' },
  { n: '05', hint: 'Whey, casein, butterfat', name: 'Dairy' },
  { n: '06', hint: 'Albumin, lysozyme', name: 'Eggs' },
  { n: '07', hint: 'Gluten-containing grains', name: 'Wheat' },
  { n: '08', hint: 'Lecithin, isolate, TVP', name: 'Soy' },
  { n: '09', hint: 'Tahini, halva, bun seeds', name: 'Sesame' },
  { n: '10', hint: 'Brassica & seed oils', name: 'Mustard' },
  { n: '11', hint: 'Wines, dried fruit', name: 'Sulfites' },
  { n: '12', hint: 'Root & leaf', name: 'Celery' },
  { n: '13', hint: 'Pea, bean, chickpea', name: 'Legumes' },
  { n: '14', hint: '+ your custom set', name: 'Your list' },
];

export default function Allergens() {
  return (
    <section className="band-what" id="covers">
      <div className="inner">
        <div className="head">
          <h2>
            The fourteen we <em>never miss.</em>
          </h2>
          <p className="lede">
            Every major declared allergen, plus the aliases, derivatives and
            cross-contamination notices that hide inside "natural flavoring,"
            "may contain," and long Latin names.
          </p>
        </div>
        <div className="allergen-grid">
          {CELLS.map((c) => (
            <div key={c.n} className="al-cell">
              <span className="num">{c.n}</span>
              <span className="hint">{c.hint}</span>
              <span className="name">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
