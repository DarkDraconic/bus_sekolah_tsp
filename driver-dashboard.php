<?php
include "middleware/driver-only.php";
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Driver — Bus Sekolah Madiun</title>
  <!-- Bootstrap 5 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Google Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="driver-style.css">
</head>
<body>
<div class="app-wrapper">

  <!-- Status Bar -->
  <div class="status-bar">
    <span id="clock">09:41</span>
    <div class="d-flex gap-2 align-items-center">
      <i class="bi bi-wifi text-white"></i>
      <i class="bi bi-battery-full text-white"></i>
    </div>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-row">
      <div class="header-left">
        <div class="avatar-wrap">
          <i class="bi bi-person-badge-fill text-white fs-4"></i>
        </div>
        <div class="header-info">
          <div class="driver-name">
               Hallo, <?php echo $_SESSION['nama']; ?>
          </div>
          <div class="driver-role">Driver Bus Sekolah &middot; Bus 01</div>
        </div>
      </div>
      <button class="notif-btn" id="notifBtn">
        <i class="bi bi-bell-fill text-white"></i>
        <span class="notif-badge" id="notifDot"></span>
      </button>
    </div>
  </div>

  <!-- Scrollable Content -->
  <div class="content">

    <!-- Status Card -->
    <div class="status-card" id="statusCard">
      <div class="status-icon">
        <i class="bi bi-check-circle-fill text-white fs-5" id="statusIconEl"></i>
      </div>
      <div class="status-info">
        <div class="status-label" id="statusLabel">STATUS</div>
        <div class="status-title" id="statusTitle">Siap</div>
        <div class="status-sub"   id="statusSub">Anda siap untuk memulai perjalanan</div>
      </div>
      <div style="font-size:28px; flex-shrink:0;">
        <i class="bi bi-bus-front-fill text-primary"></i>
      </div>
    </div>

    <!-- Route Card -->
    <div class="card mb-3">
      <div class="section-title">
        <i class="bi bi-map section-icon"></i>
        Rute Hari Ini
        <button id="detailBtn" class="ms-auto detail-toggle-btn">
          Lihat Detail <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <!-- Route Stops -->
      <div class="route-list" id="routeList">
        <!-- Diisi oleh driver-app.js -->
      </div>

      <!-- Total Distance -->
      <div class="total-dist mt-2">
        <div class="label">
          <i class="bi bi-rulers me-1"></i> Total Jarak MNN
        </div>
        <div class="value" id="totalDistVal">— km</div>
      </div>

      <!-- Graph Section -->
      <div class="graph-wrap mt-3">
        <div class="graph-title">
          <i class="bi bi-diagram-3-fill" style="color:var(--blue);"></i>
          Graf Rute TSP &mdash;
          <span>Modified Nearest Neighbor</span>
        </div>
        <canvas id="driverGraphCanvas"></canvas>
        <div class="graph-meta">
          <div class="meta-badge">
            <span class="dot amber"></span> Bus Pool
          </div>
          <div class="meta-badge">
            <span class="dot blue"></span> Rute Optimal
          </div>
          <div class="meta-badge">
            <span class="dot purple"></span> Jalur Balik
          </div>
        </div>
      </div>
    </div>

    <!-- Start Button -->
    <button class="btn-start mb-3" id="startBtn">
      <i class="bi bi-play-fill btn-icon" id="startIcon"></i>
      <span id="startBtnText">Mulai Perjalanan</span>
    </button>

    <!-- Tracking Card -->
    <div class="tracking-card mb-3">
      <div class="section-title">
        <i class="bi bi-broadcast section-icon"></i>
        Tracking
      </div>
      <div class="tracking-grid">
        <div class="tracking-item">
          <div class="tracking-ico">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div>
            <div class="tracking-lbl">Lokasi Sekarang</div>
            <div class="tracking-val" id="currentLoc">Belum mulai</div>
          </div>
        </div>
        <div class="tracking-item">
          <div class="tracking-ico next">
            <i class="bi bi-arrow-right-circle-fill"></i>
          </div>
          <div>
            <div class="tracking-lbl">Tujuan Berikutnya</div>
            <div class="tracking-val" id="nextDest">—</div>
            <div class="tracking-sub" id="nextDist"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- MNN Steps Detail (hidden) -->
    <div class="card mb-3" id="stepsCard" style="display:none;">
      <div class="section-title">
        <i class="bi bi-list-ol section-icon"></i>
        Langkah Algoritma MNN
      </div>
      <div class="table-responsive">
        <table class="steps-table w-100" id="stepsTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Ruas</th>
              <th>Jarak</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody id="stepsBody">
            <!-- Diisi oleh driver-app.js -->
          </tbody>
        </table>
      </div>
      <div class="divider"></div>
      <div class="total-dist">
        <div class="label">Total Akumulasi Jarak</div>
        <div class="value" id="totalAccum">— km</div>
      </div>
    </div>

  </div><!-- /content -->
</div><!-- /app-wrapper -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="mnn-algorithm.js"></script>
<script src="driver-app.js"></script>
</body>
</html>