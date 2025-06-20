import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DetectedIssue } from '@/lib/legal-patterns';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultsPage({ params }: Props) {
  // Await params for Next.js 15 compatibility
  const { id } = await params;
  
  // Fetch document and analysis
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      analysis: true,
      user: true
    }
  });

  if (!document || !document.analysis) {
    notFound();
  }

  const issues: DetectedIssue[] = JSON.parse(document.analysis.issues);
  const riskScore = document.analysis.riskScore;
  
  // Risk level calculation
  const getRiskLevel = (score: number) => {
    if (score <= 0.3)
      return { level: "Low", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (score <= 0.7)
      return { level: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" }
    return { level: "High", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  };

  const riskInfo = getRiskLevel(riskScore);
  
  // Issue categorization
  const highIssues = issues.filter((issue) => issue.riskLevel === 'HIGH');
  const mediumIssues = issues.filter((issue) => issue.riskLevel === 'MEDIUM');
  const lowIssues = issues.filter((issue) => issue.riskLevel === 'LOW');

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              ⚖️ Legal Document Analyzer
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                href="/documents" 
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                📊 My Documents
              </Link>
              <Link 
                href="/" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📄 New Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span>›</span>
            <Link href="/documents" className="hover:text-gray-700">Documents</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Analysis Results</span>
          </div>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
              <p className="text-gray-600 text-lg">
                Indian Contract Act 1872 Compliance Report
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Document: <span className="font-medium text-gray-700">{document.originalName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                📥 Download Report
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                📧 Share Report
              </button>
            </div>
          </div>
        </div>

        {/* Risk Score Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Risk Score */}
          <div className="lg:col-span-2">
            <div className={`${riskInfo.bgColor} ${riskInfo.borderColor} border-2 rounded-xl p-8`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`text-4xl ${riskInfo.color}`}>
                    {riskScore <= 0.3 ? '✅' : riskScore <= 0.7 ? '⚠️' : '🚨'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Risk Assessment</h2>
                    <p className="text-gray-600 text-lg">Overall compliance evaluation</p>
                  </div>
                </div>
                <div className={`px-6 py-3 border-2 rounded-xl ${riskInfo.color} bg-white font-bold text-xl`}>
                  {riskInfo.level} Risk
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Compliance Score</span>
                  <span className={`text-4xl font-bold ${riskInfo.color}`}>
                    {Math.round((1 - riskScore) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-1000 ${
                      riskScore <= 0.3 ? 'bg-green-500' : 
                      riskScore <= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(1 - riskScore) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Risk Score: {Math.round(riskScore * 100)}%</span>
                  <span>{document.analysis.totalIssues} issues identified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Processing Stats</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Processing Time</span>
                  <span className="font-medium">
                    {(document.analysis.processingTime ? document.analysis.processingTime / 1000 : 0).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Words Analyzed</span>
                  <span className="font-medium">{document.wordCount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pages Scanned</span>
                  <span className="font-medium">{document.pageCount || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Document Info</h3>
                <span className="text-2xl">📄</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">File Size</span>
                  <span className="font-medium">
                    {document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Analyzed</span>
                  <span className="font-medium">
                    {new Date(document.analysis.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="font-medium">{document.mimeType?.split('/')[1]?.toUpperCase() || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">High Risk Issues</p>
                  <p className="text-3xl font-bold text-red-700">{highIssues.length}</p>
                </div>
                <div className="text-4xl">🚨</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Require immediate legal review and correction</p>
              {highIssues.length > 0 && (
                                 <div className="mt-3 space-y-1">
                   {highIssues.slice(0, 2).map((issue, idx) => (
                     <p key={idx} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded truncate">
                       {issue.name}
                     </p>
                   ))}
                   {highIssues.length > 2 && (
                     <p className="text-xs text-gray-500">+{highIssues.length - 2} more issues</p>
                   )}
                 </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-yellow-50 border-b border-yellow-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Medium Risk Issues</p>
                  <p className="text-3xl font-bold text-yellow-700">{mediumIssues.length}</p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Should be reviewed and addressed</p>
              {mediumIssues.length > 0 && (
                                 <div className="mt-3 space-y-1">
                   {mediumIssues.slice(0, 2).map((issue, idx) => (
                     <p key={idx} className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded truncate">
                       {issue.name}
                     </p>
                   ))}
                   {mediumIssues.length > 2 && (
                     <p className="text-xs text-gray-500">+{mediumIssues.length - 2} more issues</p>
                   )}
                 </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Low Risk Issues</p>
                  <p className="text-3xl font-bold text-green-700">{lowIssues.length}</p>
                </div>
                <div className="text-4xl">ℹ️</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Minor improvements for best practices</p>
              {lowIssues.length > 0 && (
                                 <div className="mt-3 space-y-1">
                   {lowIssues.slice(0, 2).map((issue, idx) => (
                     <p key={idx} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded truncate">
                       {issue.name}
                     </p>
                   ))}
                   {lowIssues.length > 2 && (
                     <p className="text-xs text-gray-500">+{lowIssues.length - 2} more issues</p>
                   )}
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Issues */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Detailed Analysis</h3>
                <p className="text-gray-600 mt-1">All identified compliance issues with recommendations</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                  Filter by Risk
                </button>
                <button className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                  Sort by Severity
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {issues.map((issue, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                                         <div className="flex items-center gap-3 mb-2">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(issue.riskLevel)}`}>
                         {issue.riskLevel.charAt(0) + issue.riskLevel.slice(1).toLowerCase()} Risk
                       </span>
                       <span className="text-sm text-gray-500">{issue.category}</span>
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900 mb-2">{issue.name}</h4>
                     <p className="text-gray-700 mb-3">{issue.issue}</p>
                  </div>
                  <div className="text-2xl ml-4">
                    {issue.riskLevel === 'HIGH' ? '🚨' : issue.riskLevel === 'MEDIUM' ? '⚠️' : 'ℹ️'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">📋 Legal Basis</h5>
                  <p className="text-sm text-gray-700">{issue.legalBasis}</p>
                </div>

                                 <div className="bg-blue-50 rounded-lg p-4">
                   <h5 className="font-medium text-blue-900 mb-2">💡 Recommendation</h5>
                   <p className="text-sm text-blue-800">{issue.suggestion}</p>
                 </div>

                 {issue.matchedText && (
                   <div className="mt-4 bg-green-50 rounded-lg p-4">
                     <h5 className="font-medium text-green-900 mb-2">📍 Matched Text</h5>
                     <p className="text-sm text-green-800 italic">"{issue.matchedText}"</p>
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎯</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Next Steps</h3>
              <div className="space-y-3">
                {highIssues.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Priority:</strong> Address {highIssues.length} high-risk issue{highIssues.length > 1 ? 's' : ''} immediately to ensure legal compliance
                    </p>
                  </div>
                )}
                {mediumIssues.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      <strong>Review:</strong> Consider addressing {mediumIssues.length} medium-risk issue{mediumIssues.length > 1 ? 's' : ''} to strengthen the contract
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Consult:</strong> Consider consulting with a legal professional for complex issues or final review
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between bg-white rounded-xl border shadow-sm p-6">
          <div>
            <p className="text-sm text-gray-500">
              <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute legal advice.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/documents"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View All Documents
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Analyze Another Document
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}