const ChildProgress = require("../models/ChildProgress")
const Parent = require("../models/Parent")
const User = require("../models/User")

/**
 * ===========================================
 * 📊 PROGRESS REPORT APIS - DETAILED CHILD REPORTS
 * ===========================================
 * These APIs handle the detailed progress reports shown in the images
 */

// @desc    Get child's progress report
// @route   GET /api/progress/:childId
// @access  Private
const getChildProgressReport = async (req, res) => {
  try {
    const { childId } = req.params
    const { date } = req.query

    // Default to today if no date provided
    const reportDate = date ? new Date(date) : new Date()
    reportDate.setHours(0, 0, 0, 0)

    const report = await ChildProgress.findOne({
      childId,
      reportDate,
    })
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomName roomNumber")

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Progress report not found for this date",
      })
    }

    // Check access permissions
    if (req.user.role === "parent") {
      const parent = await Parent.findOne({ userId: req.user._id })
      const hasAccess = parent.children.some((child) => child._id.toString() === childId.toString())

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this child's report",
        })
      }

      // Mark as viewed by parent
      if (!report.parentViewed) {
        report.parentViewed = true
        report.parentViewedAt = new Date()
        await report.save()
      }
    }

    // Format report for frontend
    const formattedReport = {
      id: report._id,
      childName: "Child Name", // This should come from populated child data
      reportDate: report.reportDate,
      reportType: report.reportType,

      // Daily Summary
      meals: report.meals.map((meal) => ({
        type: meal.type,
        items: meal.items,
        time: meal.time,
        amountEaten: meal.amountEaten,
      })),

      mood: {
        overall: report.mood.overall,
        notes: report.mood.notes,
      },

      activities: report.activities.map((activity) => ({
        name: activity.name,
        category: activity.category,
        description: activity.description,
        participation: activity.participation,
        skillsDemonstrated: activity.skills_demonstrated,
        time: activity.time,
      })),

      // Learning Observations
      observations: report.observations.map((obs) => ({
        domain: obs.domain,
        skill: obs.skill,
        indicator: obs.indicator,
        observation: obs.observation,
        photos: obs.photos,
        developmentLevel: obs.developmentLevel,
      })),

      // Physical Care
      sleepSessions: report.sleepSessions,
      diaperChanges: report.diaperChanges,
      attendance: report.attendance,

      // Notes and Media
      teacherNotes: report.teacherNotes,
      parentNotes: report.parentNotes,
      photos: report.photos,

      // Teacher Info
      teacher: report.teacherId
        ? {
            id: report.teacherId._id,
            name: `${report.teacherId.firstName} ${report.teacherId.lastName}`,
            profileImage: report.teacherId.profileImage,
          }
        : null,

      room: report.roomId
        ? {
            id: report.roomId._id,
            name: report.roomId.roomName,
            number: report.roomId.roomNumber,
          }
        : null,

      // Status
      isCompleted: report.isCompleted,
      parentViewed: report.parentViewed,
      parentViewedAt: report.parentViewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }

    res.json({
      success: true,
      data: formattedReport,
    })
  } catch (error) {
    console.error("Get child progress report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress report",
      error: error.message,
    })
  }
}

