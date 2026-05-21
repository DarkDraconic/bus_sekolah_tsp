/**
 * ============================================================
 *  MODIFIED NEAREST NEIGHBOR (MNN) - TSP Algorithm
 *  Sistem Rute Bus Sekolah - Kecamatan Manguharjo, Kota Madiun
 * ============================================================
 *
 *  Algoritma MNN bekerja dalam 2 fase:
 *
 *  FASE 1 — Nearest Neighbor Greedy Construction
 *    - Mulai dari depot (Bus Pool = node A)
 *    - Setiap iterasi: pilih node tetangga TERDEKAT yang belum dikunjungi
 *    - Tandai node sebagai dikunjungi, pindah ke sana
 *    - Ulangi sampai semua node dikunjungi
 *    - Kembali ke depot untuk menutup sirkuit Hamiltonian
 *
 *  FASE 2 — 2-opt Local Search Improvement ("Modified" part)
 *    - Coba semua pasangan edge (i, j)
 *    - Jika membalik segmen [i..j] mengurangi total jarak → lakukan swap
 *    - Ulangi sampai tidak ada perbaikan
 *    - Formula: jika d(r[i-1],r[j]) + d(r[i],r[j+1]) < d(r[i-1],r[i]) + d(r[j],r[j+1])
 *               maka reverse segmen r[i..j]
 *
 *  Formula Total Jarak:
 *    D(rute) = Σ dist(v_k, v_{k+1})  untuk k = 0..n-1,  v_n = v_0
 * ============================================================
 */

'use strict';

// ── Sentintel value untuk edge yang tidak ada ────────────────
const INF = 9999;

// ── Data Node (titik pemberhentian) ──────────────────────────
// nx, ny: posisi ternormalisasi (0-1) untuk rendering canvas
const NODES = [
  { id: 0, code: 'A', name: 'Bus Pool Manguharjo',     shortName: 'Bus Pool',    type: 'pool',   nx: 0.055, ny: 0.50 },
  { id: 1, code: 'B', name: 'SMPN 07 Madiun',          shortName: 'SMPN 07',     type: 'school', nx: 0.180, ny: 0.83 },
  { id: 2, code: 'C', name: 'SDN 03 Nambangan Kidul',  shortName: 'SDN 03',      type: 'school', nx: 0.270, ny: 0.13 },
  { id: 3, code: 'D', name: 'SDN 01 Nambangan Kidul',  shortName: 'SDN 01',      type: 'school', nx: 0.380, ny: 0.52 },
  { id: 4, code: 'E', name: 'SDN 02 Nambangan Kidul',  shortName: 'SDN 02',      type: 'school', nx: 0.765, ny: 0.13 },
  { id: 5, code: 'F', name: 'SDN 05 Madiun Lor',       shortName: 'SDN 05 Lor',  type: 'school', nx: 0.650, ny: 0.52 },
  { id: 6, code: 'G', name: 'SMPN 01 Madiun',          shortName: 'SMPN 01',     type: 'school', nx: 0.765, ny: 0.83 },
  { id: 7, code: 'H', name: 'SMPN 03 Madiun',          shortName: 'SMPN 03',     type: 'school', nx: 0.920, ny: 0.52 },
];

// ── Adjacency List (edges yang ADA di graph) ─────────────────
const EDGES = [
  { from: 0, to: 1, dist: 0.8 },   // A–B
  { from: 0, to: 2, dist: 1.0 },   // A–C
  { from: 0, to: 3, dist: 0.9 },   // A–D
  { from: 1, to: 3, dist: 0.9 },   // B–D
  { from: 1, to: 6, dist: 3.6 },   // B–G
  { from: 2, to: 3, dist: 0.7 },   // C–D
  { from: 2, to: 4, dist: 4.2 },   // C–E
  { from: 2, to: 5, dist: 3.6 },   // C–F
  { from: 3, to: 5, dist: 2.8 },   // D–F
  { from: 4, to: 5, dist: 4.0 },   // E–F
  { from: 4, to: 7, dist: 3.8 },   // E–H
  { from: 5, to: 6, dist: 0.2 },   // F–G
  { from: 5, to: 7, dist: 0.2 },   // F–H
  { from: 6, to: 7, dist: 0.1 },   // G–H
];

