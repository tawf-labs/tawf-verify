import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { IsoBox, Float, FlowLine, FILLS, PAL, draw, drop, pop, fade, VIEW, useInViewLoop, useLoopClock } from '../../motion';
import Coin from './Coin';

/* Records become one root, and the root is stamped on a chain block. Four record tiles drop in, pair up through
 * drawn lines into two nodes, those join into one root, and a seal is stamped onto the chain block below.
 * Every line starts and ends on the floor centre of the blocks it joins (box front corner minus half its side),
 * and the lines are drawn before the blocks so the blocks cover their ends. */
const LEAF_X = [80, 200, 320, 440];
const LEAF = { y: 78, s: 34, h: 10 };
const MID = { y: 160, s: 40, h: 12 };
const ROOT = { x: 260, y: 240, s: 46, h: 14 };
const CHAIN = { x: 260, y: 372, s: 128, h: 18 };
const SEAL = { x: 260, y: CHAIN.y - CHAIN.h - CHAIN.s / 2 + 2, r: 24 };   // sits on the chain block's top face
const mids = [(LEAF_X[0] + LEAF_X[1]) / 2, (LEAF_X[2] + LEAF_X[3]) / 2];
const c = (x: number, y: number, s: number) => [x, y - s / 2] as const;      // floor centre of a block

const LINES = [
  { d: `M${LEAF_X[0]} ${c(0, LEAF.y, LEAF.s)[1]} L${mids[0]} ${c(0, MID.y, MID.s)[1]}`, at: 0.9 },
  { d: `M${LEAF_X[1]} ${c(0, LEAF.y, LEAF.s)[1]} L${mids[0]} ${c(0, MID.y, MID.s)[1]}`, at: 1.0 },
  { d: `M${LEAF_X[2]} ${c(0, LEAF.y, LEAF.s)[1]} L${mids[1]} ${c(0, MID.y, MID.s)[1]}`, at: 1.1 },
  { d: `M${LEAF_X[3]} ${c(0, LEAF.y, LEAF.s)[1]} L${mids[1]} ${c(0, MID.y, MID.s)[1]}`, at: 1.2 },
  { d: `M${mids[0]} ${c(0, MID.y, MID.s)[1]} L${ROOT.x} ${c(0, ROOT.y, ROOT.s)[1]}`, at: 1.9 },
  { d: `M${mids[1]} ${c(0, MID.y, MID.s)[1]} L${ROOT.x} ${c(0, ROOT.y, ROOT.s)[1]}`, at: 2.0 },
  { d: `M${ROOT.x} ${c(0, ROOT.y, ROOT.s)[1]} L${SEAL.x} ${SEAL.y}`, at: 2.6 },
];
const INTRO_END = 3.8;

export default function MerkleArt({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const live = useInViewLoop(ref);
  const ring = useRef<SVGCircleElement>(null);
  // a soft ring leaves the seal now and then: scale + opacity only
  useLoopClock(live, (p) => {
    const el = ring.current;
    if (!el) return;
    el.style.transform = `scale(${(1 + 0.9 * p).toFixed(3)})`;
    el.style.opacity = (0.5 * (1 - p)).toFixed(3);
  }, 4, INTRO_END);

  return (
    <motion.svg
      ref={ref}
      viewBox="0 20 520 380"
      className={`block h-auto w-full overflow-visible ${className}`}
      aria-hidden="true"
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={VIEW}
    >
      <motion.ellipse variants={fade(0.2, 0.6)} cx={CHAIN.x + 6} cy={CHAIN.y - 16} rx={104} ry={30} fill="rgba(16,38,31,.07)" />

      {LINES.map((l, i) => (
        <g key={i}>
          <motion.path variants={draw(l.at, 0.8)} d={l.d} stroke={PAL.line} strokeWidth="3" strokeLinecap="round" fill="none" />
          <FlowLine d={l.d} stroke={PAL.accent} strokeWidth={2} dash="1.5 4" duration={3.2} startAfter={INTRO_END} opacity={0.75} />
        </g>
      ))}

      <IsoBox x={CHAIN.x} y={CHAIN.y} a={CHAIN.s} b={CHAIN.s} h={CHAIN.h} fills={[...FILLS.ledger]} variants={drop(0, 0.3, 0.16, -50)} />

      {LEAF_X.map((x, i) => (
        <Float key={x} as="g" amplitude={3} duration={7 + i} delay={i * 1.3} run={live}>
          <IsoBox x={x} y={LEAF.y} a={LEAF.s} b={LEAF.s} h={LEAF.h} fills={[...FILLS.paper]} variants={drop(i, 0.1, 0.12, -44)} />
        </Float>
      ))}
      {mids.map((x, i) => (
        <IsoBox key={x} x={x} y={MID.y} a={MID.s} b={MID.s} h={MID.h} fills={[...FILLS.waqf]} variants={drop(i, 1.5, 0.12, -40)} />
      ))}
      <IsoBox x={ROOT.x} y={ROOT.y} a={ROOT.s} b={ROOT.s} h={ROOT.h} fills={[...FILLS.zakat]} variants={drop(0, 2.3, 0.16, -40)} />

      {/* the stamp: a seal lands on the chain block and its check is drawn */}
      <g>
        <circle ref={ring} cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="none" stroke={PAL.accent} strokeWidth="2" style={{ transformBox: 'fill-box', transformOrigin: 'center', opacity: 0 }} />
        <Coin cx={SEAL.x} cy={SEAL.y} r={SEAL.r} color={PAL.accent} face={PAL.accent} variants={pop(2.9)} />
        <motion.path
          variants={draw(3.2, 0.6)}
          d={`M${SEAL.x - 10} ${SEAL.y} L${SEAL.x - 2} ${SEAL.y + 5} L${SEAL.x + 11} ${SEAL.y - 6}`}
          stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </motion.svg>
  );
}
