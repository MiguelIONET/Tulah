import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, createReadStream, existsSync, statSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const workspace = resolve(import.meta.dirname, '..');
const root = process.argv[2] ? resolve(process.argv[2]) : workspace;
const proposalPath = existsSync(join(root, 'productos.html')) ? '' : '/propuesta-neumorfismo';
const previews = join(workspace, 'docs', 'previews');
mkdirSync(previews, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'tulah-video-qa-'));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer((req, res) => {
  const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!path.startsWith(root + sep) || !existsSync(path) || !statSync(path).isFile()) return res.writeHead(404).end();
  const size = statSync(path).size;
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if (range) {
    const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size) return res.writeHead(416, { 'Content-Range': 'bytes */' + size }).end();
    res.writeHead(206, { 'Content-Type': mime[extname(path)], 'Accept-Ranges': 'bytes', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': end - start + 1 });
    createReadStream(path, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    createReadStream(path).pipe(res);
  }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
assert.ok(edge, 'Microsoft Edge is required for this browser verification');
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--disable-background-networking', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const value = await fn(); if (value) return value; await sleep(100); }
  throw new Error('Timeout: ' + label);
}
let socket;
let send;
let total = 0;
const videoSources = new Set();
try {
  await until(() => existsSync(join(profile, 'DevToolsActivePort')), 'Edge startup', 45000);
  const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const endpoint = 'http://127.0.0.1:' + port;
  const target = await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { socket.addEventListener('open', r, { once: true }); socket.addEventListener('error', j, { once: true }); });
  const pending = new Map();
  const exceptions = [];
  let id = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (pending.has(message.id)) {
      const p = pending.get(message.id); pending.delete(message.id); clearTimeout(p.timer);
      message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result);
    }
  });
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    const timer = setTimeout(() => { pending.delete(n); reject(new Error('CDP timeout: ' + method)); }, 15000);
    pending.set(n, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async expression => {
    const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
    return value.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const navigate = async (url, width, reduced = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width < 800 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 800 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await send('Page.navigate', { url });
    await send('Page.bringToFront');
    await until(() => evaluate("document.readyState === 'complete' && !!document.querySelector('.main-nav')"), 'page loaded');
  };
  const capture = async name => {
    await evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))");
    await until(() => evaluate("document.getAnimations().every(a => a.playState !== 'running')"), 'animations settled before capture');
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(previews, name + '.png'), Buffer.from(shot.data, 'base64'));
  };
  for (const page of ['nosotros','productos','sinergia','identidad','contacto']) {
    for (const width of [1440,900,390]) {
      await navigate(base+'/'+page+'.html',width,true);
      await until(()=>evaluate("document.querySelector('.page-hero-visual img')?.complete && document.querySelector('.page-hero-visual img')?.naturalWidth > 0"),'hero image');
      const result=await evaluate("(()=>{const h=document.querySelector('.page-hero'),i=h.querySelector('img'),r=i.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,width:r.width,height:r.height,clipped:h.scrollWidth>h.clientWidth+1,number:!!h.querySelector('.page-index')};})()");
      assert.ok(!result.overflow && !result.clipped && !result.number && result.width>200 && result.height>150,JSON.stringify(result));
      await capture('hero-'+page+'-'+width);
      console.log('PASS '+page+' '+width+'px: image loaded, no overflow or clipping.');
    }
  }
  assert.deepEqual(exceptions, []);
} finally {
  if (send) await send('Browser.close').catch(() => {});
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  await new Promise(r => server.close(r));
  for (let n=0;n<10;n++) {
    try { rmSync(profile, { recursive: true, force: true }); break; } catch { await sleep(200); }
  }
}
