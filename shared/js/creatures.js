// 低多边形人物与动物：关节为 Group，由调用方按时刻设角度
import * as THREE from "three";
import { M, mesh } from "./lowpoly.js";

const limb = (parent, pos, len, r, mat) => {
  const j = new THREE.Group(); j.position.set(...pos); parent.add(j);
  const g = new THREE.CylinderGeometry(r, r * 0.85, len, 6);
  g.translate(0, -len / 2, 0);
  mesh(g, mat, j, [0, 0, 0]);
  return j;
};

// 人：o = { coat, pants, skin, hair, hat, scale, bag }
export function person(scene, o) {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body); scene.add(root);
  const s = o.scale ?? 1, coat = M(o.coat), pants = M(o.pants ?? 0x3d4a5c), skin = M(o.skin ?? 0xf2d2b6);
  root.scale.setScalar(s);
  const legL = limb(body, [-0.11, 0.78, 0], 0.78, 0.075, pants), legR = limb(body, [0.11, 0.78, 0], 0.78, 0.075, pants);
  const torso = mesh(new THREE.CylinderGeometry(o.skirt ? 0.2 : 0.22, o.skirt ? 0.36 : 0.25, 0.72, 8), coat, body, [0, 1.14, 0]);
  const head = new THREE.Group(); head.position.set(0, 1.68, 0); body.add(head);
  mesh(new THREE.IcosahedronGeometry(0.2, 1), skin, head, [0, 0, 0]);
  mesh(new THREE.IcosahedronGeometry(0.21, 1), M(o.hair ?? 0x3b2a20), head, [0, 0.06, -0.04]).scale.set(1, 0.8, 1);
  if (o.hat) {
    mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 10), M(o.hat), head, [0, 0.2, 0]);
    mesh(new THREE.BoxGeometry(0.26, 0.03, 0.16), M(o.hat), head, [0, 0.14, 0.2]);
  }
  if (o.scarf) mesh(new THREE.TorusGeometry(0.15, 0.06, 5, 10), M(o.scarf), body, [0, 1.47, 0]).rotation.x = Math.PI / 2;
  const armL = limb(body, [-0.3, 1.46, 0], 0.62, 0.06, coat), armR = limb(body, [0.3, 1.46, 0], 0.62, 0.06, coat);
  if (o.bag) mesh(new THREE.BoxGeometry(0.1, 0.36, 0.42), M(o.bag), body, [0.31, 1.0, 0]);
  return { root, body, legL, legR, armL, armR, head, torso };
}

// 姿态：walk 步行相位，amp 摆幅；sit 坐姿 0–1；wave 挥手 0–1
export function pose(p, { phase = 0, amp = 0, sit = 0, wave = 0, bob = 0, armUp = 0 }) {
  const sw = Math.sin(phase) * 0.6 * amp;
  p.legL.rotation.x = sw * (1 - sit) - 1.5 * sit;
  p.legR.rotation.x = -sw * (1 - sit) - 1.5 * sit;
  p.armL.rotation.x = -sw * 0.9 * (1 - sit) - 0.4 * sit;
  p.armR.rotation.x = sw * 0.9 * (1 - sit) - 0.4 * sit - 1.45 * armUp;
  p.armR.rotation.z = wave * (0.4 + 0.3 * Math.sin(phase * 3));
  p.body.position.y = Math.abs(Math.cos(phase)) * 0.05 * amp - 0.38 * sit + bob;
}

export function bike(scene) {
  const g = new THREE.Group(), mat = M(0xc8564a), dark = M(0x2b2b2b);
  for (const z of [-0.55, 0.55]) mesh(new THREE.TorusGeometry(0.34, 0.04, 5, 16), dark, g, [0, 0.36, z]).rotation.y = Math.PI / 2;
  const bar = (a, b) => {
    const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), m = mesh(new THREE.CylinderGeometry(0.03, 0.03, v.length(), 5), mat, g, a);
    m.position.add(v.clone().multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  };
  bar([0, 0.36, -0.55], [0, 0.82, -0.1]); bar([0, 0.82, -0.1], [0, 0.85, 0.42]); bar([0, 0.36, 0.55], [0, 0.98, 0.45]); bar([0, 0.36, -0.55], [0, 0.4, 0.1]);
  mesh(new THREE.BoxGeometry(0.4, 0.05, 0.06), dark, g, [0, 1.0, 0.45]);
  mesh(new THREE.BoxGeometry(0.42, 0.25, 0.32), M(0x9a6b45), g, [0, 0.75, -0.62]);
  scene.add(g);
  return g;
}

