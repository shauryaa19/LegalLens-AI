// Indian Legal Document Analysis Patterns
// Based on Indian Contract Act 1872 and common legal issues

export interface LegalPattern {
    id: string;
    name: string;
    pattern: RegExp;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    issue: string;
    suggestion: string;
    legalBasis: string;
    category: string;
  }
  
  export interface DetectedIssue extends LegalPattern {
    matches: number;
    matchedText: string;
  }
  
  export interface AnalysisResult {
    riskScore: number;
    issues: DetectedIssue[];
    totalIssues: number;
  }
  
  // Core Indian Legal Patterns - Starting with 5 critical ones
  export const indianLegalPatterns: LegalPattern[] = [
    {
      id: 'unlimited_liability',
      name: 'Unlimited Liability Clause',
      pattern: /unlimited.*liability|liability.*unlimited|shall be liable for all|without limitation of liability/gi,
      riskLevel: 'HIGH',
      issue: 'Unlimited liability clauses can expose parties to excessive financial risk',
      suggestion: 'Limit liability to contract value or specify maximum liability amount',
      legalBasis: 'Section 73, Indian Contract Act 1872 - Compensation for loss or damage',
      category: 'Liability'
    },
    {
      id: 'penalty_clause',
      name: 'Penalty Clause (Unenforceable)',
      pattern: /penalty|punitive damages|penalty of|shall pay.*penalty|penalty clause/gi,
      riskLevel: 'HIGH',
      issue: 'Penalty clauses are unenforceable under Indian law - only liquidated damages allowed',
      suggestion: 'Replace "penalty" with "liquidated damages" and ensure amount is reasonable estimate of actual loss',
      legalBasis: 'Section 74, Indian Contract Act 1872 - Compensation for breach of contract',
      category: 'Damages'
    },
    {
      id: 'foreign_jurisdiction',
      name: 'Foreign Governing Law',
      pattern: /governed by.*law.*(?:singapore|uk|us|new york|english|american|foreign)/gi,
      riskLevel: 'MEDIUM',
      issue: 'Foreign governing law may not be enforceable in Indian courts',
      suggestion: 'Add Indian law as governing law or include dual jurisdiction clause',
      legalBasis: 'Indian courts prefer Indian law for contracts with Indian parties',
      category: 'Jurisdiction'
    },
    {
      id: 'missing_arbitration',
      name: 'No Dispute Resolution Mechanism',
      pattern: /^(?!.*arbitration)(?!.*mediation)(?!.*dispute resolution)(?!.*courts?).*$/,
      riskLevel: 'MEDIUM',
      issue: 'No clear dispute resolution mechanism specified',
      suggestion: 'Add arbitration clause with seat in India under Arbitration Act 2015',
      legalBasis: 'Arbitration and Conciliation Act, 2015',
      category: 'Dispute Resolution'
    },
    {
      id: 'unfair_termination',
      name: 'Unfair Termination Rights',
      pattern: /terminate.*without.*notice|immediate termination|terminate.*at.*will|terminate.*without.*cause.*notice/gi,
      riskLevel: 'MEDIUM',
      issue: 'Immediate termination without notice may be deemed unfair',
      suggestion: 'Provide reasonable notice period (30-90 days) or payment in lieu of notice',
      legalBasis: 'Indian Contract Act principles of reasonableness and fairness',
      category: 'Termination'
    }
  ];
  
  // Main analysis function
  export function analyzeDocument(text: string): AnalysisResult {
    const detectedIssues: DetectedIssue[] = [];
    let riskScore = 0;
  
    // Clean text for better pattern matching
    const cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  
    for (const pattern of indianLegalPatterns) {
      const matches = cleanText.match(pattern.pattern);
      
      if (matches && matches.length > 0) {
        detectedIssues.push({
          ...pattern,
          matches: matches.length,
          matchedText: matches[0].substring(0, 100) + (matches[0].length > 100 ? '...' : '')
        });
        
        // Calculate risk score based on severity
        const riskWeight = pattern.riskLevel === 'HIGH' ? 0.25 : 
                          pattern.riskLevel === 'MEDIUM' ? 0.15 : 0.1;
        riskScore += riskWeight;
      }
    }
  
    // Special check for missing arbitration - this requires inverse logic
    const hasDisputeResolution = /arbitration|mediation|dispute resolution|jurisdiction.*court/gi.test(cleanText);
    if (!hasDisputeResolution) {
      const missingArbitration = indianLegalPatterns.find(p => p.id === 'missing_arbitration');
      if (missingArbitration) {
        detectedIssues.push({
          ...missingArbitration,
          matches: 1,
          matchedText: 'No dispute resolution mechanism found in document'
        });
        riskScore += 0.15;
      }
    }
  
    return {
      riskScore: Math.min(riskScore, 1), // Cap at 1.0
      issues: detectedIssues,
      totalIssues: detectedIssues.length
    };
  }