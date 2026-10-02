import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import MemoryCard from "../components/MemoryCard";
import EmptyState from "../components/EmptyState";
import type { Memory } from "../types/database";

export default function Search() {
  const { couple } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Memory[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function runSearch(q: string) {
    if (!couple || !q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const like = `%${q.trim()}%`;
    const { data } = await supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .or(
        `title.ilike.${like},content.ilike.${like},day_summary.ilike.${like},note_to_partner.ilike.${like},location.ilike.${like}`
      )
      .order("date", { ascending: false });

    // Also match tags client-side (array contains, case-insensitive-ish)
    const tagMatches = (data ?? []).filter((m: any) => m.tags?.some((t: string) => t.toLowerCase().includes(q.toLowerCase())));
    const merged = data ?? [];
    for (const t of tagMatches) {
      if (!merged.find((m) => m.id === t.id)) merged.push(t);
    }

    setResults(merged);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Search</h1>
        <p className="text-sm text-dim">Find a memory by title, date, tag, or place.</p>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          placeholder="beach, birthday, Paris…"
          className="flex-1 rounded-pill glass-input px-4 py-2.5 text-sm"
        />
        <button
          onClick={() => runSearch(query)}
          className="rounded-pill btn-rose px-5 py-2.5 text-sm font-medium text-white transition"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-dim">Searching…</p>
      ) : searched && results.length === 0 ? (
        <EmptyState icon="🔍" title="No memories found" subtitle="Try a different word, tag, or place." />
      ) : (
        <div className="space-y-3">
          {results.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}
    </div>
  );
}
