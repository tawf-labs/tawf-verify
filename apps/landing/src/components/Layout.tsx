import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Button from "./ui/Button";

const REPO_URL = "https://github.com/tawf-labs/tawf-verify";

const NAV_LINKS = [
  { label: "The Problem", href: "#problem" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Not Custody", href: "#not-custody" },
  { label: "What's Real", href: "#status" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col selection:bg-tawf-gold/30 selection:text-tawf-green bg-tawf-sand">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-tawf-green text-tawf-sand px-4 py-2 rounded-lg z-[100] focus:outline-none focus:ring-2 focus:ring-tawf-gold"
      >
        Skip to main content
      </a>

      <header>
        <nav
          className="fixed top-0 left-0 right-0 z-50 bg-tawf-sand/90 backdrop-blur-md border-b border-tawf-green/10"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <img src="/images/tawftransparent.png" alt="Tawf" className="h-10 w-auto invert" />
              <span className="font-serif text-xl text-tawf-green">
                verify<span className="text-tawf-gold">.</span>
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-widest uppercase text-tawf-ink/70 hover:text-tawf-green transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button href={REPO_URL} target="_blank" variant="secondary" size="sm">
                GitHub
              </Button>
            </div>

            <button
              className="lg:hidden p-3 text-tawf-green min-h-[48px] min-w-[48px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-tawf-green/10 bg-white">
              <div className="px-6 py-4 space-y-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm font-medium tracking-widest uppercase text-tawf-ink/70 hover:text-tawf-green"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium tracking-widest uppercase text-tawf-green border border-tawf-green px-6 py-2.5 rounded-full text-center"
                >
                  GitHub
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow pt-20" id="main-content" role="main">
        {children}
      </main>

      <footer className="bg-tawf-ink text-white/60 py-16 border-t border-white/10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <img src="/images/tawftransparent.png" alt="Tawf" className="-ml-3 h-16 w-auto mb-2" />
            <h3 className="sr-only">tawf-verify</h3>
            <p className="text-sm max-w-sm leading-relaxed">
              A notary, not a custodian. This repository publishes hashes, not assets, and holds no rupiah.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium tracking-widest uppercase text-xs mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a href={`${REPO_URL}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  README
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/prd.md`} target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  Full spec (prd.md)
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-tawf-gold transition-colors"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  Apache-2.0 License
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium tracking-widest uppercase text-xs mb-6">Tawf Ecosystem</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a href="https://tawf.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  Tawf Islamic Foundation
                </a>
              </li>
              <li>
                <a href="https://tawf.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  Tawf Labs
                </a>
              </li>
              <li>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-tawf-gold transition-colors">
                  tawf-verify on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>&copy; {new Date().getFullYear()} Tawf Labs. Apache-2.0.</p>
          <p className="mt-4 md:mt-0 italic">No token. No custody. No wallet required for donors.</p>
        </div>
      </footer>
    </div>
  );
}
