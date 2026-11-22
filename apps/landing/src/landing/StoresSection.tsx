import { Clock, FileCheck } from "lucide-react";
import { Float, IsoGrid, Stagger, StaggerItem } from "../motion";
import { SectionHead, WRAP } from "./common";

const ITEMS = [
  {
    icon: <Clock className="size-6" />,
    title: "Existence",
    description: "This transaction was recorded at or before block N, timestamp T. A donor can prove the record predates any later report, dispute, or audit.",
    detail: "Anchored on Base",
  },
  {
    icon: <FileCheck className="size-6" />,
    title: "Integrity",
    description: "The amount, date, campaign, and recipient in this receipt are byte-for-byte what was recorded then. Nothing was edited afterwards.",
    detail: "Recomputed, never trusted",
  },
];

export default function StoresSection() {
  return (
    <section className="relative overflow-hidden bg-t-stone py-16 md:py-24">
      <IsoGrid cy="40%" />
      <div className={`${WRAP} relative z-10`}>
        <SectionHead
          badge="What The Chain Actually Stores"
          title="Two Things You Can Prove"
          description="No personal data. No unblinded amount, by default. Only a keccak256 fingerprint, batched into a Merkle tree."
        />
        <Stagger className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {ITEMS.map((it) => (
            <StaggerItem key={it.title}>
              <div className="h-full rounded-2xl border border-t-line bg-t-paper p-8 transition-transform duration-300 hover:-translate-y-1">
                <Float amplitude={4} duration={7} className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-t-mint text-t-accent">
                  {it.icon}
                </Float>
                <h3 className="mb-3 text-xl text-t-ink">{it.title}</h3>
                <p className="mb-4 leading-relaxed text-t-muted">{it.description}</p>
                <p className="text-sm font-semibold text-t-honey">{it.detail}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
