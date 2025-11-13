import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3Config.js";
import { upload as multerUpload } from "../middlewares/multer.js";
import dotenv from "dotenv";

dotenv.config();

const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/jpg",
];

function isImage(mimetype) {
	return ALLOWED_IMAGE_TYPES.includes(mimetype);
}

function generateKey(originalName, folder = "images") {
	const ext = path.extname(originalName) || "";
	const name = `${Date.now()}-${cryptoRandomHex(8)}${ext}`;
	if (folder) return `${folder.replace(/\/$/, "")}/${name}`;
	return name;
}

function cryptoRandomHex(size = 8) {
	try {
		return require("crypto").randomBytes(size).toString("hex");
	} catch (e) {
		// fallback
		return Math.random().toString(16).slice(2, 2 + size * 2);
	}
}

async function uploadBuffer(buffer, key, contentType, options = {}) {
	const Bucket = process.env.AWS_BUCKET_NAME;
	if (!Bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
		throw new Error("S3 is not configured via environment variables.");
	}

	const params = {
		Bucket,
		Key: key,
		Body: buffer,
		ContentType: contentType || "application/octet-stream",
		ACL: options.publicRead ? "public-read" : undefined,
	};

	const cmd = new PutObjectCommand(params);
	await s3.send(cmd);

	const region = process.env.AWS_REGION;
	const url = `https://${Bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
	return url;
}

async function uploadFile(file, opts = {}) {
	// file: multer file object with `path`, `mimetype`, `originalname`, `size`
	if (!file) throw new Error("No file provided to uploadFile");

	const useS3 = opts.useS3 ?? true;
	const deleteLocal = opts.deleteLocal ?? true;
	const folder = opts.folder ?? "images";

	if (!isImage(file.mimetype)) {
		if (deleteLocal && file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
		throw new Error("Invalid image type");
	}

	// If S3 is not configured, return a local URL path
	if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
		// return relative public path that the server serves (assuming `public/` is served statically)
		const publicPath = file.path ? file.path.replace(/^\.?\/?(public\\|public\/)?/, "") : file.filename || file.originalname;
		return `/${publicPath.replace(/\\/g, "/")}`;
	}

	const key = generateKey(file.originalname, folder);

	const stream = fs.createReadStream(file.path);

	const params = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: key,
		Body: stream,
		ContentType: file.mimetype,
		ACL: opts.publicRead ? "public-read" : undefined,
	};

	const cmd = new PutObjectCommand(params);
	await s3.send(cmd);

	if (deleteLocal && file.path && fs.existsSync(file.path)) {
		try {
			fs.unlinkSync(file.path);
		} catch (e) {
			// ignore unlink errors
		}
	}

	const region = process.env.AWS_REGION;
	const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
	return url;
}

export { isImage, uploadFile, uploadBuffer, multerUpload };

