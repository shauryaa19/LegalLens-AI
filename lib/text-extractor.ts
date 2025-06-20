import mammoth from 'mammoth';
import fs from 'fs';

export interface ExtractedText {
  content: string;
  pageCount?: number;
  wordCount: number;
}

// This function is now only used for Word documents via the API
export async function extractTextFromFile(filePath: string, mimeType: string): Promise<ExtractedText> {
  try {
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return {
        content: result.value,
        wordCount: result.value.split(/\s+/).filter((word: string) => word.length > 0).length
      };
    }
    
    throw new Error(`Unsupported file type: ${mimeType}. PDF files are now processed on the client-side.`);
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to validate file type
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  return supportedTypes.includes(mimeType);
}

// Utility function to get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Validate file size (5MB limit for MVP)
export function validateFileSize(fileSize: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSize;
}