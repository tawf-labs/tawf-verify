import { CheckCircle2, ChevronRight, Minus, XCircle } from "lucide-react";
import { Stagger, StaggerItem } from "../motion";
import CustodianVault from "./art/CustodianVault";
import RegistryVault from "./art/RegistryVault";
import { SectionHead, WRAP } from "./common";

const BAD = [
  "Mints, burns, and transfers a real ERC-20 balance per order",
  "A contract bug there can drain funds",
  "Issues a transferable asset: an OJK/Bappebti conversation",
  "One on-chain write per order, financially absurd at ZISWAF volume",
];
const GOOD = [
  "Publishes a keccak256 fingerprint of a record. No value, ever.",
  "No payable, no receive, no withdraw. Nothing to drain.",
  "No asset issued. A far lighter regulatory posture.",
  "One write per batch: hundreds to millions of records, under Rp 1 each.",
];

export default function CustodySection() {
  return (
    <section id="not-custody" className="scroll-mt-24 bg-t-ink py-16 md:py-24">
      <div className={WRAP}>
        <SectionHead
          dark
          badge="The Reference Teardown"
          title="Not Another Token Vault"
          description="The brief was to reverse a token-reward coffee shop contract. That product is worth departing from, on every axis that matters for a regulated charity flow."
        />
        <Stagger className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
          <StaggerItem>
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10">
              <CustodianVault className="mx-auto mb-6 w-full max-w-[300px]" />
              <div className="mb-6 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-white/10"><XCircle className="size-6 text-white/80" /></div>
                <h3 className="text-2xl text-white">Custodian Vault</h3>
              </div>
              <ul className="m-0 list-none space-y-3 p-0 text-white/80">
                {BAD.map((t) => (
                  <li key={t} className="flex items-start gap-3"><Minus className="mt-0.5 size-5 shrink-0 text-white/80" /><span>{t}</span></li>
                ))}
              </ul>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="h-full rounded-2xl border-2 border-t-mint bg-t-accent p-8 md:p-10">
              <RegistryVault className="mx-auto mb-6 w-full max-w-[300px]" />
              <div className="mb-6 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-white"><CheckCircle2 className="size-6 text-t-accent" /></div>
                <h3 className="text-2xl text-white">tawf-verify Registry</h3>
              </div>
              <ul className="m-0 list-none space-y-3 p-0 text-white/90">
                {GOOD.map((t) => (
                  <li key={t} className="flex items-start gap-3"><ChevronRight className="mt-0.5 size-5 shrink-0 text-t-butter" /><span>{t}</span></li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </Stagger>
        <p className="mx-auto mt-12 max-w-2xl text-center text-lg text-white/80">
          A contract bug here can at worst stop new anchors. It can never touch a rupiah.
        </p>
      </div>
    </section>
  );
}
