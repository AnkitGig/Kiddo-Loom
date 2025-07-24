const DailySchedule = require("../models/DailySchedule")
const Room = require("../models/Room")

/**
 * ===========================================
 * 📅 SCHEDULE APIS - DAILY CURRICULUM MANAGEMENT
 * ===========================================
 * These APIs handle the daily schedule screens shown in the images
 */

// @desc    Get today's schedule
// @route   GET /api/schedule/today
// @access  Private
const getTodaysSchedule = async (req, res) => {
  try {
    const { roomId } = req.query
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const query = { date: today, isActive: true }
    if (roomId) {
      query.roomId = roomId
    }

    const schedules = await DailySchedule.find(query)
      .populate("roomId", "roomName roomNumber")
      .populate("createdBy", "firstName lastName")

    // Format schedules for frontend
    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule._id,
      room: {
        id: schedule.roomId._id,
        name: schedule.roomId.roomName,
        number: schedule.roomId.roomNumber,
      },
      date: schedule.date,
      activities: schedule.activities.map((activity) => ({
        time: activity.time,
        category: activity.category,
        title: activity.title,
        description: activity.description,
        materials: activity.materials,
        duration: activity.duration,
        learningObjectives: activity.learningObjectives,
        ageGroup: activity.ageGroup,
        isCompleted: activity.isCompleted,
        completedAt: activity.completedAt,
        notes: activity.notes,
      })),
      createdBy: schedule.createdBy,
      createdAt: schedule.createdAt,
    }))

    res.json({
      success: true,
      data: {
        schedules: formattedSchedules,
        date: today,
        totalActivities: schedules.reduce((total, schedule) => total + schedule.activities.length, 0),
      },
    })
  } catch (error) {
    console.error("Get today's schedule error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's schedule",
      error: error.message,
    })
  }
}

// @desc    Create daily schedule
// @route   POST /api/schedule
// @access  Private (Teacher/Admin only)
const createDailySchedule = async (req, res) => {
  try {
    const { roomId, date, activities } = req.body

    // Validation
    if (!roomId || !date || !activities || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Room ID, date, and activities are required",
      })
    }

    // Check if room exists
    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      })
    }

    // Check if schedule already exists for this room and date
    const existingSchedule = await DailySchedule.findOne({
      roomId,
      date: new Date(date),
    })

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "Schedule already exists for this room and date",
      })
    }

    // Create schedule
    const schedule = new DailySchedule({
      roomId,
      date: new Date(date),
      activities: activities.map((activity) => ({
        time: activity.time,
        category: activity.category,
        title: activity.title,
        description: activity.description || "",
        materials: activity.materials || [],
        duration: activity.duration || 30,
        learningObjectives: activity.learningObjectives || [],
        ageGroup: activity.ageGroup || { min: 2, max: 5 },
      })),
      createdBy: req.user._id,
    })

    await schedule.save()

    // Populate for response
    await schedule.populate("roomId", "roomName roomNumber")
    await schedule.populate("createdBy", "firstName lastName")

    res.status(201).json({
      success: true,
      message: "Daily schedule created successfully",
      data: {
        id: schedule._id,
        room: {
          id: schedule.roomId._id,
          name: schedule.roomId.roomName,
          number: schedule.roomId.roomNumber,
        },
        date: schedule.date,
        activities: schedule.activities,
        createdBy: schedule.createdBy,
        createdAt: schedule.createdAt,
      },
    })
  } catch (error) {
    console.error("Create daily schedule error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create daily schedule",
      error: error.message,
    })
  }
}

// @desc    Update activity completion status
// @route   PUT /api/schedule/:scheduleId/activities/:activityIndex/complete
// @access  Private (Teacher only)
const markActivityComplete = async (req, res) => {
  try {
    const { scheduleId, activityIndex } = req.params
    const { notes } = req.body

    const schedule = await DailySchedule.findById(scheduleId)
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      })
    }

    const activityIdx = Number.parseInt(activityIndex)
    if (activityIdx < 0 || activityIdx >= schedule.activities.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity index",
      })
    }

    const activity = schedule.activities[activityIdx]
    activity.isCompleted = true
    activity.completedAt = new Date()
    if (notes) {
      activity.notes = notes
    }

    await schedule.save()

    res.json({
      success: true,
      message: "Activity marked as completed",
      data: {
        activity: {
          time: activity.time,
          category: activity.category,
          title: activity.title,
          isCompleted: activity.isCompleted,
          completedAt: activity.completedAt,
          notes: activity.notes,
        },
      },
    })
  } catch (error) {
    console.error("Mark activity complete error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark activity as complete",
      error: error.message,
    })
  }
}

