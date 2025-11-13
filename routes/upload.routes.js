import { Router } from "express";
import multer from "multer";
import uploadController from "../controllers/uploadController.js";

const router = Router();

// Use memory storage so file buffer can be uploaded directly to S3
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /api/v1/upload/temp
router.post("/temp", upload.single("image"), uploadController.tempUpload);

export default router;
