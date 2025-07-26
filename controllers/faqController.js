const Faq = require("../models/Faq");

const searchFaqs = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }
    const regex = new RegExp(q, "i");
    const faqs = await Faq.find({
      $or: [
        { question: { $regex: regex } },
        { answer: { $regex: regex } }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to search FAQs", error: error.message });
  }
};

const createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Question and answer are required" });
    }
    const faq = new Faq({ question, answer, createdBy: req.user?._id });
    await faq.save();
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create FAQ",
        error: error.message,
      });
  }
};

const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch FAQs",
        error: error.message,
      });
  }
};

const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const faq = await Faq.findById(id);
    if (!faq)
      return res.status(404).json({ success: false, message: "FAQ not found" });
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    faq.updatedBy = req.user?._id;
    await faq.save();
    res.json({ success: true, data: faq });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update FAQ",
        error: error.message,
      });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq)
      return res.status(404).json({ success: false, message: "FAQ not found" });
    res.json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete FAQ",
        error: error.message,
      });
  }
};

module.exports = {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
  searchFaqs,
};
