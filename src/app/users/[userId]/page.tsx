"use client";

import { useState, useEffect, useCallback, use } from "react";
import axios from "axios";
import { Button, Input, InputNumber, Popover, Select, Switch, message } from "antd";
import { GYM_HABIT_ID, WORKOUT_TYPES } from "@/lib/constants";

interface DayPerformance {
  date: string;
  dayName: string;
  dayNum: number;
  completed: boolean;
  logged: boolean;
  isToday: boolean;
  // detail for hover popover
  durationMin: number;
  description: string;
  note: string;
  workoutType: string;
}

interface GymForm {
  completed: boolean;
  durationMin: number;
  description: string;
  note: string;
  workoutType: string;
}

const EMPTY_FORM: GymForm = {
  completed: false,
  durationMin: 0,
  description: "",
  note: "",
  workoutType: "",
};

// Flat HabitLog row shape (only fields we read)
interface LogRow {
  date: string;
  completed: boolean;
  durationMin?: number;
  description?: string;
  note?: string;
  data?: { workoutType?: string };
}

export default function UserDashboard({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const [weekData, setWeekData] = useState<DayPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<GymForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // prefillForm: on initial load we prefill today's entry so the user can edit it.
  // After a save we refresh the grid only (form is reset separately).
  const loadWeek = useCallback(
    async (prefillForm: boolean) => {
      const days: DayPerformance[] = [];
      // Build buckets at UTC midnight to match how logs are stored/queried.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        days.push({
          date: d.toISOString().split("T")[0],
          dayName: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
          dayNum: d.getUTCDate(),
          completed: false,
          logged: false,
          isToday: i === 0,
          durationMin: 0,
          description: "",
          note: "",
          workoutType: "",
        });
      }

      const todayStr = days[days.length - 1].date;

      try {
        const { data: json } = await axios.get(`/api/logs/week?userId=${userId}`);
        if (json.success) {
          for (const log of json.data as LogRow[]) {
            const logDate = new Date(log.date).toISOString().split("T")[0];
            const day = days.find((d) => d.date === logDate);
            if (day) {
              day.logged = true;
              day.completed = !!log.completed;
              day.durationMin = log.durationMin ?? 0;
              day.description = log.description ?? "";
              day.note = log.note ?? "";
              day.workoutType = log.data?.workoutType ?? "";
            }
            // Prefill today's form so the existing entry can be updated
            if (prefillForm && logDate === todayStr) {
              setForm({
                completed: !!log.completed,
                durationMin: log.durationMin ?? 0,
                description: log.description ?? "",
                note: log.note ?? "",
                workoutType: log.data?.workoutType ?? "",
              });
            }
          }
        }
      } catch {
        // network/db error — leave grid empty, form at defaults
      } finally {
        setWeekData(days);
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadWeek(true);
  }, [loadWeek]);

  async function saveToday() {
    setSaving(true);
    try {
      await axios.patch("/api/logs", {
        userId,
        habitId: GYM_HABIT_ID,
        completed: form.completed,
        durationMin: form.durationMin,
        description: form.description,
        note: form.note,
        data: { workoutType: form.workoutType },
      });
      message.success("Gym log saved");
      setForm(EMPTY_FORM);       // reset form on successful save
      await loadWeek(false);     // refresh grid only, keep form cleared
    } catch {
      message.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const completedDays = weekData.filter((d) => d.completed).length;
  const loggedDays = weekData.filter((d) => d.logged).length;
  const successRate =
    loggedDays > 0 ? Math.round((completedDays / loggedDays) * 100) : 0;
  const todayLogged = weekData.find((d) => d.isToday)?.logged ?? false;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-800 to-blue-600 p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-1">Your Progress</h1>
          <p className="text-blue-300 text-sm">Gym tracker · past 7 days</p>
        </div>

        {/* Today's Gym Log */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
            Today&apos;s Gym
          </h2>

          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-100 text-sm">Did you go to the gym?</span>
            <Switch
              checked={form.completed}
              onChange={(v) => setForm((f) => ({ ...f, completed: v }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Workout Type
              </label>
              <Select
                value={form.workoutType || undefined}
                onChange={(v) => setForm((f) => ({ ...f, workoutType: v }))}
                placeholder="Select"
                className="w-full"
                size="large"
                options={WORKOUT_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </div>
            <div>
              <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Time spent (min)
              </label>
              <InputNumber
                min={0}
                max={600}
                value={form.durationMin}
                onChange={(v) =>
                  setForm((f) => ({ ...f, durationMin: Number(v ?? 0) }))
                }
                className="w-full"
                size="large"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(ev) =>
                setForm((f) => ({ ...f, description: ev.target.value }))
              }
              placeholder="e.g. Chest & triceps"
              maxLength={120}
              size="large"
            />
          </div>

          <div className="mb-4">
            <label className="block text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
              Notes
            </label>
            <Input.TextArea
              value={form.note}
              onChange={(ev) =>
                setForm((f) => ({ ...f, note: ev.target.value }))
              }
              placeholder="Anything else…"
              rows={3}
              maxLength={300}
              showCount
            />
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={saving}
            onClick={saveToday}
            className="rounded-xl font-bold text-blue-800 bg-white hover:bg-blue-50! border-0 h-12"
          >
            {saving
              ? "Saving…"
              : todayLogged
              ? "Update Today's Log"
              : "Save Today's Log"}
          </Button>
          {todayLogged && !saving && (
            <p className="text-blue-300 text-xs text-center mt-2">
              Already logged today — saving updates the same entry.
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Gym Days", value: completedDays },
            { label: "Logged", value: loggedDays },
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
                  const bg = day.completed
                    ? "bg-green-400"
                    : day.logged
                    ? "bg-red-400/70"
                    : "bg-white/10";

                  const popContent = day.logged ? (
                    <div className="text-xs leading-relaxed max-w-50">
                      <p className="font-semibold mb-1">
                        {day.completed ? "✅ Went to gym" : "❌ Skipped"}
                      </p>
                      {day.workoutType && <p>Type: {day.workoutType}</p>}
                      {day.durationMin > 0 && <p>Time: {day.durationMin} min</p>}
                      {day.description && <p>What: {day.description}</p>}
                      {day.note && <p className="text-gray-500">Note: {day.note}</p>}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No log this day</span>
                  );

                  return (
                    <Popover
                      key={day.date}
                      content={popContent}
                      title={`${day.dayName} ${day.dayNum}`}
                      trigger="hover"
                    >
                      <div className="flex flex-col items-center gap-2 cursor-pointer">
                        <p className="text-blue-300 text-xs font-medium">{day.dayName}</p>
                        <div
                          className={`w-full aspect-square rounded-xl ${bg} flex items-center justify-center ${
                            day.isToday ? "ring-2 ring-white ring-offset-1 ring-offset-transparent" : ""
                          }`}
                        >
                          <span className="text-white/90 text-xs font-bold">{day.dayNum}</span>
                        </div>
                      </div>
                    </Popover>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-5 text-xs text-blue-300">
                {[
                  { color: "bg-green-400", label: "Went" },
                  { color: "bg-red-400/70", label: "Logged, skipped" },
                  { color: "bg-white/10", label: "No log" },
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

      </div>
    </div>
  );
}
