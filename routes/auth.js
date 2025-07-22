const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const Parent = require("../models/Parent")
const { auth } = require("../middleware/auth")
const {
  firstTimeLogin,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
} = require("../controllers/authController")

const router = express.Router()

/**
 * ===========================================
 * 🔐 AUTHENTICATION APIS - LOGIN SCREENS
 * ===========================================
 * These APIs handle all login/authentication screens in Figma
 */

// 📱 SCREEN: Login Screen (Parent/Teacher Login)
// API: POST /api/auth/login
// Purpose: Main login for parents and teachers
router.post("/login", loginUser)

// 📱 SCREEN: First Time Login Screen (Password Change)
// API: POST /api/auth/first-login
// Purpose: When user logs in for first time with temporary password
router.post("/first-login", firstTimeLogin)

// 📱 SCREEN: Forgot Password Screen
// API: POST /api/auth/forgot-password
// Purpose: Request password reset link
router.post("/forgot-password", forgotPassword)

// 📱 SCREEN: Reset Password Screen
// API: POST /api/auth/reset-password
// Purpose: Reset password with token from email
router.post("/reset-password", resetPassword)

// 📱 SCREEN: Profile Screen (User Info)
// API: GET /api/auth/profile
// Purpose: Get current user profile information
router.get("/profile", auth, getUserProfile)

module.exports = router
