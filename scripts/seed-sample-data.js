const mongoose = require("mongoose")
const User = require("../models/User")
const Parent = require("../models/Parent")
const TeacherProfile = require("../models/TeacherProfile")
const School = require("../models/School")
const Room = require("../models/Room")
const Post = require("../models/Post")
const ChildProgress = require("../models/ChildProgress")
const DailySchedule = require("../models/DailySchedule")
const ChildActivity = require("../models/ChildActivity")
require("dotenv").config()

const seedSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management")
    console.log("Connected to MongoDB")

    // Find existing admin
    const admin = await User.findOne({ role: "admin" })
    if (!admin) {
      console.log("⚠️  No admin found. Please run 'node scripts/create-admin.js' first")
      process.exit(1)
    }

    // Find existing school
    const school = await School.findOne()
    if (!school) {
      console.log("⚠️  No school found. Please run 'node scripts/seed-schools.js' first")
      process.exit(1)
    }

    // Create sample parent user (Alice Sienfeld)
    let parentUser = await User.findOne({ email: "alice.sienfeld@example.com" })
    if (!parentUser) {
      parentUser = new User({
        email: "alice.sienfeld@example.com",
        password: "parent123",
        firstName: "Alice",
        lastName: "Sienfeld",
        phoneNumber: "+44-7700-900123",
        role: "parent",
        isActive: true,
        accountStatus: "active",
        isFirstLogin: false,
        createdBy: admin._id,
      })
      await parentUser.save()
      console.log("✅ Created parent user: Alice Sienfeld")
    }

    // Create parent profile with child
    let parent = await Parent.findOne({ userId: parentUser._id })
    if (!parent) {
      parent = new Parent({
        userId: parentUser._id,
        children: [
          {
            name: "David Sienfeld",
            age: 4,
            dateOfBirth: new Date("2020-03-15"),
            gender: "male",
            schoolId: school._id,
            class: "Pre-KG",
            section: "A",
            rollNumber: "PKG001",
            profileImage: "/placeholder.svg?height=150&width=150&text=David",
          },
        ],
        emergencyContact: {
          name: "John Sienfeld",
          relationship: "Father",
          phoneNumber: "+44-7700-900124",
        },
        address: {
          street: "123 Birmingham Street",
          city: "Birmingham",
          state: "West Midlands",
          zipCode: "B1 1AA",
          country: "UK",
        },
      })
      await parent.save()
      console.log("✅ Created parent profile with child: David Sienfeld")
    }

    // Create sample teacher user
    let teacherUser = await User.findOne({ email: "teacher@brightminds.edu" })
    if (!teacherUser) {
      teacherUser = new User({
        email: "teacher@brightminds.edu",
        password: "teacher123",
        firstName: "Sarah",
        lastName: "Johnson",
        phoneNumber: "+44-7700-900125",
        role: "teacher",
        isActive: true,
        accountStatus: "active",
        isFirstLogin: false,
        createdBy: admin._id,
      })
      await teacherUser.save()
      console.log("✅ Created teacher user: Sarah Johnson")
    }

    // Create teacher profile
    let teacherProfile = await TeacherProfile.findOne({ userId: teacherUser._id })
    if (!teacherProfile) {
      teacherProfile = new TeacherProfile({
        userId: teacherUser._id,
        schoolId: school._id,
        employeeId: "TCH001",
        subjects: [
          {
            name: "Early Childhood Development",
            grades: ["Pre-KG", "KG"],
            sections: ["A", "B"],
          },
        ],
        qualifications: [
          {
            degree: "Bachelor of Education",
            institution: "University of Birmingham",
            year: 2018,
          },
        ],
        experience: {
          totalYears: 5,
          specialization: ["Early Childhood", "Creative Arts"],
        },
        bio: "Passionate early childhood educator with 5 years of experience in nurturing young minds.",
      })
      await teacherProfile.save()
      console.log("✅ Created teacher profile")
    }

    // Create sample room
    let room = await Room.findOne({ roomNumber: "3" })
    if (!room) {
      room = new Room({
        roomNumber: "3",
        roomName: "Little Explorers",
        schoolId: school._id,
        primaryTeacher: {
          userId: teacherUser._id,
          name: "Sarah Johnson",
          profileImage: "/placeholder.svg?height=100&width=100&text=Sarah",
        },
        ageGroup: {
          minAge: 3,
          maxAge: 5,
          description: "Preschoolers",
        },
        capacity: 20,
        currentEnrollment: 15,
        dailySchedule: [
          {
            time: "08:00 AM",
            activity: "Creative Art",
            description: "Bee Craft activities",
            duration: 45,
          },
          {
            time: "08:45 AM",
            activity: "Fine Motor Skills",
            description: "Holding Point Brush For Painting",
            duration: 30,
          },
        ],
        facilities: ["Art Corner", "Reading Area", "Play Zone"],
      })
      await room.save()
      console.log("✅ Created room: Little Explorers")
    }

    // Create today's schedule
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let todaySchedule = await DailySchedule.findOne({ roomId: room._id, date: today })
    if (!todaySchedule) {
      todaySchedule = new DailySchedule({
        roomId: room._id,
        date: today,
        activities: [
          {
            time: "08:00 AM",
            category: "Creative Art",
            title: "Bee Craft",
            description: "Create colorful bee crafts using paper plates",
            materials: ["Paper plates", "Yellow paint", "Black markers"],
            duration: 45,
            learningObjectives: ["Fine motor skills", "Color recognition"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "08:45 AM",
            category: "Fine Motor Skills",
            title: "Holding Point Brush For Painting",
            description: "Practice proper brush grip and painting techniques",
            materials: ["Paint brushes", "Watercolors", "Paper"],
            duration: 30,
            learningObjectives: ["Hand-eye coordination", "Grip strength"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "09:15 AM",
            category: "Language And Literacy",
            title: "Communicating With Friends Through Beekeeper Pretend Play",
            description: "Role-play as beekeepers and practice communication",
            materials: ["Beekeeper hats", "Toy bees"],
            duration: 45,
            learningObjectives: ["Vocabulary development", "Social skills"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "10:00 AM",
            category: "Loose Part",
            title: "Paint And Papers",
            description: "Free exploration with various art materials",
            materials: ["Various papers", "Paints", "Brushes"],
            duration: 30,
            learningObjectives: ["Creativity", "Problem solving"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "10:30 AM",
            category: "Music And Movement",
            title: "The Yellow Song",
            description: "Sing and dance to songs about yellow and bees",
            materials: ["Music player", "Yellow scarves"],
            duration: 20,
            learningObjectives: ["Rhythm", "Gross motor skills"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "10:50 AM",
            category: "Science, Nature And Math",
            title: "Count The Bees",
            description: "Practice counting with bee-themed activities",
            materials: ["Toy bees", "Number cards"],
            duration: 30,
            learningObjectives: ["Number recognition", "Counting skills"],
            ageGroup: { min: 3, max: 5 },
          },
          {
            time: "11:20 AM",
            category: "Sensory Bin",
            title: "Bee Counting Sensory Bin",
            description: "Explore textures while practicing counting",
            materials: ["Yellow rice", "Toy bees", "Scoops"],
            duration: 25,
            learningObjectives: ["Sensory exploration", "Counting"],
            ageGroup: { min: 3, max: 5 },
          },
        ],
        createdBy: teacherUser._id,
      })
      await todaySchedule.save()
      console.log("✅ Created today's schedule")
    }

    // Create sample activities for today
    const childId = parent.children[0]._id

    // Sample activities
    const sampleActivities = [
      {
        childId,
        parentId: parent._id,
        teacherId: teacherUser._id,
        roomId: room._id,
        activityType: "attendance",
        attendanceDetails: {
          status: "present",
          checkInTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
        },
        timestamp: new Date(today.getTime() + 8 * 60 * 60 * 1000),
      },
      {
        childId,
        parentId: parent._id,
        teacherId: teacherUser._id,
        roomId: room._id,
        activityType: "mood",
        moodDetails: {
          mood: "energetic",
          notes: "Very excited about today's bee activities!",
        },
        timestamp: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      },
      {
        childId,
        parentId: parent._id,
        teacherId: teacherUser._id,
        roomId: room._id,
        activityType: "meal",
        mealDetails: {
          mealType: "afternoon_snack",
          items: "Cupcakes with apple juice",
          amountEaten: "most",
        },
        timestamp: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      },
    ]

    for (const activityData of sampleActivities) {
      const existingActivity = await ChildActivity.findOne({
        childId: activityData.childId,
        activityType: activityData.activityType,
        timestamp: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })

      if (!existingActivity) {
        const activity = new ChildActivity(activityData)
        await activity.save()
      }
    }
    console.log("✅ Created sample activities")

    // Create sample post
    let samplePost = await Post.findOne({ title: "Number comb" })
    if (!samplePost) {
      samplePost = new Post({
        childId,
        teacherId: teacherUser._id,
        roomId: room._id,
        postType: "activity",
        title: "Number comb",
        description:
          "Today the preschoolers were given two sensory bins. One had Yellow rice with yellow comb that had numbers",
        activityDetails: {
          activityName: "Number comb",
          domain: "Communication and Literacies",
          skill: "Communicative Practices: Children learn conventions of their languages",
          ageGroup: {
            min: 3,
            max: 5,
            description: "3 to 5 years",
          },
          indicators: ["Growing in their understanding of vocabulary"],
        },
        media: [
          {
            type: "image",
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Post%20Detaisl-pbaM9qn0EBjkEESLAM1l7Dxkq0oYP4.png",
            caption: "Children exploring the number comb sensory bin",
          },
        ],
        tags: ["sensory", "math", "counting", "fine-motor"],
        visibility: "parents_only",
        comments: [
          {
            userId: parentUser._id,
            content: "Failures are stepping stones to success. Embrace them, learn from them, and keep moving forward",
            likes: [
              {
                userId: teacherUser._id,
                likedAt: new Date(),
              },
            ],
            createdAt: new Date(Date.now() - 49 * 60 * 1000), // 49 minutes ago
          },
          {
            userId: teacherUser._id,
            content: "Yes",
            likes: [
              {
                userId: parentUser._id,
                likedAt: new Date(),
              },
            ],
            createdAt: new Date(Date.now() - 44 * 60 * 1000), // 44 minutes ago
          },
        ],
        likes: [
          {
            userId: parentUser._id,
            likedAt: new Date(),
          },
        ],
      })
      await samplePost.save()
      console.log("✅ Created sample post: Number comb")
    }

    // Create sample progress report
    let progressReport = await ChildProgress.findOne({ childId, reportDate: today })
    if (!progressReport) {
      progressReport = new ChildProgress({
        childId,
        parentId: parent._id,
        teacherId: teacherUser._id,
        roomId: room._id,
        reportDate: today,
        reportType: "daily",
        meals: [
          {
            type: "breakfast",
            items: "Oatmeal with milk and oranges",
            time: "08:30 AM",
            amountEaten: "all",
          },
          {
            type: "lunch",
            items: "Cracked wheat with mixed veggies",
            time: "12:00 PM",
            amountEaten: "most",
          },
          {
            type: "afternoon_snack",
            items: "Cupcakes with apple juice",
            time: "02:00 PM",
            amountEaten: "some",
          },
        ],
        mood: {
          overall: "playful",
          notes: "Very engaged and excited about activities today",
        },
        activities: [
          {
            name: "Number comb",
            category: "Sensory Bin",
            description: "Exploring numbers through sensory play with yellow rice",
            participation: "active",
            skills_demonstrated: ["Counting", "Fine motor skills", "Sensory exploration"],
            time: "11:20 AM",
          },
        ],
        observations: [
          {
            domain: "Communication and Literacies",
            skill: "Children learn conventions of their languages",
            indicator: "Growing in their understanding of vocabulary",
            observation:
              "David showed great interest in naming the numbers he found in the sensory bin. He was able to identify numbers 1-5 correctly and attempted to count beyond that.",
            photos: [
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Post%20Detaisl-pbaM9qn0EBjkEESLAM1l7Dxkq0oYP4.png",
            ],
            developmentLevel: "developing",
          },
        ],
        attendance: {
          status: "present",
          checkInTime: "08:00 AM",
        },
        teacherNotes:
          "David had a wonderful day today. He was very engaged in all activities, especially the number comb sensory bin. His counting skills are improving, and he shows great enthusiasm for learning.",
        photos: [
          {
            url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Post%20Detaisl-pbaM9qn0EBjkEESLAM1l7Dxkq0oYP4.png",
            caption: "David exploring the number comb activity",
            timestamp: new Date(),
            activity: "Number comb",
          },
        ],
        isCompleted: true,
      })
      await progressReport.save()
      console.log("✅ Created sample progress report")
    }

    console.log("\n🎉 Sample data seeding completed!")
    console.log("📋 Created sample data:")
    console.log("   - Parent: Alice Sienfeld (alice.sienfeld@example.com / parent123)")
    console.log("   - Child: David Sienfeld (4 years old)")
    console.log("   - Teacher: Sarah Johnson (teacher@brightminds.edu / teacher123)")
    console.log("   - Room: Little Explorers (Room #3)")
    console.log("   - Today's schedule with 7 activities")
    console.log("   - Sample activities (attendance, mood, meal)")
    console.log("   - Sample post: 'Number comb' with comments and likes")
    console.log("   - Daily progress report for today")
    console.log("\n🔑 Login credentials:")
    console.log("   - Admin: admin@school.com / admin123")
    console.log("   - Parent: alice.sienfeld@example.com / parent123")
    console.log("   - Teacher: teacher@brightminds.edu / teacher123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding sample data:", error)
    process.exit(1)
  }
}

seedSampleData()
