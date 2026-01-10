'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Upload, FileUp, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
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
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">Upload Trading 212 CSV</CardTitle>
            <CardDescription className="text-xs">
              Import your transaction history to analyze
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
              'border-2 border-dashed rounded-lg',
              'p-8 cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
            onClick={handleButtonClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleButtonClick()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Click to upload CSV file or drag and drop"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium mb-1">
              {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              CSV files only (max 5MB)
            </p>
          </div>
        )}

        {/* Parsing State */}
        {uploadState === 'parsing' && (
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 animate-pulse text-primary" />
            <span className="text-xs">Parsing {fileName}...</span>
          </div>
        )}

        {/* Success State */}
        {uploadState === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Successfully parsed {rowCount} transaction{rowCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">{fileName}</p>
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" size="sm" className="w-full text-xs h-8">
              <X className="h-3 w-3 mr-1.5" />
              Upload Different File
            </Button>
          </div>
        )}

        {/* Error State */}
        {uploadState === 'error' && (
          <div className="space-y-3">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-destructive">Upload Failed</p>
                  {fileName && <p className="text-xs text-destructive/80 mt-0.5">{fileName}</p>}
                  <ul className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-xs text-destructive/80">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" size="sm" className="w-full text-xs h-8">
              <Upload className="h-3 w-3 mr-1.5" />
              Try Again
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Your data stays private.</span>
            <span className="hidden sm:inline"> Processed locally in your browser.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
