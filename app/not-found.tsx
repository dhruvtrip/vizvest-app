import Link from 'next/link'
import { Navbar, Footer } from '@/components/landing'
import { Button } from '@/components/ui/button'
import { Search } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="relative overflow-x-clip">
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main
        id="main-content"
        className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 pb-28 pt-32 text-center lg:pt-40"
      >
        <Search size={24} className="text-muted-foreground" />
        <h1 className="heading-page mt-4">Page not found</h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground">
          This page does not exist or has moved. Check the address, or start again from the home page.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2 sm:w-auto sm:max-w-none sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/articles">Read the articles</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
