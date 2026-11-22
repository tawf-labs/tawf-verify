import { motion, useReducedMotion } from "motion/react";
import { Float } from "../motion";
import { SectionHead, WRAP } from "./common";

export default function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <section id="problem" className="scroll-mt-24 border-y border-t-line bg-t-paper py-16 md:py-24">
      <div className={WRAP}>
        <SectionHead
          badge="The Problem"
          title="Trust Us Doesn't Scale"
          description="Indonesian ZISWAF operators already publish reports. Nobody can check them."
        />
        <Float amplitude={4} duration={9}>
          <motion.blockquote
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-10 max-w-3xl rounded-2xl bg-t-butter/60 p-8 md:p-10"
          >
            <p className="m-0 text-center font-sans text-2xl font-medium leading-snug tracking-[-0.02em] text-t-ink md:text-3xl">
              &ldquo;Donor pays via QRIS, operator writes a row in MySQL, operator publishes a PDF report quarterly,
              donor believes it.&rdquo;
            </p>
          </motion.blockquote>
        </Float>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-relaxed text-t-muted md:text-xl">
            Every link after the first is unfalsifiable. An operator can edit a row, backdate a distribution, or
            reconcile a shortfall silently, and no external party can detect it.{" "}
            <span className="font-semibold text-t-ink">
              Operators are not distrusted. They lack a mechanism to demonstrate trustworthiness at record level.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
