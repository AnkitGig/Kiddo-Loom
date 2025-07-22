const mongoose = require("mongoose")
const Room = require("../models/Room")
const User = require("../models/User")
require("dotenv").config()

const sampleRooms = [
  {
    roomNumber: "3",
    roomName: "Little Explorers",
    primaryTeacher: {
      name: "Doris Wilson",
      profileImage: "/placeholder.svg?height=100&width=100",
    },
    ageGroup: {
      minAge: 2,
      maxAge: 4,
      description: "Toddlers & Preschool",
    },
    capacity: 15,
    currentEnrollment: 12,
    dailySchedule: [
      {
        time: "08:00 AM",
        activity: "Breakfast",
        description: "Healthy breakfast with fruits and cereals",
        duration: 30,
      },
      {
        time: "08:30 AM",
        activity: "Play time",
        description: "Free play with educational toys",
        duration: 60,
      },
      {
        time: "09:30 AM",
        activity: "Learning",
        description: "Circle time, stories, and basic learning activities",
        duration: 45,
      },
      {
        time: "10:15 AM",
        activity: "Physical games",
        description: "Outdoor play and physical activities",
        duration: 45,
      },
      {
        time: "11:00 AM",
        activity: "Snacks",
        description: "Healthy snacks and juice",
        duration: 20,
      },
      {
        time: "11:20 AM",
        activity: "Story time",
        description: "Reading stories and quiet activities",
        duration: 40,
      },
      {
        time: "12:00 PM",
        activity: "Lunch",
        description: "Nutritious lunch meal",
        duration: 45,
      },
      {
        time: "12:45 PM",
        activity: "Nap time",
        description: "Rest and sleep time",
        duration: 90,
      },
      {
        time: "02:15 PM",
        activity: "Afternoon Snacks",
        description: "Light snacks after nap",
        duration: 15,
      },
      {
        time: "02:30 PM",
        activity: "Art & Craft",
        description: "Creative activities and crafts",
        duration: 60,
      },
      {
        time: "03:30 PM",
        activity: "Check out",
        description: "Preparation for pickup",
        duration: 30,
      },
    ],
    facilities: ["Play area", "Reading corner", "Art station", "Outdoor playground"],
  },
]

const seedRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management")
    console.log("Connected to MongoDB")

    // Find a teacher user to assign as primary teacher
    const teacher = await User.findOne({ role: "teacher" })
    if (teacher) {
      sampleRooms[0].primaryTeacher.userId = teacher._id
    }

    // Find a school to assign rooms to
    const School = require("../models/School")
    const school = await School.findOne()
    if (school) {
      sampleRooms[0].schoolId = school._id
    }

    // Clear existing rooms
    await Room.deleteMany({})
    console.log("Cleared existing rooms")

    // Insert sample rooms
    await Room.insertMany(sampleRooms)
    console.log("Sample rooms inserted successfully")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding rooms:", error)
    process.exit(1)
  }
}

seedRooms()
