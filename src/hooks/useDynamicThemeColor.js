import { useEffect } from 'react';

/**
 * Custom hook to dynamically update the document's theme-color meta tag
 * based on sections with a `data-theme-color` attribute.
 * 
 * @param {string} defaultColor - The color to fall back to.
 */
export const useDynamicThemeColor = (defaultColor = '#ffffff') => {
  useEffect(() => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) return;

    const updateColor = () => {
      const sections = document.querySelectorAll('[data-theme-color]');
      let activeColor = defaultColor;

      // Find the section that currently covers the top of the viewport
      // We check if the section spans across the y=0 point.
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 10 && rect.bottom > 10) { // Using 10px buffer for reliability
          activeColor = section.getAttribute('data-theme-color') || defaultColor;
          break;
        }
      }

      const currentColor = metaTag.getAttribute('content');
      if (currentColor !== activeColor) {
        metaTag.setAttribute('content', activeColor);
      }
    };

    window.addEventListener('scroll', updateColor, { passive: true });
    // Run initially and also on a slight delay to ensure sections are rendered
    updateColor();
    const timeoutId = setTimeout(updateColor, 100);

    return () => {
      window.removeEventListener('scroll', updateColor);
      clearTimeout(timeoutId);
      metaTag.setAttribute('content', defaultColor);
    };
  }, [defaultColor]);
};
