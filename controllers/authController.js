const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const Parent = require("../models/Parent")

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  })
}

// @desc    First time login and password change
// @route   POST /api/auth/first-login
// @access  Public
const firstTimeLogin = async (req, res) => {
  try {
    const { email, temporaryPassword, newPassword } = req.body

    // Validation
    if (!email || !temporaryPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, temporary password, and new password",
      })
    }

    // Find user with temporary password
    const user = await User.findOne({
      email,
      isFirstLogin: true,
      isActive: true,
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or account not found",
      })
    }

    // Check temporary password
    const isMatch = await user.comparePassword(temporaryPassword)
    if (!isMatch || user.temporaryPassword !== temporaryPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid temporary password",
      })
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      })
    }

    // Update password and clear first login flag
    user.password = newPassword
    user.isFirstLogin = false
    user.temporaryPassword = null
    user.lastLogin = new Date()

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Password changed successfully. You are now logged in.",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
        },
      },
    })
  } catch (error) {
    console.error("First time login error:", error)
    res.status(500).json({
      success: false,
      message: "First time login failed",
      error: error.message,
    })
  }
}

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if it's first time login
    if (user.isFirstLogin) {
      return res.status(200).json({
        success: true,
        message: "First time login required. Please change your password.",
        requirePasswordChange: true,
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    })
  }
}

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save()

    // In production, send email with reset link
    // For now, return the token (remove in production)
    res.json({
      success: true,
      message: "Password reset link sent to email",
      resetToken, // Remove this in production
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message,
    })
  }
}

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide token and new password",
      })
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Update password
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    res.json({
      success: true,
      message: "Password reset successful",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const profile = { user: req.user }

    if (req.user.role === "parent") {
      const parent = await Parent.findOne({ userId: req.user._id }).populate("children.schoolId")
      profile.parent = parent
    }

    res.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    })
  }
}

module.exports = {
  firstTimeLogin,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
}
