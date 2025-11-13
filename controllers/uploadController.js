import { Upload } from "@aws-sdk/lib-storage";
import s3 from "../config/s3Config.js";
import { nanoid } from "nanoid";

export const tempUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const file = req.file;
    const safeName = file.originalname.replace(/\s+/g, "_");
    const key = `temp/${nanoid()}-${safeName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const parallelUploads3 = new Upload({
      client: s3,
      params,
    });

    await parallelUploads3.done();

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return res.status(200).json({ success: true, url, key });
  } catch (error) {
    console.error("S3 upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};

export default { tempUpload };