// 低多边形基础件：确定性随机、平涂材质、建网格、顶点抖动
import * as THREE from "three";

export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95, metalness: 0, ...o });
export const mesh = (geo, mat, parent, pos = [0, 0, 0], shadow = true) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
};
export const jitter = (geo, amt, rnd, keep = () => false) => {  // keep(x, y, z) 为真的顶点不动
  const p = geo.attributes.position, seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const r3 = (v) => Math.round(v * 1000) + 0;  // +0 把 -0 归一：圆柱起止接缝处的顶点才能共用同一位移
    const key = `${r3(p.getX(i))},${r3(p.getY(i))},${r3(p.getZ(i))}`;
    if (keep(p.getX(i), p.getY(i), p.getZ(i))) continue;
    if (!seen.has(key)) seen.set(key, [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);
    const d = seen.get(key);
    p.setXYZ(i, p.getX(i) + d[0] * amt, p.getY(i) + d[1] * amt, p.getZ(i) + d[2] * amt);
  }
  geo.computeVertexNormals();
  return geo;
};
