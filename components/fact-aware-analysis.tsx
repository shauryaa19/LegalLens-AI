'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Lightbulb,
  Loader2,
  FileText,
  Minus,
  RefreshCw
} from 'lucide-react';
import { 
  UserFacts, 
  ClauseAnalysisResult, 
  FactAwareAnalysisResult, 
  DocumentClassification,
  DynamicQuestion 
} from '@/lib/clause-analyzer';

interface FactAwareAnalysisProps {
  documentId?: string;
  onAnalysisComplete?: (result: FactAwareAnalysisResult) => void;
}

export default function FactAwareAnalysis({ documentId, onAnalysisComplete }: FactAwareAnalysisProps) {
  const [facts, setFacts] = useState<UserFacts>({
    name: '',
    role: '',
    situation: '',
    objectives: [],
    concerns: []
  });
  
  const [classification, setClassification] = useState<DocumentClassification | null>(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FactAwareAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [newConcern, setNewConcern] = useState('');

  useEffect(() => {
    if (documentId) {
      classifyDocument();
    }
  }, [documentId]);

  const classifyDocument = async () => {
    if (!documentId) return;
    
    setClassificationLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analyze-clauses?documentId=${documentId}&action=classify`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to classify document');
      }
      
      setClassification(result.classification);
      
      // Reset facts to match the new document type
      setFacts({
        name: '',
        role: '',
        situation: '',
        objectives: [],
        concerns: []
      });
      
    } catch (err) {
      console.error('Classification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to classify document');
    } finally {
      setClassificationLoading(false);
    }
  };

  const handleFactChange = (field: string, value: string | string[]) => {
    setFacts(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'objectives' | 'concerns', value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setFacts(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
      setter('');
    }
  };

  const removeFromArray = (field: 'objectives' | 'concerns', index: number) => {
    setFacts(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const renderDynamicInput = (question: DynamicQuestion) => {
    const value = facts[question.id] || '';
    
    switch (question.type) {
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleFactChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleFactChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder={question.placeholder}
            required={question.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value as string}
            onChange={(e) => handleFactChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={question.placeholder}
            required={question.required}
          />
        );
      default: // text
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleFactChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={question.placeholder}
            required={question.required}
          />
        );
    }
  };

  const analyzeDocument = async () => {
    if (!facts.name.trim()) {
      setError('Please provide your name');
      return;
    }

    if (!facts.role.trim()) {
      setError('Please specify your role in this agreement');
      return;
    }

    if (!facts.situation.trim()) {
      setError('Please describe your current situation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-clauses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          facts,
          classification
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysis(result.analysis);
      onAnalysisComplete?.(result.analysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getFavorabilityColor = (favorability: string) => {
    switch (favorability) {
      case 'favorable': return 'text-green-600 bg-green-50 border-green-200';
      case 'unfavorable': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFavorabilityIcon = (favorability: string) => {
    switch (favorability) {
      case 'favorable': return <CheckCircle className="h-4 w-4" />;
      case 'unfavorable': return <AlertTriangle className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      employment: 'Employment Contract',
      rental: 'Rental/Lease Agreement',
      service: 'Service Agreement',
      partnership: 'Partnership Agreement',
      purchase: 'Purchase/Sale Agreement',
      loan: 'Loan Agreement',
      nda: 'Non-Disclosure Agreement',
      general: 'Legal Document'
    };
    return labels[type] || 'Legal Document';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>AI-Powered Legal Analysis</CardTitle>
              <CardDescription>
                Personalized clause analysis based on your specific situation and document context
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Classification */}
      {classification && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Analysis
                </CardTitle>
                <CardDescription>
                  AI has analyzed your document type to provide relevant questions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={classifyDocument}
                disabled={classificationLoading}
              >
                {classificationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium">{getDocumentTypeLabel(classification.documentType)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Primary Purpose</p>
                <p className="font-medium">{classification.primaryPurpose}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Key Parties</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {classification.keyParties.map((party, index) => (
                    <Badge key={index} variant="secondary">{party}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Facts Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Information & Context
          </CardTitle>
          <CardDescription>
            {classification 
              ? `Provide details relevant to this ${getDocumentTypeLabel(classification.documentType).toLowerCase()}`
              : 'Tell us about your situation to get personalized analysis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Required Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                value={facts.name}
                onChange={(e) => handleFactChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Role *
              </label>
              <input
                type="text"
                value={facts.role}
                onChange={(e) => handleFactChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Employee, Tenant, Buyer, Client"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Situation *
            </label>
            <textarea
              value={facts.situation}
              onChange={(e) => handleFactChange('situation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe your current situation and context"
            />
          </div>

          {/* Dynamic Questions Based on Document Type */}
          {classification && classification.suggestedQuestions.length > 0 && (
            <div className="border-t pt-4 mt-6">
              <h4 className="font-medium text-gray-900 mb-4">
                Document-Specific Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                {classification.suggestedQuestions.map((question) => (
                  <div key={question.id} className={question.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {question.label} {question.required && '*'}
                    </label>
                    {renderDynamicInput(question)}
                    {question.helpText && (
                      <p className="text-xs text-gray-500 mt-1">{question.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Objectives/Goals
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Get fair compensation, Exit without penalties"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('objectives', newObjective, setNewObjective)}
                />
                <Button 
                  onClick={() => addToArray('objectives', newObjective, setNewObjective)} 
                  variant="outline" 
                  size="sm"
                >
                  Add
                </Button>
              </div>
              {facts.objectives && facts.objectives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facts.objectives.map((objective, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeFromArray('objectives', index)}
                    >
                      {objective} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Concerns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Concerns or Issues
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConcern}
                  onChange={(e) => setNewConcern(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., High penalty clauses, Unfair terms"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('concerns', newConcern, setNewConcern)}
                />
                <Button 
                  onClick={() => addToArray('concerns', newConcern, setNewConcern)} 
                  variant="outline" 
                  size="sm"
                >
                  Add
                </Button>
              </div>
              {facts.concerns && facts.concerns.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facts.concerns.map((concern, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeFromArray('concerns', index)}
                    >
                      {concern} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={analyzeDocument} 
            disabled={loading || !facts.name.trim() || !facts.role.trim() || !facts.situation.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Contract...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Contract Clauses
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Risk</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(analysis.overallRiskScore * 100)}%
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Favorable</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysis.summary.favorableClauses}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unfavorable</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analysis.summary.unfavorableClauses}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Neutral</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {analysis.summary.neutralClauses}
                    </p>
                  </div>
                  <Minus className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Findings */}
          {analysis.keyFindings && analysis.keyFindings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Key Findings
                </CardTitle>
                <CardDescription>
                  Most important insights from the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{finding}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Clause Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle>Clause-by-Clause Analysis</CardTitle>
              <CardDescription>
                Each clause analyzed based on your specific situation and objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.analyses.map((clauseAnalysis, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getFavorabilityColor(clauseAnalysis.favorability)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getFavorabilityIcon(clauseAnalysis.favorability)}
                        <h4 className="font-semibold">{clauseAnalysis.heading}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(clauseAnalysis.riskLevel)}>
                          {clauseAnalysis.riskLevel} risk
                        </Badge>
                        <Badge variant="outline">
                          {clauseAnalysis.tag.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-2">
                      <strong>Analysis:</strong> {clauseAnalysis.reason}
                    </p>
                    
                    <p className="text-sm mb-2">
                      <strong>Impact on Your Goals:</strong> {clauseAnalysis.impact}
                    </p>
                    
                    {clauseAnalysis.applicableSection && (
                      <p className="text-xs text-gray-600">
                        <strong>Legal Basis:</strong> {clauseAnalysis.applicableSection}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested actions based on your analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 