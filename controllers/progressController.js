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
      sleepInfo,
    } = req.body

    console.log("Creating progress report for childId:", childId)
    console.log("Request body:", req.body)

    // Get parent ID from child
    const parent = await Parent.findOne({ "children._id": childId })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found for this child",
      })
    }

    console.log("Found parent:", parent._id)

    const targetDate = new Date(reportDate || new Date())
    targetDate.setHours(0, 0, 0, 0)

    // Check if report already exists
    let report = await ChildProgress.findOne({
      childId,
      reportDate: targetDate,
    })

    console.log("Existing report:", report ? report._id : "None")

    // Process meals data - convert from the API format to model format
    const processedMeals = []
    if (meals) {
      if (meals.breakfast) {
        processedMeals.push({
          type: "breakfast",
          items: meals.breakfast.notes || "Breakfast",
          time: "08:00",
          amountEaten:
            meals.breakfast.amount === "full"
              ? "all"
              : meals.breakfast.amount === "most"
                ? "most"
                : meals.breakfast.amount === "some"
                  ? "some"
                  : "little",
        })
      }
      if (meals.lunch) {
        processedMeals.push({
          type: "lunch",
          items: meals.lunch.notes || "Lunch",
          time: "12:00",
          amountEaten:
            meals.lunch.amount === "full"
              ? "all"
              : meals.lunch.amount === "most"
                ? "most"
                : meals.lunch.amount === "some"
                  ? "some"
                  : "little",
        })
      }
      if (meals.snack) {
        processedMeals.push({
          type: "afternoon_snack",
          items: meals.snack.notes || "Snack",
          time: "15:00",
          amountEaten:
            meals.snack.amount === "full"
              ? "all"
              : meals.snack.amount === "most"
                ? "most"
                : meals.snack.amount === "some"
                  ? "some"
                  : "little",
        })
      }
    }

    console.log("Processed meals:", processedMeals)

    // Process mood data
    let processedMood = { overall: "happy" }
    if (mood) {
      if (Array.isArray(mood)) {
        processedMood.overall = mood[0] || "happy"
        processedMood.notes = mood.join(", ")
      } else if (typeof mood === "string") {
        processedMood.overall = mood
      } else if (mood.overall) {
        processedMood = mood
      }
    }

    console.log("Processed mood:", processedMood)

    // Process sleep sessions from sleepInfo
    const processedSleepSessions = sleepSessions || []
    if (sleepInfo && sleepInfo.napTime) {
      const napStart = sleepInfo.napTime
      const napDuration = sleepInfo.napDuration || 60
      const napEndTime = new Date(`2000-01-01 ${napStart}`)
      napEndTime.setMinutes(napEndTime.getMinutes() + napDuration)

      processedSleepSessions.push({
        startTime: napStart,
        endTime: napEndTime.toTimeString().slice(0, 5),
        duration: napDuration,
        quality: sleepInfo.sleepQuality || "good",
      })
    }

    console.log("Processed sleep sessions:", processedSleepSessions)

    // Process activities
    const processedActivities = []
    if (activities && Array.isArray(activities)) {
      activities.forEach((activity) => {
        processedActivities.push({
          name: activity.name || "Activity",
          category: activity.domain || "general",
          description: activity.description || "",
          participation: "active", // Default value
          skills_demonstrated: activity.skillsObserved || [],
          time: new Date().toTimeString().slice(0, 5), // Default to current time
        })
      })
    }

    console.log("Processed activities:", processedActivities)

    if (report) {
      // Update existing report
      if (processedMeals.length > 0) report.meals = processedMeals
      if (processedMood) report.mood = processedMood
      if (processedActivities.length > 0) report.activities = processedActivities
      if (observations) {
        if (typeof observations === "string") {
          // If observations is a string, convert to the expected format
          report.observations = [
            {
              domain: "General",
              skill: "Overall Development",
              indicator: "Daily Observation",
              observation: observations,
              photos: photos || [],
              developmentLevel: "developing",
            },
          ]
        } else {
          report.observations = observations
        }
      }
      if (processedSleepSessions.length > 0) report.sleepSessions = processedSleepSessions
      if (diaperChanges) report.diaperChanges = diaperChanges
      if (attendance) report.attendance = attendance
      if (teacherNotes) report.teacherNotes = teacherNotes
      if (photos) report.photos = photos

      report.isCompleted = true
      report.parentViewed = false // Reset parent viewed status

      console.log("Updating existing report")
    } else {
      // Create new report
      const reportData = {
        childId,
        parentId: parent._id,
        teacherId: req.user._id,
        reportDate: targetDate,
        meals: processedMeals,
        mood: processedMood,
        activities: processedActivities,
        sleepSessions: processedSleepSessions,
        diaperChanges: diaperChanges || [],
        attendance: attendance || { status: "present" },
        teacherNotes: teacherNotes || "",
        photos: photos || [],
        isCompleted: true,
      }

      // Handle observations
      if (observations) {
        if (typeof observations === "string") {
          reportData.observations = [
            {
              domain: "General",
              skill: "Overall Development",
              indicator: "Daily Observation",
              observation: observations,
              photos: photos || [],
              developmentLevel: "developing",
            },
          ]
        } else {
          reportData.observations = observations
        }
      } else {
        reportData.observations = []
      }

      console.log("Creating new report with data:", reportData)

      report = new ChildProgress(reportData)
    }

    await report.save()
    console.log("Report saved successfully:", report._id)

    // Populate for response
    await report.populate("teacherId", "firstName lastName profileImage")
    if (report.roomId) {
      await report.populate("roomId", "roomName roomNumber")
    }

    res.status(200).json({
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
