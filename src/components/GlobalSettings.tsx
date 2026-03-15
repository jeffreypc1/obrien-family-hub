'use client';

import { useEffect } from 'react';

export default function GlobalSettings() {
  useEffect(() => {
    fetch('/api/admin')
      .then((r) => r.json())
      .then((data) => {
        if (!data.config) return;

        // Apply font
        const fontName = data.config.fontPrimary;
        if (fontName && fontName !== 'Outfit') {
          const linkId = 'dynamic-font-global';
          let link = document.getElementById(linkId) as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
          document.documentElement.style.setProperty('--dynamic-font', `"${fontName}", sans-serif`);
          document.body.style.fontFamily = `"${fontName}", sans-serif`;
        }

        // Apply font size
        const fontSize = data.config.fontSize;
        if (fontSize) {
          document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
          document.documentElement.style.fontSize = `${fontSize}px`;
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
