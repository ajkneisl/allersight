import { useEffect, useState } from 'react';
import IOSDevice from './IOSDevice';
import SplashScene from './scenes/SplashScene';
import ScanningScene from './scenes/ScanningScene';
import ResultsScene from './scenes/ResultsScene';

type Scene = 'splash' | 'scanning' | 'results';

export default function InHeroPhone() {
  const [scene, setScene] = useState<Scene>('splash');

  useEffect(() => {
    if (scene !== 'results') return;
    const id = setTimeout(() => setScene('splash'), 6000);
    return () => clearTimeout(id);
  }, [scene]);

  let content;
  if (scene === 'splash') {
    content = <SplashScene onStart={() => setScene('scanning')} />;
  } else if (scene === 'scanning') {
    content = <ScanningScene onComplete={() => setScene('results')} />;
  } else {
    content = <ResultsScene onRestart={() => setScene('splash')} />;
  }

  return <IOSDevice dark={scene === 'scanning'}>{content}</IOSDevice>;
}
