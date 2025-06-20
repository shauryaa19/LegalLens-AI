import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma, ensureDefaultUser } from '@/lib/db';
import { extractTextFromFile, isSupportedFileType, validateFileSize } from '@/lib/text-extractor';
import { analyzeDocument } from '@/lib/legal-patterns';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF or DOCX files only.' 
      }, { status: 400 });
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create unique filename to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, uniqueFilename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File saved to:', filePath);

    // Extract text
    const startTime = Date.now();
    const extractedText = await extractTextFromFile(filePath, file.type);
    console.log('Text extracted, word count:', extractedText.wordCount);

    // Ensure we have a default user
    const defaultUser = await ensureDefaultUser();

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: file.name,
        originalName: file.name,
        content: extractedText.content,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        wordCount: extractedText.wordCount,
        pageCount: extractedText.pageCount,
        userId: defaultUser.id
      }
    });

    console.log('Document created with ID:', document.id);

    // Run legal analysis
    const analysisResult = analyzeDocument(extractedText.content);
    const processingTime = Date.now() - startTime;
    
    console.log('Analysis completed:', {
      riskScore: analysisResult.riskScore,
      totalIssues: analysisResult.totalIssues,
      processingTime
    });

    // Save analysis
    const analysis = await prisma.analysis.create({
      data: {
        documentId: document.id,
        riskScore: analysisResult.riskScore,
        totalIssues: analysisResult.totalIssues,
        issues: JSON.stringify(analysisResult.issues),
        processingTime
      }
    });

    return NextResponse.json({ 
      success: true,
      documentId: document.id,
      riskScore: analysisResult.riskScore,
      totalIssues: analysisResult.totalIssues,
      wordCount: extractedText.wordCount,
      pageCount: extractedText.pageCount,
      processingTime
    });

  } catch (error) {
    console.error('Upload/Analysis error:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload and analysis failed'
    }, { status: 500 });
  }
}