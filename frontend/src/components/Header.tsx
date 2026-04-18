import BrandMark from './BrandMark';

export default function Header() {
  return (
    <header className="site">
      <div className="nav">
        <a href="#" className="brand">
          <BrandMark />
        </a>
        <ul>
          <li>
            <a href="#how">How</a>
          </li>
          <li>
            <a href="#covers">Allergens</a>
          </li>
          <li>
            <a href="#glasses">Lens</a>
          </li>
          <li>
            <a href="#nutrition">Nutrition</a>
          </li>
        </ul>
        <a href="#download" className="cta">
          Get the app
        </a>
      </div>
    </header>
  );
}
