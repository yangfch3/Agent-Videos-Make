// 本片的低多边形质感：平涂材质、顶点抖动
import * as THREE from "three";

export const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95, metalness: 0, ...o });
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
