import mongoose, { Schema, Document, Model } from "mongoose";

// One row per (user, habit, day). Common columns + a flexible `data` blob
// that varies per habit (e.g. gym → { workoutType }).
export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  habitId: string;            // slug, e.g. "gym"
  date: Date;                 // normalized to midnight UTC — the day logged
  completed: boolean;
  durationMin: number;        // "time performed" — minutes spent
  description: string;        // short what-was-done
  note: string;               // free remarks
  data: Record<string, unknown>; // habit-specific payload
  createdAt: Date;
  updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    habitId: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    durationMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// One log per user per habit per day; also serves the weekly range query.
HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

const HabitLog: Model<IHabitLog> =
  mongoose.models.HabitLog ||
  mongoose.model<IHabitLog>("HabitLog", HabitLogSchema);

export default HabitLog;
