import mongoose, { Schema, Document, Model } from "mongoose";

interface IEntry {
  habitId: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  note?: string;
}

export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;       // normalized to midnight UTC — one doc per user per day
  entries: IEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "UserHabit",
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    entries: [EntrySchema],
  },
  { timestamps: true }
);

// Enforce one document per user per day
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyLog: Model<IDailyLog> =
  mongoose.models.DailyLog ||
  mongoose.model<IDailyLog>("DailyLog", DailyLogSchema);

export default DailyLog;
