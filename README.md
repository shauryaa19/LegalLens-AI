# AI Legal Document Analyzer

A Next.js application that analyzes legal documents for compliance with the Indian Contract Act 1872, providing risk scoring and detailed recommendations.

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **Legal Analysis**: Pattern-based detection of legal issues and compliance gaps
- **Risk Assessment**: Comprehensive scoring system (0-100 scale)
- **Document Management**: View and manage all uploaded documents
- **Detailed Reports**: Issue categorization by severity with legal recommendations

## Tech Stack

- **Frontend**: Next.js 15.3.4, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel
- **File Processing**: PDF parsing, DOCX extraction

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud provider like Neon)
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
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push the schema to your database
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
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
| `NODE_ENV` | Environment (development/production) | Yes |

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure your database provider allows connections from Vercel
   - Check that your database is accessible and running

2. **Prisma Client Issues**
   - Clear your local `.next` folder: `Remove-Item .next -Recurse -Force` (Windows) or `rm -rf .next` (Mac/Linux)
   - Regenerate Prisma client: `npx prisma generate`

3. **Build Failures**
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

## Project Structure

```
ai-legal/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── documents/         # Document management page
│   ├── results/           # Analysis results page
│   └── page.tsx          # Home page
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema
└── uploads/              # File storage (development)
```

## API Endpoints

- `POST /api/upload` - Upload document
- `POST /api/extract-text` - Extract text from document
- `POST /api/analyze` - Analyze document for legal issues
- `GET /api/documents` - Get document list
- `DELETE /api/documents` - Delete document

## Legal Patterns

The analyzer currently detects issues related to:
- Contract formation and validity
- Consideration requirements
- Capacity to contract
- Free consent and fraud
- Void and voidable contracts
- Performance and breach
- Remedies and damages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
