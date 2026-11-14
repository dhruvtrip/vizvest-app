'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import posthog from 'posthog-js'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Plus,
  RotateCcw,
  ShieldCheck,
  Upload,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DUR, EASE } from '@/lib/motion'
import { validateCSVColumns, validateTransactions } from '@/lib/csv-validator'
import type { Trading212Transaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useShallow } from 'zustand/react/shallow'
import { Container, GridGuides } from '@/components/layout/container'
import { Button, buttonVariants } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BlurReveal } from '@/components/motion/blur-reveal'
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

/** 40px icon box on surface-2 with the demo-surface ring */
function IconBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-foreground shadow-demo-surface',
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

const REASSURANCE = [
  {
    title: 'Private by default',
    body: 'Your data is processed locally in your browser. Nothing is uploaded or stored.',
    icon: ShieldCheck
  },
  {
    title: 'Runs in your browser',
    body: 'No account and no server. Refresh the page and everything is cleared.',
    dot: true
  },
  {
    title: 'How to export',
    steps: ['Trading 212', 'History', 'Export'],
    icon: FileSpreadsheet
  }
] as const

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
  const reduce = useReducedMotion()

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
    const parsingStartedAt = Date.now()
    posthog.capture('csv_upload_started', { file_count: fileList.length })

    const checked = preflight(fileList)
    const preflightErrors = checked.filter(c => c.error).map(c => c.error as string)
    if (preflightErrors.length > 0) {
      setUploadState('error')
      setErrors(preflightErrors)
      posthog.capture('csv_upload_failed', { reason: 'preflight', error_count: preflightErrors.length })
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
      posthog.capture('csv_upload_failed', { reason: 'validation', error_count: allErrors.length })
      return
    }

    setProgress({
      done: valid.length,
      total: valid.length,
      status: 'Merging transactions…'
    })

    const MIN_LOADER_MS = 1200
    const elapsed = Date.now() - parsingStartedAt
    if (elapsed < MIN_LOADER_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_LOADER_MS - elapsed))
    }

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

  // State swaps cross-fade through a light blur
  const swap = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: DUR.fast } },
        exit: { opacity: 0, transition: { duration: DUR.quick } }
      }
    : {
        initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DUR.fast, ease: EASE.smoothOut } },
        exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: DUR.quick, ease: EASE.smoothOut } }
      }

  const stagedBytes = stagedFiles.reduce((sum, f) => sum + f.size, 0)

  return (
    <section className={cn('relative pb-20 md:pb-28', className)} aria-labelledby="csv-upload-title">
      <GridGuides />

      <Container>
        <BlurReveal immediate className="flex flex-col items-center px-2 pb-10 pt-16 text-center md:px-6 md:pb-14 md:pt-24">
          <h1 id="csv-upload-title" className="max-w-[672px] text-h3 text-foreground md:text-h2">
            Upload your transaction history
          </h1>
          <p className="mt-4 max-w-[520px] text-pretty text-p text-fg-secondary md:text-p-lg">
            Drop one or more Trading 212 exports. We&apos;ll merge them, strip duplicates and chart your portfolio.
          </p>
        </BlurReveal>

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

        <BlurReveal immediate delay={0.1}>
          {/* Main cell: the drop zone and every upload state */}
          <div className="border-y border-border md:border-x">
            <div className="p-3 md:p-6">
              <AnimatePresence mode="wait" initial={false}>
                {uploadState === 'idle' && (
                  <motion.div key="idle" {...swap}>
                    <div
                      className={cn(
                        'group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center md:min-h-[340px]',
                        'transition-[border-color,background-color] duration-200 ease-in-out',
                        isDragging
                          ? 'border-border-hover bg-white/[0.03]'
                          : 'border-border-strong hover:border-border-hover hover:bg-white/[0.03]'
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
                      data-dragging={isDragging || undefined}
                    >
                      {/* Children ignore pointer events so drag-leave does not flicker */}
                      <div className="pointer-events-none flex flex-col items-center">
                        <IconBox
                          className={cn(
                            'transition-[color,background-color] duration-200',
                            isDragging ? 'bg-surface-4 text-white' : 'group-hover:bg-surface-3'
                          )}
                        >
                          <Upload className="h-4 w-4" strokeWidth={1.5} />
                        </IconBox>

                        <p className="mt-6 text-p text-foreground">
                          {isDragging ? 'Release to add your files' : 'Drop your Trading 212 CSV here'}
                        </p>
                        <p className="mt-1 text-p-sm text-fg-secondary">or click to browse</p>

                        <span
                          className={cn(buttonVariants({ variant: 'default' }), 'mt-6 group-active:scale-[0.97]')}
                          aria-hidden="true"
                        >
                          Choose files
                        </span>

                        <p id="file-upload-description" className="mt-6 text-label text-fg-gray">
                          CSV only, up to 5 MB each. Add several files to merge them.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {uploadState === 'staging' && (
                  <motion.div key="staging" {...swap}>
                    <div
                      className={cn(
                        'flex min-h-[300px] flex-col overflow-hidden rounded-xl border bg-surface-1 md:min-h-[340px]',
                        'transition-[border-color,background-color] duration-200 ease-in-out',
                        isDragging ? 'border-border-hover bg-surface-2' : 'border-border'
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      role="region"
                      aria-label="Files ready to upload"
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
                        <div className="min-w-0">
                          <p className="text-p-sm text-foreground">
                            <span className="tabular">{stagedFiles.length}</span> file{stagedFiles.length === 1 ? '' : 's'} ready
                            <span className="text-fg-gray"> · <span className="tabular">{formatBytes(stagedBytes)}</span></span>
                          </p>
                          <p className="mt-0.5 text-label text-fg-secondary">
                            Review your selection, then continue to process.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddMoreClick}
                          className="text-fg-secondary"
                        >
                          <Plus strokeWidth={1.5} aria-hidden="true" />
                          Add more files
                        </Button>
                      </div>

                      {stagingRejects.length > 0 && (
                        <div className="flex gap-3 border-b border-border bg-negative/[0.04] px-4 py-3 md:px-5" role="alert">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-negative" strokeWidth={1.5} aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-p-sm text-negative">
                              <span className="tabular">{stagingRejects.length}</span> file{stagingRejects.length === 1 ? '' : 's'} skipped
                            </p>
                            <ul className="mt-1 space-y-0.5">
                              {stagingRejects.map((msg, i) => (
                                <li key={i} className="break-words text-label text-fg-secondary">{msg}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <ul aria-label="Staged files">
                        <AnimatePresence initial={false}>
                          {stagedFiles.map((file) => {
                            const key = fileKey(file)
                            return (
                              <motion.li
                                key={key}
                                layout={!reduce}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { duration: DUR.quick } }}
                                exit={{ opacity: 0, transition: { duration: DUR.quick } }}
                                className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-5"
                              >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-3 text-fg-secondary" aria-hidden="true">
                                  <FileText className="h-4 w-4" strokeWidth={1.5} />
                                </span>
                                <p className="min-w-0 flex-1 truncate text-p-sm text-foreground">{file.name}</p>
                                <span className="tabular shrink-0 text-label text-fg-gray">
                                  {formatBytes(file.size)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaged(key)}
                                  className="-mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-fg-gray transition-[color,background-color] duration-150 hover:bg-white/5 hover:text-white"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                </button>
                              </motion.li>
                            )
                          })}
                        </AnimatePresence>
                      </ul>

                      {/* Remaining space doubles as a drop target for more files */}
                      <div className="flex flex-1 p-3" aria-hidden="true">
                        <div
                          className={cn(
                            'pointer-events-none flex min-h-16 flex-1 items-center justify-center gap-2 rounded-lg border border-dashed text-label',
                            'transition-[border-color,color] duration-200 ease-in-out',
                            isDragging ? 'border-border-hover text-foreground' : 'border-border-strong text-fg-gray'
                          )}
                        >
                          <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {isDragging ? 'Release to add these files' : 'Drop more files here'}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-3 md:px-5">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="ghost" onClick={handleReset}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleContinue}
                            disabled={stagedFiles.length === 0}
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {uploadState === 'parsing' && (
                  <motion.div key="parsing" {...swap}>
                    <div
                      className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-surface-1 px-6 py-12 text-center md:min-h-[340px]"
                      role="status"
                      aria-live="polite"
                      aria-label="Processing files"
                    >
                      <IconBox>
                        <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
                      </IconBox>
                      <p className="working-shimmer mt-6 text-p">Processing your files</p>
                      <p className="mt-1 max-w-full truncate text-p-sm text-fg-secondary">{progress.status}</p>
                      {progress.total > 0 && (
                        <div className="mt-6 w-full max-w-[320px]">
                          <div
                            className="h-0.5 w-full overflow-hidden rounded-full bg-surface-3"
                            role="progressbar"
                            aria-label="Files processed"
                            aria-valuemin={0}
                            aria-valuemax={progress.total}
                            aria-valuenow={progress.done}
                          >
                            <motion.div
                              className="h-full rounded-full bg-foreground"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: DUR.medium, ease: EASE.smoothOut }}
                            />
                          </div>
                          <p className="tabular mt-2 text-label text-fg-gray">
                            {progress.done} / {progress.total} files
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {uploadState === 'error' && (
                  <motion.div key="error" {...swap}>
                    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border px-3 py-10 md:min-h-[340px] md:px-6">
                      <div className="w-full max-w-[600px]">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                          <AlertTitle>Upload failed</AlertTitle>
                          <AlertDescription>
                            <ul className="space-y-1">
                              {errors.map((error, index) => (
                                <li key={index} className="break-words text-p-sm text-fg-secondary">
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                        <div className="mt-4 flex justify-center">
                          <Button variant="outline" onClick={handleReset}>
                            <RotateCcw strokeWidth={1.5} aria-hidden="true" />
                            Try again
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reassurance: three cells sharing hairlines with the drop zone cell */}
          <ul className="grid grid-cols-1 border-b border-border md:grid-cols-3 md:border-x">
            {REASSURANCE.map((item, i) => (
              <li
                key={item.title}
                className={cn(
                  'flex flex-col gap-2 px-4 py-5 md:p-6',
                  i > 0 && 'border-t border-border md:border-l md:border-t-0'
                )}
              >
                <p className="flex items-center gap-2 text-p-sm text-foreground">
                  {'dot' in item ? (
                    <span className="status-dot" aria-hidden="true" />
                  ) : (
                    <item.icon className="h-4 w-4 text-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
                  )}
                  {item.title}
                </p>
                {'steps' in item ? (
                  <p className="flex flex-wrap items-center gap-1 text-p-sm text-fg-secondary">
                    {item.steps.map((step, s) => (
                      <span key={step} className="inline-flex items-center gap-1">
                        {s > 0 && (
                          <>
                            <ChevronRight className="h-3.5 w-3.5 text-fg-gray" strokeWidth={1.5} aria-hidden="true" />
                            <span className="sr-only">then</span>
                          </>
                        )}
                        {step}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-pretty text-p-sm text-fg-secondary">{item.body}</p>
                )}
              </li>
            ))}
          </ul>
        </BlurReveal>
      </Container>

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
