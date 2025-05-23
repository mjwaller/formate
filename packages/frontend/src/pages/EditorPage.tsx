import { useParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useDances } from '../hooks/useDanceStore';

export default function EditorPage() {
  const { danceId } = useParams<{ danceId: string }>();
  if (!danceId) return <p style={{ padding: '1rem' }}>Invalid URL (no id).</p>;

  const { dances, dispatch } = useDances();
  const dance = dances.find(d => d.id === danceId);
  if (!dance) return <p style={{ padding: '1rem' }}>Dance not found.</p>;

  /* ---------- local form state ---------- */
  const [title, setTitle] = useState(dance.title);

  // guard: if dancers is accidentally not an array, coerce to string first
  const startText = Array.isArray(dance.dancers)
    ? dance.dancers.join(', ')
    : String(dance.dancers);

  const [dancerText, setDancerText] = useState(startText);

  function handleSave(e: FormEvent) {
    e.preventDefault();

    const id = dance!.id; // dance is definitely defined here

    dispatch({ type: 'edit-title', danceId: id, title });

    const list = dancerText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    dispatch({ type: 'edit-dancers', danceId: id, dancers: list });
    alert('Saved! (persists until browser reload)');
  }

  return (
    <main>
      <h1>Edit Dance</h1>

      <form onSubmit={handleSave} className="panel" style={{ maxWidth: 480 }}>
        <label>
          Title
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </label>

        <label style={{ marginTop: 12 }}>
          Dancers (comma separated)
          <input
            value={dancerText}
            onChange={e => setDancerText(e.target.value)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </label>

        <button type="submit" className="btn-sm" style={{ marginTop: 16 }}>
          Save
        </button>
      </form>

      {/* placeholder for future interactive stage */}
      <div className="stage-wrap" style={{ marginTop: '2rem' }}>
        <section className="stage card" aria-label="Stage canvas"></section>
      </div>
    </main>
  );
}
