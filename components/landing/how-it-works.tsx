import { Check, Download, FileSpreadsheet } from '@/components/icons'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from './section-heading'
import { SnapRail } from './snap-rail'

const steps = [
  {
    label: 'Export',
    title: 'Export your history',
    description:
      'In Trading 212, open History and export a CSV. Each file holds up to 12 months, so export as many ranges as you need.',
    visual: <ExportVisual />,
  },
  {
    label: 'Upload',
    title: 'Drop the files in',
    description:
      'Vizvest checks the format, merges your files and removes duplicate rows. Everything happens on your device.',
    visual: <DropVisual />,
  },
  {
    label: 'Read',
    title: 'Read your portfolio',
    description:
      'Holdings, dividends, fees and trading activity appear at once. Open any stock to see its full history.',
    visual: <ExploreVisual />,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="mx-auto w-full max-w-content scroll-mt-28">
      <Reveal>
        <SectionHeading
          id="how-heading"
          title="From export to answers in three steps"
          description="One export from Trading 212 is all it takes."
        />
      </Reveal>

      {/* A swipe row on phones with the step numbers in its label row, picture
          beside text on tablets, three columns on desktop. */}
      <SnapRail
        as="ol"
        aria-label="Show a step"
        labels={steps.map((step, index) => ({
          value: `step-${index + 1}`,
          label: (
            <>
              <span className="figure text-muted-foreground">{index + 1}</span>
              {step.label}
            </>
          ),
        }))}
        className="md:mt-12 md:grid md:gap-10 lg:mt-16 lg:grid-cols-3 lg:gap-8"
      >
        {steps.map((step, index) => (
          <li key={step.title}>
            {/* The swipe row shows its cards from the start: one peeking in from the side would never trigger its reveal. */}
            <Reveal
              delay={index * 0.1}
              className="flex flex-col gap-5 max-md:!transform-none max-md:!opacity-100 md:gap-6 md:max-lg:flex-row md:max-lg:items-center md:max-lg:gap-10"
            >
              <div
                aria-hidden="true"
                className="relative flex h-40 items-center justify-center overflow-hidden rounded-3xl bg-muted p-4 max-md:[&>*]:scale-90 md:h-48 md:p-6 md:max-lg:w-1/2"
              >
                {step.visual}
              </div>
              <div className="md:max-lg:w-1/2">
                <p className="figure text-sm font-normal text-muted-foreground max-md:hidden">Step {index + 1}</p>
                <h3 className="heading-card md:mt-1">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </SnapRail>
    </section>
  )
}

/* Small product sketches. Decorative, so the whole frame is aria-hidden. */

function ExportVisual() {
  return (
    <div className="w-full max-w-[15rem] rounded-2xl bg-background p-3 shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">History</span>
        <span className="figure text-2xs font-normal text-muted-foreground">Last 12 months</span>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {['Orders', 'Dividends', 'Transactions'].map((row) => (
          <div key={row} className="flex items-center gap-2 text-xs font-normal">
            <span className="grid size-4 place-items-center rounded-[5px] bg-foreground text-background">
              <Check size={10} strokeWidth={2} />
            </span>
            {row}
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-full bg-foreground text-xs font-medium text-background">
        <Download size={14} strokeWidth={2} />
        Export CSV
      </div>
    </div>
  )
}

function DropVisual() {
  const files = [
    { name: '2024 history.csv', rows: '412 rows', hue: 1 },
    { name: '2025 history.csv', rows: '389 rows', hue: 4 },
  ]
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2 rounded-2xl border border-dashed border-foreground/25 p-3">
      {files.map((file) => (
        <div key={file.name} className="flex items-center gap-2.5 rounded-xl bg-background p-2 shadow-xs">
          <span
            style={{ color: `rgb(var(--chart-${file.hue}))`, backgroundColor: `rgb(var(--chart-${file.hue}) / 0.12)` }}
            className="grid size-8 shrink-0 place-items-center rounded-lg"
          >
            <FileSpreadsheet size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">{file.name}</span>
            <span className="figure block text-2xs font-normal text-muted-foreground">{file.rows}</span>
          </span>
          <Check size={14} strokeWidth={2} className="text-up" />
        </div>
      ))}
      <p className="figure pt-0.5 text-center text-2xs font-normal text-muted-foreground">
        2 files merged, 14 duplicates removed
      </p>
    </div>
  )
}

function ExploreVisual() {
  const bars = [34, 52, 41, 68, 47, 80, 58, 92]
  return (
    <div className="w-full max-w-[15rem] rounded-2xl bg-background p-3 shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xs font-normal text-muted-foreground">Net dividends</p>
          <p className="figure text-lg font-semibold leading-6 tracking-tight">€1,284.20</p>
        </div>
        <span className="figure text-2xs font-medium text-up">+18.4%</span>
      </div>
      <div className="mt-3 flex h-16 items-end gap-1">
        {bars.map((height, index) => (
          <span
            key={index}
            style={{ height: `${height}%` }}
            className={index === bars.length - 1 ? 'flex-1 rounded-t-[3px] bg-chart-2' : 'flex-1 rounded-t-[3px] bg-chart-2/40'}
          />
        ))}
      </div>
    </div>
  )
}
