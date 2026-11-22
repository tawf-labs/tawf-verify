import { isoBox, type Pt } from '../../motion';

/* One open box, shared by the two vaults so they can be compared side by side: the rim is the top face,
 * and the opening is that face shrunk towards its centre. */
export const BOX = { x: 150, y: 196, s: 76, h: 48 };
export const box = isoBox(BOX.x, BOX.y, BOX.s, BOX.s, BOX.h);
export const centre: Pt = [
  (box.top[0][0] + box.top[2][0]) / 2,
  (box.top[0][1] + box.top[2][1]) / 2,
];
export const opening: Pt[] = box.top.map(([x, y]) => [centre[0] + (x - centre[0]) * 0.74, centre[1] + (y - centre[1]) * 0.74] as Pt);
