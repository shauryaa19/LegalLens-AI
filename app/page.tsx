"use client"

import Link from "next/link"
import { FileUploadComponent } from "@/components/file-upload-component"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scale, FileText, History, Shield, CheckCircle, AlertTriangle, Clock } from "lucide-react"

export default function HomePage() {
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
                href="/documents" 
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <History className="h-4 w-4" />
                My Documents
              </Link>
              <Button asChild variant="outline">
                <Link href="/documents">
                  <FileText className="h-4 w-4 mr-2" />
                  View History
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Scale className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Legal Document Analyzer
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Indian Contract Act 1872 Compliance Analysis
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Upload your legal documents to get instant compliance analysis, risk assessment, 
            and actionable recommendations based on Indian Contract Act provisions.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 border shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Analysis</h3>
            <p className="text-gray-600 text-sm">
              Get comprehensive legal compliance analysis in seconds using advanced pattern detection
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Assessment</h3>
            <p className="text-gray-600 text-sm">
              Identify high, medium, and low risk issues with detailed explanations and legal basis
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Compliance</h3>
            <p className="text-gray-600 text-sm">
              Ensure your contracts comply with Indian Contract Act 1872 provisions and requirements
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-dashed border-gray-200 bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">Upload Your Document</CardTitle>
              <CardDescription className="text-lg">
                Support for PDF and DOCX files up to 5MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadComponent />
            </CardContent>
          </Card>
        </div>

        {/* Process Steps */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Document</h3>
              <p className="text-gray-600">
                Upload your PDF or DOCX contract document securely
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your document for legal compliance issues
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600">
                Receive detailed analysis with actionable recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Analysis</h2>
              <Link 
                href="/documents" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No documents analyzed yet.</p>
              <p className="text-sm">Upload your first document to get started!</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This tool provides informational analysis only and does not constitute legal advice.
            </p>
            <p className="text-sm">
              Always consult with a qualified legal professional for important legal decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}