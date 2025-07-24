const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const { getParentDashboard, getChildDetails } = require("../controllers/dashboardController")

const router = express.Router()

/**
 * ===========================================
 * 🏠 DASHBOARD APIS - PARENT & CHILD OVERVIEW
 * ===========================================
 * These APIs handle the main dashboard screens shown in the images
 */

// 📱 SCREEN: Parent Dashboard (Alice Sienfeld - My Child screen)
// API: GET /api/dashboard/parent
// Purpose: Get parent dashboard with children overview and quick stats
// Features: Child status, quick activity cards, navigation buttons, notifications
router.get("/parent", auth, authorize("parent"), getParentDashboard)

// 📱 SCREEN: Child Details (David Sienfeld details)
// API: GET /api/dashboard/child/:childId
// Purpose: Get detailed view of specific child with today's activities
// Features: Child profile, today's activities, recent posts, schedule
router.get("/child/:childId", auth, authorize("parent"), getChildDetails)

module.exports = router
