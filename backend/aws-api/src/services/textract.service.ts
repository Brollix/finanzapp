import { DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { textractClient } from '../config/aws.js';

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    const response = await textractClient.send(command);

    if (!response.Blocks) {
      throw new Error('No text detected in image');
    }

    // Extract only LINE blocks to get the text content
    const textLines = response.Blocks
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text || '')
      .filter((text) => text.trim().length > 0);

    if (textLines.length === 0) {
      throw new Error('No text lines found in image');
    }

    // Join lines with newlines to preserve structure
    return textLines.join('\n');
  } catch (error) {
    console.error('Textract error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
