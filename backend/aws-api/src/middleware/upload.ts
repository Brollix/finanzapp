import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import { Request } from "express";

// Configure storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Use system temp directory
		cb(null, os.tmpdir());
	},
	filename: (req, file, cb) => {
		// Sanitization: UUID + extension derived from MIME type
		// We do NOT use file.originalname to avoid any potential path traversal or spoofing
		const MIME_TYPE_MAP: Record<string, string> = {
			"image/png": ".png",
			"image/jpeg": ".jpg",
			"image/jpg": ".jpg",
			"image/webp": ".webp",
		};

		const uniqueSuffix = uuidv4();
		// Default to .bin if mimetype is unknown (though fileFilter should catch this)
		const ext = MIME_TYPE_MAP[file.mimetype] || ".bin";
		cb(null, `${uniqueSuffix}${ext}`);
	},
});

// File Filter
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	// Whitelist allowed mime types
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		// Reject with specific error
		cb(new Error("Invalid file type. Only JPEG, PNG and WebP are allowed."));
	}
};

// Limits
const limits = {
	fileSize: 5 * 1024 * 1024, // 5MB limit (Strict limit for t2.micro)
};

export const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: limits,
});