// ── Matriks Jarak (Adjacency Matrix) ─────────────────────────
// DISTANCE_MATRIX[i][j] = jarak dari node i ke node j (KM)
// INF = tidak ada koneksi langsung
const DISTANCE_MATRIX = [
  //   A      B      C      D      E      F      G      H
  [  0.0,   0.8,   1.0,   0.9,   INF,   INF,   INF,   INF ],  // A
  [  0.8,   0.0,   INF,   0.9,   INF,   INF,   3.6,   INF ],  // B
  [  1.0,   INF,   0.0,   0.7,   4.2,   3.6,   INF,   INF ],  // C
  [  0.9,   0.9,   0.7,   0.0,   INF,   2.8,   INF,   INF ],  // D
  [  INF,   INF,   4.2,   INF,   0.0,   4.0,   INF,   3.8 ],  // E
  [  INF,   INF,   3.6,   2.8,   4.0,   0.0,   0.2,   0.2 ],  // F
  [  INF,   3.6,   INF,   INF,   INF,   0.2,   0.0,   0.1 ],  // G
  [  INF,   INF,   INF,   INF,   3.8,   0.2,   0.1,   0.0 ],  // H
];

// ═════════════════════════════════════════════════════════════
//  FASE 1: Nearest Neighbor Greedy Construction
// ═════════════════════════════════════════════════════════════
function nearestNeighborConstruct(startNode) {
  const n = NODES.length;
  const visited = new Array(n).fill(false);
  const route = [startNode];
  const steps = [];
  visited[startNode] = true;

  let current = startNode;
  let totalDist = 0;

  while (route.length < n) {
    let nearest = -1;
    let minDist = INF;

    // Cari tetangga terdekat yang belum dikunjungi
    for (let i = 0; i < n; i++) {
      if (!visited[i] && DISTANCE_MATRIX[current][i] < minDist) {
        minDist = DISTANCE_MATRIX[current][i];
        nearest = i;
      }
    }

    if (nearest === -1) {
      // Node terdekat tidak reachable langsung; cari via BFS
      const pathInfo = bfsShortestPath(current, n, visited);
      if (!pathInfo) break;
      nearest = pathInfo.node;
      minDist = pathInfo.dist;
    }

    steps.push({
      step: steps.length + 1,
      fromCode: NODES[current].code,
      toCode: NODES[nearest].code,
      fromId: current,
      toId: nearest,
      dist: minDist,
      analysis: getAnalysis(current, nearest, minDist),
    });

    route.push(nearest);
    visited[nearest] = true;
    totalDist += minDist;
    current = nearest;
  }

  // Tutup sirkuit: kembali ke depot
  const returnDist = getReturnDist(current, startNode);
  steps.push({
    step: steps.length + 1,
    fromCode: NODES[current].code,
    toCode: NODES[startNode].code,
    fromId: current,
    toId: startNode,
    dist: returnDist.dist,
    analysis: 'Penutupan sirkuit Hamiltonian – kembali ke Bus Pool.',
    isReturn: true,
    returnPath: returnDist.path,
  });
  totalDist += returnDist.dist;

  return { route, steps, totalDist };
}

// ── BFS untuk node terdekat reachable ────────────────────────
function bfsShortestPath(from, n, visited) {
  // Temukan unvisited node yang bisa dicapai dengan jarak terpendek
  const dists = new Array(n).fill(INF);
  dists[from] = 0;
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (let i = 0; i < n; i++) {
      if (DISTANCE_MATRIX[cur][i] < INF && dists[i] === INF) {
        dists[i] = dists[cur] + DISTANCE_MATRIX[cur][i];
        queue.push(i);
      }
    }
  }
  let best = -1, bestDist = INF;
  for (let i = 0; i < n; i++) {
    if (!visited[i] && dists[i] < bestDist) {
      bestDist = dists[i]; best = i;
    }2
  }
  return best === -1 ? null : { node: best, dist: bestDist };
}