export function dog(scene) {
  const root = new THREE.Group(), fur = M(0xd9a066), dark = M(0x7a4d2a);
  scene.add(root);
  mesh(new THREE.BoxGeometry(0.26, 0.24, 0.6), fur, root, [0, 0.42, 0]);
  const head = new THREE.Group(); head.position.set(0, 0.6, 0.34); root.add(head);
  mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), fur, head, [0, 0, 0]);
  mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), dark, head, [0, -0.04, 0.16]);
  for (const x of [-0.1, 0.1]) mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), dark, head, [x, 0.14, -0.04]);
  const legs = [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]].map(([x, z]) => limb(root, [x, 0.32, z], 0.3, 0.04, fur));
  const tail = limb(root, [0, 0.5, -0.3], 0.26, 0.03, fur);
  tail.rotation.x = -2.3;
  return { root, head, legs, tail };
}

export function duck(scene, white) {
  const root = new THREE.Group(), c = M(white ? 0xf7f4ec : 0x8a6a4a), g = M(0x3f7a52), y = M(0xf2a93b);
  scene.add(root);
  mesh(new THREE.IcosahedronGeometry(0.2, 0), c, root, [0, 0.12, 0]).scale.set(1, 0.7, 1.4);
  mesh(new THREE.IcosahedronGeometry(0.11, 0), white ? c : g, root, [0, 0.3, 0.2]);
  mesh(new THREE.ConeGeometry(0.04, 0.12, 4), y, root, [0, 0.28, 0.33]).rotation.x = Math.PI / 2;
  return root;
}

// 鸟：身体 + 两片翅膀，翅膀绕 z 轴拍动
export function bird(scene, color, s = 1) {
  const root = new THREE.Group(), m = M(color, { side: THREE.DoubleSide });
  root.scale.setScalar(s); scene.add(root);
  mesh(new THREE.ConeGeometry(0.08, 0.4, 5), m, root, [0, 0, 0], false).rotation.x = Math.PI / 2;
  const wing = (sx) => {
    const w = new THREE.Group(); root.add(w);
    const sh = new THREE.Shape([new THREE.Vector2(0, -0.1), new THREE.Vector2(0.42 * sx, 0.02), new THREE.Vector2(0, 0.12)]);
    const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2);
    mesh(geo, m, w, [0, 0, 0], false);
    return w;
  };
  return { root, wl: wing(1), wr: wing(-1) };
}
export const flap = (b, ph) => { b.wl.rotation.z = 0.7 * Math.sin(ph); b.wr.rotation.z = -0.7 * Math.sin(ph); };

export function deer(scene) {
  const root = new THREE.Group(), c = M(0xa8714a), lt = M(0xf1e2cc), ant = M(0x6e4a30);
  scene.add(root);
  mesh(new THREE.BoxGeometry(0.34, 0.36, 0.9), c, root, [0, 0.9, 0]);
  const neck = new THREE.Group(); neck.position.set(0, 1.0, 0.4); root.add(neck);
  mesh(new THREE.BoxGeometry(0.16, 0.5, 0.18), c, neck, [0, 0.25, 0.04]).rotation.x = 0.35;
  const head = new THREE.Group(); head.position.set(0, 0.52, 0.12); neck.add(head);
  mesh(new THREE.BoxGeometry(0.18, 0.18, 0.32), c, head, [0, 0, 0.08]);
  for (const sx of [-1, 1]) {
    const a = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 4), ant, head, [0.06 * sx, 0.22, -0.02], false);
    a.rotation.z = -0.4 * sx;
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 4), ant, head, [0.13 * sx, 0.3, 0.05], false).rotation.set(0.6, 0, -0.9 * sx);
  }
  mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), lt, root, [0, 0.98, -0.47]);
  const legs = [[-0.11, 0.35], [0.11, 0.35], [-0.11, -0.35], [0.11, -0.35]].map(([x, z]) => limb(root, [x, 0.74, z], 0.74, 0.04, c));
  return { root, neck, head, legs };
}
