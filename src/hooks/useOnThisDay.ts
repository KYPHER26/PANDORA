import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Memory } from "../types/database";
import { useAuth } from "../context/AuthContext";

export function useOnThisDay() {
  const { couple } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!couple) {
      setLoading(false);
      return;
    }
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .lt("date", today.toISOString().slice(0, 10))
      .then(({ data }) => {
        const matches = (data ?? []).filter((m) => {
          const d = new Date(m.date);
          return d.getMonth() + 1 === month && d.getDate() === day;
        });
        setMemories(matches);
        setLoading(false);
      });
  }, [couple]);

  return { memories, loading };
}
