import { useDances, useCreateDance, useDeleteDance } from "../api/dances";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: dances, isLoading, isError } = useDances();
  const createDance = useCreateDance();
  const deleteDance = useDeleteDance();

  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState(5);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createDance.mutate({ name: newName, numberOfDancers: newCount });
    setNewName("");
    setNewCount(5);
  }

  if (isLoading) return <p>Loading dances...</p>;
  if (isError) return <p>Failed to load dances.</p>;

  return (
    <main>
      <h1>Your Dances</h1>

      <form onSubmit={handleCreate}>
        <label>
          Name:
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </label>
        <label>
          # of Dancers:
          <input
            type="number"
            value={newCount}
            onChange={(e) => setNewCount(Number(e.target.value))}
            min={1}
            max={20}
            required
          />
        </label>
        <button type="submit" disabled={createDance.isPending}>
          Create Dance
        </button>
      </form>

      <ul>
        {dances?.map((dance) => (
          <li key={dance._id}>
            <strong>{dance.name}</strong> ({dance.numberOfDancers} dancers)
            <button onClick={() => navigate(`/editor/${dance._id}`)}>Edit</button>
            <button onClick={() => deleteDance.mutate(dance._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
