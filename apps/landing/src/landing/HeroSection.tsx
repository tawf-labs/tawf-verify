import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { DrawnUnderline, HeroStage, IsoGrid } from "../motion";
import MerkleArt from "./art/MerkleArt";
import { Btn, REPO_URL, WRAP } from "./common";

export default function HeroSection() {
  const reduce = useReducedMotion();
  const rise = (d: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 16 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] as const },
  });
  return (
    <section className="relative -mt-20 overflow-hidden bg-t-glaze pb-12">
      <IsoGrid color="#C3D3CA" />
      <div className={`${WRAP} relative z-10`}>
        <div className="grid min-h-[85svh] items-center gap-8 py-8 pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-16">
          <div className="text-center lg:text-left">
            <motion.p {...rise(0)} className="mb-5 text-sm font-medium text-t-accent">
              Cryptographic Notarization for ZISWAF
            </motion.p>
            <motion.h1
              {...rise(0.1)}
              className="m-0 max-w-[11em] font-sans text-[clamp(40px,5.4vw,68px)] font-medium leading-[1.04] tracking-[-0.035em] text-t-ink max-lg:mx-auto"
            >
              A notary, not a <DrawnUnderline>custodian</DrawnUnderline>
            </motion.h1>
            <motion.p {...rise(0.2)} className="mt-6 max-w-[34em] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-t-muted max-lg:mx-auto">
              Keep collecting donations the ordinary way: QRIS, bank transfer, virtual account, e-wallet, IDRX.
            </motion.p>
            <motion.p {...rise(0.25)} className="mt-3 max-w-[34em] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-t-muted max-lg:mx-auto">
              Make every record independently verifiable on a public blockchain, without ever holding a rupiah.
            </motion.p>
            <motion.div {...rise(0.3)} className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Btn href={`${REPO_URL}/blob/main/prd.md`}>
                Read the Spec <ArrowRight className="size-4" />
              </Btn>
              <Btn href={REPO_URL} variant="paper">
                View on GitHub <ArrowRight className="size-4" />
              </Btn>
            </motion.div>
            <motion.p {...rise(0.4)} className="mt-8 text-sm font-medium text-t-muted">
              No token. No custody. No wallet required for donors.
            </motion.p>
          </div>
          <HeroStage className="mx-auto w-full max-w-[560px]">
            <MerkleArt />
          </HeroStage>
        </div>
      </div>
    </section>
  );
}
