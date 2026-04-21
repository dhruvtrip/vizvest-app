'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import posthog from 'posthog-js'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { validateCSVColumns, validateTransactions } from '@/lib/csv-validator'
import type { Trading212Transaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useShallow } from 'zustand/react/shallow'
import { CurrencyPickerDialog } from './currency-picker-dialog'

interface UploadResult {
  fileName: string
  rowCount: number
}

interface CSVUploadProps {
  onDataParsed?: (data: Trading212Transaction[], result: UploadResult) => void
  isHidden?: boolean
  className?: string
}

type UploadState = 'idle' | 'staging' | 'parsing' | 'error'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fileKey(file: File): string {
  return `${file.name}__${file.size}__${file.lastModified}`
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

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

interface ParsedFile {
  fileName: string
  data: Trading212Transaction[]
}

interface FilePreFlight {
  file: File
  error?: string
}

function preflight(files: File[]): FilePreFlight[] {
  return files.map((file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { file, error: `"${file.name}" is not a .csv file` }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { file, error: `"${file.name}" is larger than 5MB` }
    }
    if (file.size === 0) {
      return { file, error: `"${file.name}" is empty` }
    }
    return { file }
  })
}

function parseOne(file: File): Promise<{ fileName: string; data: Trading212Transaction[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse<Trading212Transaction>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = []

        const columnValidation = validateCSVColumns(results.meta.fields || [])
        if (!columnValidation.isValid) {
          errors.push(...columnValidation.errors.map(e => `${file.name}: ${e}`))
        }

        if (columnValidation.isValid) {
          const dataValidation = validateTransactions(results.data)
          if (!dataValidation.isValid) {
            errors.push(...dataValidation.errors.map(e => `${file.name}: ${e}`))
          }
        }

        resolve({
          fileName: file.name,
          data: results.data as Trading212Transaction[],
          errors
        })
      },
      error: (error) => {
        resolve({
          fileName: file.name,
          data: [],
          errors: [`${file.name}: Failed to parse CSV: ${error.message}`]
        })
      }
    })
  })
}

