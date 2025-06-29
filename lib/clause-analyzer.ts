import { GoogleGenerativeAI } from '@google/generative-ai';

// Enhanced types for generic legal document analysis
export interface UserFacts {
  name: string;
  role: string; // e.g., "Employee", "Tenant", "Service Provider", "Client"
  situation: string; // Current situation or context
  objectives: string[]; // What the user wants to achieve
  concerns: string[]; // Specific concerns or issues
  timeline?: string; // Relevant timeframes
  financialContext?: string; // Financial constraints or expectations
  [key: string]: any; // Allow additional dynamic facts
}

export interface DocumentClassification {
  documentType: 'employment' | 'rental' | 'service' | 'partnership' | 'purchase' | 'loan' | 'nda' | 'general';
  subType?: string;
  keyParties: string[];
  primaryPurpose: string;
  suggestedQuestions: DynamicQuestion[];
}

export interface DynamicQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ParsedClause {
  tag: string;
  heading: string;
  text: string;
  section?: string;
}

export interface ClauseAnalysisResult {
  heading: string;
  tag: string;
  favorability: 'favorable' | 'unfavorable' | 'neutral';
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  applicableSection?: string;
  impact: string; // How this affects the user's objectives
}

export interface FactAwareAnalysisResult {
  documentClassification: DocumentClassification;
  analyses: ClauseAnalysisResult[];
  overallRiskScore: number;
  summary: {
    favorableClauses: number;
    unfavorableClauses: number;
    neutralClauses: number;
  };
  recommendations: string[];
  keyFindings: string[];
}

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Document classification templates
const DOCUMENT_TEMPLATES: Record<string, DynamicQuestion[]> = {
  employment: [
    {
      id: 'currentPosition',
      label: 'Your Position/Role',
      type: 'text',
      required: true,
      placeholder: 'e.g., Software Engineer, Manager'
    },
    {
      id: 'employmentStatus',
      label: 'Employment Status',
      type: 'select',
      options: ['Joining new company', 'Currently employed', 'Planning to leave', 'Contract renewal', 'Promotion/transfer'],
      required: true
    },
    {
      id: 'workExperience',
      label: 'Relevant Work Experience',
      type: 'text',
      required: false,
      placeholder: 'e.g., 3 years in software development'
    },
    {
      id: 'salaryExpectation',
      label: 'Salary/Compensation Context',
      type: 'text',
      required: false,
      placeholder: 'e.g., Current salary ₹8L, expecting ₹12L'
    }
  ],
  rental: [
    {
      id: 'tenantType',
      label: 'You are the',
      type: 'select',
      options: ['Tenant (Renting)', 'Landlord (Letting out)', 'Agent/Representative'],
      required: true
    },
    {
      id: 'propertyType',
      label: 'Property Type',
      type: 'select',
      options: ['Residential Apartment', 'House', 'Commercial Space', 'Office', 'Warehouse', 'Land'],
      required: false
    },
    {
      id: 'rentBudget',
      label: 'Rent Budget/Expectation',
      type: 'text',
      required: false,
      placeholder: 'e.g., ₹25,000 per month maximum'
    },
    {
      id: 'tenancyDuration',
      label: 'Preferred Tenancy Duration',
      type: 'text',
      required: false,
      placeholder: 'e.g., 11 months, 2 years'
    }
  ],
  service: [
    {
      id: 'serviceRole',
      label: 'You are the',
      type: 'select',
      options: ['Service Provider', 'Client/Customer', 'Contractor'],
      required: true
    },
    {
      id: 'serviceType',
      label: 'Type of Service',
      type: 'text',
      required: false,
      placeholder: 'e.g., Software Development, Consulting, Design'
    },
    {
      id: 'projectDuration',
      label: 'Project Duration',
      type: 'text',
      required: false,
      placeholder: 'e.g., 3 months, 1 year'
    },
    {
      id: 'budgetRange',
      label: 'Budget/Payment Context',
      type: 'text',
      required: false,
      placeholder: 'e.g., ₹5L total budget, ₹50k per month'
    }
  ],
  purchase: [
    {
      id: 'buyerSeller',
      label: 'You are the',
      type: 'select',
      options: ['Buyer', 'Seller', 'Agent/Broker'],
      required: true
    },
    {
      id: 'itemType',
      label: 'What is being purchased/sold?',
      type: 'text',
      required: false,
      placeholder: 'e.g., Car, Property, Equipment, Goods'
    },
    {
      id: 'purchaseValue',
      label: 'Purchase Value/Price Range',
      type: 'text',
      required: false,
      placeholder: 'e.g., ₹10L, ₹5L-8L range'
    },
    {
      id: 'paymentMethod',
      label: 'Preferred Payment Method',
      type: 'text',
      required: false,
      placeholder: 'e.g., Cash, EMI, Bank transfer'
    }
  ],
  loan: [
    {
      id: 'loanRole',
      label: 'You are the',
      type: 'select',
      options: ['Borrower', 'Lender', 'Guarantor'],
      required: true
    },
    {
      id: 'loanType',
      label: 'Type of Loan',
      type: 'select',
      options: ['Personal Loan', 'Home Loan', 'Business Loan', 'Vehicle Loan', 'Education Loan', 'Other'],
      required: false
    },
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'text',
      required: false,
      placeholder: 'e.g., ₹10L, ₹50L'
    },
    {
      id: 'repaymentCapacity',
      label: 'Repayment Capacity/Income',
      type: 'text',
      required: false,
      placeholder: 'e.g., Monthly income ₹80k, can pay ₹25k EMI'
    }
  ]
};

