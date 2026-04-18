type Props = {
  size?: 'sm' | 'lg';
};

export function AppStoreButton({ size = 'sm' }: Props) {
  const sz = size === 'lg' ? 28 : 22;
  return (
    <a href="#" className="store" aria-label="Download on the App Store">
      <svg width={sz} height={sz + 4} viewBox="0 0 22 26" fill="none">
        <path
          d="M18.3 13.8c0-3 2.5-4.5 2.6-4.5-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.2 1.5 12.2 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1s2.3 1 3.9 1c1.6 0 2.6-1.5 3.6-3 1.1-1.7 1.6-3.4 1.6-3.5-.1 0-3.1-1.2-3.1-4.7z M15.3 4.8c.8-1 1.4-2.4 1.2-3.8-1.2.1-2.6.8-3.4 1.8-.7.8-1.4 2.2-1.2 3.5 1.3.1 2.6-.6 3.4-1.5z"
          fill="currentColor"
        />
      </svg>
      <div>
        <div className="small">Download on the</div>
        <div className="big">App Store</div>
      </div>
    </a>
  );
}

export function GooglePlayButton({ size = 'sm' }: Props) {
  const sz = size === 'lg' ? 28 : 22;
  return (
    <a href="#" className="store" aria-label="Get it on Google Play">
      <svg width={sz} height={sz + 4} viewBox="0 0 22 26" fill="none">
        <path
          d="M1.8 1.4c-.4.4-.6 1-.6 1.8v19.6c0 .8.2 1.4.6 1.8l.1.1L13 13.2v-.4L1.9 1.3l-.1.1z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M16.7 16.9L13 13.2v-.4l3.7-3.7.1.1 4.4 2.5c1.3.7 1.3 1.9 0 2.6l-4.4 2.5-.1.1z"
          fill="currentColor"
        />
        <path
          d="M16.8 16.8L13 13 1.8 24.4c.4.5 1.1.5 1.9.1l13.1-7.7"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M16.8 9.2L3.7 1.5c-.8-.4-1.5-.4-1.9.1L13 13l3.8-3.8z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
      <div>
        <div className="small">Get it on</div>
        <div className="big">Google Play</div>
      </div>
    </a>
  );
}
