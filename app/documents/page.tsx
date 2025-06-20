import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';

export default async function DocumentsPage() {
  // Fetch all documents with their analysis
  const documents = await prisma.document.findMany({
    include: {
      analysis: true,
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { level: "Low", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (score <= 0.7) return { level: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" }
    return { level: "High", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  };

  const getRiskIcon = (score: number) => {
    if (score <= 0.3) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score <= 0.7) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Scale className="h-8 w-8 text-blue-600" />
              Legal Document Analyzer
            </Link>
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Upload New
              </Link>
              <Button asChild>
                <Link href="/">
                  <FileText className="h-4 w-4 mr-2" />
                  New Analysis
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document History</h1>
          <p className="text-gray-600">
            View and manage your analyzed documents and their compliance reports
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter(d => d.analysis && d.analysis.riskScore > 0.7).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.analysis && d.analysis.riskScore > 0.3 && d.analysis.riskScore <= 0.7).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.analysis && d.analysis.riskScore <= 0.3).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((document) => {
              const riskInfo = document.analysis ? getRiskLevel(document.analysis.riskScore) : null;
              
              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {document.originalName}
                          </h3>
                          {riskInfo && (
                            <div className="flex items-center gap-1">
                              {getRiskIcon(document.analysis!.riskScore)}
                              <Badge variant="outline" className={riskInfo.color}>
                                {riskInfo.level} Risk
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">File Size</p>
                            <p className="text-sm font-medium">
                              {document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pages</p>
                            <p className="text-sm font-medium">{document.pageCount || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Word Count</p>
                            <p className="text-sm font-medium">{document.wordCount?.toLocaleString() || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Issues Found</p>
                            <p className="text-sm font-medium">
                              {document.analysis?.totalIssues || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Analyzed {new Date(document.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {document.analysis && (
                            <div>
                              Processing time: {(document.analysis.processingTime ? document.analysis.processingTime / 1000 : 0).toFixed(2)}s
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {document.analysis && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/results/${document.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Report
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Risk Score Bar */}
                    {document.analysis && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Risk Score</span>
                          <span className={`text-sm font-bold ${riskInfo!.color}`}>
                            {Math.round(document.analysis.riskScore * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              document.analysis.riskScore <= 0.3 ? 'bg-green-500' : 
                              document.analysis.riskScore <= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${document.analysis.riskScore * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't uploaded any documents for analysis yet.
              </p>
              <Button asChild>
                <Link href="/">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {documents.length > 10 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page 1 of 1
              </span>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 