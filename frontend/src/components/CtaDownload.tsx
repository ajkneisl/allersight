import { AppStoreButton, GooglePlayButton } from './StoreButtons';

export default function CtaDownload() {
  return (
    <section className="band-cta" id="download">
      <div className="inner">
        <div>
          <h2>
            A safer bite, <em>every time.</em>
          </h2>
          <p>
            Free to download. Works offline for the 14 major allergens. Premium
            unlocks custom profiles, family sharing, and travel dictionaries in
            42 languages.
          </p>
        </div>
        <div className="stores">
          <AppStoreButton size="lg" />
          <GooglePlayButton size="lg" />
        </div>
      </div>
    </section>
  );
}
