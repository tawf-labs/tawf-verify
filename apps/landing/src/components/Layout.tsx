import React, { useState } from "react";
import { Menu, X } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-t-stone">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-t-accent text-white px-4 py-2 rounded-xl z-[100] focus:outline-none focus:ring-2 focus:ring-t-ink"
      >
        Skip to main content
      </a>

      <header>
        <nav
          className="fixed top-0 left-0 right-0 z-50 bg-t-stone/90 backdrop-blur-md border-b border-t-line"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <img src="/images/tawftransparent.png" alt="Tawf" className="h-10 w-auto invert" />
              <span className="text-xl font-medium tracking-[-0.03em] text-t-ink">
                verify<span className="text-t-accent">.</span>
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-t-muted transition-colors hover:text-t-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-t-accent rounded-md"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-xl border border-t-line bg-t-paper px-5 text-[15px] font-medium text-t-ink transition-colors hover:border-t-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-t-accent"
              >
                GitHub
              </a>
            </div>

            <button
              className="lg:hidden p-3 text-t-ink min-h-[48px] min-w-[48px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-t-line bg-t-paper">
              <div className="px-6 py-4 space-y-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex min-h-[44px] items-center text-base font-medium text-t-muted hover:text-t-ink"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center rounded-xl border border-t-line bg-t-paper text-base font-medium text-t-ink"
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

      <footer className="bg-t-ink text-white/80 py-16 border-t border-white/10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <img src="/images/tawftransparent.png" alt="Tawf" className="-ml-3 h-16 w-auto mb-2" />
            <h3 className="sr-only">tawf-verify</h3>
            <p className="text-sm max-w-sm leading-relaxed">
              A notary, not a custodian. This repository publishes hashes, not assets, and holds no rupiah.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a href={`${REPO_URL}#readme`} target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  README
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/prd.md`} target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  Full spec (prd.md)
                </a>
              </li>
              <li>
                <a
                  href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-t-butter transition-colors"
                >
                  Contributing
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  Apache-2.0 License
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-medium mb-6">Tawf Ecosystem</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a href="https://tawf.foundation" target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  Tawf Islamic Foundation
                </a>
              </li>
              <li>
                <a href="https://tawflabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  Tawf Labs
                </a>
              </li>
              <li>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-t-butter transition-colors">
                  tawf-verify on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>&copy; {new Date().getFullYear()} Tawf Labs. Apache-2.0.</p>
          <p className="mt-4 md:mt-0">No token. No custody. No wallet required for donors.</p>
        </div>
      </footer>
    </div>
  );
}