// Function to classify document and suggest questions using Gemini
export async function classifyDocumentAndGenerateQuestions(text: string): Promise<DocumentClassification> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a legal document classifier. Analyze the document and classify it into one of these categories:
- employment: Job offers, employment contracts, bonds, NDAs, termination letters
- rental: Lease agreements, rent agreements, property documents
- service: Service agreements, consulting contracts, freelance contracts
- partnership: Business partnerships, joint ventures, collaborations
- purchase: Sale agreements, purchase orders, buying/selling contracts
- loan: Loan agreements, credit agreements, borrowing documents
- nda: Non-disclosure agreements, confidentiality agreements
- general: Other legal documents

Also identify the key parties involved and the primary purpose.

Document to classify:
${text.substring(0, 2000)}

Please respond with a JSON object in this exact format:
{
  "documentType": "one of the categories above",
  "subType": "optional specific sub-category",
  "keyParties": ["Party 1", "Party 2"],
  "primaryPurpose": "brief description of the document's main purpose"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }
    
    const classification = JSON.parse(jsonMatch[0]);
    
    // Get suggested questions based on document type
    const suggestedQuestions = DOCUMENT_TEMPLATES[classification.documentType] || DOCUMENT_TEMPLATES.employment;
    
    return {
      ...classification,
      suggestedQuestions
    };

  } catch (error) {
    console.error('Error classifying document:', error);
    // Fallback to general type with basic questions
    return {
      documentType: 'general',
      keyParties: ['Party A', 'Party B'],
      primaryPurpose: 'Legal agreement',
      suggestedQuestions: [
        {
          id: 'role',
          label: 'Your Role in this Agreement',
          type: 'text',
          required: true,
          placeholder: 'e.g., Buyer, Seller, Employee, Client'
        },
        {
          id: 'situation',
          label: 'Current Situation',
          type: 'textarea',
          required: true,
          placeholder: 'Describe your current situation and context'
        }
      ]
    };
  }
}

