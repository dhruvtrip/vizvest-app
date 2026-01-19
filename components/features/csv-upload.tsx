'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import posthog from 'posthog-js'
import { motion } from 'framer-motion'
import { Upload, FileUp, AlertCircle, Lock, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateCSVColumns, validateTransactions } from '@/lib/csv-validator'
import type { Trading212Transaction } from '@/types/trading212'

interface UploadResult {
  fileName: string
  rowCount: number
}

interface CSVUploadProps {
  onDataParsed?: (data: Trading212Transaction[], result: UploadResult) => void
  isHidden?: boolean
  className?: string
}

type UploadState = 'idle' | 'parsing' | 'error'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

export function CSVUpload({ onDataParsed, isHidden = false, className }: CSVUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [errors, setErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // If hidden, don't render anything
  if (isHidden) {
    return null
  }

  const processFile = (file: File) => {
    setErrors([])
    setUploadState('parsing')
    setFileName(file.name)

    // Track upload started
    posthog.capture('csv_upload_started')

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState('error')
      setErrors(['Invalid file type. Please upload a .csv file.'])
      posthog.capture('csv_upload_failed-file-type-invalid')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadState('error')
      setErrors(['File too large. Maximum file size is 5MB.'])
      posthog.capture('csv_upload_failed-file-too-large')
      return
    }

    if (file.size === 0) {
      setUploadState('error')
      setErrors(['File is empty. Please upload a valid Trading 212 CSV file.'])
      posthog.capture('csv_upload_failed-file-empty')
      return
    }

    Papa.parse<Trading212Transaction>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        handleParseComplete(results, file.name)
      },
      error: (error) => {
        setUploadState('error')
        setErrors([`Failed to parse CSV: ${error.message}`])
        posthog.capture('csv_upload_failed')
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

  const handleParseComplete = (results: Papa.ParseResult<Trading212Transaction>, name: string) => {
    const columnValidation = validateCSVColumns(results.meta.fields || [])
    if (!columnValidation.isValid) {
      setUploadState('error')
      setErrors(columnValidation.errors)
      posthog.capture('csv_upload_failed-column-validation')
      return
    }

    const dataValidation = validateTransactions(results.data)
    if (!dataValidation.isValid) {
      setUploadState('error')
      setErrors(dataValidation.errors)
      posthog.capture('csv_upload_failed-data-validation')
      return
    }

    const validData = results.data as Trading212Transaction[]

    // Track successful upload
    posthog.capture('csv_upload_completed')

    if (onDataParsed) {
      onDataParsed(validData, {
        fileName: name,
        rowCount: validData.length
      })
    }

    // Reset state after successful upload (component will be hidden by parent)
    setUploadState('idle')
  }

  const handleReset = () => {
    setUploadState('idle')
    setFileName('')
    setErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    posthog.capture('csv_upload_clicked')
    fileInputRef.current?.click()
  }

  return (
    <section className={cn('relative py-16 lg:py-24', className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(120,119,198,0.1),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(120,119,198,0.15),transparent)]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 max-w-2xl"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Trading 212 CSV Import
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Upload your transaction history
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Export your data from Trading 212 and drop it here to visualize your portfolio performance
          </p>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-file-input"
          aria-label="Upload Trading 212 CSV file"
          aria-describedby="file-upload-description"
        />

        {/* Upload Area */}
        <motion.div variants={fadeInUp}>
          {uploadState === 'idle' && (
            <div
              className={cn(
                'relative flex flex-col items-center justify-center',
                'border-2 border-dashed rounded-2xl',
                'p-12 cursor-pointer transition-all duration-300',
                'bg-card/50 backdrop-blur-sm',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'
              )}
              onClick={handleButtonClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleButtonClick()
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Click to upload CSV file or drag and drop"
              aria-describedby="file-upload-description"
            >
              {/* Animated icon container */}
              <motion.div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-5',
                  'bg-gradient-to-br from-primary/10 to-accent/10',
                  'border border-primary/20'
                )}
                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Upload className={cn(
                  'w-7 h-7 transition-colors',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )} />
              </motion.div>

              <p className="text-sm font-medium mb-1">
                {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
              </p>
              <p id="file-upload-description" className="text-xs text-muted-foreground">
                CSV files only (max 5MB)
              </p>

              {/* How to export hint */}
              <div className="mt-6 pt-6 border-t border-border/50 w-full max-w-xs">
                <p className="text-xs text-muted-foreground text-center">
                  <span className="font-medium text-foreground">How to export:</span>
                  {' '}Trading 212 → History → Export
                </p>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {uploadState === 'parsing' && (
            <div
              className="flex flex-col items-center gap-4 p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50"
              role="status"
              aria-live="polite"
              aria-label="Processing file"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <FileUp className="w-7 h-7 text-primary" />
                </motion.div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Processing your file</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {uploadState === 'error' && (
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-destructive/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">Upload Failed</p>
                  {fileName && <p className="text-xs text-muted-foreground mb-2">{fileName}</p>}
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-xs text-destructive/80">
                        {error}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleReset}
                    className="mt-4 text-xs font-medium text-primary hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div variants={fadeInUp} className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          <span>Your data stays private. Processed locally in your browser.</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
