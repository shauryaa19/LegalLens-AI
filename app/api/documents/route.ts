import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const riskFilter = searchParams.get('risk') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.originalName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (riskFilter) {
      if (riskFilter === 'high') {
        where.analysis = {
          riskScore: { gt: 0.7 }
        };
      } else if (riskFilter === 'medium') {
        where.analysis = {
          riskScore: { gt: 0.3, lte: 0.7 }
        };
      } else if (riskFilter === 'low') {
        where.analysis = {
          riskScore: { lte: 0.3 }
        };
      }
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          analysis: true,
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.document.count({ where })
    ]);

    // Get statistics
    const stats = await prisma.document.findMany({
      include: {
        analysis: true
      }
    });

    const statistics = {
      total: stats.length,
      analyzed: stats.filter(d => d.analysis).length,
      highRisk: stats.filter(d => d.analysis && d.analysis.riskScore > 0.7).length,
      mediumRisk: stats.filter(d => d.analysis && d.analysis.riskScore > 0.3 && d.analysis.riskScore <= 0.7).length,
      lowRisk: stats.filter(d => d.analysis && d.analysis.riskScore <= 0.3).length,
      averageRiskScore: stats.reduce((acc, d) => acc + (d.analysis?.riskScore || 0), 0) / (stats.filter(d => d.analysis).length || 1),
      totalIssues: stats.reduce((acc, d) => acc + (d.analysis?.totalIssues || 0), 0),
      averageProcessingTime: stats.reduce((acc, d) => acc + (d.analysis?.processingTime || 0), 0) / (stats.filter(d => d.analysis).length || 1)
    };

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        statistics
      }
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Delete analysis first (if exists)
    await prisma.analysis.deleteMany({
      where: { documentId }
    });

    // Delete document
    await prisma.document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 