// @desc    Create/Update progress report
// @route   POST /api/progress/:childId
// @access  Private (Teacher only)
const createProgressReport = async (req, res) => {
  try {
    const { childId } = req.params
    const {
      reportDate,
      meals,
      mood,
      activities,
      observations,
      sleepSessions,
      diaperChanges,
      attendance,
      teacherNotes,
      photos,
    } = req.body

    // Get parent ID from child
    const parent = await Parent.findOne({ "children._id": childId })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found for this child",
      })
    }

    // Get teacher's room
    const TeacherProfile = require("../models/TeacherProfile")
    const teacherProfile = await TeacherProfile.findOne({ userId: req.user._id })
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const targetDate = new Date(reportDate || new Date())
    targetDate.setHours(0, 0, 0, 0)

    // Check if report already exists
    let report = await ChildProgress.findOne({
      childId,
      reportDate: targetDate,
    })

    if (report) {
      // Update existing report
      if (meals) report.meals = meals
      if (mood) report.mood = mood
      if (activities) report.activities = activities
      if (observations) report.observations = observations
      if (sleepSessions) report.sleepSessions = sleepSessions
      if (diaperChanges) report.diaperChanges = diaperChanges
      if (attendance) report.attendance = attendance
      if (teacherNotes) report.teacherNotes = teacherNotes
      if (photos) report.photos = photos

      report.isCompleted = true
      report.parentViewed = false // Reset parent viewed status
    } else {
      // Create new report
      report = new ChildProgress({
        childId,
        parentId: parent._id,
        teacherId: req.user._id,
        roomId: teacherProfile.schoolId, // This should be roomId, not schoolId
        reportDate: targetDate,
        meals: meals || [],
        mood: mood || { overall: "happy" },
        activities: activities || [],
        observations: observations || [],
        sleepSessions: sleepSessions || [],
        diaperChanges: diaperChanges || [],
        attendance: attendance || { status: "present" },
        teacherNotes: teacherNotes || "",
        photos: photos || [],
        isCompleted: true,
      })
    }

    await report.save()

    // Populate for response
    await report.populate("teacherId", "firstName lastName profileImage")
    await report.populate("roomId", "roomName roomNumber")

    res.status(report.isNew ? 201 : 200).json({
      success: true,
      message: `Progress report ${report.isNew ? "created" : "updated"} successfully`,
      data: {
        id: report._id,
        reportDate: report.reportDate,
        isCompleted: report.isCompleted,
        teacher: {
          id: report.teacherId._id,
          name: `${report.teacherId.firstName} ${report.teacherId.lastName}`,
        },
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    })
  } catch (error) {
    console.error("Create progress report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create progress report",
      error: error.message,
    })
  }
}

// @desc    Get available reports for parent
// @route   GET /api/progress/reports
// @access  Private (Parent only)
const getAvailableReports = async (req, res) => {
  try {
    const { childId, limit = 10, page = 1 } = req.query

    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const query = { parentId: parent._id, isCompleted: true }

    if (childId) {
      query.childId = childId
    } else {
      // Get all children's reports
      const childIds = parent.children.map((child) => child._id)
      query.childId = { $in: childIds }
    }

    const reports = await ChildProgress.find(query)
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomName roomNumber")
      .sort({ reportDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await ChildProgress.countDocuments(query)

    // Format reports list
    const formattedReports = reports.map((report) => {
      const child = parent.children.find((c) => c._id.toString() === report.childId.toString())

      return {
        id: report._id,
        child: {
          id: report.childId,
          name: child ? child.name : "Unknown Child",
          profileImage: child ? child.profileImage : null,
        },
        reportDate: report.reportDate,
        reportType: report.reportType,
        teacher: report.teacherId
          ? {
              id: report.teacherId._id,
              name: `${report.teacherId.firstName} ${report.teacherId.lastName}`,
              profileImage: report.teacherId.profileImage,
            }
          : null,
        room: report.roomId
          ? {
              id: report.roomId._id,
              name: report.roomId.roomName,
              number: report.roomId.roomNumber,
            }
          : null,
        summary: {
          mealsCount: report.meals.length,
          activitiesCount: report.activities.length,
          observationsCount: report.observations.length,
          photosCount: report.photos.length,
          mood: report.mood.overall,
        },
        parentViewed: report.parentViewed,
        parentViewedAt: report.parentViewedAt,
        createdAt: report.createdAt,
        isNew: !report.parentViewed,
      }
    })

    res.json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        summary: {
          totalReports: total,
          newReports: formattedReports.filter((r) => r.isNew).length,
        },
      },
    })
  } catch (error) {
    console.error("Get available reports error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch available reports",
      error: error.message,
    })
  }
}

// @desc    Add parent note to report
// @route   POST /api/progress/:reportId/parent-note
// @access  Private (Parent only)
const addParentNote = async (req, res) => {
  try {
    const { reportId } = req.params
    const { note } = req.body

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      })
    }

    const report = await ChildProgress.findById(reportId)
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      })
    }

    // Verify parent has access to this report
    const parent = await Parent.findOne({ userId: req.user._id })
    if (report.parentId.toString() !== parent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this report",
      })
    }

    report.parentNotes = note.trim()
    await report.save()

    res.json({
      success: true,
      message: "Parent note added successfully",
      data: {
        parentNotes: report.parentNotes,
        updatedAt: report.updatedAt,
      },
    })
  } catch (error) {
    console.error("Add parent note error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add parent note",
      error: error.message,
    })
  }
}

module.exports = {
  getChildProgressReport,
  createProgressReport,
  getAvailableReports,
  addParentNote,
}
