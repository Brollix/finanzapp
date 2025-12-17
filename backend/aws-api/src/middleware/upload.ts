import multer from "multer";
import { Request } from "express";

// Configure memory storage (better for serverless/Lambda environments)
// This avoids disk space issues in /tmp/ directory
const storage = multer.memoryStorage();

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
