/**
 * driver-app.js
 * Logic untuk halaman Driver Dashboard
 * Bergantung pada: mnn-algorithm.js (harus diload lebih dulu)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const { MNN_RESULT, NODES, DISTANCE_MATRIX, GraphRenderer } = window.MNN;
  const result = MNN_RESULT;

  // ── State aplikasi driver ───────────────────────────────────
  let isRunning  = false;
  let segIdx     = 0;
  let segProg    = 0;
  let animFrame  = null;
  let pulsePhase = 0;

  // ─────────────────────────────────────────────────────────
  //  CLOCK
  // ─────────────────────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const el  = document.getElementById('clock');
    if (el) el.textContent = `${h}:${m}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ─────────────────────────────────────────────────────────
  //  ROUTE LIST (stops)
  // ─────────────────────────────────────────────────────────
  const fullRoute  = result.optimizedRoute;
  const stopNodes  = fullRoute.map(id => NODES[id]);

  // Waktu penjemputan simulasi, mulai 06:30
  const BASE_HOUR = 6, BASE_MIN = 30;
  const TIMES = stopNodes.map((_, i) => {
    const total = BASE_MIN + i * 15;
    const h     = BASE_HOUR + Math.floor(total / 60);
    const m     = total % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  });

  function renderRouteList() {
    const list = document.getElementById('routeList');
    if (!list) return;
    list.innerHTML = '';

    // Stops unik (skip duplikat di tengah)
    const uniqueStops = [];
    const seen = new Set();
    stopNodes.forEach((n, i) => {
      if (!seen.has(n.id) || i === stopNodes.length - 1) {
        uniqueStops.push({ node: n, time: TIMES[i], idx: i });
        seen.add(n.id);
      }
    });

    uniqueStops.forEach((s, i) => {
      const isFirst  = i === 0;
      const isLast   = i === uniqueStops.length - 1;
      const pinCls   = isFirst ? 'start' : isLast ? 'end' : '';
      const pinIcon  = isFirst
        ? '<i class="bi bi-geo-alt-fill"></i>'
        : isLast
        ? '<i class="bi bi-flag-fill"></i>'
        : '<i class="bi bi-circle-fill" style="font-size:10px;"></i>';
      const stopLbl  = isFirst ? 'Titik Awal' : isLast ? 'Titik Akhir' : `Perhentian ${i}`;

      const item = document.createElement('div');
      item.className = 'route-item';
      item.innerHTML = `
        <div class="route-pin-wrap">
          <div class="route-pin ${pinCls}">${pinIcon}</div>
          ${!isLast ? '<div class="route-line"></div>' : ''}
        </div>
        <div class="route-info">
          <div class="route-name">${s.node.name}</div>
          <div class="route-stop">${stopLbl}</div>
        </div>
        <div class="route-time">${s.time}</div>
      `;
      list.appendChild(item);
    });

    const totalEl = document.getElementById('totalDistVal');
    if (totalEl) totalEl.textContent = result.optimizedDist.toString().replace('.', ',') + ' km';
  }
  renderRouteList();

  // ─────────────────────────────────────────────────────────
  //  MNN STEPS TABLE
  // ─────────────────────────────────────────────────────────
  function renderSteps() {
    const tbody = document.getElementById('stepsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    result.steps.forEach((s, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td><span class="route-badge">
          ${s.fromCode} <span class="arrow-badge"><i class="bi bi-arrow-right"></i></span> ${s.toCode}
        </span></td>
        <td>${s.dist} km</td>
        <td style="font-size:10.5px;color:var(--text-light);">${s.analysis}</td>
      `;
      tbody.appendChild(tr);
    });
    const accum = document.getElementById('totalAccum');
    if (accum) accum.textContent = result.optimizedDist.toString().replace('.', ',') + ' km';
  }
  renderSteps();

  // Toggle detail
  const detailBtn = document.getElementById('detailBtn');
  if (detailBtn) {
    detailBtn.addEventListener('click', () => {
      const card = document.getElementById('stepsCard');
      const isHidden = card.style.display === 'none';
      card.style.display = isHidden ? 'block' : 'none';
      detailBtn.innerHTML = isHidden
        ? 'Sembunyikan <i class="bi bi-chevron-up"></i>'
        : 'Lihat Detail <i class="bi bi-chevron-right"></i>';
    });
  }

  // ─────────────────────────────────────────────────────────
  //  GRAPH CANVAS
  // ─────────────────────────────────────────────────────────
  const canvas = document.getElementById('driverGraphCanvas');
  const dpr    = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width * dpr;
    canvas.height = 220 * dpr;
    canvas.style.width  = rect.width + 'px';
    canvas.style.height = '220px';
    canvas.getContext('2d').scale(dpr, dpr);
  }
  resizeCanvas();

  const renderer = new GraphRenderer(canvas, {
    padding:    32,
    nodeRadius: 15,
    poolRadius: 19,
    labelFont:  '600 9px Nunito, sans-serif',
    codeFont:   'bold 10px Nunito, sans-serif',
    distFont:   '500 8.5px Nunito, sans-serif',
  });

  // ── Pisahkan rute utama dan jalur balik ─────────────────────
  // Berdasarkan hasil MNN: rute lengkap = [A,B,D,C,F,G,H,E,C,A]
  // Jalur balik = segmen E→C→A (dari step terakhir yang isReturn)
  const lastStep = result.steps[result.steps.length - 1];
  let returnPath = [];
  if (lastStep && lastStep.isReturn && lastStep.returnPath) {
    returnPath = lastStep.returnPath;
  } else {
    // Fallback: ambil 2 node terakhir
    returnPath = fullRoute.slice(-2);
  }

  // Main route: semua sampai sebelum return path dimulai
  const returnStart = fullRoute.indexOf(returnPath[0]);
  const mainRoute   = returnStart > 0
    ? fullRoute.slice(0, returnStart + 1)
    : fullRoute.slice(0, -1);

  function drawStatic() {
    renderer.render(mainRoute, returnPath, null);
  }
  drawStatic();

  // ─────────────────────────────────────────────────────────
  //  BUS ANIMATION
  // ─────────────────────────────────────────────────────────
  const animSegments = [];
  for (let i = 0; i < fullRoute.length - 1; i++) {
    animSegments.push({ from: fullRoute[i], to: fullRoute[i + 1] });
  }

  const SEG_SPD = 0.005;

  function animateBus() {
    if (!isRunning) return;

    pulsePhase = (pulsePhase + 0.05) % 1;
    segProg   += SEG_SPD;

    if (segProg >= 1) {
      segProg = 0;
      segIdx  = (segIdx + 1) % animSegments.length;
      updateTrackingUI();
    }

    renderer._scale();
    const sn   = renderer.scaledNodes;
    const seg  = animSegments[segIdx];
    const from = sn[seg.from];
    const to   = sn[seg.to];
    const busX = from.cx + (to.cx - from.cx) * segProg;
    const busY = from.cy + (to.cy - from.cy) * segProg;

    renderer.render(mainRoute, returnPath, { pos: { x: busX, y: busY }, progress: pulsePhase });
    animFrame = requestAnimationFrame(animateBus);
  }

  function updateTrackingUI() {
    const curId  = animSegments[segIdx].from;
    const nextId = animSegments[segIdx].to;
    const curNode  = NODES[curId];
    const nextNode = NODES[nextId];

    const lokasiMap = {
      0: 'Jl. Manguharjo No. 1',
      1: 'Jl. SMPN 07 Madiun',
      2: 'Jl. Nambangan Kidul 03',
      3: 'Jl. Nambangan Kidul 01',
      4: 'Jl. Nambangan Kidul 02',
      5: 'Jl. Madiun Lor 05',
      6: 'Jl. SMPN 01 Madiun',
      7: 'Jl. SMPN 03 Madiun',
    };

    const locEl  = document.getElementById('currentLoc');
    const destEl = document.getElementById('nextDest');
    const distEl = document.getElementById('nextDist');

    if (locEl)  locEl.textContent  = lokasiMap[curId] || curNode.name;
    if (destEl) destEl.textContent = nextNode.shortName;

    const segDist = DISTANCE_MATRIX[curId][nextId];
    const remDist = segDist < 9999 ? ((1 - segProg) * segDist).toFixed(1) : '—';
    if (distEl) distEl.textContent = `${remDist} km lagi`;
  }

  // ─────────────────────────────────────────────────────────
  //  START / STOP
  // ─────────────────────────────────────────────────────────
  const startBtn  = document.getElementById('startBtn');
  const statusCard = document.getElementById('statusCard');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      isRunning = !isRunning;

      const iconEl   = document.getElementById('startIcon');
      const labelEl  = document.getElementById('startBtnText');
      const statusIconEl = document.getElementById('statusIconEl');

      if (isRunning) {
        startBtn.classList.add('running');
        if (iconEl)  iconEl.className  = 'bi bi-stop-fill btn-icon';
        if (labelEl) labelEl.textContent = 'Akhiri Perjalanan';

        statusCard.className = 'status-card beroperasi';
        if (statusIconEl) statusIconEl.className = 'bi bi-arrow-repeat text-white fs-5';
        document.getElementById('statusLabel').textContent = 'STATUS';
        document.getElementById('statusTitle').textContent = 'Beroperasi';
        document.getElementById('statusSub').textContent   = 'Perjalanan sedang berlangsung...';

        updateTrackingUI();
        animateBus();
      } else {
        cancelAnimationFrame(animFrame);
        segIdx  = 0;
        segProg = 0;

        startBtn.classList.remove('running');
        if (iconEl)  iconEl.className  = 'bi bi-play-fill btn-icon';
        if (labelEl) labelEl.textContent = 'Mulai Perjalanan';

        statusCard.className = 'status-card';
        if (statusIconEl) statusIconEl.className = 'bi bi-check-circle-fill text-white fs-5';
        document.getElementById('statusLabel').textContent = 'STATUS';
        document.getElementById('statusTitle').textContent = 'Selesai';
        document.getElementById('statusSub').textContent   = 'Perjalanan telah selesai. Terima kasih!';

        const destEl = document.getElementById('nextDest');
        const distEl = document.getElementById('nextDist');
        if (destEl) destEl.textContent = '—';
        if (distEl) distEl.textContent = '';

        drawStatic();
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  //  RESIZE
  // ─────────────────────────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      drawStatic();
    }, 200);
  });

});