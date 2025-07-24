const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  getTodaysSchedule,
  createDailySchedule,
  markActivityComplete,
  getScheduleTemplates,
} = require("../controllers/scheduleController")

const router = express.Router()

/**
 * ===========================================
 * 📅 SCHEDULE APIS - DAILY CURRICULUM MANAGEMENT
 * ===========================================
 * These APIs handle the daily schedule screens shown in the images
 */

// 📱 SCREEN: Today's Schedule (Expandable schedule section)
// API: GET /api/schedule/today?roomId=123
// Purpose: Get today's curriculum schedule with all activities
// Features: Activity categories, time slots, learning objectives, materials
router.get("/today", auth, getTodaysSchedule)

// 📱 SCREEN: Create Schedule (Teacher/Admin)
// API: POST /api/schedule
// Purpose: Create daily schedule with curriculum activities
// Features: Multiple activity categories, time management, learning objectives
router.post("/", auth, authorize("teacher", "admin"), createDailySchedule)

// 📱 SCREEN: Mark Activity Complete (Teacher)
// API: PUT /api/schedule/:scheduleId/activities/:activityIndex/complete
// Purpose: Mark individual activities as completed with notes
// Features: Activity completion tracking, teacher notes, progress monitoring
router.put("/:scheduleId/activities/:activityIndex/complete", auth, authorize("teacher"), markActivityComplete)

// 📱 SCREEN: Schedule Templates (Teacher/Admin)
// API: GET /api/schedule/templates
// Purpose: Get pre-built schedule templates for different age groups
// Features: Age-appropriate activities, curriculum standards, quick setup
router.get("/templates", auth, authorize("teacher", "admin"), getScheduleTemplates)

module.exports = router
