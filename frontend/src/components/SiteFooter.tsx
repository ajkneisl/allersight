import BrandMark from './BrandMark';

const PRODUCT = ['Features', 'Premium', 'Profiles', 'Releases'];
const COMPANY = ['About', 'Journal', 'Careers', 'Press'];
const SUPPORT = ['Help center', 'Emergency info', 'Contact', 'Privacy'];

export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="inner">
        <div className="brand-block">
          <div className="logo">
            <BrandMark />
          </div>
          <p>
            A pocket investigator for everyone who has ever hesitated over a
            menu, a label, or a stranger's kitchen.
          </p>
        </div>
        <div>
          <h5>Product</h5>
          <ul>
            {PRODUCT.map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            {COMPANY.map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Support</h5>
          <ul>
            {SUPPORT.map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="legal">
        <span>© 2026 AllerVision. Not a medical device.</span>
        <span>Made for the allergic few.</span>
      </div>
    </footer>
  );
}
