<?php
include "middleware/admin-only.php";
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel — Bus Sekolah Madiun</title>
  <!-- Bootstrap 5 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Google Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap">
  <link rel="stylesheet" href="admin-style.css">
</head>
<body>

<!-- ═══ SIDEBAR OVERLAY (mobile) ═══ -->
<div class="sidebar-overlay d-lg-none" id="sidebarOverlay"></div>

<div class="layout">

  <!-- ═══ SIDEBAR ═══ -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <i class="bi bi-bus-front-fill text-white fs-5"></i>
      </div>
      <div class="brand-text">
        <div class="name">Bus Sekolah</div>
        <div class="sub">Admin Panel</div>
      </div>
    </div>

    <nav class="nav-section">
      <div class="nav-label">Menu</div>
      <a class="nav-item active" href="admin-dashboard.html">
        <i class="bi bi-house-fill nav-icon"></i> Dashboard
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-building nav-icon"></i> Data Sekolah
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-clock-history nav-icon"></i> Penjadwalan Shift
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-map nav-icon"></i> Perancangan Rute
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-clipboard-data nav-icon"></i> Laporan Harian
      </a>
    </nav>

    <nav class="nav-section">
      <div class="nav-label">Data Master</div>
      <a class="nav-item" href="#">
        <i class="bi bi-person-fill nav-icon"></i> Driver
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-bus-front nav-icon"></i> Bus
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-people-fill nav-icon"></i> Pengguna
      </a>
      <a class="nav-item" href="#">
        <i class="bi bi-gear-fill nav-icon"></i> Pengaturan
      </a>
    </nav>

    <div class="sidebar-footer">
      <a href="logout.php" class="logout-btn text-decoration-none"></a>
        <i class="bi bi-box-arrow-left"></i> Logout
      </button>
    </div>
  </aside>

  <!-- ═══ MAIN ═══ -->
  <main class="main">

    <!-- Top Bar -->
    <header class="topbar">
      <button class="topbar-menu" id="sidebarToggle">
        <i class="bi bi-list"></i>
      </button>
      <span class="topbar-title">Dashboard</span>
      <div class="topbar-right ms-auto">
        <div class="topbar-date d-none d-md-flex">
          <i class="bi bi-calendar3"></i>
          <span id="currentDate">Memuat...</span>
        </div>
        <div class="topbar-notif">
          <i class="bi bi-bell-fill"></i>
          <span class="badge rounded-pill bg-danger position-absolute" style="font-size:9px;top:6px;right:6px;width:8px;height:8px;padding:0;"></span>
        </div>
        <div class="topbar-user">
          <div class="user-ava">
            <i class="bi bi-person-circle fs-5 text-white"></i>
          </div>
          <div class="user-info d-none d-md-block">
            <div class="uname"><?php echo $_SESSION['nama']; ?></div>
            <div class="urole">Super Admin</div>
          </div>
          <i class="bi bi-chevron-down topbar-caret d-none d-md-inline"></i>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <div class="page">

      <!-- Greeting -->
      <div class="page-greet">
        <h1>Halo, Admin <i class="bi bi-hand-wave text-warning"></i></h1>
        <p>Selamat datang di sistem manajemen bus sekolah Kota Madiun.</p>
      </div>

      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon-wrap blue">
              <i class="bi bi-building fs-4 text-white"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Sekolah</div>
              <div class="stat-val">5</div>
              <div class="stat-trend">
                <i class="bi bi-arrow-up-short text-success"></i> +2 dari bulan lalu
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon-wrap green">
              <i class="bi bi-people-fill fs-4 text-white"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Driver</div>
              <div class="stat-val">10</div>
              <div class="stat-trend">
                <i class="bi bi-arrow-up-short text-success"></i> +3 dari bulan lalu
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon-wrap purple">
              <i class="bi bi-bus-front-fill fs-4 text-white"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Bus</div>
              <div class="stat-val">4</div>
              <div class="stat-trend neutral">
                <i class="bi bi-dash text-secondary"></i> Tidak berubah
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="stat-card">
            <div class="stat-icon-wrap orange">
              <i class="bi bi-sign-turn-right-fill fs-4 text-white"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Rute</div>
              <div class="stat-val">6</div>
              <div class="stat-trend">
                <i class="bi bi-arrow-up-short text-success"></i> +1 dari bulan lalu
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TRACKING CTA -->
      <div class="tracking-cta mb-4">
        <div class="cta-icon-wrap">
          <i class="bi bi-broadcast fs-2 text-white"></i>
        </div>
        <div class="cta-text">
          <h2>Tracking Bus Real-Time</h2>
          <p>Pantau posisi bus dan rute TSP yang sedang aktif secara langsung di atas peta graf.</p>
          <div class="cta-stats">
            <div class="cta-stat">
              <span class="dot green"></span> 3 Bus Aktif
            </div>
            <div class="cta-stat">
              <span class="dot amber"></span> 1 Bus Standby
            </div>
            <div class="cta-stat">
              <span class="dot red"></span> 0 Bus Error
            </div>
          </div>
        </div>
        <a href="admin-tracking.html" class="btn-tracking">
          <span class="pulse-dot"></span>
          <i class="bi bi-broadcast me-2"></i>
          Buka Tracking
        </a>
      </div>

      <!-- Feature Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="feature-card blue h-100">
            <div class="fc-image"><i class="bi bi-building fs-1"></i></div>
            <div class="fc-title">Data Sekolah</div>
            <div class="fc-desc">Kelola data sekolah yang terdaftar dalam sistem.</div>
            <button class="fc-btn blue mt-auto">
              Kelola Sekolah <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="feature-card green h-100">
            <div class="fc-image"><i class="bi bi-clock-history fs-1"></i></div>
            <div class="fc-title">Penjadwalan Shift</div>
            <div class="fc-desc">Atur jadwal shift driver untuk operasional bus.</div>
            <button class="fc-btn green mt-auto">
              Kelola Shift <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="feature-card purple h-100">
            <div class="fc-image"><i class="bi bi-map fs-1"></i></div>
            <div class="fc-title">Perancangan Rute</div>
            <div class="fc-desc">Rancang dan kelola rute perjalanan bus sekolah.</div>
            <button class="fc-btn purple mt-auto">
              Kelola Rute <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="feature-card orange h-100">
            <div class="fc-image"><i class="bi bi-clipboard-data fs-1"></i></div>
            <div class="fc-title">Laporan Harian</div>
            <div class="fc-desc">Lihat dan kelola laporan harian dari driver.</div>
            <button class="fc-btn orange mt-auto">
              Lihat Laporan <i class="bi bi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Reports -->
      <div class="section-header mb-3">
        <h2>Laporan Terbaru</h2>
        <a class="see-all" href="#">Lihat Semua <i class="bi bi-chevron-right"></i></a>
      </div>
      <div class="reports-table-wrap mb-4">
        <div class="table-responsive">
          <table class="reports-table table mb-0">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Rute</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="driver-cell">
                    <div class="driver-ava"><i class="bi bi-person-circle fs-4 text-secondary"></i></div>
                    <div>
                      <div class="driver-name">Budi Santoso</div>
                      <div class="driver-sub">Driver Bus 01</div>
                    </div>
                  </div>
                </td>
                <td>Rute SDN 1 – SDN 3</td>
                <td>21 Mei 2024, 07:30</td>
                <td><span class="status-pill selesai">Selesai</span></td>
                <td>
                  <button class="btn btn-sm action-btn" title="Lihat Detail">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="driver-cell">
                    <div class="driver-ava"><i class="bi bi-person-circle fs-4 text-secondary"></i></div>
                    <div>
                      <div class="driver-name">Andi Wijaya</div>
                      <div class="driver-sub">Driver Bus 02</div>
                    </div>
                  </div>
                </td>
                <td>Rute SDN 2 – SDN 4</td>
                <td>21 Mei 2024, 07:25</td>
                <td><span class="status-pill selesai">Selesai</span></td>
                <td>
                  <button class="btn btn-sm action-btn" title="Lihat Detail">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="driver-cell">
                    <div class="driver-ava"><i class="bi bi-person-circle fs-4 text-secondary"></i></div>
                    <div>
                      <div class="driver-name">Rizky Pratama</div>
                      <div class="driver-sub">Driver Bus 03</div>
                    </div>
                  </div>
                </td>
                <td>Rute SDN 3 – SDN 5</td>
                <td>21 Mei 2024, 07:20</td>
                <td><span class="status-pill terkirim">Terkirim</span></td>
                <td>
                  <button class="btn btn-sm action-btn" title="Lihat Detail">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="driver-cell">
                    <div class="driver-ava"><i class="bi bi-person-circle fs-4 text-secondary"></i></div>
                    <div>
                      <div class="driver-name">Doni Setiawan</div>
                      <div class="driver-sub">Driver Bus 04</div>
                    </div>
                  </div>
                </td>
                <td>Rute SDN 1 – SDN 5</td>
                <td>21 Mei 2024, 07:15</td>
                <td><span class="status-pill terkirim">Terkirim</span></td>
                <td>
                  <button class="btn btn-sm action-btn" title="Lihat Detail">
                    <i class="bi bi-file-earmark-text"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div><!-- /page -->
  </main>
</div><!-- /layout -->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
  // Date
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const now = new Date();
  document.getElementById('currentDate').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Sidebar toggle (mobile)
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
</script>
</body>
</html>