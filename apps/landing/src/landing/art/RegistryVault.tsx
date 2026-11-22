import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Float, FlowLine, FILLS, PAL, draw, drop, fade, VIEW, useInViewLoop, pts } from '../../motion';
import { BOX, box, centre, opening } from './vaultShared';

/* A registry: the same box, but empty. It never holds funds, only fingerprint lines, which are drawn above the
 * opening and then drift slowly (dash flow). The box is lighter than the custodian's so the two read as opposites. */
const ARCS = [11, 21, 31, 41].map((rx) => ({ rx, ry: rx * 0.577 }));
const BASE_Y = centre[1] - 22;
const arc = (rx: number, ry: number) => `M${centre[0] - rx} ${BASE_Y} A${rx} ${ry} 0 0 1 ${centre[0] + rx} ${BASE_Y}`;

export default function RegistryVault({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const live = useInViewLoop(ref);
  return (
    <motion.svg
      ref={ref}
      viewBox="0 40 300 190"
      className={`block h-auto w-full overflow-visible ${className}`}
      aria-hidden="true"
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={VIEW}
    >
      <motion.ellipse variants={fade(0.1, 0.6)} cx={BOX.x + 4} cy={BOX.y - 30} rx={96} ry={26} fill="rgba(16,38,31,.07)" />
      <motion.g variants={drop(0, 0.2, 0.16, -46)}>
        <polygon points={pts(box.left)} fill={FILLS.waqf[0]} />
        <polygon points={pts(box.right)} fill={FILLS.waqf[1]} />
        <polygon points={pts(box.top)} fill={FILLS.waqf[2]} />
        <polygon points={pts(opening)} fill="#B9D3C6" />
        <polyline points={pts(box.edge)} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1" />
        <polygon points={pts(box.left)} fill="none" stroke={PAL.line} strokeWidth="1" />
        <polygon points={pts(box.right)} fill="none" stroke={PAL.line} strokeWidth="1" />
      </motion.g>

      <Float as="g" amplitude={4} duration={7} delay={2.4} run={live}>
        {ARCS.map((a, i) => (
          <g key={a.rx}>
            <motion.path variants={draw(0.9 + i * 0.2, 0.9)} d={arc(a.rx, a.ry)} stroke={PAL.accent} strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" fill="none" />
            <FlowLine d={arc(a.rx, a.ry)} stroke={PAL.accent} strokeWidth={3} dash="18 7" duration={9 + i * 2} reverse={i % 2 === 1} startAfter={2.4} />
          </g>
        ))}
      </Float>
    </motion.svg>
  );
}
