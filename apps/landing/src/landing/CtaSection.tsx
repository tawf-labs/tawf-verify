import { ArrowRight } from "lucide-react";
import { RevealText, TurningPattern } from "../motion";
import { Btn, H2, REPO_URL, WRAP } from "./common";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-t-accent py-20 text-center md:py-28">
      <TurningPattern color="#D3ECDD" opacity={0.18} />
      <div className={`${WRAP} relative z-10 max-w-3xl`}>
        <RevealText text="Ship Transparency, Not Custody Risk" className={`${H2} !text-white`} />
        <p className="mb-10 mt-6 text-lg leading-relaxed text-white/85 md:text-xl">
          Under 30 minutes of integration work for a competent backend developer. No donor wallet. No gas on their
          side. One API key.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Btn href={REPO_URL} variant="onDark">Get Started on GitHub <ArrowRight className="size-4" /></Btn>
          <Btn href={`${REPO_URL}/blob/main/prd.md`} variant="paper" className="!border-white/40 !bg-transparent !text-white hover:!border-white">
            Read prd.md <ArrowRight className="size-4" />
          </Btn>
        </div>
        <p className="mt-8 text-sm text-white/95">Apache-2.0. Part of the Tawf ecosystem.</p>
      </div>
    </section>
  );
}
