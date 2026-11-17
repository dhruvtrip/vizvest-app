import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/landing'
import { prose } from '@/components/articles/mdx-components'
import { Card } from '@/components/ui/card'
import { Check } from '@/components/icons'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Use and Disclaimer | Vizvest',
  description:
    'Vizvest is for information only. It is not financial or tax advice, its figures can contain errors, and you should check them and consult a qualified tax adviser.',
  path: '/terms',
})

const section = 'mt-12 border-t border-border pt-12'

export default function TermsPage() {
  return (
    <div className="relative overflow-x-clip">
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
        <div className="mx-auto w-full max-w-prose">
          <header className="t-rise-in">
            <h1 className="text-[2rem] font-light leading-[2.375rem] tracking-[-0.035em] text-foreground sm:text-[2.5rem] sm:leading-[2.875rem] lg:text-5xl lg:leading-[3.375rem]">
              Terms of use and disclaimer
            </h1>
            <p className="figure mt-4 text-sm font-normal text-muted-foreground">Last updated November 2026</p>
          </header>

          <Card className="mt-10 p-6 sm:p-8">
            <h2 className="heading-card">The short version</h2>
            <ul className="mt-4 flex flex-col gap-3 text-base font-normal leading-relaxed">
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 shrink-0 text-foreground" />
                <span>
                  Vizvest is for information only. It is{' '}
                  <strong className={prose.strong}>not financial, investment or tax advice</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 shrink-0 text-foreground" />
                <span>
                  The figures can be wrong. Vizvest is software and can have bugs, so check anything that matters
                  against your official Trading&nbsp;212 statements.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 shrink-0 text-foreground" />
                <span>
                  Do not use Vizvest to prepare a tax return. Always consult a qualified tax adviser.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={16} className="mt-1 shrink-0 text-foreground" />
                <span>You use Vizvest at your own risk, and decisions you make with it are your own.</span>
              </li>
            </ul>
          </Card>

          <section aria-labelledby="no-advice" className={section}>
            <h2 id="no-advice" className={prose.h2}>
              Not advice
            </h2>
            <p className={prose.p}>
              Vizvest, its dashboard and its articles provide general information only. Nothing on this site is
              financial, investment, tax, accounting or legal advice, and nothing on it is a recommendation to buy,
              sell or hold any investment. Vizvest is not authorised or regulated to give advice.
            </p>
            <p className={prose.p}>
              Vizvest does not calculate tax and is not a tax tool. For anything to do with tax, including what you
              owe or what to report, consult a qualified tax adviser.
            </p>
          </section>

          <section aria-labelledby="accuracy" className={section}>
            <h2 id="accuracy" className={prose.h2}>
              Accuracy of the figures
            </h2>
            <p className={prose.p}>
              Everything Vizvest shows is worked out from the CSV files you upload. The results can be incomplete or
              wrong, for example because:
            </p>
            <ul className={prose.ul}>
              <li className={prose.li}>the software has bugs or makes calculations that do not match yours;</li>
              <li className={prose.li}>your export covers only part of your history, or files overlap or are missing;</li>
              <li className={prose.li}>Trading&nbsp;212 changes the format or meaning of its export;</li>
              <li className={prose.li}>currency conversion uses the rates in your file, which may differ from other sources.</li>
            </ul>
            <p className={prose.p}>
              Your Trading&nbsp;212 account and its official statements are the authoritative record. Always check
              Vizvest&apos;s figures against them before relying on them for any purpose.
            </p>
          </section>

          <section aria-labelledby="articles" className={section}>
            <h2 id="articles" className={prose.h2}>
              Articles and guides
            </h2>
            <p className={prose.p}>
              Our guides are written in good faith and dated, but products, fees and rules change, and a guide may be
              out of date or not apply to your circumstances. Check current details with Trading&nbsp;212 or the
              relevant official source.
            </p>
          </section>

          <section aria-labelledby="as-is" className={section}>
            <h2 id="as-is" className={prose.h2}>
              No warranty
            </h2>
            <p className={prose.p}>
              Vizvest is free and provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent
              permitted by law, we make no promises or warranties, express or implied, that it will be accurate,
              complete, reliable, available or free of errors, or that it is fit for any particular purpose.
            </p>
          </section>

          <section aria-labelledby="liability" className={section}>
            <h2 id="liability" className={prose.h2}>
              Limitation of liability
            </h2>
            <p className={prose.p}>
              To the fullest extent permitted by law, Vizvest and the people who make it are not liable for any loss
              or damage arising from your use of, or reliance on, the site, the dashboard, its figures or its
              articles. That includes investment losses, tax liabilities, penalties or interest, and any indirect or
              consequential loss.
            </p>
            <p className={prose.p}>
              Nothing in these terms excludes or limits liability that cannot be excluded or limited by law, such as
              liability for death or personal injury caused by negligence, or for fraud.
            </p>
          </section>

          <section aria-labelledby="trademark" className={section}>
            <h2 id="trademark" className={prose.h2}>
              Not affiliated with Trading 212
            </h2>
            <p className={prose.p}>
              Vizvest is an independent project. It is not affiliated with, endorsed by or sponsored by
              Trading&nbsp;212. &ldquo;Trading&nbsp;212&rdquo; is a trademark of its owner and is used only to
              describe the export files Vizvest reads.
            </p>
          </section>

          <section aria-labelledby="data" className={section}>
            <h2 id="data" className={prose.h2}>
              Your data
            </h2>
            <p className={prose.p}>
              Your CSV is processed in your browser and never uploaded. The{' '}
              <Link href="/privacy" className={prose.link}>
                privacy policy
              </Link>{' '}
              explains what we do and do not collect.
            </p>
          </section>

          <section aria-labelledby="changes" className={section}>
            <h2 id="changes" className={prose.h2}>
              Changes to these terms
            </h2>
            <p className={prose.p}>
              We may update these terms. The date at the top shows when they last changed. By using Vizvest you
              accept the terms in force at the time.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
