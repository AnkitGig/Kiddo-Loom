const Parent = require("../models/Parent")
const ChildProgress = require("../models/ChildProgress")
const Post = require("../models/Post")
const ChildActivity = require("../models/ChildActivity")
const DailySchedule = require("../models/DailySchedule")

/**
 * ===========================================
 * 🏠 DASHBOARD APIS - PARENT & CHILD OVERVIEW
 * ===========================================
 * These APIs handle the main dashboard screens shown in the images
 */

// @desc    Get parent dashboard with child overview
// @route   GET /api/dashboard/parent
// @access  Private (Parent only)
const getParentDashboard = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id }).populate(
      "children.schoolId",
      "name address contactInfo",
    )

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Process each child's data
    const childrenData = await Promise.all(
      parent.children.map(async (child) => {
        // Get latest activities for quick overview
        const latestActivities = await ChildActivity.find({
          childId: child._id,
          timestamp: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        })
          .sort({ timestamp: -1 })
          .limit(3)
          .populate("teacherId", "firstName lastName")

        // Get attendance status
        const attendanceToday = await ChildActivity.findOne({
          childId: child._id,
          activityType: "attendance",
          timestamp: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ timestamp: -1 })

        // Get latest feed, sleep, diaper activities for quick cards
        const feedActivity = await ChildActivity.findOne({
          childId: child._id,
          activityType: "meal",
          timestamp: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ timestamp: -1 })

        const sleepActivity = await ChildActivity.findOne({
          childId: child._id,
          activityType: "sleep",
          timestamp: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ timestamp: -1 })

        const diaperActivity = await ChildActivity.findOne({
          childId: child._id,
          activityType: "diaper",
          timestamp: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ timestamp: -1 })

        // Check for new reports
        const newReportsCount = await ChildProgress.countDocuments({
          childId: child._id,
          isCompleted: true,
          parentViewed: false,
        })

        return {
          id: child._id,
          name: child.name,
          age: child.age,
          profileImage: child.profileImage,
          school: child.schoolId
            ? {
                id: child.schoolId._id,
                name: child.schoolId.name,
              }
            : null,
          status: attendanceToday?.attendanceDetails?.status || "unknown",
          joinedDate: child.createdAt || parent.createdAt,

          // Quick activity cards
          quickCards: {
            feed: feedActivity
              ? {
                  time: getTimeAgo(feedActivity.timestamp),
                  details: feedActivity.mealDetails?.mealType || "Meal",
                }
              : { time: "No data", details: "No meals today" },

            sleep: sleepActivity
              ? {
                  time: getTimeAgo(sleepActivity.timestamp),
                  duration: sleepActivity.sleepDetails?.duration || 0,
                }
              : { time: "No data", duration: 0 },

            diaper: diaperActivity
              ? {
                  time: getTimeAgo(diaperActivity.timestamp),
                  type: diaperActivity.diaperDetails?.type || "unknown",
                }
              : { time: "No data", type: "unknown" },
          },

          // Navigation items
          navigation: {
            attendance: {
              available: !!attendanceToday,
              status: attendanceToday?.attendanceDetails?.status || "unknown",
            },
            room: child.class || "Room #3", // Default room
            schedule: {
              available: true,
            },
          },

          // Notifications
          notifications: {
            newReports: newReportsCount,
            hasNewActivity: latestActivities.length > 0,
          },

          latestActivities: latestActivities.map((activity) => ({
            id: activity._id,
            type: activity.activityType,
            timestamp: activity.timestamp,
            teacher: activity.teacherId ? `${activity.teacherId.firstName} ${activity.teacherId.lastName}` : "Teacher",
            timeAgo: getTimeAgo(activity.timestamp),
          })),
        }
      }),
    )

    // Get user location info (mock data for now)
    const userLocation = {
      city: "Birmingham",
      country: "UK",
    }

    res.json({
      success: true,
      data: {
        parent: {
          id: parent._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          location: userLocation,
          profileImage: req.user.profileImage,
        },
        children: childrenData,
        summary: {
          totalChildren: parent.children.length,
          activeChildren: childrenData.filter((child) => child.status === "present").length,
          newReports: childrenData.reduce((sum, child) => sum + child.notifications.newReports, 0),
          todayActivities: childrenData.reduce((sum, child) => sum + child.latestActivities.length, 0),
        },
      },
    })
  } catch (error) {
    console.error("Get parent dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch parent dashboard",
      error: error.message,
    })
  }
}

// @desc    Get child details for parent
// @route   GET /api/dashboard/child/:childId
// @access  Private (Parent only)
const getChildDetails = async (req, res) => {
  try {
    const { childId } = req.params

    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const child = parent.children.id(childId)
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      })
    }

    // Get today's activities
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = await ChildActivity.find({
      childId: child._id,
      timestamp: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("teacherId", "firstName lastName profileImage")
      .sort({ timestamp: -1 })

    // Get recent posts about this child
    const recentPosts = await Post.find({
      childId: child._id,
      isArchived: false,
    })
      .populate("teacherId", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .limit(5)

    // Get today's schedule
    const todaySchedule = await DailySchedule.findOne({
      date: today,
      isActive: true,
    })

    res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          name: child.name,
          age: child.age,
          profileImage: child.profileImage,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          class: child.class,
          section: child.section,
          rollNumber: child.rollNumber,
        },
        todayActivities: todayActivities.map((activity) => ({
          id: activity._id,
          type: activity.activityType,
          timestamp: activity.timestamp,
          timeAgo: getTimeAgo(activity.timestamp),
          teacher: activity.teacherId
            ? {
                name: `${activity.teacherId.firstName} ${activity.teacherId.lastName}`,
                profileImage: activity.teacherId.profileImage,
              }
            : null,
          details: getActivityDetails(activity),
        })),
        recentPosts: recentPosts.map((post) => ({
          id: post._id,
          title: post.title,
          description: post.description,
          media: post.media,
          teacher: {
            name: `${post.teacherId.firstName} ${post.teacherId.lastName}`,
            profileImage: post.teacherId.profileImage,
          },
          likes: post.likes.length,
          comments: post.comments.length,
          createdAt: post.createdAt,
          timeAgo: getTimeAgo(post.createdAt),
        })),
        todaySchedule: todaySchedule
          ? {
              activities: todaySchedule.activities.map((activity) => ({
                time: activity.time,
                category: activity.category,
                title: activity.title,
                isCompleted: activity.isCompleted,
              })),
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Get child details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch child details",
      error: error.message,
    })
  }
}

// Helper function to get activity details based on type
const getActivityDetails = (activity) => {
  switch (activity.activityType) {
    case "meal":
      return {
        mealType: activity.mealDetails?.mealType,
        items: activity.mealDetails?.items,
        amountEaten: activity.mealDetails?.amountEaten,
      }
    case "sleep":
      return {
        duration: activity.sleepDetails?.duration,
        quality: activity.sleepDetails?.quality,
      }
    case "diaper":
      return {
        type: activity.diaperDetails?.type,
        notes: activity.diaperDetails?.notes,
      }
    case "mood":
      return {
        mood: activity.moodDetails?.mood,
        notes: activity.moodDetails?.notes,
      }
    case "attendance":
      return {
        status: activity.attendanceDetails?.status,
        checkInTime: activity.attendanceDetails?.checkInTime,
        checkOutTime: activity.attendanceDetails?.checkOutTime,
      }
    default:
      return {}
  }
}

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    return `${Math.floor(diffInHours / 24)}d ago`
  }
}

module.exports = {
  getParentDashboard,
  getChildDetails,
}
