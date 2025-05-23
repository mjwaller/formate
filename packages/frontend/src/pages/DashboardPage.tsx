import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useDances } from '../hooks/useDanceStore';

export default function DashboardPage() {
  const { dances, dispatch } = useDances();
  const [newTitle, setNewTitle] = useState('');

  /* ---------- handlers ---------- */
  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (trimmed) {
      dispatch({ type: 'add', title: trimmed });
      setNewTitle('');
    }
  }

  function handleDelete(id: string) {
    if (confirm('Delete this dance?')) dispatch({ type: 'delete', danceId: id });
  }

  /* ---------- render ---------- */
  return (
    <main>
      {/* quick-add form */}
      <form onSubmit={handleAdd} className="panel add-form">
        <label>
          <span>Add a new dance</span>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title…"
          />
        </label>
        <button type="submit" className="btn-sm">Add</button>
      </form>

      {/* list of existing dances */}
      <section className="dance-list">
        {dances.map(d => (
          <article key={d.id} className="card dance-item">
            <div className="meta">
              <h3>{d.title}</h3>
              <p>{d.dancers.length} {d.dancers.length === 1 ? 'dancer' : 'dancers'}</p>
            </div>

            <div className="item-actions">
              <Link to={`/editor/${d.id}`} className="btn-sm">Edit</Link>
              <button
                type="button"
                className="btn-icon"
                aria-label="Delete dance"
                title="Delete dance"
                onClick={() => handleDelete(d.id)}
              >
                🗑️
              </button>
            </div>
          </article>
        ))}

        {dances.length === 0 && (
          <p style={{ opacity: .7, paddingTop: '1rem' }}>
            No dances yet — add one above!
          </p>
        )}
      </section>
    </main>
  );
}
