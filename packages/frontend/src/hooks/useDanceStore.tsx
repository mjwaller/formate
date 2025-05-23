import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
  } from 'react';
  import { nanoid } from 'nanoid';
  
  /* ---------- types ---------- */
  export interface Dance {
    id: string;
    title: string;
    dancers: string[];            // always an array of dancer names
  }
  
  type Action =
    | { type: 'add'; title: string }
    | { type: 'delete'; danceId: string }
    | { type: 'edit-title'; danceId: string; title: string }
    | { type: 'edit-dancers'; danceId: string; dancers: string[] };
  
  interface DanceContextValue {
    dances: Dance[];
    dispatch: (a: Action) => void;
  }
  
  /* ---------- initial seed data (arrays, not numbers) ---------- */
  const initialDances: Dance[] = [
    {
      id: nanoid(),
      title: 'Serenade',
      dancers: ['Ava', 'Jordan', 'Riley', 'Sam']
    },
    {
      id: nanoid(),
      title: 'Lost & Found',
      dancers: ['Kai', 'Maya', 'Leo', 'Zoe', 'Noah', 'Luna']
    },
    {
      id: nanoid(),
      title: 'Midnight Groove',
      dancers: ['Alex', 'Brook', 'Charlie']
    }
  ];
  
  /* ---------- reducer ---------- */
  function reducer(state: Dance[], action: Action): Dance[] {
    switch (action.type) {
      case 'add':
        return [
          ...state,
          { id: nanoid(), title: action.title, dancers: [] }
        ];
  
      case 'delete':
        return state.filter(d => d.id !== action.danceId);
  
      case 'edit-title':
        return state.map(d =>
          d.id === action.danceId ? { ...d, title: action.title } : d
        );
  
      case 'edit-dancers':
        return state.map(d =>
          d.id === action.danceId ? { ...d, dancers: action.dancers } : d
        );
  
      default:
        return state;
    }
  }
  
  /* ---------- context & provider ---------- */
  const DanceCtx = createContext<DanceContextValue | null>(null);
  
  export function DanceProvider({ children }: { children: ReactNode }) {
    const [dances, dispatch] = useReducer(reducer, [], () => {
      const saved = localStorage.getItem('dances');
      return saved ? (JSON.parse(saved) as Dance[]) : initialDances;
    });
  
    useEffect(() => {
      localStorage.setItem('dances', JSON.stringify(dances));
    }, [dances]);
  
    return (
      <DanceCtx.Provider value={{ dances, dispatch }}>
        {children}
      </DanceCtx.Provider>
    );
  }
  
  /* ---------- convenience hook ---------- */
  export function useDances() {
    const ctx = useContext(DanceCtx);
    if (!ctx) throw new Error('useDances must be used inside DanceProvider');
    return ctx;
  }
  