// @desc    Get schedule templates
// @route   GET /api/schedule/templates
// @access  Private (Teacher/Admin only)
const getScheduleTemplates = async (req, res) => {
  try {
    const templates = [
      {
        name: "Standard Preschool Day",
        ageGroup: { min: 3, max: 5 },
        activities: [
          {
            time: "08:00 AM",
            category: "Creative Art",
            title: "Bee Craft",
            description: "Create colorful bee crafts using paper plates and construction paper",
            materials: ["Paper plates", "Yellow paint", "Black markers", "Glue sticks"],
            duration: 45,
            learningObjectives: ["Fine motor skills", "Color recognition", "Following instructions"],
          },
          {
            time: "08:45 AM",
            category: "Fine Motor Skills",
            title: "Holding Point Brush For Painting",
            description: "Practice proper brush grip and painting techniques",
            materials: ["Paint brushes", "Watercolors", "Paper", "Water cups"],
            duration: 30,
            learningObjectives: ["Hand-eye coordination", "Grip strength", "Artistic expression"],
          },
          {
            time: "09:15 AM",
            category: "Language And Literacy",
            title: "Communicating With Friends Through Beekeeper Pretend Play",
            description: "Role-play as beekeepers and practice communication skills",
            materials: ["Beekeeper hats", "Toy bees", "Pretend hives"],
            duration: 45,
            learningObjectives: ["Vocabulary development", "Social skills", "Imaginative play"],
          },
          {
            time: "10:00 AM",
            category: "Loose Part",
            title: "Paint And Papers",
            description: "Free exploration with various art materials",
            materials: ["Various papers", "Paints", "Brushes", "Sponges", "Natural materials"],
            duration: 30,
            learningObjectives: ["Creativity", "Problem solving", "Sensory exploration"],
          },
          {
            time: "10:30 AM",
            category: "Music And Movement",
            title: "The Yellow Song",
            description: "Sing and dance to songs about the color yellow and bees",
            materials: ["Music player", "Yellow scarves", "Instruments"],
            duration: 20,
            learningObjectives: ["Rhythm", "Gross motor skills", "Musical appreciation"],
          },
          {
            time: "10:50 AM",
            category: "Science, Nature And Math",
            title: "Count The Bees",
            description: "Practice counting and number recognition with bee-themed activities",
            materials: ["Toy bees", "Number cards", "Counting mats"],
            duration: 30,
            learningObjectives: ["Number recognition", "Counting skills", "One-to-one correspondence"],
          },
          {
            time: "11:20 AM",
            category: "Sensory Bin",
            title: "Bee Counting Sensory Bin",
            description: "Explore textures while practicing counting with bee-themed sensory bin",
            materials: ["Yellow rice", "Toy bees", "Scoops", "Containers"],
            duration: 25,
            learningObjectives: ["Sensory exploration", "Counting", "Fine motor skills"],
          },
        ],
      },
      {
        name: "Toddler Discovery Day",
        ageGroup: { min: 1, max: 3 },
        activities: [
          {
            time: "09:00 AM",
            category: "Sensory Bin",
            title: "Water Play Discovery",
            description: "Explore water with various containers and toys",
            materials: ["Water table", "Cups", "Floating toys", "Sponges"],
            duration: 30,
            learningObjectives: ["Sensory exploration", "Cause and effect", "Hand-eye coordination"],
          },
          {
            time: "09:30 AM",
            category: "Music And Movement",
            title: "Wiggle and Giggle Time",
            description: "Simple songs with movements for toddlers",
            materials: ["Music player", "Scarves", "Shakers"],
            duration: 15,
            learningObjectives: ["Gross motor skills", "Following directions", "Social interaction"],
          },
          {
            time: "09:45 AM",
            category: "Fine Motor Skills",
            title: "Big Bead Threading",
            description: "Practice threading large beads on thick strings",
            materials: ["Large beads", "Thick strings", "Containers"],
            duration: 20,
            learningObjectives: ["Hand-eye coordination", "Concentration", "Fine motor development"],
          },
        ],
      },
    ]

    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error("Get schedule templates error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule templates",
      error: error.message,
    })
  }
}

module.exports = {
  getTodaysSchedule,
  createDailySchedule,
  markActivityComplete,
  getScheduleTemplates,
}
