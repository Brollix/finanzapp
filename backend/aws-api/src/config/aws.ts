import { TextractClient } from "@aws-sdk/client-textract";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Log para debug
console.log("AWS Configuration:");
console.log("Region:", AWS_REGION);
console.log(
	"Access Key ID:",
	process.env.AWS_ACCESS_KEY_ID
		? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...`
		: "NOT SET"
);
console.log("Secret Key:", process.env.AWS_SECRET_ACCESS_KEY ? "SET (hidden)" : "NOT SET");

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
