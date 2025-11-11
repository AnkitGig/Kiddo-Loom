import mongoose from "mongoose";

const DailyReportSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChildForm",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    date: {
      type: Date,
      default: new Date().toISOString().split("T")[0],
    },

    // Check in/Check out
    checkIn: {
      time: {
        type: String,
        default: null,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
    checkOut: {
      time: {
        type: String,
        default: null,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },

    // Activities
    activities: {
      type: String,
      default: "",
      trim: true,
    },
    activitiesTime: {
      type: String,
      default: null,
    },

    // Health
    health: {
      type: String,
      default: "",
      trim: true,
    },
    healthCustomField: {
      type: String,
      default: "",
    },
    healthTime: {
      type: String,
      default: null,
    },

    // Temperature
    temperature: {
      value: {
        type: Number,
        default: null,
      },
      unit: {
        type: String,
        enum: ["C", "F"],
        default: "C",
      },
    },
    temperatureTime: {
      type: String,
      default: null,
    },

    // Mood
    mood: {
      type: String,
      enum: ["Happy", "Sad", "Angry", "Excited", "Calm", "Neutral"],
      default: null,
    },
    moodTime: {
      type: String,
      default: null,
    },

    // Supplies
    supplies: {
      type: String,
      default: "",
      trim: true,
    },
    suppliesTime: {
      type: String,
      default: null,
    },

    // Naps
    naps: {
      type: String,
      default: "",
      trim: true,
    },
    napsTime: {
      type: String,
      default: null,
    },

    // Notes
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    notesTime: {
      type: String,
      default: null,
    },

    // Name to face
    nameToFace: {
      type: String,
      default: "",
      trim: true,
    },
    nameToFaceTime: {
      type: String,
      default: null,
    },

    // Move rooms
    moveRooms: {
      type: String,
      default: "",
      trim: true,
    },
    moveRoomsTime: {
      type: String,
      default: null,
    },

    // Custom field
    customField: {
      type: String,
      default: "",
    },

    isSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DailyReportSchema.index({ childId: 1, date: 1 });
DailyReportSchema.index({ roomId: 1, date: 1 });
DailyReportSchema.index({ teacherId: 1, date: 1 });

export const DailyReport = mongoose.model("DailyReport", DailyReportSchema);
