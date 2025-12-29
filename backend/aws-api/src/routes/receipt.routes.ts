import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { scanLimiter } from "../middleware/rateLimit.js";
import { authenticate } from "../middleware/auth.js";
import {
	validateFileUpload,
	sanitizeInput,
} from "../middleware/validation.middleware.js";
import * as receiptController from "../controllers/receipt.controller.js";

const router = Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// POST /api/receipt/process - Process a receipt image
router.post(
	"/process",
	authenticate,
	scanLimiter,
	upload.single("image"),
	validateFileUpload, // Validate uploaded file
	receiptController.processReceipt
);

// POST /api/receipt/manual - Create a receipt manually
router.post("/manual", authenticate, receiptController.createManualReceipt);

// PUT /api/receipt/:id - Update a receipt
router.put("/:id", authenticate, receiptController.updateReceipt);

// GET /api/receipt/user/me - Get all receipts for the current user
router.get("/user/me", authenticate, receiptController.getUserReceipts);

// GET /api/receipt/process/:jobId/status - Get processing status for a job
router.get(
	"/process/:jobId/status",
	authenticate,
	receiptController.getProcessingStatus
);

// GET /api/receipt/:id - Get a receipt by ID
router.get("/:id", authenticate, receiptController.getReceiptById);

export default router;
