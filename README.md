# LegalLens AI - AI-Powered Legal Document Analyzer

A Next.js application that analyzes legal documents for compliance with the Indian Contract Act 1872, providing intelligent clause interpretation, risk scoring, and personalized recommendations based on user context.

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **Intelligent Document Classification**: AI-powered automatic detection of document types (employment, rental, service agreements, etc.)
- **Dynamic Fact Collection**: Context-aware form generation based on document type
- **AI-Powered Clause Analysis**: Google Gemini-powered interpretation based on user's specific situation and facts
- **Personalized Risk Assessment**: Comprehensive scoring system with favorability analysis per clause
- **Document Management**: Modern dashboard to view and manage all uploaded documents
- **Detailed Reports**: Issue categorization by severity with legal recommendations and actionable insights
- **Fact-Aware Analysis**: Clause-by-clause favorability assessment tailored to user's role, objectives, and concerns

## Tech Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **UI Components**: ShadCN/UI (built on Radix UI primitives)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini 1.5 Flash
- **File Processing**: PDF parsing, DOCX extraction, multi-format support
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud provider like Neon)
- Google Gemini API key
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-legal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_legal"
   GEMINI_API_KEY="your-gemini-api-key-here"
   NODE_ENV="development"
   ```

4. **Get Google Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

5. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push the schema to your database
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

### Option 1: Neon DB (Recommended for Production)

1. **Create a Neon account** at [neon.tech](https://neon.tech)
2. **Create a new project** and database
3. **Copy the connection string** from your Neon dashboard
4. **Add to your environment variables**:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL** on your machine
2. **Create a database**:
   ```sql
   CREATE DATABASE ai_legal;
   ```
3. **Set up the connection string**:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_legal"
   ```

## Deployment to Vercel

### Step 1: Prepare Your Database

1. **Set up Neon DB** (or another PostgreSQL provider)
2. **Get your connection string** from the provider's dashboard

### Step 2: Deploy to Vercel

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NODE_ENV`: `production`

3. **Deploy**: Vercel will automatically build and deploy your app

### Step 3: Verify Deployment

1. **Check build logs** for any errors
2. **Test the application** by uploading a document
3. **Monitor** the Vercel dashboard for any runtime errors

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI-powered analysis | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## AI Features

### Document Classification
LegalLens AI automatically identifies document types including:
- Employment contracts
- Rental/lease agreements
- Service agreements
- Partnership agreements
- Purchase/sale agreements
- Loan agreements
- Non-disclosure agreements (NDAs)
- General legal documents

### Dynamic Fact Collection
Based on document classification, the system presents relevant questions to gather user context:
- **Role**: Your position in the agreement (employee, tenant, service provider, etc.)
- **Situation**: Current circumstances affecting the agreement
- **Objectives**: What you want to achieve
- **Concerns**: Specific issues or risks you're worried about

### Intelligent Analysis
- **Clause-by-clause breakdown** with favorability assessment
- **Risk scoring** (Low/Medium/High) for each clause
- **Personalized recommendations** based on your specific facts
- **Compliance checking** against Indian Contract Act 1872

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure your database provider allows connections from Vercel
   - Check that your database is accessible and running

2. **Gemini API Issues**
   - Verify your `GEMINI_API_KEY` is valid and active
   - Check API quota and billing status in Google AI Studio
   - Ensure you have enabled the Gemini API

3. **Prisma Client Issues**
   - Clear your local `.next` folder: `Remove-Item .next -Recurse -Force` (Windows) or `rm -rf .next` (Mac/Linux)
   - Regenerate Prisma client: `npx prisma generate`

4. **Build Failures**
   - Check Vercel build logs for specific error messages
   - Ensure all environment variables are properly set
   - Verify your database schema is compatible

### Local Development Issues

1. **Database Connection Failed**
   - Check if PostgreSQL is running
   - Verify your `DATABASE_URL` is correct
   - Ensure the database exists

2. **Module Resolution Errors**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again
   - Clear Next.js cache: `Remove-Item .next -Recurse -Force`

3. **Gemini API Errors**
   - Check your API key is correctly set in `.env`
   - Verify network connectivity
   - Check API rate limits

## Project Structure

```
ai-legal/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── analyze/       # Traditional legal analysis
│   │   ├── analyze-clauses/ # AI-powered clause analysis
│   │   ├── documents/     # Document management
│   │   ├── extract-text/  # Text extraction
│   │   └── upload/        # File upload
│   ├── documents/         # Document management page
│   ├── results/           # Analysis results page
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # ShadCN/UI components
│   └── fact-aware-analysis.tsx # AI analysis component
├── lib/                   # Utility functions
│   ├── clause-analyzer.ts # AI analysis logic
│   ├── legal-patterns.ts # Legal pattern detection
│   └── text-extractor.ts # Document processing
├── prisma/               # Database schema
└── uploads/              # File storage (development)
```

## API Endpoints

- `POST /api/upload` - Upload document
- `POST /api/extract-text` - Extract text from document
- `POST /api/analyze` - Traditional legal pattern analysis
- `POST /api/analyze-clauses` - AI-powered clause analysis with user facts
- `GET /api/analyze-clauses` - Retrieve existing clause analysis
- `GET /api/documents` - Get document list
- `DELETE /api/documents` - Delete document

## Legal Analysis Capabilities

### Traditional Pattern Detection
- Contract formation and validity
- Consideration requirements
- Capacity to contract
- Free consent and fraud
- Void and voidable contracts
- Performance and breach
- Remedies and damages

### AI-Powered Clause Analysis
- **Context-aware interpretation** based on user's specific situation
- **Favorability assessment** for each clause (Favorable/Neutral/Unfavorable)
- **Risk categorization** (Low/Medium/High risk)
- **Personalized recommendations** tailored to user objectives
- **Compliance verification** against Indian Contract Act 1872

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions, please open an issue on GitHub or contact the development team.
