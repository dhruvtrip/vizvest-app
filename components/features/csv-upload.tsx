'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Papa from 'papaparse'
import posthog from 'posthog-js'
import { cn } from '@/lib/utils'
import { validateCSVColumns, validateTransactions } from '@/lib/csv-validator'
import type { Trading212Transaction } from '@/types/trading212'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AutoHeight, Disclosure, DotLoader, TextSwap, TextsReveal, useShake } from '@/components/motion'
import { seriesAt, seriesVar } from '@/components/charts'
import { CircleAlert, CloudUpload, FileSpreadsheet, Lock, Plus, RotateCcw, X } from '@/components/icons'
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

/** Splits "export-2024.csv" so the name can truncate while the extension stays visible. */
function splitName(name: string): [string, string] {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return [name, '']
  return [name.slice(0, dot), name.slice(dot)]
}

const EXPORT_STEPS = [
  'In the Trading 212 app, open History.',
  'Tap the export icon in the top right corner.',
  'Pick a time frame (up to 12 months per file) and keep Transactions, Dividends and Orders ticked.',
  'Tap Export CSV, then drop the file here. Export several ranges to cover more than a year.'
]

const zoneShape = 'rounded-4xl border-[1.5px] border-dashed'

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
  const { ref: shakeRef, shake } = useShake<HTMLDivElement>()

  const { pendingMerge, commitMerge, cancelPendingMerge } = useDashboardStore(
    useShallow((state) => ({
      pendingMerge: state.pendingMerge,
      commitMerge: state.commitMerge,
      cancelPendingMerge: state.cancelPendingMerge
    }))
  )

  // A rejected upload (a skipped file or a failed validation) shakes the drop area.
  useEffect(() => {
    if (uploadState === 'error' || stagingRejects.length > 0) shake()
  }, [uploadState, stagingRejects, shake])

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

  // Staging with nothing accepted (every file was skipped) keeps the drop zone up.
  const showList = uploadState === 'staging' && stagedFiles.length > 0
  const showZone = uploadState === 'idle' || uploadState === 'error' || (uploadState === 'staging' && !showList)

  return (
    <section
      aria-labelledby="upload-heading"
      className={cn('mx-auto w-full max-w-[40rem] px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:pt-24', className)}
    >
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

      {/* First-load entrance: heading, lead and drop area rise in 100ms apart. */}
      <div style={{ '--stagger-stagger': '100ms' } as React.CSSProperties}>
        <TextsReveal>
          <h1
            id="upload-heading"
            className="heading-display text-balance text-center sm:text-5xl sm:leading-[1.05] lg:text-[3.5rem]"
          >
            Upload your Trading&nbsp;212 export
          </h1>
          <p className="text-lead mx-auto mt-4 max-w-[32rem] text-pretty text-center text-muted-foreground">
            Drop one or more CSV exports. Vizvest merges them, removes duplicates and builds your dashboard.
          </p>
          <div className="mt-10">
            <AutoHeight>
              <div className="space-y-3">
                {uploadState === 'error' && (
                  <Alert variant="destructive">
                    <CircleAlert size={16} strokeWidth={2} />
                    <AlertTitle>Upload failed</AlertTitle>
                    <AlertDescription>
                      <ul className="space-y-1 break-words font-normal leading-5">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="-ms-3 mt-2 text-foreground hover:bg-destructive/10"
                      >
                        <RotateCcw size={14} />
                        Try again
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {uploadState === 'staging' && stagingRejects.length > 0 && (
                  <Alert variant="destructive">
                    <CircleAlert size={16} strokeWidth={2} />
                    <AlertTitle>
                      {stagingRejects.length} file{stagingRejects.length === 1 ? '' : 's'} skipped
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="space-y-1 break-words font-normal leading-5">
                        {stagingRejects.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div ref={shakeRef}>
                  {showZone && (
                    <div
                      className={cn(
                        zoneShape,
                        'group flex h-60 cursor-pointer flex-col items-center justify-center px-6 text-center',
                        'transition-[background-color,border-color] duration-150 ease-ui',
                        isDragging
                          ? 'border-solid border-foreground bg-muted'
                          : 'border-foreground/25 hover:bg-muted'
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
                      data-dragging={isDragging ? 'true' : undefined}
                    >
                      {/* Children ignore the pointer so dragging across them never flickers the state. */}
                      <span
                        className={cn(
                          'pointer-events-none mb-4 grid size-12 place-items-center rounded-full bg-tile text-foreground',
                          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-ui',
                          isDragging && 'motion-safe:-translate-y-0.5'
                        )}
                        aria-hidden="true"
                      >
                        <CloudUpload size={22} />
                      </span>
                      <p className="pointer-events-none text-base font-medium">Drop your CSV files here</p>
                      <p className="pointer-events-none mt-1 text-sm text-muted-foreground">
                        or{' '}
                        <span className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 ease-ui group-hover:decoration-foreground">
                          browse your device
                        </span>
                      </p>
                      <p id="file-upload-description" className="pointer-events-none mt-5 text-sm font-normal text-muted-foreground">
                        CSV only, up to 5 MB per file
                      </p>
                    </div>
                  )}

                  {showList && (
                    <div
                      className={cn(
                        zoneShape,
                        'p-3 transition-[border-color] duration-150 ease-ui sm:p-4',
                        isDragging ? 'border-solid border-foreground' : 'border-foreground/25'
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      role="region"
                      aria-label="Files ready to upload"
                    >
                      <div className="flex items-center justify-between gap-3 pb-3 ps-2 pt-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            <span className="figure">{stagedFiles.length}</span> file{stagedFiles.length === 1 ? '' : 's'} ready
                          </p>
                          <p id="file-upload-description" className="text-xs font-normal text-muted-foreground">
                            Add every export you want included, then continue.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddMoreClick}
                          className="shrink-0 ps-2.5"
                        >
                          <Plus size={14} strokeWidth={2} />
                          Add more files
                        </Button>
                      </div>

                      <ul className="flex flex-col gap-2" aria-label="Staged files">
                        {stagedFiles.map((file, index) => {
                          const key = fileKey(file)
                          const [base, ext] = splitName(file.name)
                          const color = seriesAt(index)
                          return (
                            <li
                              key={key}
                              className="flex items-center gap-3 rounded-2xl bg-tile p-2 pe-1.5"
                            >
                              <span
                                className="grid size-10 shrink-0 place-items-center rounded-xl"
                                style={{ background: seriesVar(color, 0.12), color: seriesVar(color) }}
                                aria-hidden="true"
                              >
                                <FileSpreadsheet size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="flex min-w-0 text-sm font-medium" title={file.name}>
                                  <span className="truncate">{base}</span>
                                  <span className="shrink-0">{ext}</span>
                                </p>
                                <p className="figure text-xs font-normal text-muted-foreground">
                                  {formatBytes(file.size)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemoveStaged(key)}
                                className="text-muted-foreground hover:bg-tile-hover hover:text-foreground"
                                aria-label={`Remove ${file.name}`}
                              >
                                <X size={16} />
                              </Button>
                            </li>
                          )
                        })}
                      </ul>

                      <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:flex min-[360px]:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleReset}
                          className="order-2 min-[360px]:order-none"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleContinue}
                          disabled={stagedFiles.length === 0}
                          className="order-1 min-[360px]:order-none"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadState === 'parsing' && (
                    <div
                      className={cn(zoneShape, 'flex min-h-60 flex-col items-center justify-center border-foreground/25 px-6 py-10 text-center')}
                      role="status"
                      aria-live="polite"
                      aria-label="Processing files"
                    >
                      <span className="mb-5 grid size-12 place-items-center rounded-full bg-tile">
                        <DotLoader pattern="scan" label="Processing your files" className="scale-150 text-foreground" />
                      </span>
                      <p className="text-base font-medium">Processing your files</p>
                      <p className="mt-1 w-full max-w-xs text-sm font-normal text-muted-foreground">
                        <TextSwap text={progress.status} className="max-w-full truncate align-bottom" />
                      </p>
                      {progress.total > 0 && (
                        <div className="mt-5 w-full max-w-xs">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-tile">
                            <div
                              className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-smooth-out"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <p className="figure mt-2 text-xs font-normal text-muted-foreground">
                            {progress.done} of {progress.total} {progress.total === 1 ? 'file' : 'files'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </AutoHeight>
          </div>
        </TextsReveal>
      </div>

      <p className="mt-5 text-balance text-center text-sm text-muted-foreground">
        <Lock size={14} className="me-1.5 inline-block align-[-2px]" aria-hidden="true" />
        Your file is read in your browser and never uploaded
      </p>

      <div className="mt-12 border-y border-border">
        <Disclosure value="export-guide" title="How to export from Trading 212" headingLevel={2}>
          <ol className="list-decimal space-y-1.5 ps-5 marker:font-medium marker:text-foreground">
            {EXPORT_STEPS.map((step) => (
              <li key={step} className="ps-1">{step}</li>
            ))}
          </ol>
          <Image
            src="/assets/trading212-export-guide.png"
            alt="Trading 212 app: the History screen with the export icon in the top right, and the Export history screen with a time frame, the included data and the Export CSV button."
            width={1024}
            height={1010}
            sizes="(min-width: 640px) 28rem, 100vw"
            className="image-outline mx-auto mt-5 h-auto w-full max-w-md rounded-2xl"
          />
        </Disclosure>
      </div>

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
