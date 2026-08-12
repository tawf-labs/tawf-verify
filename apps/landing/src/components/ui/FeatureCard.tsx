import React from "react";
import { motion } from "motion/react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
  index?: number;
  featured?: boolean;
}

export default function FeatureCard({ icon, title, description, detail, index = 0, featured = false }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`p-8 border rounded-2xl ${featured ? "border-tawf-gold/30 bg-tawf-sand/50" : "border-tawf-green/10 bg-tawf-sand/30"}`}
    >
      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm">{icon}</div>
      <h3 className="text-xl font-serif font-medium text-tawf-green mb-3">{title}</h3>
      <p className="text-tawf-muted leading-relaxed mb-4">{description}</p>
      {detail && <p className="text-sm font-semibold tracking-wider uppercase text-tawf-gold">{detail}</p>}
    </motion.div>
  );
}
