"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface DayPerformance {
  date: string;
  dayName: string;
  dayNum: number;
  completed: number;
  total: number;
  isToday: boolean;
}

function Dashboard() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [weekData, setWeekData] = useState<DayPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days: DayPerformance[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        completed: 0,
        total: 0,
        isToday: i === 0,
      });
    }

    if (userId) {
      axios
        .get(`/api/logs/week?userId=${userId}`)
        .then(({ data: json }) => {
          if (json.success) {
            for (const log of json.data) {
              const logDate = new Date(log.date).toISOString().split("T")[0];
              const day = days.find((d) => d.date === logDate);
              if (day) {
                day.total = log.entries.length;
                day.completed = log.entries.filter(
                  (e: { completed: boolean }) => e.completed
                ).length;
              }
            }
          }
          setWeekData(days);
          setLoading(false);
        })
        .catch(() => {
          setWeekData(days);
          setLoading(false);
        });
    } else {
      setWeekData(days);
      setLoading(false);
    }
  }, [userId]);

  const totalCompleted = weekData.reduce((s, d) => s + d.completed, 0);
  const totalHabits = weekData.reduce((s, d) => s + d.total, 0);
  const activeDays = weekData.filter((d) => d.completed > 0).length;
  const successRate =
    totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-800 to-blue-600 p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-1">Your Progress</h1>
          <p className="text-blue-300 text-sm">Past 7 days performance</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Active Days", value: activeDays },
            { label: "Completed", value: totalCompleted },
            { label: "Success Rate", value: `${successRate}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20"
            >
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-300 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Grid */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
            Weekly Overview
          </h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin h-8 w-8 text-blue-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {weekData.map((day) => {
                  const pct = day.total > 0 ? day.completed / day.total : -1;
                  const bg =
                    pct < 0
                      ? "bg-white/10"
                      : pct === 1
                      ? "bg-green-400"
                      : pct > 0
                      ? "bg-yellow-400"
                      : "bg-red-400/70";

                  return (
                    <div key={day.date} className="flex flex-col items-center gap-2">
                      <p className="text-blue-300 text-xs font-medium">{day.dayName}</p>
                      <div
                        className={`w-full aspect-square rounded-xl ${bg} flex flex-col items-center justify-center gap-0.5 ${
                          day.isToday ? "ring-2 ring-white ring-offset-1 ring-offset-transparent" : ""
                        }`}
                      >
                        <span className="text-white/90 text-xs font-bold">{day.dayNum}</span>
                        {day.total > 0 && (
                          <span className="text-white/70 text-[9px]">
                            {day.completed}/{day.total}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-5 text-xs text-blue-300">
                {[
                  { color: "bg-green-400", label: "All done" },
                  { color: "bg-yellow-400", label: "Partial" },
                  { color: "bg-red-400/70", label: "Missed" },
                  { color: "bg-white/10", label: "No habits" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded ${item.color} inline-block`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Empty state */}
        {!loading && totalHabits === 0 && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 text-center">
            <p className="text-white font-semibold text-lg mb-1">No habits tracked yet</p>
            <p className="text-blue-300 text-sm">
              Start adding habits to see your weekly performance here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-800 to-blue-600 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}
