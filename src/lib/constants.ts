// Single tracked habit for now: gym.
// habitId is a readable string slug (no Habit collection needed yet).
export const GYM_HABIT_ID = "gym";

export const WORKOUT_TYPES = [
  "Strength",
  "Cardio",
  "Flexibility",
  "Sports",
  "Other",
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];
