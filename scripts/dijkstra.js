// ============================================================
// dijkstra.js — Visualização de Rede + Algoritmo de Dijkstra
// Integrado na Camada de Rede do Modelo OSI
// ============================================================

import { points } from './points.js'

// ——— Estado Global ———
const state = {
  roteadores: points,
  idMap: {},         
  caminho: [],       
  distanciaTotal: 0,
  animando: false,
  offsetX: 0, offsetY: 0, scale: 1, dragging: false, dragStart: { x: 0, y: 0 }, lastOffset: { x: 0, y: 0 },
  hoveredRouter: null,
  pacotePos: null, pacoteSegmento: 0, pacoteProgresso: 0, visitados: new Set(),
  velocidade: 1, flashRouters: new Set(), canvasReady: false, animFrameId: null,
}

points.forEach((r, i) => { state.idMap[r.id] = i })

let canvas, ctx, tooltip, selectOrigem, selectDestino, btnCalcular, resultInfo, errorMessage, speedSlider, speedValue

function getElements() {
  canvas = document.getElementById('network-canvas')
  if (!canvas) return false
  ctx = canvas.getContext('2d')
  tooltip = document.getElementById('router-tooltip')
  selectOrigem = document.getElementById('select-origem')
  selectDestino = document.getElementById('select-destino')
  btnCalcular = document.getElementById('btn-calcular-rota')
  resultInfo = document.getElementById('network-result')
  errorMessage = document.getElementById('network-error')
  speedSlider = document.getElementById('speed-slider')
  speedValue = document.getElementById('speed-value')
  return true
}

function recalcularRede() {
  if (!canvas || !ctx || !state.canvasReady) return
  requestAnimationFrame(() => {
    resizeCanvas()
    fitGraphToCanvas()
  })
}

function init() {
  if (!getElements()) return
  populateDropdowns()
  bindEvents()
  startRenderLoop()
  state.canvasReady = true
  recalcularRede()

  const wrapper = canvas.parentElement
  if (wrapper && 'ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (!state.canvasReady) return
      recalcularRede()
    })
    observer.observe(wrapper)
  }
}

function populateDropdowns() {
  const ativos = state.roteadores.filter(r => r.ativo)
  const default1 = document.createElement('option'); default1.value = ''; default1.textContent = 'Selecione...'; default1.disabled = true; default1.selected = true; selectOrigem.appendChild(default1)
  const default2 = document.createElement('option'); default2.value = ''; default2.textContent = 'Selecione...'; default2.disabled = true; default2.selected = true; selectDestino.appendChild(default2)

  for (const r of ativos) {
    const opt1 = document.createElement('option'); opt1.value = r.id; opt1.textContent = `${r.id} — ${r.ip}`; selectOrigem.appendChild(opt1)
    const opt2 = document.createElement('option'); opt2.value = r.id; opt2.textContent = `${r.id} — ${r.ip}`; selectDestino.appendChild(opt2)
  }
}

function resizeCanvas() {
  const wrapper = canvas.parentElement
  if (!wrapper || !ctx) return

  const width = wrapper.clientWidth
  const height = wrapper.clientHeight
  if (!width || !height) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function fitGraphToCanvas() {
  const wrapper = canvas.parentElement
  if (!wrapper || !wrapper.clientWidth || !wrapper.clientHeight) return

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const r of state.roteadores) {
    if (r.x < minX) minX = r.x; if (r.x > maxX) maxX = r.x; if (r.y < minY) minY = r.y; if (r.y > maxY) maxY = r.y
  }

  const graphW = maxX - minX + 80
  const graphH = maxY - minY + 80
  const widthScale = wrapper.clientWidth / graphW
  const heightScale = wrapper.clientHeight / graphH
  const baseScale = Math.min(widthScale, heightScale)
  state.scale = Number.isFinite(baseScale) && baseScale > 0 ? baseScale * 0.9 : 0.6
  if (state.scale < 0.15) state.scale = 0.15

  state.offsetX = (wrapper.clientWidth - graphW * state.scale) / 2 - minX * state.scale + 40 * state.scale
  state.offsetY = (wrapper.clientHeight - graphH * state.scale) / 2 - minY * state.scale + 40 * state.scale
}

