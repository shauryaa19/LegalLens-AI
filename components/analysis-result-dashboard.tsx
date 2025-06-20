"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { AlertTriangle, CheckCircle, Clock, FileText, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Analysis {
  riskScore: number
  totalIssues: number
  issues: Array<{
    type: string
    severity: "high" | "medium" | "low"
    description: string
    legalBasis: string
    recommendation: string
    locations: string[]
  }>
  processingTime: number
}

interface DocumentMetadata {
  name: string
  size: string
  pages: number
  words: number
  uploadDate: string
}

interface AnalysisResultsDashboardProps {
  analysis: Analysis
  documentMetadata: DocumentMetadata
}

export function AnalysisResultsDashboard({ analysis, documentMetadata }: AnalysisResultsDashboardProps) {
  const getRiskLevel = (score: number) => {
    if (score <= 0.3)
      return { level: "Low", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" }
    if (score <= 0.7)
      return { level: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" }
    return { level: "High", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" }
  }

  const getRiskIcon = (score: number) => {
    if (score <= 0.3) return <TrendingDown className="h-5 w-5 text-green-600" />
    if (score <= 0.7) return <Minus className="h-5 w-5 text-yellow-600" />
    return <TrendingUp className="h-5 w-5 text-red-600" />
  }

  const riskInfo = getRiskLevel(analysis.riskScore)
  const highIssues = analysis.issues.filter((issue) => issue.severity === "high").length
  const mediumIssues = analysis.issues.filter((issue) => issue.severity === "medium").length
  const lowIssues = analysis.issues.filter((issue) => issue.severity === "low").length

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <Card className={cn("border-2", riskInfo.borderColor, riskInfo.bgColor)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getRiskIcon(analysis.riskScore)}
              <div>
                <CardTitle className="text-2xl">Risk Assessment</CardTitle>
                <CardDescription>Overall compliance risk level</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-lg px-4 py-2", riskInfo.color)}>
              {riskInfo.level} Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Score</span>
              <span className={cn("text-2xl font-bold", riskInfo.color)}>{(analysis.riskScore * 100).toFixed(0)}%</span>
            </div>
            <Progress value={analysis.riskScore * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Based on {analysis.totalIssues} identified compliance issues
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Document</p>
              <p className="text-sm font-semibold truncate" title={documentMetadata.name}>
                {documentMetadata.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">File Size</p>
              <p className="text-sm font-semibold">{documentMetadata.size}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Pages</p>
              <p className="text-sm font-semibold">{documentMetadata.pages}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Word Count</p>
              <p className="text-sm font-semibold">{documentMetadata.words.toLocaleString()}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Processed in {analysis.processingTime}s</span>
            </div>
            <div className="text-muted-foreground">
              Uploaded: {new Date(documentMetadata.uploadDate).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">High Risk Issues</p>
                <p className="text-3xl font-bold text-red-700">{highIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-red-600 mt-2">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Medium Risk Issues</p>
                <p className="text-3xl font-bold text-yellow-700">{mediumIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-yellow-600 mt-2">Should be reviewed</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Low Risk Issues</p>
                <p className="text-3xl font-bold text-green-700">{lowIssues}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">Minor recommendations</p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Indian Contract Act 1872 Compliance
          </CardTitle>
          <CardDescription>Analysis based on key provisions of the Indian Contract Act</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Overall Compliance Score</span>
              <Badge
                variant={
                  analysis.riskScore <= 0.3 ? "default" : analysis.riskScore <= 0.7 ? "secondary" : "destructive"
                }
              >
                {((1 - analysis.riskScore) * 100).toFixed(0)}%
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Contract formation and validity requirements</p>
              <p>• Consideration and capacity provisions</p>
              <p>• Performance and breach conditions</p>
              <p>• Termination and penalty clauses</p>
              <p>• Jurisdiction and dispute resolution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
