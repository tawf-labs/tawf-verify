import { FileCode, LayoutDashboard, Server, ShieldCheck, Terminal, Wrench } from "lucide-react";
import { Stagger, StaggerItem } from "../motion";
import { SectionHead, WRAP } from "./common";

const ITEMS = [
  { icon: <FileCode className="size-6" />, title: "@tawf/verify-core", desc: "Canonicalization, Merkle tree, proof verification. 100% branch coverage on the hashing core.", real: true },
  { icon: <ShieldCheck className="size-6" />, title: "TawfVerifyRegistry.sol", desc: "Append-only, per-org signer authority, on-chain Merkle verification. Byte-for-byte parity with the off-chain core.", real: true },
  { icon: <Server className="size-6" />, title: "@tawf/verify-server", desc: "Real Merkle batching. Chain submission is a documented stub, ready for a real signer.", real: false },
  { icon: <LayoutDashboard className="size-6" />, title: "@tawf/verify-react", desc: "VerifyBadge, VerifyPanel, TransparencyBoard. Real components, canned data for now.", real: false },
  { icon: <Terminal className="size-6" />, title: "@tawf/verify-cli", desc: "tawf-verify check runs with no API key and no Tawf infrastructure, against a public RPC only.", real: true },
  { icon: <Wrench className="size-6" />, title: "Hosted verify-service", desc: "The public verification page and REST API. Structured, stubbed, documented.", real: false },
];

/* Calm section: status text stays still on purpose. */
export default function StatusSection() {
  return (
    <section id="status" className="scroll-mt-24 bg-t-stone py-16 md:py-24">
      <div className={WRAP}>
        <SectionHead
          badge="Not Promises. Committed Code."
          title="What's Real Today"
          description="This is what shipped, not a roadmap slide. The crypto core and the contract are real, tested, and cross-checked against each other."
        />
        <Stagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <StaggerItem key={it.title}>
              <div className="h-full rounded-2xl border border-t-line bg-t-paper p-8 transition-transform duration-300 hover:-translate-y-1">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-t-mint text-t-accent">{it.icon}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${it.real ? "bg-t-accent text-white" : "bg-t-butter text-t-ink"}`}>
                    {it.real ? "Real" : "Stub"}
                  </span>
                </div>
                <h3 className="mb-2 text-lg text-t-ink">{it.title}</h3>
                <p className="text-sm leading-relaxed text-t-muted">{it.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
