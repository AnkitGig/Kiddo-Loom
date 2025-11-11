import Joi from "joi";
import { DailyReport } from "../models/parent/DailyReport.js";
import { Child } from "../models/parent/ChildForm.js";
import { Room } from "../models/schools/Room.js";
import { Teacher } from "../models/teacher/Teacher.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create or Get today's daily report
export const getDailyReportHandle = async (req, res) => {
  try {
    const { childId, roomId } = req.query;

    const schema = Joi.object({
      childId: Joi.string().required(),
      roomId: Joi.string().required(),
    });

    const { error } = schema.validate(req.query);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    // Verify child exists
    const child = await Child.findById(childId);
    if (!child)
      return res.status(404).json(new ApiResponse(404, {}, "Child not found"));

    // Verify room exists and teacher is assigned
    const room = await Room.findOne({ _id: roomId, teacherId: req.user.id });
    if (!room)
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "Room not found or not assigned to you")
        );

    const today = new Date().toISOString().split("T")[0];

    let report = await DailyReport.findOne({
      childId,
      roomId,
      date: today,
    });

    if (!report) {
      report = await DailyReport.create({
        childId,
        roomId,
        teacherId: req.user.id,
        date: today,
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, report, "Daily report retrieved successfully")
      );
  } catch (error) {
    console.error("Error getting daily report:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Check In
export const updateCheckInHandle = async (req, res) => {
  try {
    const { reportId, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      time: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.checkIn.time = time;
    report.checkIn.status = true;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Check in updated successfully"));
  } catch (error) {
    console.error("Error updating check in:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Check Out
export const updateCheckOutHandle = async (req, res) => {
  try {
    const { reportId, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      time: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.checkOut.time = time;
    report.checkOut.status = true;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Check out updated successfully"));
  } catch (error) {
    console.error("Error updating check out:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Activities
export const updateActivitiesHandle = async (req, res) => {
  try {
    const { reportId, activities, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      activities: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.activities = activities;
    report.activitiesTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Activities updated successfully"));
  } catch (error) {
    console.error("Error updating activities:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Health
export const updateHealthHandle = async (req, res) => {
  try {
    const { reportId, health, customField, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      health: Joi.string().required(),
      customField: Joi.string().optional().allow(""),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.health = health;
    report.healthCustomField = customField || "";
    report.healthTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Health updated successfully"));
  } catch (error) {
    console.error("Error updating health:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Temperature
export const updateTemperatureHandle = async (req, res) => {
  try {
    const { reportId, value, unit, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      value: Joi.number().required(),
      unit: Joi.string().valid("C", "F").required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.temperature.value = value;
    report.temperature.unit = unit;
    report.temperatureTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Temperature updated successfully"));
  } catch (error) {
    console.error("Error updating temperature:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Mood
export const updateMoodHandle = async (req, res) => {
  try {
    const { reportId, mood, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      mood: Joi.string()
        .valid("Happy", "Sad", "Angry", "Excited", "Calm", "Neutral")
        .required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.mood = mood;
    report.moodTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Mood updated successfully"));
  } catch (error) {
    console.error("Error updating mood:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Supplies
export const updateSuppliesHandle = async (req, res) => {
  try {
    const { reportId, supplies, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      supplies: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.supplies = supplies;
    report.suppliesTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Supplies updated successfully"));
  } catch (error) {
    console.error("Error updating supplies:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Naps
export const updateNapsHandle = async (req, res) => {
  try {
    const { reportId, naps, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      naps: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.naps = naps;
    report.napsTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Naps updated successfully"));
  } catch (error) {
    console.error("Error updating naps:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Notes
export const updateNotesHandle = async (req, res) => {
  try {
    const { reportId, notes, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      notes: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.notes = notes;
    report.notesTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Notes updated successfully"));
  } catch (error) {
    console.error("Error updating notes:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Name to Face
export const updateNameToFaceHandle = async (req, res) => {
  try {
    const { reportId, nameToFace, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      nameToFace: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.nameToFace = nameToFace;
    report.nameToFaceTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Name to face updated successfully"));
  } catch (error) {
    console.error("Error updating name to face:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Update Move Rooms
export const updateMoveRoomsHandle = async (req, res) => {
  try {
    const { reportId, moveRooms, time } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
      moveRooms: Joi.string().required(),
      time: Joi.string().optional().allow(null),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.moveRooms = moveRooms;
    report.moveRoomsTime = time || null;
    await report.save();

    return res
      .status(200)
      .json(new ApiResponse(200, report, "Move rooms updated successfully"));
  } catch (error) {
    console.error("Error updating move rooms:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Submit Daily Report
export const submitDailyReportHandle = async (req, res) => {
  try {
    const { reportId } = req.body;

    const schema = Joi.object({
      reportId: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const report = await DailyReport.findOne({
      _id: reportId,
      teacherId: req.user.id,
    });
    if (!report)
      return res.status(404).json(new ApiResponse(404, {}, "Report not found"));

    report.isSubmitted = true;
    await report.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, report, "Daily report submitted successfully")
      );
  } catch (error) {
    console.error("Error submitting daily report:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Get all reports for a child
export const getChildReportsHandle = async (req, res) => {
  try {
    const { childId } = req.query;

    const schema = Joi.object({
      childId: Joi.string().required(),
    });

    const { error } = schema.validate(req.query);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const reports = await DailyReport.find({
      childId,
      teacherId: req.user.id,
    }).sort({ date: -1 });

    if (!reports || reports.length === 0)
      return res.status(404).json(new ApiResponse(404, {}, "No reports found"));

    return res
      .status(200)
      .json(new ApiResponse(200, reports, "Reports retrieved successfully"));
  } catch (error) {
    console.error("Error getting reports:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// Get Child Resports by Parent for Today
export const getChildReportsByParent = async (req, res) => {
  try {
    const { childId } = req.query;

    const schema = Joi.object({
      childId: Joi.string().required(),
    });

    const { error } = schema.validate(req.query);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const child = await Child.findById(childId);
    if (!child)
      return res.status(404).json(new ApiResponse(404, {}, "Child not found"));

    if (child.parentId && child.parentId.toString() !== req.user.id)
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized access"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const reports = await DailyReport.find({
      childId,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ date: -1 });

    if (!reports || reports.length === 0)
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No reports found for today"));

    return res
      .status(200)
      .json(
        new ApiResponse(200, reports, "Today's reports retrieved successfully")
      );
  } catch (error) {
    console.error("Error getting today's reports for parent:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};
