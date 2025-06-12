// packages/frontend/src/pages/DashboardPage.tsx
import { useState } from "react";
import { useDances, useCreateDance, useDeleteDance } from "../api/dances";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { data: dances, isLoading, error } = useDances();
  const createDance = useCreateDance();
  const deleteDance = useDeleteDance();

  const [name, setName] = useState("");
  const [numberOfDancers, setNumberOfDancers] = useState(5);

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error loading dances</p>;

  return (
    <main className="content">
      {/* Full-width create panel */}
      <div className="panel add-form-panel">
        <div className="create-header">Create a New Dance!</div>
        <form
          className="create-controls"
          onSubmit={(e) => {
            e.preventDefault();
            createDance.mutate({ name, numberOfDancers });
            setName("");
            setNumberOfDancers(5);
          }}
        >
          <input
            type="text"
            placeholder="Title of Dance"
            aria-label="Title of dance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            min={1}
            max={20}
            placeholder="# of dancers"
            aria-label="Number of dancers"
            value={numberOfDancers}
            onChange={(e) => setNumberOfDancers(Number(e.target.value))}
            required
          />
          <button type="submit" className="btn-sm">
            Create
          </button>
        </form>
      </div>

      {/* Grid of existing dance cards */}
      <section className="dance-list">
        {dances?.map((d) => (
          <div key={d._id} className="dance-item card">
            <div className="meta">
              <h3>{d.name}</h3>
              <p>{d.numberOfDancers} dancers</p>
            </div>
            <div className="item-actions">
              <Link to={`/editor/${d._id}`} className="btn-sm">
                Edit
              </Link>
              <button
                className="btn-sm"
                onClick={() => deleteDance.mutate(d._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
