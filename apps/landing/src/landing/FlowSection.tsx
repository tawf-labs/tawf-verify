import { Layers, Link2, Receipt, ShieldCheck } from "lucide-react";
import { IsoGrid, StickySteps } from "../motion";
import StepTimeline from "./art/StepTimeline";
import { SectionHead, WRAP } from "./common";

const STEPS = [
  { step: "01", icon: <Receipt />, title: "Record", desc: "tawf.record({...}) is the only line the operator's backend adds, called right after payment confirms." },
  { step: "02", icon: <Layers />, title: "Batch", desc: "Every 5,000 records or 15 minutes, pending leaves are built into a Merkle tree. One tree, any number of records." },
  { step: "03", icon: <Link2 />, title: "Anchor", desc: "A single signed anchorBatch() transaction commits the tree root to TawfVerifyRegistry on a public L2." },
  { step: "04", icon: <ShieldCheck />, title: "Verify", desc: "A donor's phone recomputes the leaf, walks the Merkle path, and reads the root back from the chain. Free, offline-capable." },
];

export default function FlowSection() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 overflow-clip border-y border-t-line bg-t-paper py-16 md:py-24">
      <IsoGrid opacity={0.7} />
      <div className={`${WRAP} relative z-10`}>
        <SectionHead
          badge="The Flow"
          title="One Line Added, Nothing Else Changes"
          description="The operator's own payment flow is untouched. Anchoring happens on a schedule, in batches, off to the side."
        />
        <StickySteps steps={STEPS} fallback={<StepTimeline steps={STEPS} />} />
      </div>
    </section>
  );
}
