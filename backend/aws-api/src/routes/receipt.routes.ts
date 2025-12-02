import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { scanLimiter } from "../middleware/rateLimit.js";
import { authenticate } from "../middleware/auth.js";
import * as receiptController from "../controllers/receipt.controller.js";

const router = Router();

// POST /api/receipt/process - Process a receipt image
router.post(
	"/process",
	authenticate,
	scanLimiter,
	upload.single("image"),
	receiptController.processReceipt
);

// POST /api/receipt/manual - Create a receipt manually
router.post("/manual", authenticate, receiptController.createManualReceipt);

// PUT /api/receipt/:id - Update a receipt
router.put("/:id", authenticate, receiptController.updateReceipt);

// GET /api/receipt/user/me - Get all receipts for the current user
router.get("/user/me", authenticate, receiptController.getUserReceipts);

// GET /api/receipt/:id - Get a receipt by ID
router.get("/:id", authenticate, receiptController.getReceiptById);

export default router;
