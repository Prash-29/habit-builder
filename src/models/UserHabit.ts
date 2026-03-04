import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserHabit extends Document {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId | null; // null = custom habit
  customTitle: string | null;             // used when taskId is null
  startDate: Date;
  targetDays: number;                     // e.g. 21 or 66 days
  isActive: boolean;
}

const UserHabitSchema = new Schema<IUserHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    customTitle: {
      type: String,
      default: null,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDays: {
      type: Number,
      default: 21,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UserHabitSchema.index({ userId: 1 });

const UserHabit: Model<IUserHabit> =
  mongoose.models.UserHabit ||
  mongoose.model<IUserHabit>("UserHabit", UserHabitSchema);

export default UserHabit;
