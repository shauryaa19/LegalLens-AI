'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DetectedIssue } from '@/lib/legal-patterns';
import FactAwareAnalysis from '@/components/fact-aware-analysis';
import { FactAwareAnalysisResult } from '@/lib/clause-analyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Scale, 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Share,
  Loader2
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  originalName: string;
  wordCount: number | null;
  pageCount: number | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Analysis {
  id: string;
  riskScore: number;
  totalIssues: number;
  issues: string;
  status: string;
  processingTime: number | null;
}

interface ResultData {
  document: Document;
  analysis: Analysis;
  factAwareAnalysis?: FactAwareAnalysisResult;
  hasFactAwareAnalysis: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('traditional');

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analyze-clauses?documentId=${id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch results');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleFactAwareAnalysisComplete = (analysis: FactAwareAnalysisResult) => {
    setData(prev => prev ? {
      ...prev,
      factAwareAnalysis: analysis,
      hasFactAwareAnalysis: true
    } : null);
    setActiveTab('fact-aware');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Results</h3>
            <p className="text-gray-600 mb-4">{error || 'Results not found'}</p>
            <Button asChild>
              <Link href="/documents">Back to Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const issues: DetectedIssue[] = JSON.parse(data.analysis.issues);
  const riskScore = data.analysis.riskScore;
  
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
              <Scale className="h-8 w-8 text-blue-600" />
              Legal Document Analyzer
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                href="/documents" 
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                My Documents
              </Link>
              <Button asChild>
                <Link href="/">
                  <FileText className="h-4 w-4 mr-2" />
                  New Analysis
                </Link>
              </Button>
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
                Document: <span className="font-medium text-gray-700">{data.document.originalName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share Report
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traditional" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Traditional Analysis
            </TabsTrigger>
            <TabsTrigger value="fact-aware" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Fact-Aware Analysis
              {data.hasFactAwareAnalysis && (
                <Badge variant="secondary" className="ml-2">New</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Traditional Analysis Tab */}
          <TabsContent value="traditional" className="space-y-6">
            {/* Risk Score Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Risk Score */}
              <div className="lg:col-span-2">
                <Card className={`${riskInfo.bgColor} ${riskInfo.borderColor} border-2`}>
                  <CardContent className="p-8">
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
                      <Badge className={`px-6 py-3 text-xl ${riskInfo.color} bg-white border-2`}>
                        {riskInfo.level} Risk
                      </Badge>
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
                        <span>{data.analysis.totalIssues} issues identified</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Processing Stats</h3>
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Processing Time</span>
                        <span className="font-medium">
                          {(data.analysis.processingTime ? data.analysis.processingTime / 1000 : 0).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Words Analyzed</span>
                        <span className="font-medium">{data.document.wordCount?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Pages Scanned</span>
                        <span className="font-medium">{data.document.pageCount || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Issue Breakdown</h3>
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">High Risk</span>
                        <Badge className="bg-red-100 text-red-800">{highIssues.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Medium Risk</span>
                        <Badge className="bg-yellow-100 text-yellow-800">{mediumIssues.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Low Risk</span>
                        <Badge className="bg-green-100 text-green-800">{lowIssues.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Issues List */}
            <Card>
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
                <CardDescription>
                  Issues found based on Indian Contract Act 1872 patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {issues.map((issue, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(issue.riskLevel)}>
                            {issue.riskLevel}
                          </Badge>
                          <span className="font-semibold">{issue.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Issue Description</h4>
                            <p className="text-gray-700">{issue.issue}</p>
                          </div>
                          
                          {issue.matchedText && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Matched Text</h4>
                              <p className="text-sm bg-gray-100 p-3 rounded border italic">
                                "{issue.matchedText}"
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Recommendation</h4>
                            <p className="text-gray-700">{issue.suggestion}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Legal Basis</h4>
                            <p className="text-sm text-gray-600">{issue.legalBasis}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fact-Aware Analysis Tab */}
          <TabsContent value="fact-aware" className="space-y-6">
            <FactAwareAnalysis 
              documentId={id}
              onAnalysisComplete={handleFactAwareAnalysisComplete}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}