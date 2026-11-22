import React from "react";
import { motion } from "motion/react";
import { Magnetic, RevealText } from "../motion";

export const REPO_URL = "https://github.com/tawf-labs/tawf-verify";
export const WRAP = "mx-auto max-w-7xl px-6";
export const H2 = "m-0 font-sans text-[clamp(30px,4vw,48px)] font-medium leading-[1.08] tracking-[-0.03em] text-t-ink";
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-t-accent focus-visible:ring-offset-2";

export function SectionHead({ badge, title, description, dark = false, center = true }: { badge?: string; title: string; description?: string; dark?: boolean; center?: boolean }) {
  return (
    <div className={`mb-12 max-w-3xl md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      {badge && <p className={`mb-4 text-sm font-medium ${dark ? "text-t-butter" : "text-t-accent"}`}>{badge}</p>}
      <RevealText text={title} className={`${H2} ${dark ? "!text-white" : ""}`} />
      {description && <p className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/75" : "text-t-muted"}`}>{description}</p>}
    </div>
  );
}

export function Btn({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "paper" | "onDark"; className?: string }) {
  const look = {
    primary: "bg-t-accent text-white hover:bg-t-hover",
    paper: "border border-t-line bg-t-paper text-t-ink hover:border-t-ink",
    onDark: "bg-t-paper text-t-ink hover:bg-white",
  }[variant];
  const a = (
    <motion.a
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-12 min-w-[44px] items-center justify-center gap-2.5 rounded-xl px-6 text-[15px] font-medium transition-colors ${look} ${FOCUS} ${className}`}
    >
      {children}
    </motion.a>
  );
  return variant === "paper" ? a : <Magnetic strength={6}>{a}</Magnetic>;
}
