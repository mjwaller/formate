import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { v4 as uuidv4 } from "uuid";

export interface Dance {
  _id: string;
  name: string;
  numberOfDancers: number;
  formations: {
    id: string;
    positions: { dancerIndex: number; x: number; y: number }[];
  }[];
}

export interface Formation {
  id: string;
  positions: { dancerIndex: number; x: number; y: number }[];
}

// Fetch all dances
// packages/frontend/src/api/dances.ts
export function useDances() {
  const { token } = useAuth();
  return useQuery<Dance[]>({
    queryKey: ["dances"],
    queryFn: async () => {
      const res = await fetch("/api/dances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dances");
      return res.json();
    },
    refetchOnMount: "always",
  });
}


// Create a new dance
export function useCreateDance() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      numberOfDancers,
    }: {
      name: string;
      numberOfDancers: number;
    }) => {
      const res = await fetch("/api/dances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, numberOfDancers }),
      });
      if (!res.ok) throw new Error("Failed to create dance");
      return res.json() as Promise<Dance>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dances"] });
    },
  });
}

// Delete a dance
export function useDeleteDance() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (danceId: string) => {
      const res = await fetch(`/api/dances/${danceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete dance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dances"] });
    },
  });
}

// Fetch one dance by ID
export function useDanceById(danceId: string) {
  const { token } = useAuth();
  return useQuery<Dance>({
    queryKey: ["dance", danceId],
    queryFn: async () => {
      const res = await fetch("/api/dances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dance");
      const all = (await res.json()) as Dance[];
      return all.find((d) => d._id === danceId)!;
    },
    enabled: !!danceId,
  });
}

// Update an existing formation
export function useUpdateFormation() {
    const { token } = useAuth();
    const qc = useQueryClient();
  
    return useMutation({
      mutationFn: async ({
        danceId,
        formationId,
        positions,
      }: {
        danceId: string;
        formationId: string;
        positions: { dancerIndex: number; x: number; y: number }[];
      }) => {
        const res = await fetch(
          `/api/dances/${danceId}/formations/${formationId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ positions }),
          }
        );
        if (!res.ok) throw new Error("Failed to update formation");
      },
      onMutate: async ({ danceId, formationId, positions }) => {
        await qc.cancelQueries({ queryKey: ["dance", danceId] });
        const previous = qc.getQueryData<Dance>(["dance", danceId]);
        if (previous) {
          // Patch only the one formation
          const patched: Dance = {
            ...previous,
            formations: previous.formations.map((f) =>
              f.id === formationId ? { ...f, positions } : f
            ),
          };
          qc.setQueryData(["dance", danceId], patched);
        }
        return { previous };
      },
      onError: (_err, _vars, context: any) => {
        if (context?.previous) {
          qc.setQueryData(["dance", context.previous._id], context.previous);
        }
      },
      onSettled: (_data, _err, { danceId }) => {
        qc.invalidateQueries({ queryKey: ["dance", danceId] });
      },
    });
  }

  export function useUpdateDance() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
  
    return useMutation<
      // TData:
      { danceId: string; name: string; numberOfDancers: number },
      // TError:
      Error,
      // TVariables:
      { danceId: string; name: string; numberOfDancers: number }
    >({
      mutationFn: async ({ danceId, name, numberOfDancers }) => {
        const res = await fetch(`/api/dances/${danceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, numberOfDancers }),
        });
        if (!res.ok) {
          // try to parse error message, or fallback
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.message || "Failed to update dance");
        }
        return { danceId, name, numberOfDancers };
      },
      onSuccess: (data) => {
        const { danceId, name, numberOfDancers } = data;
  
        // 1) update dances list
        queryClient.setQueryData<Dance[]>(
          ["dances"],
          (old) =>
            old?.map((d) =>
              d._id === danceId
                ? { ...d, name, numberOfDancers }
                : d
            ) ?? []
        );
  
        // 2) update individual dance cache
        queryClient.setQueryData<Dance>(
          ["dance", danceId],
          (old) =>
            old
              ? { ...old, name, numberOfDancers }
              : old!
        );
      },
    });
  }

// Add a new formation (optimistic)
export function useAddFormation() {
    const { token } = useAuth();
    const qc = useQueryClient();
  
    return useMutation({
      mutationFn: async (danceId: string): Promise<Formation> => {
        const res = await fetch(`/api/dances/${danceId}/formations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to add formation");
        return res.json();
      },
      onMutate: async (danceId) => {
        await qc.cancelQueries({ queryKey: ["dance", danceId] });
        const previous = qc.getQueryData<Dance>(["dance", danceId]);
        if (previous) {
          const tempId = uuidv4();
          const last = previous.formations[previous.formations.length - 1];
          const patched: Dance = {
            ...previous,
            formations: [
              ...previous.formations,
              { id: tempId, positions: last.positions },
            ],
          };
          qc.setQueryData(["dance", danceId], patched);
        }
        return { previous };
      },
      onError: (_err, danceId, context: any) => {
        if (context?.previous) {
          qc.setQueryData(["dance", danceId], context.previous);
        }
      },
      onSettled: (_data, _err, danceId) => {
        qc.invalidateQueries({ queryKey: ["dance", danceId] });
      },
    });
  }
  
  // Delete a formation (optimistic)
  export function useDeleteFormation() {
    const { token } = useAuth();
    const qc = useQueryClient();
  
    return useMutation({
      mutationFn: async ({
        danceId,
        formationId,
      }: {
        danceId: string;
        formationId: string;
      }) => {
        const res = await fetch(
          `/api/dances/${danceId}/formations/${formationId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to delete formation");
      },
      onMutate: async ({ danceId, formationId }) => {
        await qc.cancelQueries({ queryKey: ["dance", danceId] });
        const previous = qc.getQueryData<Dance>(["dance", danceId]);
        if (previous) {
          const patched: Dance = {
            ...previous,
            formations: previous.formations.filter((f) => f.id !== formationId),
          };
          qc.setQueryData(["dance", danceId], patched);
        }
        return { previous };
      },
      onError: (_err, vars, context: any) => {
        if (context?.previous) {
          qc.setQueryData(["dance", vars.danceId], context.previous);
        }
      },
      onSettled: (_data, _err, vars) => {
        qc.invalidateQueries({ queryKey: ["dance", vars.danceId] });
      },
    });
  }
  
  



