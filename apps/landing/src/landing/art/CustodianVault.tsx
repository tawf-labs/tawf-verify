import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Float, FILLS, PAL, drop, pop, fade, VIEW, useInViewLoop, pts, EASE } from '../../motion';
import Coin from './Coin';
import { BOX, box, centre, opening } from './vaultShared';

/* A custodian: an open vault with the money inside it. The box lands, then coins drop in one by one and rest there,
 * the top one bobbing a little. Compare RegistryVault, the same box with nothing in it. */
const COINS = [
  { dx: -17, dy: 10 }, { dx: 17, dy: 10 }, { dx: 0, dy: 3 }, { dx: 0, dy: -4 },
];

export default function CustodianVault({ className = '' }: { className?: string }) {
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
        <polygon points={pts(box.left)} fill={FILLS.ledger[0]} />
        <polygon points={pts(box.right)} fill={FILLS.ledger[1]} />
        <polygon points={pts(box.top)} fill={FILLS.ledger[2]} />
        <polygon points={pts(opening)} fill="#0B1A15" />
        <polyline points={pts(box.edge)} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
      </motion.g>
      {COINS.map((c, i) => {
        const coin = (
          <Coin cx={centre[0] + c.dx} cy={centre[1] + c.dy} r={15} color={PAL.honey} face={PAL.butter}
            variants={{ hidden: { opacity: 0, y: -34 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.9 + i * 0.28, ease: EASE } } }} />
        );
        return i === COINS.length - 1
          ? <Float key={i} as="g" amplitude={2.5} duration={5} delay={3} run={live}>{coin}</Float>
          : <g key={i}>{coin}</g>;
      })}
    </motion.svg>
  );
}
