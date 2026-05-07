import { TextractClient } from "@aws-sdk/client-textract";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const envRegion = process.env.AWS_REGION;
const AWS_REGION = (typeof envRegion === "string" && envRegion.length > 0) ? envRegion : "us-east-1";

import logger from "../utils/logger.js";

// Log para debug
logger.debug("AWS Configuration:");
logger.debug(`Region: ${AWS_REGION}`);
logger.debug(
	`Access Key ID: ${
		(typeof process.env.AWS_ACCESS_KEY_ID === "string" && process.env.AWS_ACCESS_KEY_ID.length > 0)
			? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...`
			: "NOT SET"
	}`
);
logger.debug(
	`Secret Key: ${
		(typeof process.env.AWS_SECRET_ACCESS_KEY === "string" && process.env.AWS_SECRET_ACCESS_KEY.length > 0) ? "SET (hidden)" : "NOT SET"
	}`
);

export const textractClient = new TextractClient({
	region: AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const bedrockClient = new BedrockRuntimeClient({
	region: AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});
