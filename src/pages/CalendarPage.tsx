import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import MemoryCard from "../components/MemoryCard";
import EmptyState from "../components/EmptyState";
import type { Memory } from "../types/database";

export default function CalendarPage() {
  const { couple } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [dayMemories, setDayMemories] = useState<Memory[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    if (!couple) return;
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(month), "yyyy-MM-dd");
    supabase
      .from("memories")
      .select("date")
      .eq("couple_id", couple.id)
      .gte("date", from)
      .lte("date", to)
      .then(({ data }) => {
        setMarkedDates(new Set((data ?? []).map((r) => r.date)));
      });
  }, [couple, month]);

  useEffect(() => {
    if (!couple) return;
    setLoadingDay(true);
    supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("date", format(selectedDate, "yyyy-MM-dd"))
      .then(({ data }) => {
        setDayMemories(data ?? []);
        setLoadingDay(false);
      });
  }, [couple, selectedDate]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = new Date(cur.getTime() + 86400000);
    }
    return days;
  }, [month]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Memory Calendar</h1>
        <p className="text-sm text-dim">Explore our story, one day at a time.</p>
      </div>

      <div className="rounded-soft border border-hairline bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="px-2 text-lg text-dim hover:text-current">
            ‹
          </button>
          <p className="font-display text-lg">{format(month, "MMMM yyyy")}</p>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="px-2 text-lg text-dim hover:text-current">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-dim">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {gridDays.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const hasMemory = markedDates.has(key);
            const inMonth = isSameMonth(d, month);
            const selected = isSameDay(d, selectedDate);
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                  selected ? "bg-rose text-white" : "hover:bg-surface-raised"
                } ${inMonth ? "" : "text-dim/40"}`}
              >
                {format(d, "d")}
                {hasMemory && (
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-rose"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-dim">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        {loadingDay ? (
          <div className="skeleton h-24 rounded-soft" />
        ) : dayMemories.length === 0 ? (
          <EmptyState icon="🗓️" title="No memories on this day" subtitle="Pick another date, or add one for today." />
        ) : (
          <div className="space-y-3">
            {dayMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
