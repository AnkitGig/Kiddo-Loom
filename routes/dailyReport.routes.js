import { Router } from "express";
import {
  getDailyReportHandle,
  updateCheckInHandle,
  updateCheckOutHandle,
  updateActivitiesHandle,
  updateHealthHandle,
  updateTemperatureHandle,
  updateMoodHandle,
  updateSuppliesHandle,
  updateNapsHandle,
  updateNotesHandle,
  updateNameToFaceHandle,
  updateMoveRoomsHandle,
  submitDailyReportHandle,
  getChildReportsHandle,
} from "../controllers/dailyReportController.js";
import { auth } from "../middlewares/auth.js";

const dailyReportRouter = Router();

// Get or create today's daily report
dailyReportRouter.get("/report", auth, getDailyReportHandle);

// Update individual fields
dailyReportRouter.post("/check-in", auth, updateCheckInHandle);
dailyReportRouter.post("/check-out", auth, updateCheckOutHandle);
dailyReportRouter.post("/activities", auth, updateActivitiesHandle);
dailyReportRouter.post("/health", auth, updateHealthHandle);
dailyReportRouter.post("/temperature", auth, updateTemperatureHandle);
dailyReportRouter.post("/mood", auth, updateMoodHandle);
dailyReportRouter.post("/supplies", auth, updateSuppliesHandle);
dailyReportRouter.post("/naps", auth, updateNapsHandle);
dailyReportRouter.post("/notes", auth, updateNotesHandle);
dailyReportRouter.post("/name-to-face", auth, updateNameToFaceHandle);
dailyReportRouter.post("/move-rooms", auth, updateMoveRoomsHandle);

// Submit daily report
dailyReportRouter.post("/submit", auth, submitDailyReportHandle);

// Get all reports for a child
dailyReportRouter.get("/child-reports", auth, getChildReportsHandle);

export default dailyReportRouter;