// ── Hitung jarak kembali ke depot (termasuk backtracking) ────
function getReturnDist(lastNode, depot) {
  // Coba langsung
  if (DISTANCE_MATRIX[lastNode][depot] < INF) {
    return { dist: DISTANCE_MATRIX[lastNode][depot], path: [lastNode, depot] };
  }
  // BFS cari path kembali
  const prev = new Array(NODES.length).fill(-1);
  const dists = new Array(NODES.length).fill(INF);
  dists[lastNode] = 0;
  const queue = [lastNode];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === depot) break;
    for (let i = 0; i < NODES.length; i++) {
      if (DISTANCE_MATRIX[cur][i] < INF && dists[i] === INF) {
        dists[i] = dists[cur] + DISTANCE_MATRIX[cur][i];
        prev[i] = cur;
        queue.push(i);
      }
    }
  }
  // Rekonstruksi path
  const path = [];
  let cur = depot;
  while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
  return { dist: dists[depot], path };
}

function getAnalysis(from, to, dist) {
  const fromCode = NODES[from].code, toCode = NODES[to].code;
  const analyses = {
    'A-B': 'Pemilihan tetangga terdekat di zona Barat dari Bus Pool.',
    'B-D': 'Penetrasi klaster SDN Nambangan Kidul 01.',
    'D-C': 'Mengambil keuntungan dari jarak antar-SD terpendek.',
    'C-F': 'Transisi horizontal menuju hub SDN 05 Madiun Lor.',
    'F-G': 'Optimasi klaster SMPN dengan jarak minimal.',
    'G-H': 'Titik efisiensi tertinggi dalam seluruh jaringan graf.',
    'H-E': 'Ekspansi rute ke sisi Timur (SDN 02 Nambangan Kidul).',
  };
  return analyses[`${fromCode}-${toCode}`] || `Nearest neighbor dari ${fromCode} ke ${toCode} (${dist} KM).`;
}

// ═════════════════════════════════════════════════════════════
//  FASE 2: 2-opt Local Search Improvement  ("Modified" part)
//  Formula: jika dist(r[i-1],r[j]) + dist(r[i],r[j+1])
//                < dist(r[i-1],r[i]) + dist(r[j],r[j+1])
//           maka balik (reverse) segmen r[i..j]
// ═════════════════════════════════════════════════════════════
function twoOptImprove(route) {
  let improved = true;
  let best = [...route];

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length - 1; j++) {
        const d1 = DISTANCE_MATRIX[best[i - 1]][best[i]];
        const d2 = DISTANCE_MATRIX[best[j]][best[j + 1]];
        const d3 = DISTANCE_MATRIX[best[i - 1]][best[j]];
        const d4 = DISTANCE_MATRIX[best[i]][best[j + 1]];

        // Hanya swap jika edge pengganti valid (bukan INF)
        if (d3 < INF && d4 < INF && d1 + d2 > d3 + d4 + 1e-9) {
          const reversed = best.slice(i, j + 1).reverse();
          best = [...best.slice(0, i), ...reversed, ...best.slice(j + 1)];
          improved = true;
        }
      }
    }
  }
  return best;
}

// ── Hitung total jarak sebuah rute ───────────────────────────
function calcTotalDist(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = DISTANCE_MATRIX[route[i]][route[i + 1]];
    if (d < INF) total += d;
  }
  return Math.round(total * 10) / 10;
}

// ═════════════════════════════════════════════════════════════
//  Fungsi Utama: jalankan MNN lengkap
// ═════════════════════════════════════════════════════════════
function runMNN(startNode = 0) {
  // Fase 1: NN Greedy
  const phase1 = nearestNeighborConstruct(startNode);

  // Fase 2: 2-opt improvement
  const optimizedRoute = twoOptImprove(phase1.route);
  const optimizedDist  = calcTotalDist(optimizedRoute);

  return {
    nodes:            NODES,
    edges:            EDGES,
    distanceMatrix:   DISTANCE_MATRIX,
    // Hasil Fase 1
    initialRoute:     phase1.route,
    initialDist:      Math.round(phase1.totalDist * 10) / 10,
    steps:            phase1.steps,
    // Hasil Fase 2 (MNN Final)
    optimizedRoute:   optimizedRoute,
    optimizedDist:    optimizedDist,
    improvement:      Math.round((phase1.totalDist - optimizedDist) * 10) / 10,
  };
}

