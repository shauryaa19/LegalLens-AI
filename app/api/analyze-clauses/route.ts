import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  analyzeClausesWithFacts, 
  extractClausesFromText, 
  classifyDocumentAndGenerateQuestions,
  UserFacts,
  DocumentClassification,
  ParsedClause
} from '@/lib/clause-analyzer';

const prisma = new PrismaClient();

interface AnalyzeClausesRequest {
  documentId?: string; // Optional: if analyzing existing document
  content?: string; // Optional: if analyzing new text
  facts: UserFacts;
  clauses?: ParsedClause[]; // Optional: if clauses are pre-parsed
  classification?: DocumentClassification; // Optional: if document is pre-classified
}

interface ClassifyDocumentRequest {
  documentId?: string;
  content?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    // Handle document classification
    if (action === 'classify') {
      const body: ClassifyDocumentRequest = await request.json();
      const { documentId, content } = body;

      let documentContent = '';
      
      if (content) {
        documentContent = content;
              } else if (documentId) {
          const document = await prisma.document.findUnique({
            where: { id: documentId }
          });
        
        if (!document) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Document not found' 
            }, 
            { status: 404 }
          );
        }
        
        documentContent = document.content;
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Either documentId or content must be provided' 
          }, 
          { status: 400 }
        );
      }

      const classification = await classifyDocumentAndGenerateQuestions(documentContent);
      
      return NextResponse.json({
        success: true,
        classification,
        processingTime: Date.now() - startTime
      });
    }

    // Handle clause analysis
    const body: AnalyzeClausesRequest = await request.json();
    const { documentId, content, facts, clauses, classification } = body;

    // Validate input
    if (!facts || !facts.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User facts with name are required' 
        }, 
        { status: 400 }
      );
    }

    // Validate that we have necessary user facts
    if (!facts.role || !facts.situation) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User role and situation are required' 
        }, 
        { status: 400 }
      );
    }

    let parsedClauses: ParsedClause[] = [];
    let document = null;
    let documentClassification = classification;

    // Get clauses from either provided clauses, document content, or existing document
    if (clauses && clauses.length > 0) {
      parsedClauses = clauses;
    } else if (content) {
      parsedClauses = extractClausesFromText(content);
      // Classify document if not provided
      if (!documentClassification) {
        documentClassification = await classifyDocumentAndGenerateQuestions(content);
      }
          } else if (documentId) {
        // Fetch existing document
        document = await prisma.document.findUnique({
          where: { id: documentId },
          include: { analysis: true }
        });
      
      if (!document) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Document not found' 
          }, 
          { status: 404 }
        );
      }
      
      parsedClauses = extractClausesFromText(document.content);
      
      // Classify document if not provided
      if (!documentClassification) {
        documentClassification = await classifyDocumentAndGenerateQuestions(document.content);
      }
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either documentId, content, or clauses must be provided' 
        }, 
        { status: 400 }
      );
    }

    if (parsedClauses.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No clauses could be extracted for analysis' 
        }, 
        { status: 400 }
      );
    }

    // Perform AI-powered clause analysis
    const analysisResult = await analyzeClausesWithFacts(facts, parsedClauses, documentClassification);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // If we have a document, save the analysis results
    if (document) {
      // Update existing analysis or create new one
      const analysisData = {
        riskScore: analysisResult.overallRiskScore,
        totalIssues: analysisResult.analyses.filter(a => a.favorability === 'unfavorable').length,
        issues: JSON.stringify({
          factAwareAnalysis: analysisResult.analyses,
          summary: analysisResult.summary,
          recommendations: analysisResult.recommendations,
          keyFindings: analysisResult.keyFindings,
          documentClassification: analysisResult.documentClassification,
          userFacts: facts
        }),
        status: 'completed',
        processingTime,
      };

      if (document.analysis) {
        await prisma.analysis.update({
          where: { id: document.analysis.id },
          data: analysisData
        });
      } else {
        await prisma.analysis.create({
          data: {
            ...analysisData,
            documentId: document.id,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      documentId: document?.id,
      analysis: analysisResult,
      clausesAnalyzed: parsedClauses.length,
      processingTime,
    });

  } catch (error) {
    console.error('Clause analysis error:', error);
    
    // Check for specific API key errors
    if (error instanceof Error && error.message.includes('Gemini API key')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service configuration error. Please check your Gemini API key configuration.' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Clause analysis failed' 
      }, 
      { status: 500 }
    );
  }
}

// GET method to retrieve existing clause analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action');

    if (!documentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document ID is required' 
        }, 
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { 
        analysis: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document not found' 
        }, 
        { status: 404 }
      );
    }

    // If action is classify, return document classification
    if (action === 'classify') {
      try {
        const classification = await classifyDocumentAndGenerateQuestions(document.content);
        return NextResponse.json({
          success: true,
          classification,
          document: {
            id: document.id,
            title: document.title,
            originalName: document.originalName
          }
        });
      } catch (error) {
        console.error('Classification error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to classify document' 
          }, 
          { status: 500 }
        );
      }
    }

    // Parse the stored analysis if it exists
    let factAwareAnalysis = null;
    if (document.analysis?.issues) {
      try {
        const parsedIssues = JSON.parse(document.analysis.issues);
        if (parsedIssues.factAwareAnalysis) {
          factAwareAnalysis = {
            analyses: parsedIssues.factAwareAnalysis,
            summary: parsedIssues.summary,
            recommendations: parsedIssues.recommendations,
            keyFindings: parsedIssues.keyFindings,
            documentClassification: parsedIssues.documentClassification,
            userFacts: parsedIssues.userFacts,
            overallRiskScore: document.analysis.riskScore
          };
        }
      } catch (e) {
        console.warn('Failed to parse stored analysis:', e);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        originalName: document.originalName,
        wordCount: document.wordCount,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
        user: document.user
      },
      analysis: document.analysis,
      factAwareAnalysis,
      hasFactAwareAnalysis: !!factAwareAnalysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve analysis' 
      }, 
      { status: 500 }
    );
  }
} 