// packages/frontend/src/pages/EditorPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useDanceById,
  useUpdateFormation,
  useAddFormation,
  useDeleteFormation,
} from "../api/dances";

interface Dot {
  dancerIndex: number;
  x: number; // percent
  y: number; // percent
}

export default function EditorPage() {
  const { danceId } = useParams();
  const { data: dance, isLoading } = useDanceById(danceId!);
  const saveFormation = useUpdateFormation();
  const addFormation = useAddFormation();
  const deleteFormation = useDeleteFormation();

  // Local state: array of formations and which index is active
  const [formations, setFormations] = useState<Dot[][]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [positions, setPositions] = useState<Dot[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Seed local formations from server data
  useEffect(() => {
    if (dance?.formations) {
      const all = dance.formations.map((f) => [...f.positions]);
      setFormations(all);
      setCurrentIdx(all.length - 1);
      setPositions(all[all.length - 1]);
    }
  }, [dance]);

  // Sync positions when currentIdx changes
  useEffect(() => {
    if (formations[currentIdx]) {
      setPositions(formations[currentIdx]);
    }
  }, [formations, currentIdx]);

  if (isLoading || !dance) return <p>Loading...</p>;

  // Drag handlers
  const handleMouseDown = (idx: number) => setDragging(idx);
  const handleMouseUp = () => setDragging(null);
  const handleMouseMove = (ev: React.MouseEvent) => {
    if (dragging === null || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    let x = ev.clientX - rect.left;
    let y = ev.clientY - rect.top;
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    const xp = (x / rect.width) * 100;
    const yp = (y / rect.height) * 100;
    setPositions((arr) =>
      arr.map((p) =>
        p.dancerIndex === dragging ? { ...p, x: xp, y: yp } : p
      )
    );
  };

  // Save current formation (only updates that one locally)
  const handleSave = () => {
    const formation = dance.formations[currentIdx];
    saveFormation.mutate({
      danceId: dance._id,
      formationId: formation.id,
      positions,
    });
    setFormations((all) => {
      const next = [...all];
      next[currentIdx] = [...positions];
      return next;
    });
  };

  // Add a new formation (clone last)
  const handleAddFormation = () => {
    addFormation.mutate(dance._id, {
      onSuccess: (newF) => {
        setFormations((all) => {
          const updated = [...all, newF.positions];
          setCurrentIdx(updated.length - 1);
          return updated;
        });
      },
    });
  };

  // Delete the current formation
  const handleDeleteFormation = () => {
    const formation = dance.formations[currentIdx];
    deleteFormation.mutate(
      { danceId: dance._id, formationId: formation.id },
      {
        onSuccess: () => {
          setFormations((all) => {
            const filtered = all.filter((_, i) => i !== currentIdx);
            const newIdx = Math.min(filtered.length - 1, currentIdx);
            setCurrentIdx(Math.max(0, newIdx));
            return filtered;
          });
        },
      }
    );
  };

  return (
    <main>
      <h1>{dance.name}</h1>

      {/* Controls */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          ← Prev
        </button>
        <span style={{ margin: "0 1em" }}>
          Formation {currentIdx + 1} of {formations.length}
        </span>
        <button
          onClick={() =>
            setCurrentIdx((i) => Math.min(formations.length - 1, i + 1))
          }
          disabled={currentIdx === formations.length - 1}
        >
          Next →
        </button>
        <button onClick={handleAddFormation} style={{ margin: "0 1em" }}>
          + Add Formation
        </button>
        <button
          onClick={handleDeleteFormation}
          disabled={formations.length <= 1}
        >
          🗑️ Delete Formation
        </button>
      </div>

      {/* Draggable Grid */}
      <div
        ref={gridRef}
        style={{
          width: "100%",
          maxWidth: 600,
          height: 600,
          border: "1px solid lightgray",
          position: "relative",
          userSelect: "none",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {positions.map((p) => {
          const left = (p.x / 100) * 600;
          const top = (p.y / 100) * 600;
          return (
            <div
              key={p.dancerIndex}
              onMouseDown={() => handleMouseDown(p.dancerIndex)}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "red",
                border: "2px solid lime",
                position: "absolute",
                left,
                top,
                transform: "translate(-50%, -50%)",
                cursor: "grab",
                zIndex: 10,
              }}
              title={`Dancer ${p.dancerIndex + 1}`}
            />
          );
        })}
      </div>

      <button onClick={handleSave} style={{ marginTop: 8 }}>
        Save Formation
      </button>
    </main>
  );
}
