'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Upload, FileUp, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { validateCSVColumns, validateTransactions } from '@/lib/csv-validator'
import type { Trading212Transaction, CSVParseResult } from '@/types/trading212'

interface CSVUploadProps {
  onDataParsed?: (data: Trading212Transaction[]) => void
  className?: string
}

type UploadState = 'idle' | 'parsing' | 'success' | 'error'

export function CSVUpload({ onDataParsed, className }: CSVUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [parsedData, setParsedData] = useState<Trading212Transaction[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [rowCount, setRowCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset state
    setErrors([])
    setParsedData([])
    setRowCount(0)
    setUploadState('parsing')
    setFileName(file.name)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState('error')
      setErrors(['Invalid file type. Please upload a .csv file.'])
      return
    }

    // Validate file size (max 5MB as per security guidelines)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setUploadState('error')
      setErrors(['File too large. Maximum file size is 5MB.'])
      return
    }

    // Check if file is empty
    if (file.size === 0) {
      setUploadState('error')
      setErrors(['File is empty. Please upload a valid Trading 212 CSV file.'])
      return
    }

    // Parse CSV with PapaParse
    Papa.parse<Trading212Transaction>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        handleParseComplete(results)
      },
      error: (error) => {
        setUploadState('error')
        setErrors([`Failed to parse CSV: ${error.message}`])
      }
    })
  }

  const handleParseComplete = (results: Papa.ParseResult<Trading212Transaction>) => {
    // Validate column headers
    const columnValidation = validateCSVColumns(results.meta.fields || [])
    if (!columnValidation.isValid) {
      setUploadState('error')
      setErrors(columnValidation.errors)
      return
    }

    // Validate parsed data
    const dataValidation = validateTransactions(results.data)
    if (!dataValidation.isValid) {
      setUploadState('error')
      setErrors(dataValidation.errors)
      setRowCount(dataValidation.rowCount || 0)
      return
    }

    // Success - store the data
    const validData = results.data as Trading212Transaction[]
    setParsedData(validData)
    setRowCount(validData.length)
    setUploadState('success')
    
    // Call the callback if provided
    if (onDataParsed) {
      onDataParsed(validData)
    }
  }

  const handleReset = () => {
    setUploadState('idle')
    setFileName('')
    setParsedData([])
    setErrors([])
    setRowCount(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Upload Trading 212 CSV
        </CardTitle>
        <CardDescription>
          Import your Trading 212 transaction history to analyze your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="CSV file upload"
        />

        {/* Upload Area */}
        {uploadState === 'idle' && (
          <div
            className={cn(
              'flex flex-col items-center justify-center',
              'border-2 border-dashed border-border rounded-lg',
              'p-12 cursor-pointer transition-colors',
              'hover:border-primary hover:bg-muted/50'
            )}
            onClick={handleButtonClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleButtonClick()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Click to upload CSV file"
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Trading 212 CSV export only (max 5MB)
            </p>
          </div>
        )}

        {/* Parsing State */}
        {uploadState === 'parsing' && (
          <Alert>
            <AlertCircle className="h-4 w-4 animate-pulse" />
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>
              Parsing {fileName}...
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {uploadState === 'success' && (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-600 dark:text-green-400">
                Success
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Successfully parsed {rowCount} transaction{rowCount !== 1 ? 's' : ''} from {fileName}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Upload Different File
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {uploadState === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>
                {fileName && <p className="font-medium mb-2">File: {fileName}</p>}
                {rowCount > 0 && (
                  <p className="mb-2">Found {rowCount} rows with the following errors:</p>
                )}
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={handleReset} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted/50 rounded-lg">
          <p className="font-medium">🔒 Your data stays private</p>
          <p>Your portfolio data is processed locally in your browser and never sent to external servers.</p>
        </div>
      </CardContent>
    </Card>
  )
}

