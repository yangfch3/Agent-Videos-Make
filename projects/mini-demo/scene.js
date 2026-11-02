import * as THREE from "three";
import { M, jitter, mesh, mulberry32 } from "./assets/shared/js/lowpoly.js";
import { angleAt, popAt } from "./world.js";

const D = window.DEMO, W = 1920, H = 1080;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(D.col.bg, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(D.cam.fov, W / H, 0.1, 100);
camera.position.set(0, 0, D.cam.dist);
camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(3, 4, 5);
scene.add(sun);

const pivot = new THREE.Group();
pivot.position.set(...D.obj.pos);
scene.add(pivot);
const geo = jitter(new THREE.IcosahedronGeometry(1, 1), D.obj.jitter, mulberry32(D.obj.seed));
mesh(geo, M(D.col.subject), pivot, [0, 0, 0], false).rotation.x = 0.4;

const read = document.getElementById("read");

function renderAt(t) {
  pivot.rotation.y = THREE.MathUtils.degToRad(angleAt(D, t));
  pivot.scale.setScalar(D.obj.scale * popAt(D, t));
  renderer.render(scene, camera);
  read.innerHTML = `ω = ${D.obj.omega.toFixed(0)}°/s<br>t = ${t.toFixed(2)} s<br>θ = ${angleAt(D, t).toFixed(1)}°`;
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
