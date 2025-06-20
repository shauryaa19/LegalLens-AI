'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// PDF.js types
declare global {
  interface Window {
    pdfjsLib?: any;
  }
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

interface ExtractedText {
  content: string;
  pageCount: number;
  wordCount: number;
}

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const router = useRouter();

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
        setError('Failed to load PDF processing library');
      }
    };

    loadPdfJs();
  }, []);

  const extractTextFromPDF = async (file: File): Promise<ExtractedText> => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js not loaded');
    }

    setExtracting(true);
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
    } finally {
      setExtracting(false);
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(file.type)) {
      setError('Please upload only PDF or DOCX files');
      return false;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      let extractedText: ExtractedText;

      // Extract text based on file type
      if (file.type === 'application/pdf') {
        if (!pdfJsLoaded) {
          throw new Error('PDF processing library not ready. Please try again.');
        }
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromWord(file);
      }

      // Send extracted text to server for analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          ...extractedText
        })
      });

      const result: UploadResult = await response.json();
      
      if (response.ok && result.success) {
        router.push(`/results/${result.documentId}`);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const isProcessing = uploading || extracting;
  const processingText = extracting ? 'Extracting text...' : 'Analyzing document...';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Legal Document
        </h2>
        <p className="text-gray-600 mb-6">
          Upload your contract or legal document for Indian law compliance analysis
        </p>

        {/* PDF.js Loading Status */}
        {!pdfJsLoaded && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">Loading PDF processing library...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : file 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            
            <div className="space-y-4">
              {file ? (
                <div className="text-green-600">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium">Drop your document here</p>
                  <p className="text-sm">or click to browse</p>
                  <p className="text-xs mt-2">PDF or DOCX files, max 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || isProcessing || !pdfJsLoaded}
            className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium transition-colors ${
              !file || isProcessing || !pdfJsLoaded
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processingText}
              </div>
            ) : (
              'Analyze Document'
            )}
          </button>
        </form>

        {/* Features List */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">What we check for:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Unlimited liability clauses</li>
            <li>• Unenforceable penalty clauses</li>
            <li>• Foreign jurisdiction issues</li>
            <li>• Missing dispute resolution</li>
            <li>• Unfair termination terms</li>
            <li>• Intellectual property concerns</li>
            <li>• Payment and delivery terms</li>
            <li>• Compliance with Indian laws</li>
          </ul>
        </div>
      </div>
    </div>
  );
}