// packages/frontend/src/pages/EditorPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useDanceById,
  useUpdateFormation,
  useAddFormation,
  useDeleteFormation,
  useUpdateDance,
} from "../api/dances";

interface Dot {
  dancerIndex: number;
  x: number; // percent
  y: number; // percent
}

export default function EditorPage() {
  const { danceId } = useParams<{ danceId: string }>();
  const { data: dance, isLoading } = useDanceById(danceId!);
  const saveFormation = useUpdateFormation();
  const addFormation = useAddFormation();
  const deleteFormation = useDeleteFormation();
  const updateDance = useUpdateDance();

  const [formations, setFormations] = useState<Dot[][]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [positions, setPositions] = useState<Dot[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState(0);

  const gridRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1) Seed formations once
  useEffect(() => {
    if (dance?.formations && formations.length === 0) {
      const all = dance.formations.map((f) => [...f.positions]);
      setFormations(all);
      setCurrentIdx(all.length - 1);
      setPositions(all[all.length - 1]);
    }
  }, [dance, formations.length]);

  // 2) Sync positions on index change
  useEffect(() => {
    if (formations[currentIdx]) {
      setPositions(formations[currentIdx]);
    }
  }, [formations, currentIdx]);

  // 3) Auto‐save with debounce, update local copy
  useEffect(() => {
    if (!dance) return;
    clearTimeout(debounceTimer.current!);
    debounceTimer.current = setTimeout(() => {
      const f = dance.formations[currentIdx];
      saveFormation.mutate({
        danceId: dance._id,
        formationId: f.id,
        positions,
      });
      setFormations((all) => {
        const next = [...all];
        next[currentIdx] = [...positions];
        return next;
      });
    }, 500);
    return () => clearTimeout(debounceTimer.current!);
  }, [positions, currentIdx, dance, saveFormation]);

  if (isLoading || !dance) return <p>Loading…</p>;

  // Drag handlers
  const onMouseDown = (i: number) => setDragging(i);
  const onMouseUp = () => setDragging(null);
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragging === null || !gridRef.current) return;
    const r = gridRef.current.getBoundingClientRect();
    let x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    let y = Math.max(0, Math.min(r.height, e.clientY - r.top));
    const xp = (x / r.width) * 100;
    const yp = (y / r.height) * 100;
    setPositions((arr) =>
      arr.map((p) =>
        p.dancerIndex === dragging ? { ...p, x: xp, y: yp } : p
      )
    );
  };

  // Add / Delete formations
  const onAdd = () => {
    addFormation.mutate(danceId!, {
      onSuccess: (newF) => {
        setFormations((all) => {
          const updated = [...all, newF.positions];
          setCurrentIdx(updated.length - 1);
          return updated;
        });
      },
    });
  };
  const onDelete = () => {
    const f = dance.formations[currentIdx];
    deleteFormation.mutate(
      { danceId: danceId!, formationId: f.id },
      {
        onSuccess: () => {
          setFormations((all) => {
            const filtered = all.filter((_, i) => i !== currentIdx);
            setCurrentIdx((i) => Math.min(filtered.length - 1, i));
            return filtered;
          });
        },
      }
    );
  };

  // Open modal and seed fields
  const openModal = () => {
    setEditName(dance.name);
    setEditCount(dance.numberOfDancers);
    setIsModalOpen(true);
  };

  // Apply modal changes
  const applyChanges = () => {
    if (!dance) return;
    const oldCount = dance.numberOfDancers;
    updateDance.mutate(
      { danceId: danceId!, name: editName, numberOfDancers: editCount },
      {
        onSuccess: () => {
          setFormations((all) => {
            if (editCount < oldCount) {
              // shrink: remove high-index dancers
              return all.map((f) =>
                f.filter((d) => d.dancerIndex < editCount)
              );
            } else if (editCount > oldCount) {
              // grow: append new dancers at back line
              return all.map((f) => {
                const next = [...f];
                for (let i = f.length; i < editCount; i++) {
                  const x =
                    editCount > 1 ? (i / (editCount - 1)) * 100 : 50;
                  next.push({ dancerIndex: i, x, y: 100 });
                }
                return next;
              });
            }
            return all;
          });
          setIsModalOpen(false);
        },
      }
    );
  };

  return (
    <main style={{ padding: "1rem" }}>
      {/* Back + Edit */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Link to="/" aria-label="Back to dashboard">
          ← Back
        </Link>
        <button className="btn-sm" onClick={openModal}>
          ✎ Edit Dance Info
        </button>
      </div>

      <h1>{dance.name}</h1>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          margin: "1rem 0",
        }}
      >
        <button
          className="btn-sm"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          ← Prev
        </button>
        <span>
          Formation {currentIdx + 1} of {formations.length}
        </span>
        <button
          className="btn-sm"
          onClick={() =>
            setCurrentIdx((i) => Math.min(formations.length - 1, i + 1))
          }
          disabled={currentIdx === formations.length - 1}
        >
          Next →
        </button>
        <button className="btn-sm" onClick={onAdd}>
          + Add Formation
        </button>
        <button
          className="btn-sm"
          onClick={onDelete}
          disabled={formations.length <= 1}
        >
          🗑️ Delete Formation
        </button>
      </div>

      {/* Stage Directions + Grid */}
      <div style={{ textAlign: "center", opacity: 0.8, marginBottom: "0.5rem" }}>
        Backstage
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            transform: "rotate(-90deg)",
            opacity: 0.8,
            marginRight: "0.3rem",
          }}
        >
          Stage Right
        </div>
        <div
          id="grid-box"
          ref={gridRef}
          style={{
            width: 600,
            height: 600,
            position: "relative",
            userSelect: "none",
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "10% 100%, 100% 10%",
            border: "2px solid var(--purple-700)",
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {positions.map((p) => {
            const left = (p.x / 100) * 600;
            const top = (p.y / 100) * 600;
            return (
              <div
                key={p.dancerIndex}
                onMouseDown={() => onMouseDown(p.dancerIndex)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--purple-500)",
                  color: "var(--color-on-primary)",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  textAlign: "center",
                  lineHeight: "28px",
                  position: "absolute",
                  left,
                  top,
                  transform: "translate(-50%, -50%)",
                  cursor: "grab",
                  zIndex: 10,
                }}
                title={`Dancer ${p.dancerIndex + 1}`}
              >
                {p.dancerIndex + 1}
              </div>
            );
          })}
        </div>
        <div
          style={{
            transform: "rotate(90deg)",
            opacity: 0.8,
            marginLeft: "0.3rem",
          }}
        >
          Stage Left
        </div>
      </div>
      <div style={{ textAlign: "center", opacity: 0.8, marginTop: "0.5rem" }}>
        Audience
      </div>

      {/* Edit Dance Info Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Dance Info</h2>
            <label>
              Name
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label>
              Number of Dancers
              <input
                type="number"
                min={1}
                max={20}
                value={editCount}
                onChange={(e) => setEditCount(Number(e.target.value))}
              />
            </label>
            <div className="modal-buttons">
              <button
                className="btn-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn-sm" onClick={applyChanges}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