function worldToScreen(wx, wy) { return { x: wx * state.scale + state.offsetX, y: wy * state.scale + state.offsetY } }
function screenToWorld(sx, sy) { return { x: (sx - state.offsetX) / state.scale, y: (sy - state.offsetY) / state.scale } }

function startRenderLoop() {
  function loop() { render(); state.animFrameId = requestAnimationFrame(loop) }
  loop()
}

function render() {
  const wrapper = canvas.parentElement
  if (!canvas || !ctx || !wrapper || !wrapper.clientWidth || !wrapper.clientHeight) return

  ctx.clearRect(0, 0, wrapper.clientWidth, wrapper.clientHeight)
  drawGrid(wrapper.clientWidth, wrapper.clientHeight)
  drawConnections()
  drawPath()
  drawRouters()
  drawPacket()
}

function drawGrid(cw, ch) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'; ctx.lineWidth = 1;
  for (let x = 0; x < cw; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke() }
  for (let y = 0; y < ch; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke() }
}

function drawConnections() {
  const drawn = new Set()
  for (const r of state.roteadores) {
    for (const vizId of r.conexoes) {
      const key = [r.id, vizId].sort().join('-')
      if (drawn.has(key)) continue
      drawn.add(key)
      const vizIdx = state.idMap[vizId]; if (vizIdx === undefined) continue;
      const viz = state.roteadores[vizIdx]
      const p1 = worldToScreen(r.x, r.y), p2 = worldToScreen(viz.x, viz.y)
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      if (r.ativo && viz.ativo) { ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 0.8 } 
      else { ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; ctx.lineWidth = 0.5 }
      ctx.stroke()
    }
  }
}

function drawPath() {
  if (state.caminho.length < 2) return

  const pathPoints = state.caminho.map(id => {
    const router = state.roteadores[state.idMap[id]]
    return worldToScreen(router.x, router.y)
  })

  const lineWidth = Math.max(5, Math.min(12, 6 / Math.max(0.5, state.scale)))

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  pathPoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.lineWidth = lineWidth + 4
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(0, 229, 255, 0.7)'
  ctx.shadowBlur = 14
  ctx.beginPath()
  pathPoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.72)'
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  pathPoints.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y)
    else ctx.lineTo(point.x, point.y)
  })
  ctx.strokeStyle = '#00e5ff'
  ctx.lineWidth = Math.max(2, lineWidth - 2)
  ctx.stroke()
  ctx.restore()

  if (!state.animando) drawPathParticles()
}

let particleTime = 0
function drawPathParticles() {
  if (state.caminho.length < 2) return
  particleTime += 0.008
  let totalLen = 0, segs = []
  for (let i = 0; i < state.caminho.length - 1; i++) {
    const p1 = worldToScreen(state.roteadores[state.idMap[state.caminho[i]]].x, state.roteadores[state.idMap[state.caminho[i]]].y)
    const p2 = worldToScreen(state.roteadores[state.idMap[state.caminho[i + 1]]].x, state.roteadores[state.idMap[state.caminho[i + 1]]].y)
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    segs.push({ p1, p2, len }); totalLen += len
  }
  for (let n = 0; n < 3; n++) {
    const t = ((particleTime + n * 0.33) % 1) * totalLen; let acc = 0;
    for (const s of segs) {
      if (acc + s.len >= t) {
        const local = (t - acc) / s.len, px = s.p1.x + (s.p2.x - s.p1.x) * local, py = s.p1.y + (s.p2.y - s.p1.y) * local
        ctx.save(); ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = '#00e5ff'; ctx.shadowColor = 'rgba(0, 229, 255, 0.8)'; ctx.shadowBlur = 10; ctx.fill(); ctx.restore()
        break
      }
      acc += s.len
    }
  }
}

