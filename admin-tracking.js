/**
 * admin-tracking.js
 * ─────────────────────────────────────────────────────────────
 * Mengelola dua panel terpisah:
 *   1. Graf MNN  — canvas berbasis algoritma MNN dari mnn-algorithm.js
 *   2. Peta GPS  — Leaflet.js dengan simulasi posisi bus bergerak
 *
 * Relasi Admin ↔ Driver:
 *   Admin punya hak READ ALL (semua bus / sopir / tracking).
 *   Driver hanya bisa WRITE posisi sendiri (via id_penugasan).
 *   Di front-end ini, posisi bus disimulasikan (polling setiap 3 detik)
 *   mengikuti rute MNN yang sudah dihitung.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════════════════════
     DATA BUS (simulasi relasi admin ↔ driver)
  ════════════════════════════════════════════════ */
  const BUS_DATA = [
    { id:0, busNama:'Bus 01', driver:'Budi Santoso',  status:'aktif',   shift:'Pagi',  ico:'g' },
    { id:1, busNama:'Bus 02', driver:'Andi Wijaya',   status:'aktif',   shift:'Pagi',  ico:'g' },
    { id:2, busNama:'Bus 03', driver:'Rizky Pratama', status:'aktif',   shift:'Pagi',  ico:'g' },
    { id:3, busNama:'Bus 04', driver:'Doni Setiawan', status:'standby', shift:'Siang', ico:'a' },
  ];

  // Lokasi simulasi untuk setiap node
  const LOC_MAP = {
    0:'Jl. Manguharjo No. 1', 1:'Jl. SMPN 07 Madiun',
    2:'Jl. Nambangan Kidul 03', 3:'Jl. Nambangan Kidul 01',
    4:'Jl. Nambangan Kidul 02', 5:'Jl. Madiun Lor 05',
    6:'Jl. SMPN 01 Madiun',    7:'Jl. SMPN 03 Madiun',
  };

  // Koordinat lat/lng nyata setiap node (Kec. Manguharjo, Madiun)
  const GEO = [
    { lat:-7.6298, lng:111.5200 },  // A Bus Pool
    { lat:-7.6380, lng:111.5230 },  // B SMPN 07
    { lat:-7.6220, lng:111.5270 },  // C SDN 03
    { lat:-7.6295, lng:111.5320 },  // D SDN 01
    { lat:-7.6220, lng:111.5470 },  // E SDN 02
    { lat:-7.6295, lng:111.5410 },  // F SDN 05
    { lat:-7.6380, lng:111.5470 },  // G SMPN 01
    { lat:-7.6295, lng:111.5510 },  // H SMPN 03
  ];

  /* ── Ambil hasil MNN ─────────────────────────── */
  const { MNN_RESULT, NODES, EDGES, DISTANCE_MATRIX, GraphRenderer } = window.MNN;
  const result    = MNN_RESULT;
  const fullRoute = result.optimizedRoute;   // [0,1,3,2,5,6,7,4,2,0]

  // Pisah main route vs return path
  const lastStep  = result.steps[result.steps.length - 1];
  let returnPath  = (lastStep && lastStep.isReturn && lastStep.returnPath)
                    ? lastStep.returnPath
                    : fullRoute.slice(-2);
  const retStart  = fullRoute.indexOf(returnPath[0]);
  const mainRoute = retStart > 0 ? fullRoute.slice(0, retStart + 1) : fullRoute.slice(0, -1);

  // Segmen animasi
  const animSegs = [];
  for (let i = 0; i < fullRoute.length - 1; i++)
    animSegs.push({ from: fullRoute[i], to: fullRoute[i + 1] });

  let activeBusIdx = 0;   // bus yang sedang dipantau

  /* ════════════════════════════════════════════════
     BUS SELECTOR
  ════════════════════════════════════════════════ */
  const busScroll = document.getElementById('busScroll');
  BUS_DATA.forEach((b, i) => {
    const chip = document.createElement('div');
    chip.className = 'bus-chip' + (i === 0 ? ' active' : '');
    chip.innerHTML = `
      <div class="chip-ico ${b.ico}">
        <i class="bi bi-bus-front-fill text-white"></i>
      </div>
      <div>
        <div class="chip-name">${b.busNama}</div>
        <div class="chip-driver">${b.driver}</div>
        <span class="chip-badge ${b.status}">${b.status === 'aktif' ? 'Aktif' : 'Standby'}</span>
      </div>`;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.bus-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeBusIdx = i;
      resetAnim();
      updateRightPanel();
      if (currentTab === 'map') updateMapBus();
    });
    busScroll.appendChild(chip);
  });

  /* ════════════════════════════════════════════════
     TAB SWITCHER
  ════════════════════════════════════════════════ */
  let currentTab = 'graph';
  let mapInited  = false;

  window.switchTab = function(tab) {
    currentTab = tab;
    document.getElementById('tabBtnGraph').classList.toggle('active', tab === 'graph');
    document.getElementById('tabBtnMap').classList.toggle('active', tab === 'map');
    document.getElementById('tabGraph').classList.toggle('active', tab === 'graph');
    document.getElementById('tabMap').classList.toggle('active', tab === 'map');

    if (tab === 'map' && !mapInited) {
      initMap();
      mapInited = true;
    }
    if (tab === 'map') { setTimeout(() => leafMap.invalidateSize(), 100); }
  };

  /* ════════════════════════════════════════════════
     PANEL KANAN — Info statik
  ════════════════════════════════════════════════ */
  // Isi hasil MNN
  document.getElementById('iInitDist').textContent = result.initialDist   + ' KM';
  document.getElementById('iOptDist').textContent  = result.optimizedDist + ' KM';
  document.getElementById('iImprove').textContent  =
    result.improvement > 0 ? '−' + result.improvement + ' KM lebih efisien' : 'Sudah optimal';
  document.getElementById('iRoute').textContent =
    result.optimizedRoute.map(id => NODES[id].code).join(' → ');

  // Langkah-langkah MNN
  const stepsWrap = document.getElementById('stepsWrap');
  result.steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'step-row';
    div.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <div style="flex:1;">
        <div class="step-rt">
          ${s.fromCode}
          <i class="bi bi-arrow-right" style="color:#1D53E8;font-size:11px;"></i>
          ${s.toCode}
          <span class="step-d">${s.dist} KM</span>
        </div>
        <div class="step-note">${s.analysis}</div>
      </div>`;
    stepsWrap.appendChild(div);
  });

  function updateRightPanel() {
    const b = BUS_DATA[activeBusIdx];
    document.getElementById('iBusNama').textContent   = b.busNama;
    document.getElementById('iDriverNama').textContent = b.driver;
    const statusEl = document.getElementById('iStatus');
    if (b.status === 'aktif') {
      statusEl.innerHTML = '<span class="sdot g"></span>Beroperasi';
    } else {
      statusEl.innerHTML = '<span class="sdot a"></span>Standby';
    }
    document.getElementById('rDriverVal').textContent = b.driver;
    document.getElementById('rDriverSub').textContent = `${b.busNama} · Shift ${b.shift}`;

    const now = new Date();
    document.getElementById('rLastUpdate').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  }
  updateRightPanel();

  /* ════════════════════════════════════════════════
     ═══ TAB 1 : GRAPH MNN (Canvas) ═══════════════
  ════════════════════════════════════════════════ */
  const canvas = document.getElementById('mnnCanvas');
  const dpr    = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const W = Math.max(canvas.parentElement.getBoundingClientRect().width, 400);
    const H = Math.max(W * 0.48, 280);
    canvas.width  = W * dpr; canvas.height = H * dpr;
    canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
    canvas.getContext('2d').scale(dpr, dpr);
  }
  resizeCanvas();

  const renderer = new GraphRenderer(canvas, {
    padding: 54, nodeRadius: 22, poolRadius: 28, bgColor: '#F8FAFC',
  });

  function drawStatic() { renderer.render(mainRoute, returnPath, null); }
  drawStatic();

  /* Animasi bus di graf */
  let isAnim    = false;
  let animFrame = null;
  let segIdx    = 0;
  let segProg   = 0;
  let pulse     = 0;
  let animSpeed = 0.004;

  function animLoop() {
    if (!isAnim) return;
    pulse    = (pulse + 0.04) % 1;
    segProg += animSpeed;
    if (segProg >= 1) {
      segProg = 0;
      segIdx  = (segIdx + 1) % animSegs.length;
      updateGraphInfo();
    }
    renderer._scale();
    const sn  = renderer.scaledNodes;
    const seg = animSegs[segIdx];
    const fx  = sn[seg.from].cx, fy = sn[seg.from].cy;
    const tx  = sn[seg.to].cx,   ty = sn[seg.to].cy;
    renderer.render(mainRoute, returnPath, {
      pos:      { x: fx + (tx - fx) * segProg, y: fy + (ty - fy) * segProg },
      progress: pulse,
    });
    animFrame = requestAnimationFrame(animLoop);
  }

  function updateGraphInfo() {
    const cId = animSegs[segIdx].from, nId = animSegs[segIdx].to;
    document.getElementById('iLokasi').textContent = LOC_MAP[cId] || NODES[cId].name;
    document.getElementById('iTujuan').textContent = NODES[nId].shortName;
    const d = DISTANCE_MATRIX[cId][nId];
    const r = d < 9999 ? ((1 - segProg) * d).toFixed(1) + ' km' : '—';
    document.getElementById('iSisa').textContent = r;
    // ETA simulasi: avg 30 km/jam
    const etaMins = d < 9999 ? Math.round((1 - segProg) * d / 30 * 60) : null;
    document.getElementById('iETA').textContent = etaMins !== null ? `~${etaMins} menit` : '—';
    // update last poll time
    const now = new Date();
    document.getElementById('rLastUpdate').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  }

  window.toggleAnim = function() {
    isAnim = !isAnim;
    const btn = document.getElementById('animBtn');
    const ico = document.getElementById('animIcon');
    const lbl = document.getElementById('animLabel');
    if (isAnim) {
      btn.classList.add('running');
      ico.className = 'bi bi-pause-fill';
      lbl.textContent = 'Hentikan Animasi';
      animLoop();
    } else {
      cancelAnimationFrame(animFrame);
      btn.classList.remove('running');
      ico.className = 'bi bi-play-fill';
      lbl.textContent = 'Lanjut Animasi';
    }
  };

  window.resetAnim = function() {
    cancelAnimationFrame(animFrame);
    isAnim = false; segIdx = 0; segProg = 0;
    const btn = document.getElementById('animBtn');
    btn.classList.remove('running');
    document.getElementById('animIcon').className  = 'bi bi-play-fill';
    document.getElementById('animLabel').textContent = 'Mulai Animasi';
    document.getElementById('iLokasi').textContent = '—';
    document.getElementById('iTujuan').textContent = '—';
    document.getElementById('iSisa').textContent   = '—';
    document.getElementById('iETA').textContent    = '—';
    drawStatic();
  };

  window.setSpeed = function(v) {
    animSpeed = 0.001 * Math.pow(2.5, Number(v) - 1);
    document.getElementById('speedLabel').textContent = v + '×';
  };

  /* resize graph */
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { resizeCanvas(); drawStatic(); }, 200);
  });

  /* ════════════════════════════════════════════════
     ═══ TAB 2 : PETA REAL-TIME (Leaflet) ══════════
     Setiap node memiliki koordinat lat/lng nyata.
     Bus dianimasikan mengikuti urutan rute MNN,
     bergerak di antara koordinat geografis asli.
  ════════════════════════════════════════════════ */
  let leafMap    = null;
  let busMarker  = null;
  let mapSegIdx  = 0;
  let mapSegProg = 0;
  let mapAnim    = null;
  const MAP_SPD  = 0.003;   // kecepatan pergerakan marker di peta

  // Ikon kustom Leaflet
  function makeIcon(color, emoji) {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.25);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;">
        ${emoji}
      </div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
      popupAnchor:[0, -18],
    });
  }

  function busIcon() {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:42px;height:42px;border-radius:50%;
        background:#EF4444;border:3px solid #fff;
        box-shadow:0 0 0 4px rgba(239,68,68,.3),0 4px 12px rgba(0,0,0,.25);
        display:flex;align-items:center;justify-content:center;
        font-size:20px;animation:busGlow 1.2s infinite;">
        <i class='bi bi-bus-front-fill' style='color:#fff;font-size:18px;'></i>
      </div>`,
      iconSize:   [42, 42],
      iconAnchor: [21, 21],
      popupAnchor:[0, -21],
    });
  }

  function initMap() {
    leafMap = L.map('mapContainer', { zoomControl: true }).setView([-7.634, 111.535], 14);

    // Tile layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(leafMap);

    // Tambah style animasi glow ke head
    const st = document.createElement('style');
    st.textContent = `@keyframes busGlow{0%,100%{box-shadow:0 0 0 4px rgba(239,68,68,.3),0 4px 12px rgba(0,0,0,.25)}50%{box-shadow:0 0 0 10px rgba(239,68,68,.1),0 4px 12px rgba(0,0,0,.25)}}`;
    document.head.appendChild(st);

    // Gambar semua edge (background dashed)
    EDGES.forEach(e => {
      const f = GEO[e.from], t = GEO[e.to];
      L.polyline([[f.lat, f.lng],[t.lat, t.lng]], {
        color: '#CBD5E1', weight: 2, dashArray: '6 4', opacity: 0.8,
      }).addTo(leafMap).bindTooltip(`${NODES[e.from].code}→${NODES[e.to].code}: ${e.dist} km`, {
        permanent: false, direction: 'center',
      });
    });

    // Gambar rute utama (biru)
    const mainCoords = mainRoute.map(id => [GEO[id].lat, GEO[id].lng]);
    L.polyline(mainCoords, { color:'#2563EB', weight:4, opacity:.85 }).addTo(leafMap);

    // Gambar jalur balik (ungu)
    if (returnPath.length > 1) {
      const retCoords = returnPath.map(id => [GEO[id].lat, GEO[id].lng]);
      L.polyline(retCoords, { color:'#7C3AED', weight:4, opacity:.85, dashArray:'8 4' }).addTo(leafMap);
    }

    // Marker setiap node
    NODES.forEach(n => {
      const geo  = GEO[n.id];
      const isPool = n.type === 'pool';
      const ico  = isPool
        ? makeIcon('#F59E0B', '<i class="bi bi-house-fill" style="color:#fff;font-size:15px;"></i>')
        : makeIcon('#2563EB', `<span style="color:#fff;font-size:12px;font-weight:800;">${n.code}</span>`);
      L.marker([geo.lat, geo.lng], { icon: ico })
        .addTo(leafMap)
        .bindPopup(`
          <div class="popup-inner">
            <div class="pop-title">${n.name}</div>
            <div class="pop-sub">${LOC_MAP[n.id] || ''}</div>
            <span class="pop-badge ${isPool ? 'pool' : 'school'}">${isPool ? 'Bus Pool (Depot)' : 'Sekolah'}</span>
          </div>`);
    });

    // Marker bus (mulai di depot)
    const depotGeo = GEO[fullRoute[0]];
    busMarker = L.marker([depotGeo.lat, depotGeo.lng], { icon: busIcon(), zIndexOffset: 1000 })
      .addTo(leafMap)
      .bindPopup(`
        <div class="popup-inner">
          <div class="pop-title" id="mapBusTitle">Bus 01 — Budi Santoso</div>
          <div class="pop-sub" id="mapBusSub">Bergerak menuju ${NODES[fullRoute[1]].shortName}</div>
          <span class="pop-badge bus">Beroperasi</span>
        </div>`);

    // Mulai animasi bus di peta otomatis
    startMapAnim();

    // Polling simulasi setiap 3 detik (update info panel)
    setInterval(updateMapBus, 3000);
  }

  function startMapAnim() {
    if (mapAnim) cancelAnimationFrame(mapAnim);
    mapSegIdx = 0; mapSegProg = 0;
    mapAnimLoop();
  }

  function mapAnimLoop() {
    mapSegProg += MAP_SPD;
    if (mapSegProg >= 1) {
      mapSegProg = 0;
      mapSegIdx  = (mapSegIdx + 1) % animSegs.length;
    }
    const seg  = animSegs[mapSegIdx];
    const from = GEO[seg.from], to = GEO[seg.to];
    const lat  = from.lat + (to.lat - from.lat) * mapSegProg;
    const lng  = from.lng + (to.lng - from.lng) * mapSegProg;
    if (busMarker) busMarker.setLatLng([lat, lng]);
    mapAnim = requestAnimationFrame(mapAnimLoop);
  }

  function updateMapBus() {
    const seg  = animSegs[mapSegIdx];
    const cId  = seg.from, nId = seg.to;
    document.getElementById('iLokasi').textContent = LOC_MAP[cId] || NODES[cId].name;
    document.getElementById('iTujuan').textContent = NODES[nId].shortName;
    const d  = DISTANCE_MATRIX[cId][nId];
    const r  = d < 9999 ? ((1 - mapSegProg) * d).toFixed(1) + ' km' : '—';
    document.getElementById('iSisa').textContent = r;
    const eta = d < 9999 ? Math.round((1 - mapSegProg) * d / 30 * 60) : null;
    document.getElementById('iETA').textContent  = eta !== null ? `~${eta} menit` : '—';
    // last update time
    const now = new Date();
    document.getElementById('rLastUpdate').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    // popup bus
    const busInfo = BUS_DATA[activeBusIdx];
    const titleEl = document.getElementById('mapBusTitle');
    const subEl   = document.getElementById('mapBusSub');
    if (titleEl) titleEl.textContent = `${busInfo.busNama} — ${busInfo.driver}`;
    if (subEl)   subEl.textContent   = `Menuju ${NODES[nId].shortName} · ${r}`;
  }

});
