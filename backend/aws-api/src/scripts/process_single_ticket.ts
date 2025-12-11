import fs from "fs/promises";
import path from "path";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";

/**
 * Process a single ticket and output JSON
 */
async function processSingleTicket() {
    try {
        const samplesDir = path.join(process.cwd(), "../../samples");
        const ticketPath = path.join(samplesDir, "ticket1.jpeg");

        console.log("Processing ticket1.jpeg...\n");

        // Read image
        const imageBuffer = await fs.readFile(ticketPath);

        // Step 1: Textract
        console.log("Step 1: Extracting text with Textract...");
        const ocrText = await extractTextFromImage(imageBuffer);
        console.log(`✓ OCR Complete (${ocrText.length} chars)\n`);

        // Step 2: Bedrock
        console.log("Step 2: Processing with AI...");
        const receiptData = await formatReceiptWithBedrock(ocrText);
        console.log("✓ AI Processing Complete\n");

        // Output clean JSON
        console.log("=".repeat(60));
        console.log("RECEIPT DATA (JSON)");
        console.log("=".repeat(60));
        console.log(JSON.stringify(receiptData, null, 2));
        console.log("=".repeat(60));
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

processSingleTicket();

