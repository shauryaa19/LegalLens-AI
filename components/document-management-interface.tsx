"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  FileText,
  Search,
  MoreHorizontal,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  name: string
  size: string
  pages: number
  words: number
  uploadDate: string
  riskScore: number
  status: "processing" | "completed" | "error"
  totalIssues: number
}

interface DocumentManagementInterfaceProps {
  documents: Document[]
}

export function DocumentManagementInterface({ documents }: DocumentManagementInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("uploadDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { level: "Low", color: "text-green-600", bgColor: "bg-green-100" }
    if (score <= 0.7) return { level: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { level: "High", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const getRiskIcon = (score: number) => {
    if (score <= 0.3) return <TrendingDown className="h-4 w-4 text-green-600" />
    if (score <= 0.7) return <Minus className="h-4 w-4 text-yellow-600" />
    return <TrendingUp className="h-4 w-4 text-red-600" />
  }

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const filteredAndSortedDocuments = documents
    .filter((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Document]
      let bValue: any = b[sortBy as keyof Document]

      if (sortBy === "uploadDate") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocuments(newSelected)
  }

  const toggleAllDocuments = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map((doc) => doc.id)))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for documents:`, Array.from(selectedDocuments))
    // Implement bulk actions here
  }

  const stats = {
    total: documents.length,
    completed: documents.filter((d) => d.status === "completed").length,
    processing: documents.filter((d) => d.status === "processing").length,
    highRisk: documents.filter((d) => d.riskScore > 0.7).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
          <CardDescription>Manage and track your legal document analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploadDate">Upload Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="riskScore">Risk Score</SelectItem>
                  <SelectItem value="totalIssues">Issues</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.size > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedDocuments.size} document(s) selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("reanalyze")}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-analyze
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("download")}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Documents Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedDocuments.size === filteredAndSortedDocuments.length &&
                        filteredAndSortedDocuments.length > 0
                      }
                      onCheckedChange={toggleAllDocuments}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDocuments.map((document) => {
                  const riskInfo = getRiskLevel(document.riskScore)

                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.has(document.id)}
                          onCheckedChange={() => toggleDocumentSelection(document.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{document.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{document.size}</span>
                            <span>•</span>
                            <span>{document.pages} pages</span>
                            <span>•</span>
                            <span>{document.words.toLocaleString()} words</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(document.status)}
                          {getStatusBadge(document.status)}
                        </div>
                      </TableCell>

                      <TableCell>
                        {document.status === "completed" ? (
                          <div className="flex items-center gap-2">
                            {getRiskIcon(document.riskScore)}
                            <Badge className={cn("text-xs", riskInfo.bgColor, riskInfo.color)}>
                              {riskInfo.level} ({(document.riskScore * 100).toFixed(0)}%)
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {document.status === "completed" ? (
                          <Badge variant="outline" className="text-xs">
                            {document.totalIssues} issues
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(document.uploadDate).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Re-analyze
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No documents match your search criteria."
                  : "Upload your first legal document to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
