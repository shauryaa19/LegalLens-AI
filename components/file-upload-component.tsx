"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription } from "./ui/alert"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, File } from "lucide-react"
import { cn } from "../lib/utils"

// PDF.js types
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface UploadedFile {
  file: File
  id: string
  status: "uploading" | "extracting" | "analyzing" | "completed" | "error"
  progress: number
  error?: string
  documentId?: string
}

interface ExtractedText {
  content: string;
  pageCount: number;
  wordCount: number;
}

interface UploadResult {
  success: boolean;
  documentId: string;
  riskScore: number;
  totalIssues: number;
  wordCount: number;
  pageCount?: number;
  processingTime: number;
  error?: string;
}

export function FileUploadComponent() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
  const router = useRouter()

  // Load PDF.js when component mounts
  useEffect(() => {
    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        setPdfJsLoaded(true);
        return;
      }

      try {
        // Load PDF.js from CDN
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
          import pdfjsDist from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm';
          window.pdfjsLib = pdfjsDist;
          // Configure worker
          pdfjsDist.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          window.dispatchEvent(new Event('pdfjsLoaded'));
        `;
        document.head.appendChild(script);

        // Wait for PDF.js to load
        await new Promise((resolve) => {
          window.addEventListener('pdfjsLoaded', resolve, { once: true });
        });

        setPdfJsLoaded(true);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };

    loadPdfJs();
  }, []);

  const extractTextFromPDF = async (file: File): Promise<ExtractedText> => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js not loaded');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;

      // Extract text from each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + ' ';
      }

      const cleanText = fullText.trim();
      const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;

      return {
        content: cleanText,
        pageCount: totalPages,
        wordCount
      };
    } catch (error) {
      throw new Error('Failed to extract text from PDF');
    }
  };

  const extractTextFromWord = async (file: File): Promise<ExtractedText> => {
    // For Word documents, we'll send to server for mammoth processing
    const formData = new FormData();
    formData.append('file', file);
    formData.append('textOnly', 'true');

    const response = await fetch('/api/extract-text', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to extract text from Word document');
    }

    return await response.json();
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to extracting
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { ...f, status: "extracting", progress: 25 } : f)
      );

      let extractedText: ExtractedText;

      // Extract text based on file type
      if (uploadedFile.file.type === 'application/pdf') {
        if (!pdfJsLoaded) {
          throw new Error('PDF processing library not ready. Please try again.');
        }
        extractedText = await extractTextFromPDF(uploadedFile.file);
      } else {
        extractedText = await extractTextFromWord(uploadedFile.file);
      }

      // Update status to analyzing
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { ...f, status: "analyzing", progress: 75 } : f)
      );

      // Send extracted text to server for analysis
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadedFile.file.name,
          mimeType: uploadedFile.file.type,
          content: extractedText.content,
          fileSize: uploadedFile.file.size,
          pageCount: extractedText.pageCount,
          wordCount: extractedText.wordCount,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Analysis failed');
      }

      const result: UploadResult = await analysisResponse.json();

      if (result.success) {
        // Update status to completed
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFile.id ? { 
            ...f, 
            status: "completed", 
            progress: 100,
            documentId: result.documentId 
          } : f)
        );

        // Redirect to results page after a short delay
        setTimeout(() => {
          router.push(`/results/${result.documentId}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('File processing error:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.id === uploadedFile.id ? { 
          ...f, 
          status: "error", 
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f)
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.log("Rejected files:", rejectedFiles)
    }

    // Process accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "uploading",
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Process each file
    newFiles.forEach((uploadedFile) => {
      processFile(uploadedFile);
    });
  }, [pdfJsLoaded, router])

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
  } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
      case "extracting":
      case "analyzing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "extracting":
        return "Extracting text..."
      case "analyzing":
        return "Analyzing compliance..."
      case "completed":
        return "Analysis complete"
      case "error":
        return "Error occurred"
      default:
        return "Pending"
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors duration-200",
          dropzoneActive || isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <CardContent className="p-8">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div
                className={cn(
                  "p-4 rounded-full transition-colors",
                  dropzoneActive || isDragActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Upload className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {dropzoneActive || isDragActive ? "Drop files here" : "Upload Legal Documents"}
                </h3>
                <p className="text-sm text-muted-foreground">Drag and drop PDF or DOCX files, or click to browse</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="text-xs">
                  PDF, DOCX
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Max 5MB per file
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Multiple files supported
                </Badge>
              </div>

              <Button variant="outline" className="mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Processing List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Processing Files</h3>

          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(uploadedFile.status)}
                  <div>
                    <p className="font-medium text-sm">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={uploadedFile.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {getStatusText(uploadedFile.status)}
                  </Badge>

                  <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.id)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {uploadedFile.status !== "completed" && uploadedFile.status !== "error" && (
                <div className="space-y-2">
                  <Progress value={uploadedFile.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{uploadedFile.progress}% complete</p>
                </div>
              )}

              {uploadedFile.error && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadedFile.error}</AlertDescription>
                </Alert>
              )}

              {uploadedFile.status === "completed" && uploadedFile.documentId && (
                <Alert className="mt-3">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Analysis complete! Redirecting to results...
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Documents are analyzed for compliance with the Indian Contract Act 1872. Processing time varies based on
          document length and complexity.
        </AlertDescription>
      </Alert>
    </div>
  )
}