// Enhanced core function for AI-powered clause analysis using Gemini
export async function analyzeClausesWithFacts(
  facts: UserFacts,
  clauses: ParsedClause[],
  documentClassification?: DocumentClassification
): Promise<FactAwareAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  if (!clauses || clauses.length === 0) {
    throw new Error('No clauses provided for analysis');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = createGeminiPrompt(facts, clauses, documentClassification);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    
    // Calculate summary statistics
    const summary = {
      favorableClauses: analysisResult.analyses.filter((a: ClauseAnalysisResult) => a.favorability === 'favorable').length,
      unfavorableClauses: analysisResult.analyses.filter((a: ClauseAnalysisResult) => a.favorability === 'unfavorable').length,
      neutralClauses: analysisResult.analyses.filter((a: ClauseAnalysisResult) => a.favorability === 'neutral').length,
    };

    return {
      documentClassification: documentClassification || {
        documentType: 'general',
        keyParties: ['Party A', 'Party B'],
        primaryPurpose: 'Legal agreement',
        suggestedQuestions: []
      },
      analyses: analysisResult.analyses,
      overallRiskScore: analysisResult.overallRiskScore,
      summary,
      recommendations: analysisResult.recommendations,
      keyFindings: analysisResult.keyFindings
    };

  } catch (error) {
    console.error('Error in clause analysis:', error);
    throw new Error(`Clause analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function createGeminiPrompt(facts: UserFacts, clauses: ParsedClause[], classification?: DocumentClassification): string {
  const docType = classification?.documentType || 'legal document';
  
  const factsSection = `
USER FACTS:
- Name: ${facts.name}
- Role: ${facts.role}
- Current Situation: ${facts.situation}
- Objectives: ${Array.isArray(facts.objectives) ? facts.objectives.join(', ') : facts.objectives}
- Concerns: ${Array.isArray(facts.concerns) ? facts.concerns.join(', ') : facts.concerns}
${facts.timeline ? `- Timeline: ${facts.timeline}` : ''}
${facts.financialContext ? `- Financial Context: ${facts.financialContext}` : ''}
${Object.entries(facts)
  .filter(([key, value]) => 
    !['name', 'role', 'situation', 'objectives', 'concerns', 'timeline', 'financialContext'].includes(key) 
    && value !== undefined && value !== ''
  )
  .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  .join('\n')}
`;

  const documentContext = classification ? `
DOCUMENT CONTEXT:
- Document Type: ${classification.documentType}
- Primary Purpose: ${classification.primaryPurpose}
- Key Parties: ${classification.keyParties.join(', ')}
${classification.subType ? `- Sub-type: ${classification.subType}` : ''}
` : '';

  const clausesSection = `
CONTRACT CLAUSES TO ANALYZE:
${clauses.map((clause, index) => `
${index + 1}. ${clause.heading} (${clause.tag})
Text: "${clause.text}"
`).join('\n')}
`;

  return `You are a junior legal analyst specializing in Indian contract law and the Indian Contract Act 1872. Your role is to analyze ${docType} clauses ONLY based on the provided user facts and clause text.

CRITICAL INSTRUCTIONS:
1. Only interpret the document in light of the provided facts
2. Do not speculate beyond the given information
3. Stay within Indian Contract Act 1872 principles
4. Base all reasoning on the relationship between user facts and clause content
5. Avoid any judgment, speculation, or hallucination
6. Keep reasoning tightly scoped to inputs

FAVORABILITY GUIDELINES:
- "favorable": Clause supports the user's stated objectives/goals
- "unfavorable": Clause conflicts with or harms the user's stated objectives
- "neutral": Clause neither helps nor harms the user based on stated facts

RISK LEVEL GUIDELINES:
- "high": Clause poses significant legal/financial risk to user
- "medium": Clause has moderate implications for user
- "low": Clause has minimal impact on user

IMPACT ANALYSIS:
- Explain specifically how each clause affects the user's stated objectives
- Consider the user's role, situation, and goals
- Reference relevant Indian Contract Act sections when applicable

${factsSection}
${documentContext}
${clausesSection}

Based ONLY on the user facts provided above, analyze each contract clause for:
1. How it affects this specific user's situation and objectives
2. Whether it's favorable, unfavorable, or neutral to their stated goals
3. The risk level it poses to them
4. The specific impact on their objectives
5. Relevant legal considerations under Indian Contract Act 1872

Do not make assumptions beyond the provided facts. Focus on the direct relationship between the user's stated situation, role, objectives, and each clause's implications.

Please respond with a JSON object in this exact format:
{
  "analyses": [
    {
      "heading": "clause heading",
      "tag": "clause tag",
      "favorability": "favorable|unfavorable|neutral",
      "reason": "specific reasoning tied to user's situation",
      "riskLevel": "low|medium|high",
      "impact": "how this affects user's objectives",
      "applicableSection": "relevant Indian Contract Act section if applicable"
    }
  ],
  "overallRiskScore": 0.5,
  "recommendations": ["recommendation 1", "recommendation 2"],
  "keyFindings": ["finding 1", "finding 2"]
}`;
}

// Enhanced utility function to extract clauses from document text
export function extractClausesFromText(text: string): ParsedClause[] {
  const clauses: ParsedClause[] = [];
  
  // Enhanced clause patterns for various document types
  const clausePatterns = [
    // Employment
    { tag: 'bond_clause', keywords: ['bond', 'service period', 'minimum period', 'training bond', 'lock-in'] },
    { tag: 'termination_clause', keywords: ['termination', 'resignation', 'notice period', 'employment end'] },
    { tag: 'compensation_clause', keywords: ['salary', 'compensation', 'remuneration', 'payment', 'wages'] },
    { tag: 'confidentiality_clause', keywords: ['confidential', 'non-disclosure', 'proprietary', 'secret'] },
    { tag: 'non_compete_clause', keywords: ['non-compete', 'competition', 'competing business', 'restraint of trade'] },
    
    // Rental
    { tag: 'rent_clause', keywords: ['rent', 'rental', 'monthly payment', 'lease payment'] },
    { tag: 'security_deposit_clause', keywords: ['security deposit', 'advance', 'refundable deposit'] },
    { tag: 'maintenance_clause', keywords: ['maintenance', 'repairs', 'upkeep', 'utilities'] },
    { tag: 'eviction_clause', keywords: ['eviction', 'termination of tenancy', 'vacation'] },
    
    // Service/Purchase
    { tag: 'payment_clause', keywords: ['payment', 'fees', 'cost', 'price', 'invoice'] },
    { tag: 'delivery_clause', keywords: ['delivery', 'completion', 'timeline', 'deadline'] },
    { tag: 'warranty_clause', keywords: ['warranty', 'guarantee', 'defects', 'quality'] },
    { tag: 'liability_clause', keywords: ['liability', 'responsibility', 'damages', 'indemnity'] },
    
    // Loan
    { tag: 'interest_clause', keywords: ['interest', 'rate', 'APR', 'finance charge'] },
    { tag: 'repayment_clause', keywords: ['repayment', 'EMI', 'installment', 'due date'] },
    { tag: 'default_clause', keywords: ['default', 'breach', 'non-payment', 'penalty'] },
    { tag: 'collateral_clause', keywords: ['collateral', 'security', 'pledge', 'mortgage'] },
    
    // General
    { tag: 'penalty_clause', keywords: ['penalty', 'liquidated damages', 'breach penalty', 'fine'] },
    { tag: 'dispute_clause', keywords: ['dispute', 'arbitration', 'jurisdiction', 'court'] },
    { tag: 'force_majeure_clause', keywords: ['force majeure', 'act of god', 'unforeseen circumstances'] },
    { tag: 'amendment_clause', keywords: ['amendment', 'modification', 'change', 'variation'] }
  ];

  // Split text into sections based on common heading patterns
  const sections = text.split(/(?=\d+\.|\b(?:ARTICLE|SECTION|CLAUSE|PARA|PARAGRAPH)\s+\d+|\b[A-Z][A-Z\s]{10,}:)/gi);
  
  for (const section of sections) {
    if (section.trim().length < 50) continue; // Skip very short sections
    
    // Extract heading (first line or numbered item)
    const lines = section.trim().split('\n');
    const heading = lines[0]?.trim() || 'Untitled Clause';
    
    // Determine clause type based on content
    let tag = 'general_clause';
    for (const pattern of clausePatterns) {
      if (pattern.keywords.some(keyword => 
        section.toLowerCase().includes(keyword.toLowerCase())
      )) {
        tag = pattern.tag;
        break;
      }
    }
    
    clauses.push({
      tag,
      heading: heading.replace(/^\d+\.?\s*/, ''), // Remove leading numbers
      text: section.trim()
    });
  }
  
  return clauses.length > 0 ? clauses : [{
    tag: 'full_document',
    heading: 'Complete Document',
    text: text.substring(0, 2000) + (text.length > 2000 ? '...' : '')
  }];
} 