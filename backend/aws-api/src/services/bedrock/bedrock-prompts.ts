/**
 * System prompts for Bedrock AI models
 */

// Optimized compact system prompt for Haiku
export const HAIKU_SYSTEM_PROMPT = `Extract receipt data to JSON. Numbers: Argentine format "5.850,00"→5850.00.

Structure: {supermarket, datetime "DD/MM/YYYY HH:MM:SS", total, items: [{product, brand?, quantity, price, discount?, promotion?, is_weight?}], discounts: [{description, amount}]}

Rules: Group duplicates. Title Case products. Extract brands if clear. Link discounts to items. Exclude totals/taxes. is_weight=true for kg/peso items.

Return JSON only.`;
