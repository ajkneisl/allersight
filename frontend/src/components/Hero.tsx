import PhoneStage from './PhoneStage';
import { AppStoreButton, GooglePlayButton } from './StoreButtons';

export default function Hero() {
  return (
    <section className="hero">
      <div className="copy">
        <div className="eyebrow">A pocket allergen investigator</div>
        <h1>
          Know <em>exactly</em> what's on your{' '}
          <span className="underlined">plate.</span>
        </h1>
        <p className="lede">
          AllerVision reads every ingredient the way you'd read them yourself —
          only faster, and without missing a thing. A pocket investigator for
          the allergic few, and a quiet coach for anyone minding their macros.
        </p>
        <div className="stores">
          <AppStoreButton />
          <GooglePlayButton />
        </div>
      </div>
      <PhoneStage />
    </section>
  );
}
