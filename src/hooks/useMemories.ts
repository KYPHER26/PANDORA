import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Memory } from "../types/database";
import { useAuth } from "../context/AuthContext";

interface UseMemoriesOptions {
  date?: string; // exact date filter, YYYY-MM-DD
  specialOnly?: boolean;
  limit?: number;
}

export function useMemories(options: UseMemoriesOptions = {}) {
  const { couple } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    if (!couple) {
      setMemories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options.date) query = query.eq("date", options.date);
    if (options.specialOnly) query = query.eq("is_special", true);
    if (options.limit) query = query.limit(options.limit);

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError("We couldn't load your memories right now.");
    } else {
      setMemories(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [couple, options.date, options.specialOnly, options.limit]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    if (!couple) return;
    const channel = supabase
      .channel(`memories-${couple.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memories", filter: `couple_id=eq.${couple.id}` },
        () => {
          fetchMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple, fetchMemories]);

  return { memories, loading, error, refresh: fetchMemories };
}
