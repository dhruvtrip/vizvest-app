# Vizvest - Trading 212 Portfolio Analysis

A modern web application for analyzing and visualizing Trading 212 trading data.

## Features

✅ **CSV Upload Component**
- Accepts Trading 212 CSV exports only
- Validates file format and required columns
- Parses data using PapaParse with proper configuration
- Shows detailed error messages for invalid data
- Displays success state with transaction count

✅ **Security & Privacy**
- All data processed locally in browser
- No data sent to external servers
- File size limits (5MB max)
- Input validation and sanitization

✅ **Error Handling**
- Comprehensive validation for CSV structure
- Row-level data validation
- Error boundaries for parsing failures
- User-friendly error messages

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **CSV Parsing**: PapaParse
- **Icons**: Lucide React

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Usage

### CSV Upload Component

The `CSVUpload` component handles Trading 212 CSV imports:

```typescript
import { CSVUpload } from '@/components/features/csv-upload'
import type { Trading212Transaction } from '@/types/trading212'

function MyComponent() {
  const handleDataParsed = (data: Trading212Transaction[]) => {
    console.log('Parsed transactions:', data)
    // Process your data here
  }

  return <CSVUpload onDataParsed={handleDataParsed} />
}
```

### Trading 212 CSV Format

The component expects CSV files with these columns:

**Required columns:**
- Action
- Ticker
- No. of shares
- Price / share
- Total

**Full column list:**
- Action
- Time
- ISIN
- Ticker
- Name
- No. of shares
- Price / share
- Currency (Price / share)
- Exchange rate
- Result
- Total
- Currency (Total)
- Withholding tax

## Component Architecture

### File Structure

```
/Users/tripd/Desktop/Projects/vizvest/vizvest-app/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── features/
│   │   └── csv-upload.tsx   # CSV upload component
│   ├── ui/                  # shadcn components
│   └── error-boundary.tsx   # Error boundary
├── lib/
│   ├── utils.ts             # Utility functions
│   └── csv-validator.ts     # CSV validation logic
└── types/
    └── trading212.ts        # TypeScript types
```

### Key Components

**CSVUpload** (`components/features/csv-upload.tsx`)
- Main component for CSV file upload
- Handles file selection, validation, and parsing
- Shows success/error states with appropriate UI
- Accepts `onDataParsed` callback for handling parsed data

**CSV Validator** (`lib/csv-validator.ts`)
- Validates CSV column headers
- Validates individual transaction rows
- Checks data types and required fields
- Returns detailed error messages

**TypeScript Types** (`types/trading212.ts`)
- `Trading212Transaction`: Type for individual transactions
- `CSVValidationResult`: Validation result structure
- `CSVParseResult`: Parse result structure

## PapaParse Configuration

The component uses PapaParse with these settings:

```typescript
Papa.parse(file, {
  header: true,          // First row is header
  dynamicTyping: true,   // Auto-convert numbers
  skipEmptyLines: true   // Ignore empty rows
})
```

## Validation

### Column Validation
- Checks for all required columns
- Provides clear error if columns are missing
- Case-sensitive column name matching

### Data Validation
- Validates each row individually
- Checks data types (strings, numbers)
- Validates positive numbers for shares and prices
- Reports up to 10 errors to user

### Edge Cases Handled
- Empty files
- Wrong file format (non-CSV)
- Files exceeding size limit (5MB)
- Missing required columns
- Invalid data types
- Malformed rows

## Security

Following best practices from `.docs/security.md`:

- ✅ Local-only data processing
- ✅ File type validation (.csv only)
- ✅ File size limits (5MB max)
- ✅ Input sanitization
- ✅ No external data transmission
- ✅ User privacy notices displayed

## Error Handling

The application implements comprehensive error handling:

1. **File Upload Errors**: Invalid type, size, empty file
2. **Parse Errors**: CSV syntax errors, malformed data
3. **Validation Errors**: Missing columns, invalid data types
4. **Component Errors**: Error boundary catches React errors

## Accessibility

- Semantic HTML elements
- Proper ARIA labels for inputs
- Keyboard navigation support
- Focus management
- Screen reader friendly error messages

## Development Guidelines

This project follows the standards defined in:
- `.docs/shadcn-dev-guidelines.md` - UI component patterns
- `.docs/security.md` - Security requirements
- `.cursor/rules/shad-cn.mdc` - shadcn usage rules

### Code Style
- Standard.js rules (2 spaces, single quotes, no semicolons)
- Functional components with hooks
- TypeScript strict mode
- Mobile-first responsive design

## Next Steps

- [ ] Add data visualization components
- [ ] Implement portfolio analytics
- [ ] Add export functionality
- [ ] Create dashboard views
- [ ] Add filtering and sorting

## License

MIT

## Disclaimer

Vizvest is an educational/visualization tool for personal use only. Not financial advice. Consult licensed professionals for investment decisions.

