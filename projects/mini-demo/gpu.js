// WebGPU 波纹网格：compute 按时刻算每格强度写入 storage buffer，render 实例化画方块
const D = window.DEMO, G = D.grid, N = G.cols * G.rows;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const COMMON = `
struct U { t: f32, cols: f32, rows: f32, pitch: f32, x0: f32, y0: f32, ox: f32, oy: f32,
           speed: f32, wave: f32, cell: f32, minScale: f32, dim: vec4f, acc: vec4f };
@group(0) @binding(0) var<uniform> u: U;
fn center(i: u32) -> vec2f {
  let cols = u32(u.cols);
  return vec2f(u.x0 + (f32(i % cols) + 0.5) * u.pitch, u.y0 + (f32(i / cols) + 0.5) * u.pitch);
}`;

const CS = COMMON + `
@group(0) @binding(1) var<storage, read_write> v: array<f32>;
@compute @workgroup_size(64) fn cs(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u32(u.cols * u.rows)) { return; }
  let behind = u.speed * max(u.t, 0.0) - distance(center(id.x), vec2f(u.ox, u.oy));
  var k = 0.0;
  if (behind > 0.0) { k = clamp(behind / 80.0, 0.0, 1.0) * (0.5 + 0.5 * cos(6.2831853 * behind / u.wave)); }
  v[id.x] = k;
}`;

const RS = COMMON + `
@group(0) @binding(1) var<storage, read> v: array<f32>;
struct VO { @builtin(position) pos: vec4f, @location(0) col: vec4f };
@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VO {
  var q = array<vec2f, 6>(vec2f(-0.5, -0.5), vec2f(0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, 0.5), vec2f(-0.5, 0.5));
  let k = v[ii];
  let p = center(ii) + q[vi] * u.cell * mix(u.minScale, 1.0, k);
  return VO(vec4f(p.x / 960.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0), mix(u.dim, u.acc, k));
}
@fragment fn fs(i: VO) -> @location(0) vec4f { return vec4f(i.col.rgb, 1.0); }`;

const ready = (async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const ctx = document.getElementById("gpu").getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });
  const ubo = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const sbo = device.createBuffer({ size: N * 4, usage: GPUBufferUsage.STORAGE });
  const comp = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: CS }), entryPoint: "cs" } });
  const rmod = device.createShaderModule({ code: RS });
  const draw = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: rmod, entryPoint: "vs" },
    fragment: { module: rmod, entryPoint: "fs", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
    multisample: { count: 4 },
  });
  const bind = (p) => device.createBindGroup({ layout: p.getBindGroupLayout(0), entries: [
    { binding: 0, resource: { buffer: ubo } }, { binding: 1, resource: { buffer: sbo } }] });
  const msaa = device.createTexture({ size: [1920, 1080], sampleCount: 4, format, usage: GPUTextureUsage.RENDER_ATTACHMENT });
  return { device, ctx, ubo, comp, draw, cbg: bind(comp), rbg: bind(draw), msaa };
})();

async function render(t) {
  const g = await ready;
  g.device.queue.writeBuffer(g.ubo, 0, new Float32Array([t, G.cols, G.rows, G.pitch, G.x0, G.y0, ...G.origin,
    G.speed, G.wave, G.cell, G.minScale, ...hex(D.col.dim), 1, ...hex(D.col.accent), 1]));
  const enc = g.device.createCommandEncoder();
  const cp = enc.beginComputePass();
  cp.setPipeline(g.comp); cp.setBindGroup(0, g.cbg); cp.dispatchWorkgroups(Math.ceil(N / 64)); cp.end();
  const rp = enc.beginRenderPass({ colorAttachments: [{ view: g.msaa.createView(), resolveTarget: g.ctx.getCurrentTexture().createView(),
    loadOp: "clear", storeOp: "discard", clearValue: { r: 0, g: 0, b: 0, a: 0 } }] });
  rp.setPipeline(g.draw); rp.setBindGroup(0, g.rbg); rp.draw(6, N); rp.end();
  g.device.queue.submit([enc.finish()]);
  await g.device.queue.onSubmittedWorkDone();
}

window.addEventListener("hf-seek", (e) => e.detail.waitUntil(render(e.detail.time - D.beats.gpu)));
render(-D.beats.gpu);