function drawRouters() {
  const radius = Math.max(6, 10 * state.scale)
  for (const r of state.roteadores) {
    const p = worldToScreen(r.x, r.y)
    const isInPath = state.caminho.includes(r.id), isFlash = state.flashRouters.has(r.id), isHover = state.hoveredRouter === r.id
    ctx.save()
    if (r.ativo) {
      if (isInPath || isFlash) { ctx.shadowColor = 'rgba(0, 229, 255, 0.7)'; ctx.shadowBlur = 18 } 
      else { ctx.shadowColor = 'rgba(7, 158, 166, 0.35)'; ctx.shadowBlur = 6 }
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = (isFlash ? '#00e5ff' : (isInPath ? '#00bcd4' : '#079ea6')); ctx.fill()
      ctx.strokeStyle = isInPath ? '#00e5ff' : 'rgba(77, 208, 215, 0.5)'; ctx.lineWidth = isHover ? 2.5 : 1.2; ctx.stroke()
      if (radius > 7) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; const s = radius * 0.35
        ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - s * 0.4, p.y - s * 0.4); ctx.lineTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.4, p.y - s * 0.4); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(p.x, p.y + s); ctx.lineTo(p.x, p.y - s * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - s * 0.4, p.y + s * 0.4); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x + s * 0.4, p.y + s * 0.4); ctx.stroke()
      }
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 76, 106, 0.15)'; ctx.fill()
      ctx.strokeStyle = 'rgba(255, 76, 106, 0.35)'; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
      if (radius > 7) {
        ctx.strokeStyle = 'rgba(255, 76, 106, 0.5)'; ctx.lineWidth = 1.2; const s = radius * 0.3
        ctx.beginPath(); ctx.moveTo(p.x - s, p.y - s); ctx.lineTo(p.x + s, p.y + s); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(p.x + s, p.y - s); ctx.lineTo(p.x - s, p.y + s); ctx.stroke()
      }
    }
    if (state.scale > 0.45) {
      ctx.font = `${Math.max(7, 9 * state.scale)}px Poppins, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillStyle = r.ativo ? 'rgba(255,255,255,0.5)' : 'rgba(255,76,106,0.35)'; ctx.fillText(r.id, p.x, p.y + radius + 3)
    }
    ctx.restore()
    if (isHover) {
      ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2); ctx.strokeStyle = r.ativo ? 'rgba(77, 208, 215, 0.45)' : 'rgba(255, 76, 106, 0.35)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    }
  }
}

function drawPacket() {
  if (!state.pacotePos) return
  const p = worldToScreen(state.pacotePos.x, state.pacotePos.y)
  const size = Math.max(12, 16 * state.scale), hw = size * 0.65, hh = size * 0.45
  ctx.save(); ctx.shadowColor = 'rgba(255, 215, 0, 0.7)'; ctx.shadowBlur = 16
  ctx.fillStyle = '#ffd700'; ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(p.x - hw, p.y - hh); ctx.lineTo(p.x + hw, p.y - hh); ctx.lineTo(p.x + hw, p.y + hh); ctx.lineTo(p.x - hw, p.y + hh); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(p.x - hw, p.y - hh); ctx.lineTo(p.x, p.y + hh * 0.1); ctx.lineTo(p.x + hw, p.y - hh); ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1.2; ctx.stroke()
  ctx.restore()
}

function dijkstra(origemId, destinoId) {
  const dist = {}, prev = {}, visited = new Set()
  for (const r of state.roteadores) { dist[r.id] = Infinity; prev[r.id] = null }
  dist[origemId] = 0

  const queue = [{ id: origemId, dist: 0 }]
  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist); const current = queue.shift()
    if (visited.has(current.id)) continue
    visited.add(current.id)
    if (current.id === destinoId) break

    const router = state.roteadores[state.idMap[current.id]]
    for (const vizId of router.conexoes) {
      const vizIdx = state.idMap[vizId]; if (vizIdx === undefined) continue;
      const viz = state.roteadores[vizIdx]
      if (!viz.ativo || visited.has(vizId)) continue

      const peso = Math.hypot(router.x - viz.x, router.y - viz.y)
      const novaDist = dist[current.id] + peso

      if (novaDist < dist[vizId]) { dist[vizId] = novaDist; prev[vizId] = current.id; queue.push({ id: vizId, dist: novaDist }) }
    }
  }

  if (dist[destinoId] === Infinity) return { caminho: [], distancia: Infinity }
  const caminho = []; let atual = destinoId;
  while (atual !== null) { caminho.unshift(atual); atual = prev[atual] }
  return { caminho, distancia: dist[destinoId] }
}

function animarPacote() {
  if (state.caminho.length < 2) return
  state.animando = true; state.pacoteSegmento = 0; state.pacoteProgresso = 0; state.visitados.clear(); state.flashRouters.clear();
  const origemR = state.roteadores[state.idMap[state.caminho[0]]]; state.pacotePos = { x: origemR.x, y: origemR.y }; state.visitados.add(state.caminho[0]); state.flashRouters.add(state.caminho[0])

  function step() {
    if (state.pacoteSegmento >= state.caminho.length - 1) {
      state.animando = false; state.flashRouters.add(state.caminho[state.caminho.length - 1])
      let fc = 0; const fi = setInterval(() => {
        if (fc >= 6) { clearInterval(fi); return }
        const dId = state.caminho[state.caminho.length - 1]
        if (state.flashRouters.has(dId)) state.flashRouters.delete(dId); else state.flashRouters.add(dId)
        fc++
      }, 200)
      return
    }

    state.pacoteProgresso += 0.015 * state.velocidade
    if (state.pacoteProgresso >= 1) {
      state.pacoteProgresso = 0; state.pacoteSegmento++
      if (state.pacoteSegmento < state.caminho.length) {
        state.visitados.add(state.caminho[state.pacoteSegmento]); state.flashRouters.add(state.caminho[state.pacoteSegmento])
        const fId = state.caminho[state.pacoteSegmento]; setTimeout(() => state.flashRouters.delete(fId), 400)
      }
    }
    if (state.pacoteSegmento < state.caminho.length - 1) {
      const fr = state.roteadores[state.idMap[state.caminho[state.pacoteSegmento]]], tr = state.roteadores[state.idMap[state.caminho[state.pacoteSegmento + 1]]]
      state.pacotePos = { x: fr.x + (tr.x - fr.x) * state.pacoteProgresso, y: fr.y + (tr.y - fr.y) * state.pacoteProgresso }
    }
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function exibirResultado(caminho, distancia) {
  const txt = caminho.map(id => { const r = state.roteadores[state.idMap[id]]; return `${r.id} (${r.ip})` }).join(' → ')
  document.getElementById('result-path').textContent = txt
  document.getElementById('result-hops').textContent = `${caminho.length - 1} saltos`
  document.getElementById('result-distance').textContent = distancia.toFixed(1) + ' u.d.'
  resultInfo.classList.add('visible'); errorMessage.classList.remove('visible')
}

function exibirErro(msg) { errorMessage.textContent = msg; errorMessage.classList.add('visible'); resultInfo.classList.remove('visible') }

// [NOVIDADE] Redirecionamento lógico do Fluxo
function getRouterIdByIp(ip) {
  const router = state.roteadores.find(r => r.ip === ip)
  if (router) return router.id
  return 'R4' // Gateway
}

function bindEvents() {
  // [NOVIDADE] Escuta do encapsulamento automático
  document.addEventListener('rota-calculada', (e) => {
    const { srcIP, dstIP } = e.detail
    const origemId = getRouterIdByIp(srcIP)
    const destinoId = getRouterIdByIp(dstIP)

    if (origemId && destinoId) {
      selectOrigem.value = origemId
      selectDestino.value = destinoId
      btnCalcular.click()
      
      const redeSection = document.getElementById('camada-rede')
      if (redeSection) redeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  btnCalcular.addEventListener('click', () => {
    const oId = selectOrigem.value, dId = selectDestino.value
    if (!oId || !dId) { exibirErro('⚠ Selecione roteadores de origem e destino.'); return }
    if (oId === dId) { exibirErro('⚠ Origem e destino devem ser diferentes.'); return }

    state.caminho = []; state.pacotePos = null; state.flashRouters.clear(); resultInfo.classList.remove('visible')

    const resultado = dijkstra(oId, dId)
    if (resultado.caminho.length === 0) { exibirErro('❌ Não há rota disponível entre estes roteadores.'); return }

    state.caminho = resultado.caminho; state.distanciaTotal = resultado.distancia
    recalcularRede()
    exibirResultado(resultado.caminho, resultado.distancia)
    setTimeout(() => animarPacote(), 300)
  })

  speedSlider.addEventListener('input', () => { state.velocidade = parseFloat(speedSlider.value); speedValue.textContent = state.velocidade.toFixed(1) + 'x' })
  window.addEventListener('resize', () => { if (!state.canvasReady) return; recalcularRede() })

  canvas.addEventListener('mousedown', (e) => { state.dragging = true; state.dragStart = { x: e.clientX, y: e.clientY }; state.lastOffset = { x: state.offsetX, y: state.offsetY } })
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top
    if (state.dragging) { state.offsetX = state.lastOffset.x + (e.clientX - state.dragStart.x); state.offsetY = state.lastOffset.y + (e.clientY - state.dragStart.y); return }
    const world = screenToWorld(mx, my); let found = null; const hitR = Math.max(8, 12 * state.scale) / state.scale + 6;
    for (const r of state.roteadores) { if (Math.hypot(world.x - r.x, world.y - r.y) < hitR) { found = r; break } }
    if (found) { state.hoveredRouter = found.id; showTooltip(found, e.clientX, e.clientY) } 
    else { state.hoveredRouter = null; hideTooltip() }
  })
  canvas.addEventListener('mouseup', () => { state.dragging = false })
  canvas.addEventListener('mouseleave', () => { state.dragging = false; state.hoveredRouter = null; hideTooltip() })
  
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); const rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top, factor = e.deltaY < 0 ? 1.1 : 0.9, ns = state.scale * factor;
    if (ns < 0.15 || ns > 5) return;
    state.offsetX = mx - (mx - state.offsetX) * (ns / state.scale); state.offsetY = my - (my - state.offsetY) * (ns / state.scale); state.scale = ns;
  }, { passive: false })

  let lastTDist = 0
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) { state.dragging = true; state.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; state.lastOffset = { x: state.offsetX, y: state.offsetY } } 
    else if (e.touches.length === 2) { lastTDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) }
  }, { passive: true })
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (e.touches.length === 1 && state.dragging) { state.offsetX = state.lastOffset.x + (e.touches[0].clientX - state.dragStart.x); state.offsetY = state.lastOffset.y + (e.touches[0].clientY - state.dragStart.y) } 
    else if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (lastTDist > 0) { const ns = state.scale * (d / lastTDist); if (ns >= 0.15 && ns <= 5) state.scale = ns }; lastTDist = d }
  }, { passive: false })
  canvas.addEventListener('touchend', () => { state.dragging = false; lastTDist = 0 })
}

function showTooltip(router, mx, my) {
  tooltip.querySelector('.tip-name').textContent = `${router.id} — ${router.nome}`; tooltip.querySelector('.tip-ip').textContent = `IP: ${router.ip}`;
  const se = tooltip.querySelector('.tip-status'); se.textContent = router.ativo ? '● Ativo' : '✕ Inativo'; se.className = `tip-status ${router.ativo ? 'ativo' : 'inativo'}`;
  const ce = tooltip.querySelector('.tip-connections'); if (ce) ce.textContent = `Conexões: ${router.conexoes.length}`;
  const wRect = canvas.parentElement.getBoundingClientRect(); let left = mx - wRect.left + 15, top = my - wRect.top - 15;
  if (left + 180 > wRect.width) left = left - 200; if (top < 5) top = 5;
  tooltip.style.left = left + 'px'; tooltip.style.top = top + 'px'; tooltip.classList.add('visible');
}
function hideTooltip() { tooltip.classList.remove('visible') }

document.addEventListener('DOMContentLoaded', init)