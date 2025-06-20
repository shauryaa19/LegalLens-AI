import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDefaultUser } from '../../../lib/db';
import { analyzeDocument } from '../../../lib/legal-patterns';

interface AnalyzeRequest {
  filename: string;
  mimeType: string;
  content: string;
  pageCount: number;
  wordCount: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeRequest = await request.json();
    const { filename, mimeType, content, pageCount, wordCount } = body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No text content provided for analysis' 
        }, 
        { status: 400 }
      );
    }

    if (wordCount < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document too short for meaningful analysis (minimum 10 words required)' 
        }, 
        { status: 400 }
      );
    }

    // Perform legal pattern analysis
    const analysisResult = analyzeDocument(content);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Get or create default user for MVP
    const defaultUser = await ensureDefaultUser();
    
    // Save document to database
    const document = await prisma.document.create({
      data: {
        title: filename.replace(/\.[^/.]+$/, ""), // Remove file extension for title
        originalName: filename,
        content: content,
        filePath: `/uploads/${Date.now()}-${filename}`, // Mock file path since we're not saving files
        fileSize: content.length,
        mimeType,
        wordCount,
        pageCount,
        userId: defaultUser.id,
      },
    });

    // Save analysis results
    const analysis = await prisma.analysis.create({
      data: {
        documentId: document.id,
        riskScore: analysisResult.riskScore,
        totalIssues: analysisResult.issues.length,
        issues: JSON.stringify(analysisResult.issues),
        status: 'completed',
        processingTime,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      riskScore: analysisResult.riskScore,
      totalIssues: analysisResult.issues.length,
      wordCount,
      pageCount,
      processingTime,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      }, 
      { status: 500 }
    );
  }
} 