export function CSVUpload({ onDataParsed, isHidden = false, className }: CSVUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errors, setErrors] = useState<string[]>([])
  const [stagingRejects, setStagingRejects] = useState<string[]>([])
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; status: string }>({
    done: 0,
    total: 0,
    status: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { pendingMerge, commitMerge, cancelPendingMerge } = useDashboardStore(
    useShallow((state) => ({
      pendingMerge: state.pendingMerge,
      commitMerge: state.commitMerge,
      cancelPendingMerge: state.cancelPendingMerge
    }))
  )

  if (isHidden) {
    return null
  }

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    setUploadState('idle')
    setErrors([])
    setStagingRejects([])
    setStagedFiles([])
    setProgress({ done: 0, total: 0, status: '' })
    resetInput()
  }

  const stageFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    const checked = preflight(incoming)
    const rejects = checked.filter(c => c.error).map(c => c.error as string)
    const accepted = checked.filter(c => !c.error).map(c => c.file)

    setStagedFiles((prev) => {
      const existing = new Set(prev.map(fileKey))
      const merged = [...prev]
      for (const file of accepted) {
        if (!existing.has(fileKey(file))) {
          merged.push(file)
          existing.add(fileKey(file))
        }
      }
      return merged
    })
    setStagingRejects(rejects)
    setUploadState('staging')
    resetInput()
  }

  const handleRemoveStaged = (key: string) => {
    setStagedFiles((prev) => {
      const next = prev.filter(f => fileKey(f) !== key)
      if (next.length === 0) {
        setStagingRejects([])
        setUploadState('idle')
      }
      return next
    })
  }

  const handleAddMoreClick = () => {
    fileInputRef.current?.click()
  }

  const processFiles = async (fileList: File[]) => {
    setErrors([])
    setStagingRejects([])
    setUploadState('parsing')
    posthog.capture('csv_upload_started', { file_count: fileList.length })

    const checked = preflight(fileList)
    const preflightErrors = checked.filter(c => c.error).map(c => c.error as string)
    if (preflightErrors.length > 0) {
      setUploadState('error')
      setErrors(preflightErrors)
      posthog.capture('csv_upload_failed-preflight', { error_count: preflightErrors.length })
      return
    }

    const valid = checked.map(c => c.file)
    setProgress({ done: 0, total: valid.length, status: `Parsing ${valid[0].name}…` })

    const parsed: ParsedFile[] = []
    const allErrors: string[] = []

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i]
      setProgress({
        done: i,
        total: valid.length,
        status: `Parsing ${file.name} (${i + 1} of ${valid.length})…`
      })
      const result = await parseOne(file)
      if (result.errors.length > 0) {
        allErrors.push(...result.errors)
      } else {
        parsed.push({ fileName: result.fileName, data: result.data })
      }
    }

    if (allErrors.length > 0) {
      setUploadState('error')
      setErrors(allErrors.slice(0, 10))
      posthog.capture('csv_upload_failed-validation')
      return
    }

    setProgress({
      done: valid.length,
      total: valid.length,
      status: 'Merging transactions…'
    })

    // Legacy single-file callback path (tests, embedded usage) — stays backwards compatible.
    if (onDataParsed && parsed.length === 1) {
      onDataParsed(parsed[0].data, { fileName: parsed[0].fileName, rowCount: parsed[0].data.length })
      posthog.capture('csv_upload_completed', { file_count: 1 })
      setUploadState('idle')
      resetInput()
      return
    }

    useDashboardStore.getState().handleMultipleFilesParsed(parsed)
    posthog.capture('csv_upload_completed', { file_count: parsed.length })

    // If a currency conflict was raised the store holds `pendingMerge` and
    // the dialog below handles it. Otherwise commit already happened and the
    // parent will unmount this component.
    setUploadState('idle')
    setStagedFiles([])
    resetInput()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    stageFiles(files)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (uploadState === 'parsing') return

    const files = Array.from(event.dataTransfer.files ?? [])
    if (files.length === 0) return
    stageFiles(files)
  }

  const handleContinue = () => {
    if (stagedFiles.length === 0) return
    void processFiles(stagedFiles)
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

  const handleButtonClick = () => {
    if (uploadState === 'parsing') return
    posthog.capture('csv_upload_clicked')
    fileInputRef.current?.click()
  }

  const progressPct = progress.total > 0
    ? Math.min(100, Math.round((progress.done / progress.total) * 100))
    : 0

  return (
    <section className={cn('relative py-16 lg:py-24', className)}>
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
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/12 border border-primary/20 text-sm font-medium text-primary mb-4">
            Trading 212 CSV Import
          </div>
          <h2 className="text-h1 mb-3">
            Upload your transaction history
          </h2>
          <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
            Drop one or more Trading 212 exports. We&apos;ll merge them, strip duplicates, and visualize your portfolio.
          </p>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="csv-file-input"
          aria-label="Upload Trading 212 CSV files"
          aria-describedby="file-upload-description"
        />

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
              aria-label="Click to upload CSV files or drag and drop"
              aria-describedby="file-upload-description"
            >
              <motion.div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-5',
                  'bg-gradient-to-br from-primary/10 to-accent/10',
                  'border border-primary/20'
                )}
                animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className={cn(
                  'text-3xl font-light transition-colors',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )}>+</span>
              </motion.div>

              <p className="text-sm font-medium mb-1">
                {isDragging ? 'Drop your files here' : 'Click to upload or drag and drop'}
              </p>
              <p id="file-upload-description" className="text-xs text-muted-foreground">
                One or more CSV files, max 5MB each
              </p>

              <div className="mt-6 pt-6 border-t border-border/50 w-full max-w-xs">
                <p className="text-xs text-muted-foreground text-center">
                  <span className="font-medium text-foreground">How to export:</span>
                  {' '}Trading 212 → History → Export
                </p>
              </div>
            </div>
          )}

          {uploadState === 'staging' && (
            <div
              className={cn(
                'flex flex-col gap-4 p-6 rounded-2xl border border-border/50',
                'bg-card/50 backdrop-blur-sm',
                isDragging && 'border-primary bg-primary/5'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              role="region"
              aria-label="Files ready to upload"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {stagedFiles.length} file{stagedFiles.length === 1 ? '' : 's'} ready
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Review your selection, then continue to process.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMoreClick}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add more files
                </button>
              </div>

              {stagingRejects.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive mb-1">
                    {stagingRejects.length} file{stagingRejects.length === 1 ? '' : 's'} skipped
                  </p>
                  <ul className="space-y-0.5">
                    {stagingRejects.map((msg, i) => (
                      <li key={i} className="text-[11px] text-destructive/80">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ul className="flex flex-col gap-2" aria-label="Staged files">
                {stagedFiles.map((file) => {
                  const key = fileKey(file)
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaged(key)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={stagedFiles.length === 0}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {uploadState === 'parsing' && (
            <div
              className="flex flex-col items-center gap-5 p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50"
              role="status"
              aria-live="polite"
              aria-label="Processing files"
            >
              <div
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-2xl font-bold text-primary animate-pulse">...</span>
              </div>
              <div className="text-center w-full max-w-xs">
                <p className="text-sm font-medium mb-1">Processing your files</p>
                <p className="text-xs text-muted-foreground truncate">{progress.status}</p>
                {progress.total > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {progress.done} / {progress.total} files
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="p-6 bg-card/50 rounded-2xl border-l-4 border-destructive border border-destructive/30">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-2">Upload Failed</p>
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

        <motion.div variants={fadeInUp} className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span><strong className="text-foreground">Private.</strong> Your data is processed locally in your browser.</span>
        </motion.div>
      </motion.div>

      {pendingMerge && (
        <CurrencyPickerDialog
          open={Boolean(pendingMerge)}
          currencies={pendingMerge.uniqueBaseCurrencies}
          perFileBreakdown={pendingMerge.perFileBaseCurrencies}
          onSelect={(currency) => {
            posthog.capture('csv_upload_currency_chosen', { currency })
            commitMerge(pendingMerge, currency)
          }}
          onCancel={() => {
            posthog.capture('csv_upload_currency_cancelled')
            cancelPendingMerge()
            handleReset()
          }}
        />
      )}
    </section>
  )
}
