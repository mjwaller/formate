import { useEffect, useState } from 'react';

/**
 * Adds / removes the `.dark` class on <body>.
 * The user’s choice is stored in localStorage under "formate-theme".
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    // initial value: look at LS or prefers-color-scheme
    localStorage.getItem('formate-theme') === 'dark' ||
    (localStorage.getItem('formate-theme') === null &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('formate-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      className="btn-icon theme-toggle"
      onClick={() => setDark(v => !v)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '🌞' : '🌙'}
    </button>
  );
}
