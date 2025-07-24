const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  getChildProgressReport,
  createProgressReport,
  getAvailableReports,
  addParentNote,
} = require("../controllers/progressController")

const router = express.Router()

/**
 * ===========================================
 * 📊 PROGRESS REPORT APIS - DETAILED CHILD REPORTS
 * ===========================================
 * These APIs handle the detailed progress reports shown in the images
 */

// 📱 SCREEN: Child Progress Report Details (Agastyaram's Report)
// API: GET /api/progress/:childId?date=2025-02-27
// Purpose: Get detailed daily progress report for a child
// Features: Meals, mood, activities, observations, photos, learning indicators
router.get("/:childId", auth, getChildProgressReport)

// 📱 SCREEN: Create/Update Progress Report (Teacher)
// API: POST /api/progress/:childId
// Purpose: Create or update daily progress report
// Features: Comprehensive reporting, observations, photos, learning documentation
router.post("/:childId", auth, authorize("teacher"), createProgressReport)

// 📱 SCREEN: Available Reports List (Parent View)
// API: GET /api/progress/reports?childId=123&page=1&limit=10
// Purpose: Get list of available reports for parent
// Features: Report history, new report notifications, child filtering
router.get("/reports", auth, authorize("parent"), getAvailableReports)

// 📱 SCREEN: Add Parent Note (Parent Response)
// API: POST /api/progress/:reportId/parent-note
// Purpose: Allow parents to add notes/responses to reports
// Features: Parent feedback, two-way communication, report interaction
router.post("/:reportId/parent-note", auth, authorize("parent"), addParentNote)

module.exports = router
