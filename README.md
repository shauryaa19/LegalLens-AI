# AI Legal Document Analyzer

A Next.js application for analyzing legal documents for Indian Contract Act 1872 compliance using pattern-based detection and risk assessment.

## Features

- 📄 **Document Upload**: Support for PDF and DOCX files
- ⚖️ **Legal Analysis**: Indian Contract Act 1872 compliance checking
- 📊 **Risk Assessment**: High, Medium, Low risk categorization
- 📈 **Document Management**: View and manage analyzed documents
- 🎯 **Actionable Insights**: Detailed recommendations and legal basis

## Tech Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI, shadcn/ui, Lucide React icons
- **Database**: Neon DB (PostgreSQL), Prisma ORM
- **File Processing**: PDF.js, Mammoth (for DOCX)
- **Deployment**: Vercel

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-legal
npm install
```

### 2. Database Setup (Neon DB)

1. **Create a Neon DB account**: Go to [https://console.neon.tech/](https://console.neon.tech/)
2. **Create a new project** and database
3. **Get your connection strings** from the Neon dashboard:
   - Go to "Connection Details"
   - Copy both "Pooled connection" and "Direct connection" strings

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
# Neon DB Configuration
# Pooled connection (for serverless functions)
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10"

# Direct connection (for migrations and schema changes)
DIRECT_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=10"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema to Neon DB
npx prisma db push

# (Optional) View your database
npx prisma studio
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment (Vercel)

### 1. Environment Variables
In your Vercel project settings, add:
- `DATABASE_URL`: Your Neon DB pooled connection string
- `DIRECT_URL`: Your Neon DB direct connection string

### 2. Deploy
```bash
# Build and deploy
vercel --prod
```

## Project Structure

```
├── app/
│   ├── api/           # API routes (upload, analyze, documents)
│   ├── documents/     # Document management page
│   ├── results/[id]/  # Analysis results page
│   └── page.tsx       # Home page
├── components/        # Reusable UI components
├── lib/
│   ├── db.ts          # Database configuration
│   ├── legal-patterns.ts  # Legal analysis patterns
│   └── text-extractor.ts  # Document text extraction
├── prisma/
│   └── schema.prisma  # Database schema
└── uploads/           # Temporary file storage
```

## Legal Analysis

The application analyzes documents for compliance with:
- **Section 73**: Compensation for loss or damage
- **Section 74**: Compensation for breach of contract
- **Arbitration and Conciliation Act, 2015**
- **Indian Contract Act principles** of reasonableness and fairness

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Disclaimer

This tool provides informational analysis only and does not constitute legal advice. Always consult with a qualified legal professional for important legal decisions.
