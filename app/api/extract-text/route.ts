import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    // Check if it's a Word document
    if (!file.type.includes('wordprocessingml') && !file.type.includes('msword')) {
      return NextResponse.json(
        { error: 'Only Word documents are supported by this endpoint' }, 
        { status: 400 }
      );
    }

    // Extract text using mammoth
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    
    const content = result.value.trim();
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    return NextResponse.json({
      content,
      pageCount: 1, // Word documents don't have clear page boundaries when extracted as text
      wordCount
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from document' }, 
      { status: 500 }
    );
  }
} 