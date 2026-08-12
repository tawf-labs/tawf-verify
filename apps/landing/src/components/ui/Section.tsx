import React, { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: "sand" | "white" | "ink" | "green";
  id?: string;
}

const bgStyles = {
  sand: "bg-tawf-sand",
  white: "bg-white",
  ink: "bg-tawf-ink",
  green: "bg-tawf-green",
};

export default function Section({ children, className = "", background = "sand", id }: SectionProps) {
  return (
    <section id={id} className={`py-16 md:py-24 px-6 ${bgStyles[background]} ${className}`.trim()}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
