// About Us Controller (CRUD)
// This controller handles CRUD operations for the About Us page content.

const AboutUs = require('../models/AboutUs')

/**
 * @desc    Create About Us content
 * @route   POST /api/about
 * @access  Admin
 */
const createAboutUs = async (req, res) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' })
    }
    const about = new AboutUs({ title, content, createdBy: req.user?._id })
    await about.save()
    res.status(201).json({ success: true, data: about })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create About Us', error: error.message })
  }
}

/**
 * @desc    Get About Us content (latest)
 * @route   GET /api/about
 * @access  Public
 */
const getAboutUs = async (req, res) => {
  try {
    const about = await AboutUs.findOne().sort({ createdAt: -1 })
    if (!about) return res.status(404).json({ success: false, message: 'About Us not found' })
    res.json({ success: true, data: about })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch About Us', error: error.message })
  }
}

/**
 * @desc    Update About Us content
 * @route   PUT /api/about/:id
 * @access  Admin
 */
const updateAboutUs = async (req, res) => {
  try {
    const { id } = req.params
    const { title, content } = req.body
    const about = await AboutUs.findById(id)
    if (!about) return res.status(404).json({ success: false, message: 'About Us not found' })
    if (title) about.title = title
    if (content) about.content = content
    about.updatedBy = req.user?._id
    await about.save()
    res.json({ success: true, data: about })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update About Us', error: error.message })
  }
}

/**
 * @desc    Delete About Us content
 * @route   DELETE /api/about/:id
 * @access  Admin
 */
const deleteAboutUs = async (req, res) => {
  try {
    const { id } = req.params
    const about = await AboutUs.findByIdAndDelete(id)
    if (!about) return res.status(404).json({ success: false, message: 'About Us not found' })
    res.json({ success: true, message: 'About Us deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete About Us', error: error.message })
  }
}

module.exports = {
  createAboutUs,
  getAboutUs,
  updateAboutUs,
  deleteAboutUs,
}
