import { Hero, Features, HowItWorks, CTA, Copyright } from './(landing)/_components'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      
      {/* Footer */}
      <footer className="relative py-12 border-t border-glass-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gradient">Vizvest</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
            
            {/* Copyright */}
            <Copyright />
          </div>
        </div>
      </footer>
    </main>
  )
}
