const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  createSchool,
  updateSchool,
  deleteSchool,
  getAllSchoolsAdmin,
  bulkCreateSchools,
  createParentAccount,
  createTeacherAccount,
  getAllUsers,
  updateUserStatus,
  resetUserPassword,
  deleteUserAccount,
  getUserStats,
  sendBulkEmail,
} = require("../controllers/adminController")
const {
  getAllApplications,
  getApplicationById,
  approveApplicationAndCreateAccount,
  rejectApplication,
  getApplicationStats,
} = require("../controllers/adminApplicationController")


const { createAboutUs, getAboutUs, updateAboutUs, deleteAboutUs } = require("../controllers/aboutUsController")

const router = express.Router()
/**
 * ===========================================
 * 📄 ABOUT US MANAGEMENT APIS
 * ===========================================
 */
// Create About Us (Admin only)
router.post("/about", auth, authorize("admin"), createAboutUs)
// Update About Us (Admin only)
router.put("/about/:id", auth, authorize("admin"), updateAboutUs)
// Delete About Us (Admin only)
router.delete("/about/:id", auth, authorize("admin"), deleteAboutUs)
// Get About Us (Everyone)
router.get("/about", getAboutUs)

/**
 * ===========================================
 * 🏫 SCHOOL MANAGEMENT APIS - ADMIN DASHBOARD SCREENS
 * ===========================================
 */

// School Management
router.post("/create-school", auth, authorize("admin"), createSchool)
router.put("/schools/:schoolId", auth, authorize("admin"), updateSchool)
router.delete("/schools/:schoolId", auth, authorize("admin"), deleteSchool)
router.get("/schools", auth, authorize("admin"), getAllSchoolsAdmin)
router.post("/bulk-create-schools", auth, authorize("admin"), bulkCreateSchools)

/**
 * ===========================================
 * 📝 APPLICATION MANAGEMENT APIS - ADMIN DASHBOARD SCREENS
 * ===========================================
 * These APIs handle admin review and processing of public applications
 */

// 📱 SCREEN: Application Management Dashboard
// API: GET /api/admin/applications?status=pending&schoolId=123&search=john
// Purpose: Admin views all submitted applications for review
// Features: Filter by status, school, search, pagination, statistics
router.get("/applications", auth, authorize("admin"), getAllApplications)

// 📱 SCREEN: Application Details Screen
// API: GET /api/admin/applications/:applicationId
// Purpose: Admin views detailed application information
// Features: Full application details, review history, parent info
router.get("/applications/:applicationId", auth, authorize("admin"), getApplicationById)

// 📱 SCREEN: Approve Application & Create Account Screen
// API: POST /api/admin/applications/:applicationId/approve
// Purpose: Admin approves application and creates parent account
// Features: Account creation, credential generation, welcome email
router.post("/applications/:applicationId/approve", auth, authorize("admin"), approveApplicationAndCreateAccount)

// 📱 SCREEN: Reject Application Screen
// API: POST /api/admin/applications/:applicationId/reject
// Purpose: Admin rejects application with reason
// Features: Rejection reason, notification email, status update
router.post("/applications/:applicationId/reject", auth, authorize("admin"), rejectApplication)

// 📱 SCREEN: Application Statistics Dashboard
// API: GET /api/admin/applications/stats?timeframe=month
// Purpose: Show application statistics and analytics
// Features: Status breakdown, school-wise stats, trends, approval rates
router.get("/applications/stats", auth, authorize("admin"), getApplicationStats)

/**
 * ===========================================
 * 👨‍💼 USER MANAGEMENT APIS - ADMIN DASHBOARD SCREENS
 * ===========================================
 */

// User Management
router.post("/create-parent", auth, authorize("admin"), createParentAccount)
router.post("/create-teacher", auth, authorize("admin"), createTeacherAccount)
router.get("/users", auth, authorize("admin"), getAllUsers)
router.get("/stats", auth, authorize("admin"), getUserStats)
router.put("/users/:userId/status", auth, authorize("admin"), updateUserStatus)
router.post("/users/:userId/reset-password", auth, authorize("admin"), resetUserPassword)
router.delete("/users/:userId", auth, authorize("admin"), deleteUserAccount)
router.post("/send-bulk-email", auth, authorize("admin"), sendBulkEmail)

module.exports = router
