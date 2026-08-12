import React from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileCode,
  Layers,
  Link2,
  LayoutDashboard,
  Minus,
  Receipt,
  Server,
  ShieldCheck,
  Terminal,
  Wrench,
  XCircle,
} from "lucide-react";
import Button from "./ui/Button";
import Section from "./ui/Section";
import SectionHeader from "./ui/SectionHeader";
import FeatureCard from "./ui/FeatureCard";

const REPO_URL = "https://github.com/tawf-labs/tawf-verify";

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="min-h-[90vh] px-6 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <div className="w-[90vw] max-w-[600px] h-[90vw] max-h-[600px] md:w-[800px] md:h-[800px] border border-tawf-green rounded-full absolute transform -translate-y-1/4"></div>
          <div className="w-[120vw] max-w-[900px] h-[120vw] max-h-[900px] md:w-[1200px] md:h-[1200px] border border-tawf-green rounded-full absolute transform -translate-y-1/4"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-tawf-gold"></div>
              <span className="text-sm font-semibold tracking-[0.2em] uppercase text-tawf-gold">Cryptographic Notarization for ZISWAF</span>
              <div className="h-px w-12 bg-tawf-gold"></div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.05] tracking-tight text-tawf-green mb-8">
              A notary,
              <br />
              <span className="italic text-tawf-gold">not a custodian</span>
            </h1>

            <p className="text-xl text-tawf-muted font-light leading-relaxed mb-6">
              Keep collecting donations the ordinary way: QRIS, bank transfer, virtual account, e-wallet, IDRX.
            </p>
            <p className="text-lg text-tawf-muted font-light leading-relaxed mb-10">
              Make every record independently verifiable on a public blockchain, without ever holding a rupiah.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href={`${REPO_URL}/blob/main/prd.md`} target="_blank" variant="primary" size="md">
                Read the Spec
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href={REPO_URL} target="_blank" variant="secondary" size="md">
                View on GitHub
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <p className="mt-10 text-sm font-semibold tracking-wider uppercase text-tawf-muted">
              No token. No custody. No wallet required for donors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Trust Gap */}
      <Section id="problem" background="white" className="border-y border-tawf-green/10">
        <SectionHeader
          badge="The Problem"
          title="Trust Us Doesn't Scale"
          description="Indonesian ZISWAF operators already publish reports. Nobody can check them."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto p-8 md:p-10 bg-tawf-sand/50 border border-tawf-green/10 rounded-2xl mb-10"
        >
          <p className="font-serif text-2xl md:text-3xl text-tawf-green leading-relaxed text-center italic">
            &ldquo;Donor pays via QRIS, operator writes a row in MySQL, operator publishes a PDF report quarterly,
            donor believes it.&rdquo;
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center">
          <p className="text-tawf-muted text-xl leading-relaxed">
            Every link after the first is unfalsifiable. An operator can edit a row, backdate a distribution, or
            reconcile a shortfall silently, and no external party can detect it.{" "}
            <span className="font-semibold text-tawf-green">
              Operators are not distrusted. They lack a mechanism to demonstrate trustworthiness at record level.
            </span>
          </p>
        </div>
      </Section>

      {/* Two things you can prove */}
      <Section background="sand">
        <SectionHeader
          badge="What The Chain Actually Stores"
          title="Two Things You Can Prove"
          description="No personal data. No unblinded amount, by default. Only a keccak256 fingerprint, batched into a Merkle tree."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            icon={<Clock className="w-7 h-7 text-tawf-gold" />}
            title="Existence"
            description="This transaction was recorded at or before block N, timestamp T. A donor can prove the record predates any later report, dispute, or audit."
            detail="Anchored on Base"
            featured
          />
          <FeatureCard
            icon={<FileCheck className="w-7 h-7 text-tawf-gold" />}
            title="Integrity"
            description="The amount, date, campaign, and recipient in this receipt are byte-for-byte what was recorded then. Nothing was edited afterwards."
            detail="Recomputed, never trusted"
            featured
          />
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" background="white" className="border-y border-tawf-green/10">
        <SectionHeader
          badge="The Flow"
          title="One Line Added, Nothing Else Changes"
          description="The operator's own payment flow is untouched. Anchoring happens on a schedule, in batches, off to the side."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              step: "01",
              icon: <Receipt className="w-6 h-6" />,
              title: "Record",
              desc: "tawf.record({...}) is the only line the operator's backend adds, called right after payment confirms.",
            },
            {
              step: "02",
              icon: <Layers className="w-6 h-6" />,
              title: "Batch",
              desc: "Every 5,000 records or 15 minutes, pending leaves are built into a Merkle tree. One tree, any number of records.",
            },
            {
              step: "03",
              icon: <Link2 className="w-6 h-6" />,
              title: "Anchor",
              desc: "A single signed anchorBatch() transaction commits the tree root to TawfVerifyRegistry on a public L2.",
            },
            {
              step: "04",
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "Verify",
              desc: "A donor's phone recomputes the leaf, walks the Merkle path, and reads the root back from the chain. Free, offline-capable.",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 border border-tawf-green/10 rounded-2xl bg-tawf-sand/30 relative"
            >
              <div className="w-12 h-12 bg-tawf-green rounded-full flex items-center justify-center mb-5 text-tawf-gold">{item.icon}</div>
              <span className="text-sm font-semibold tracking-wider uppercase text-tawf-gold">{item.step}</span>
              <h3 className="text-xl font-serif font-medium text-tawf-green mt-1 mb-3">{item.title}</h3>
              <p className="text-tawf-muted text-sm leading-relaxed">{item.desc}</p>
              {idx < 3 && (
                <ChevronRight className="hidden md:block w-6 h-6 text-tawf-gold/40 absolute -right-3 top-1/2 -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Not custody */}
      <Section id="not-custody" background="ink" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-tawf-gold/30 to-transparent"></div>
        <SectionHeader
          badge="The Reference Teardown"
          title="Not Another Token Vault"
          description="The brief was to reverse a token-reward coffee shop contract. That product is worth departing from, on every axis that matters for a regulated charity flow."
          light
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-10 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                <XCircle className="w-7 h-7 text-white/50" />
              </div>
              <h3 className="text-2xl font-serif text-white">Custodian Vault</h3>
            </div>
            <ul className="space-y-3 text-tawf-sand/70">
              <li className="flex items-start gap-3">
                <Minus className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span>Mints, burns, and transfers a real ERC-20 balance per order</span>
              </li>
              <li className="flex items-start gap-3">
                <Minus className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span>A contract bug there can drain funds</span>
              </li>
              <li className="flex items-start gap-3">
                <Minus className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span>Issues a transferable asset: an OJK/Bappebti conversation</span>
              </li>
              <li className="flex items-start gap-3">
                <Minus className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span>One on-chain write per order, financially absurd at ZISWAF volume</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-10 bg-tawf-green rounded-2xl border-2 border-tawf-gold"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-tawf-green" />
              </div>
              <h3 className="text-2xl font-serif text-white">tawf-verify Registry</h3>
            </div>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-tawf-gold shrink-0 mt-0.5" />
                <span>Publishes a keccak256 fingerprint of a record. No value, ever.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-tawf-gold shrink-0 mt-0.5" />
                <span>No payable, no receive, no withdraw. Nothing to drain.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-tawf-gold shrink-0 mt-0.5" />
                <span>No asset issued. A far lighter regulatory posture.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-tawf-gold shrink-0 mt-0.5" />
                <span>One write per batch: hundreds to millions of records, under Rp 1 each.</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <p className="text-center text-tawf-sand/60 text-lg italic mt-12 max-w-2xl mx-auto">
          A contract bug here can at worst stop new anchors. It can never touch a rupiah.
        </p>
      </Section>

      {/* Status */}
      <Section id="status" background="sand">
        <SectionHeader
          badge="Not Promises. Committed Code."
          title="What's Real Today"
          description="This is what shipped, not a roadmap slide. The crypto core and the contract are real, tested, and cross-checked against each other."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: <FileCode className="w-7 h-7 text-tawf-gold" />,
              title: "@tawf/verify-core",
              desc: "Canonicalization, Merkle tree, proof verification. 100% branch coverage on the hashing core.",
              real: true,
            },
            {
              icon: <ShieldCheck className="w-7 h-7 text-tawf-gold" />,
              title: "TawfVerifyRegistry.sol",
              desc: "Append-only, per-org signer authority, on-chain Merkle verification. Byte-for-byte parity with the off-chain core.",
              real: true,
            },
            {
              icon: <Server className="w-7 h-7 text-tawf-gold" />,
              title: "@tawf/verify-server",
              desc: "Real Merkle batching. Chain submission is a documented stub, ready for a real signer.",
              real: false,
            },
            {
              icon: <LayoutDashboard className="w-7 h-7 text-tawf-gold" />,
              title: "@tawf/verify-react",
              desc: "VerifyBadge, VerifyPanel, TransparencyBoard. Real components, canned data for now.",
              real: false,
            },
            {
              icon: <Terminal className="w-7 h-7 text-tawf-gold" />,
              title: "@tawf/verify-cli",
              desc: "tawf-verify check runs with no API key and no Tawf infrastructure, against a public RPC only.",
              real: true,
            },
            {
              icon: <Wrench className="w-7 h-7 text-tawf-gold" />,
              title: "Hosted verify-service",
              desc: "The public verification page and REST API. Structured, stubbed, documented.",
              real: false,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-8 bg-white border border-tawf-green/10 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 bg-tawf-sand rounded-full flex items-center justify-center">{item.icon}</div>
                <span
                  className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full ${
                    item.real ? "bg-tawf-green text-tawf-sand" : "bg-tawf-gold/20 text-tawf-green"
                  }`}
                >
                  {item.real ? "Real" : "Stub"}
                </span>
              </div>
              <h3 className="text-lg font-serif font-medium text-tawf-green mb-2">{item.title}</h3>
              <p className="text-tawf-muted text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="green" className="text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] border border-tawf-gold rounded-full absolute"></div>
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif text-tawf-sand mb-6">Ship Transparency, Not Custody Risk</h2>
          <p className="text-tawf-sand/80 mb-10 text-xl font-light leading-relaxed">
            Under 30 minutes of integration work for a competent backend developer. No donor wallet. No gas on their
            side. One API key.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button href={REPO_URL} target="_blank" variant="gold" size="lg">
              Get Started on GitHub
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button href={`${REPO_URL}/blob/main/prd.md`} target="_blank" variant="secondary" size="lg" className="border-tawf-sand text-tawf-sand hover:bg-tawf-sand/10 hover:text-tawf-sand">
              Read prd.md
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-tawf-sand/60 text-sm mt-6 italic">Apache-2.0. Part of the Tawf ecosystem.</p>
        </div>
      </Section>
    </>
  );
}
