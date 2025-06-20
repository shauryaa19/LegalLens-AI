"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Separator } from "./ui/separator"
import { AlertTriangle, ChevronDown, ChevronUp, Search, Scale, MapPin, BookOpen, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./ui/badge"

interface LegalIssue {
  type: string
  severity: "high" | "medium" | "low"
  description: string
  legalBasis: string
  recommendation: string
  locations: string[]
}

interface LegalIssuesDisplayProps {
  issues: LegalIssue[]
}

export function LegalIssuesDisplay({ issues }: LegalIssuesDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set())

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    const iconClass =
      severity === "high" ? "text-red-600" : severity === "medium" ? "text-yellow-600" : "text-green-600"
    return <AlertTriangle className={cn("h-4 w-4", iconClass)} />
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedIssues(newExpanded)
  }

  const issueStats = {
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Legal Compliance Issues
          </CardTitle>
          <CardDescription>Detailed analysis of contract compliance with Indian Contract Act 1872</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{issueStats.high}</div>
              <div className="text-sm text-red-600">High Risk</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{issueStats.medium}</div>
              <div className="text-sm text-yellow-600">Medium Risk</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{issueStats.low}</div>
              <div className="text-sm text-green-600">Low Risk</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues by type or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || severityFilter !== "all"
                  ? "No issues match your current filters."
                  : "No compliance issues detected in this document."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue, index) => (
            <Card key={index} className="overflow-hidden">
              <Collapsible open={expandedIssues.has(index)} onOpenChange={() => toggleExpanded(index)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{issue.type}</CardTitle>
                            <Badge className={cn("text-xs", getSeverityColor(issue.severity))}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">{issue.description}</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2">
                        {expandedIssues.has(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />

                    <div className="space-y-4">
                      {/* Legal Basis */}
                      <div className="flex gap-3">
                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Legal Basis</h4>
                          <p className="text-sm text-muted-foreground">{issue.legalBasis}</p>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="flex gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Recommendation</h4>
                          <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                        </div>
                      </div>

                      {/* Locations */}
                      <div className="flex gap-3">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Document Locations</h4>
                          <div className="flex flex-wrap gap-2">
                            {issue.locations.map((location, locationIndex) => (
                              <Badge key={locationIndex} variant="outline" className="text-xs">
                                {location}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {filteredIssues.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredIssues.length} of {issues.length} issues
              </span>
              <span className="text-muted-foreground">Analysis based on Indian Contract Act 1872</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