// ═════════════════════════════════════════════════════════════
//  GraphRenderer — Canvas Drawing Engine
// ═════════════════════════════════════════════════════════════
class GraphRenderer {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.options = Object.assign({
      padding:      45,
      nodeRadius:   20,
      poolRadius:   24,
      bgColor:      '#F8FAFC',
      edgeColor:    '#CBD5E1',
      edgeLabelClr: '#94A3B8',
      routeColor:   '#2563EB',
      returnColor:  '#7C3AED',
      poolColor:    '#F59E0B',
      schoolColor:  '#2563EB',
      nodeText:     '#FFFFFF',
      labelColor:   '#1E293B',
      labelFont:    '600 11px "Plus Jakarta Sans", sans-serif',
      codeFont:     'bold 13px "Plus Jakarta Sans", sans-serif',
      distFont:     '500 10px "Plus Jakarta Sans", sans-serif',
    }, options);
    this.busPos    = null;  // { x, y } current bus pixel position
    this.scaledNodes = [];
  }

  // ── Scale normalized node positions to canvas pixels ───────
  _scale() {
    const { padding } = this.options;
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.scaledNodes = NODES.map(n => ({
      ...n,
      cx: padding + n.nx * (W - 2 * padding),
      cy: padding + n.ny * (H - 2 * padding),
    }));
  }

  // ── Draw a single arrow line ────────────────────────────────
  _arrow(x1, y1, x2, y2, color, lineWidth = 2.5) {
    const ctx   = this.ctx;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const r     = this.options.nodeRadius + 4;
    const ex    = x2 - r * Math.cos(angle);
    const ey    = y2 - r * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x1 + r * Math.cos(angle), y1 + r * Math.sin(angle));
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineWidth;
    ctx.stroke();

    // Arrowhead
    const al = 10, aw = 5;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - al * Math.cos(angle - 0.4), ey - al * Math.sin(angle - 0.4));
    ctx.lineTo(ex - al * Math.cos(angle + 0.4), ey - al * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ── Draw edge label in the middle of the edge ──────────────
  _edgeLabel(x1, y1, x2, y2, text) {
    const ctx = this.ctx;
    const mx  = (x1 + x2) / 2;
    const my  = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ox = -Math.sin(angle) * 12;
    const oy =  Math.cos(angle) * 12;

    ctx.save();
    ctx.font      = this.options.distFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // White pill background
    const tw = ctx.measureText(text).width + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(mx + ox - tw / 2, my + oy - 8, tw, 16, 4);
    ctx.fill();
    ctx.fillStyle = this.options.edgeLabelClr;
    ctx.fillText(text, mx + ox, my + oy);
    ctx.restore();
  }

  // ── Full render ─────────────────────────────────────────────
  render(routeNodeIds = [], returnPath = [], busSegment = null) {
    const ctx = this.ctx;
    this._scale();
    const sn  = this.scaledNodes;
    const opt = this.options;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = opt.bgColor;
    ctx.fillRect(0, 0, W, H);

    // ── 1. Draw all background edges ─────────────────────────
    EDGES.forEach(e => {
      const f = sn[e.from], t = sn[e.to];
      ctx.beginPath();
      ctx.moveTo(f.cx, f.cy);
      ctx.lineTo(t.cx, t.cy);
      ctx.strokeStyle = opt.edgeColor;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      this._edgeLabel(f.cx, f.cy, t.cx, t.cy, e.dist + ' km');
    });

    // ── 2. Draw optimized route edges ────────────────────────
    for (let i = 0; i < routeNodeIds.length - 1; i++) {
      const f = sn[routeNodeIds[i]];
      const t = sn[routeNodeIds[i + 1]];
      this._arrow(f.cx, f.cy, t.cx, t.cy, opt.routeColor, 3);
    }

    // ── 3. Draw return path (if differs from main route) ─────
    if (returnPath && returnPath.length > 1) {
      for (let i = 0; i < returnPath.length - 1; i++) {
        const f = sn[returnPath[i]];
        const t = sn[returnPath[i + 1]];
        this._arrow(f.cx, f.cy, t.cx, t.cy, opt.returnColor, 2.5);
      }
    }

    // ── 4. Draw nodes ─────────────────────────────────────────
    sn.forEach((node, idx) => {
      const isPool  = node.type === 'pool';
      const r       = isPool ? opt.poolRadius : opt.nodeRadius;
      const fillClr = isPool ? opt.poolColor  : opt.schoolColor;

      // Shadow
      ctx.save();
      ctx.shadowColor   = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur    = 8;
      ctx.shadowOffsetY = 3;

      // Circle
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, r, 0, Math.PI * 2);
      ctx.fillStyle   = fillClr;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth   = 3;
      ctx.stroke();
      ctx.restore();

      // Code label inside circle
      ctx.font         = opt.codeFont;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = opt.nodeText;
      ctx.fillText(node.code, node.cx, node.cy);

      // Short name below node
      ctx.font         = opt.labelFont;
      ctx.fillStyle    = opt.labelColor;
      const labelY     = node.cy + r + 12;
      ctx.fillText(node.shortName, node.cx, labelY);
    });

    // ── 5. Draw animated bus icon ─────────────────────────────
    if (busSegment) {
      const { pos, progress } = busSegment;
      this._drawBus(pos.x, pos.y, progress);
    }

    // ── 6. Legend ─────────────────────────────────────────────
    this._drawLegend();
  }

  _drawBus(x, y, progress) {
    const ctx = this.ctx;
    ctx.save();

    // Outer glow
    ctx.shadowColor = 'rgba(239,68,68,0.6)';
    ctx.shadowBlur  = 15;

    // Bus circle
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();

    // Bus emoji / icon
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚌', x, y + 1);

    // Pulse ring
    ctx.save();
    const pulseR = 13 + progress * 10;
    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${0.6 - progress * 0.6})`;
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
  }

  _drawLegend() {
    const ctx  = this.ctx;
    const W    = this.canvas.width;
    const opt  = this.options;

    const items = [
      { color: opt.poolColor,   label: 'Bus Pool (Depot)' },
      { color: opt.schoolColor, label: 'Sekolah' },
      { color: opt.routeColor,  label: 'Rute TSP Optimal' },
      { color: opt.returnColor, label: 'Jalur Kembali' },
    ];

    const legX  = W - 170;
    const legY  = 10;
    const itemH = 18;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(legX - 8, legY - 6, 165, items.length * itemH + 14, 8);
    ctx.fill();

    items.forEach((item, i) => {
      const y = legY + i * itemH + 6;
      ctx.beginPath();
      ctx.arc(legX + 6, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.font      = '500 10px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, legX + 18, y);
    });
    ctx.restore();
  }

  // ── Get pixel position along a route at given progress (0-1) ─
  getPositionAlongRoute(routeSegments, globalProgress) {
    const sn        = this.scaledNodes;
    const totalSegs = routeSegments.length;
    const segIdx    = Math.min(Math.floor(globalProgress * totalSegs), totalSegs - 1);
    const segProg   = (globalProgress * totalSegs) - segIdx;
    const fromNode  = sn[routeSegments[segIdx].from];
    const toNode    = sn[routeSegments[segIdx].to];
    return {
      x: fromNode.cx + (toNode.cx - fromNode.cx) * segProg,
      y: fromNode.cy + (toNode.cy - fromNode.cy) * segProg,
    };
  }
}

// ── Run algorithm on load ─────────────────────────────────────
const MNN_RESULT = runMNN(0);

// Route as segments for animation
// Full route: A(0)→B(1)→D(3)→C(2)→F(5)→G(6)→H(7)→E(4)→C(2)→A(0)
const ROUTE_SEGMENTS = [];
for (let i = 0; i < MNN_RESULT.optimizedRoute.length - 1; i++) {
  ROUTE_SEGMENTS.push({
    from: MNN_RESULT.optimizedRoute[i],
    to:   MNN_RESULT.optimizedRoute[i + 1],
  });
}

// Export ke global scope (untuk dipakai di driver-app.js dan admin-tracking.js)
if (typeof window !== 'undefined') {
  window.MNN = {
    NODES, EDGES, DISTANCE_MATRIX,
    runMNN, calcTotalDist,
    MNN_RESULT, ROUTE_SEGMENTS,
    GraphRenderer,
  };
}