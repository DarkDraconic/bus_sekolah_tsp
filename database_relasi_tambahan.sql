-- ============================================================
--  TAMBAHAN DATABASE: Relasi Admin ↔ Driver (Tracking)
--  Jalankan SETELAH database_bus_sekolah.sql sudah diimport
--  DBMS: MySQL / phpMyAdmin
-- ============================================================

USE `bus_sekolah_madiun`;

-- ─────────────────────────────────────────────────────────
--  TABEL: relasi_admin_driver
--  Menyimpan hak pantau admin terhadap driver tertentu.
--  Admin bisa dipantau satu atau lebih driver.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `relasi_admin_driver` (
  `id`          INT(11)   NOT NULL AUTO_INCREMENT,
  `id_admin`    INT(11)   NOT NULL COMMENT 'Admin pemantau',
  `id_sopir`    INT(11)   NOT NULL COMMENT 'Driver yang dipantau',
  `aktif`       TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=aktif pantau',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_sopir` (`id_admin`, `id_sopir`),
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE CASCADE,
  FOREIGN KEY (`id_sopir`) REFERENCES `sopir`(`id_sopir`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Relasi admin memantau driver (many-to-many)';

-- ─────────────────────────────────────────────────────────
--  TABEL: log_aktivitas_tracking
--  Mencatat kapan admin membuka / menutup sesi tracking.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `log_aktivitas_tracking` (
  `id`              INT(11)   NOT NULL AUTO_INCREMENT,
  `id_admin`        INT(11)   NOT NULL,
  `id_sopir`        INT(11)   NOT NULL COMMENT 'Driver yang sedang dipantau',
  `waktu_buka`      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `waktu_tutup`     DATETIME  DEFAULT NULL,
  `durasi_detik`    INT(11)   DEFAULT NULL COMMENT 'Durasi sesi pantau (detik)',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE CASCADE,
  FOREIGN KEY (`id_sopir`) REFERENCES `sopir`(`id_sopir`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Log sesi tracking admin terhadap driver';

-- ─────────────────────────────────────────────────────────
--  TABEL: notifikasi
--  Admin mendapat notifikasi dari event driver (berangkat/tiba/dll).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifikasi` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `id_admin`    INT(11)      NOT NULL,
  `id_sopir`    INT(11)      DEFAULT NULL,
  `judul`       VARCHAR(150) NOT NULL,
  `pesan`       TEXT         NOT NULL,
  `tipe`        ENUM('info','warning','success','error') NOT NULL DEFAULT 'info',
  `sudah_baca`  TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_admin` (`id_admin`),
  FOREIGN KEY (`id_admin`) REFERENCES `admin`(`id_admin`) ON DELETE CASCADE,
  FOREIGN KEY (`id_sopir`) REFERENCES `sopir`(`id_sopir`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Notifikasi admin dari event driver';

-- ─────────────────────────────────────────────────────────
--  SEED DATA: Relasi admin → semua driver (Super Admin memantau semua)
-- ─────────────────────────────────────────────────────────
INSERT INTO `relasi_admin_driver` (`id_admin`, `id_sopir`, `aktif`) VALUES
(1, 1, 1),  -- Admin memantau Budi Santoso
(1, 2, 1),  -- Admin memantau Andi Wijaya
(1, 3, 1),  -- Admin memantau Rizky Pratama
(1, 4, 1);  -- Admin memantau Doni Setiawan

-- Notifikasi awal (simulasi)
INSERT INTO `notifikasi` (`id_admin`, `id_sopir`, `judul`, `pesan`, `tipe`) VALUES
(1, 1, 'Bus 01 Berangkat', 'Budi Santoso telah memulai perjalanan pagi dari Bus Pool.', 'success'),
(1, 2, 'Bus 02 Berangkat', 'Andi Wijaya telah memulai perjalanan pagi dari Bus Pool.',  'success'),
(1, 3, 'Bus 03 Berangkat', 'Rizky Pratama telah memulai perjalanan pagi dari Bus Pool.','success'),
(1, 4, 'Bus 04 Standby',   'Doni Setiawan sedang standby, belum memulai perjalanan.',  'info');

-- ─────────────────────────────────────────────────────────
--  VIEW BARU: v_admin_monitoring
--  View lengkap untuk halaman tracking admin.
--  JOIN: relasi_admin_driver → sopir → penugasan → bus → tracking terbaru
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `v_admin_monitoring` AS
SELECT
  rad.id_admin,
  a.nama              AS nama_admin,
  s.id_sopir,
  s.nama              AS nama_driver,
  s.no_hp             AS hp_driver,
  b.id_bus,
  b.plat_kendaraan,
  CONCAT('Bus 0', b.id_bus) AS nama_bus,
  p.shift,
  p.jam_mulai,
  p.status            AS status_penugasan,
  -- Posisi GPS terbaru dari driver ini
  t.latitude          AS last_lat,
  t.longitude         AS last_lng,
  t.kecepatan_kmh     AS kecepatan,
  t.timestamp_gps     AS last_update_gps,
  rad.aktif           AS koneksi_aktif
FROM `relasi_admin_driver` rad
JOIN `admin`     a   ON a.id_admin   = rad.id_admin
JOIN `sopir`     s   ON s.id_sopir   = rad.id_sopir
LEFT JOIN `penugasan` p ON p.id_sopir = s.id_sopir AND p.tanggal = CURDATE()
LEFT JOIN `bus`  b   ON b.id_bus     = p.id_bus
LEFT JOIN `tracking` t ON t.id_sopir = s.id_sopir
  AND t.timestamp_gps = (
    SELECT MAX(t2.timestamp_gps)
    FROM `tracking` t2
    WHERE t2.id_sopir = s.id_sopir
  )
WHERE rad.aktif = 1;

-- ─────────────────────────────────────────────────────────
--  VIEW BARU: v_tracking_live
--  Posisi GPS terkini seluruh bus yang beroperasi hari ini,
--  siap dikonsumsi oleh front-end (polling).
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `v_tracking_live` AS
SELECT
  t.id_tracking,
  s.id_sopir,
  s.nama                    AS nama_driver,
  CONCAT('Bus 0', b.id_bus) AS nama_bus,
  b.plat_kendaraan,
  p.shift,
  t.latitude,
  t.longitude,
  t.kecepatan_kmh,
  t.heading_derajat,
  t.timestamp_gps,
  TIMESTAMPDIFF(SECOND, t.timestamp_gps, NOW()) AS detik_sejak_update
FROM `tracking` t
JOIN `sopir`     s  ON s.id_sopir     = t.id_sopir
JOIN `penugasan` p  ON p.id_penugasan = t.id_penugasan AND p.tanggal = CURDATE()
JOIN `bus`       b  ON b.id_bus       = p.id_bus
WHERE t.timestamp_gps = (
  SELECT MAX(t2.timestamp_gps) FROM `tracking` t2
  WHERE t2.id_sopir = t.id_sopir
)
AND p.status IN ('aktif', 'terjadwal')
ORDER BY t.timestamp_gps DESC;

-- ─────────────────────────────────────────────────────────
--  STORED PROCEDURE: sp_update_posisi_driver
--  Dipanggil oleh front-end driver untuk INSERT tracking baru.
--  Memvalidasi bahwa driver hanya bisa update posisinya sendiri.
-- ─────────────────────────────────────────────────────────
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `sp_update_posisi_driver`(
  IN p_id_sopir    INT,
  IN p_latitude    DECIMAL(10,7),
  IN p_longitude   DECIMAL(10,7),
  IN p_kecepatan   DECIMAL(5,1)
)
BEGIN
  DECLARE v_id_penugasan INT DEFAULT NULL;

  -- Cari penugasan aktif hari ini untuk driver ini
  SELECT id_penugasan INTO v_id_penugasan
  FROM penugasan
  WHERE id_sopir = p_id_sopir
    AND tanggal  = CURDATE()
    AND status   IN ('aktif', 'terjadwal')
  LIMIT 1;

  IF v_id_penugasan IS NOT NULL THEN
    INSERT INTO `tracking`
      (id_penugasan, id_sopir, latitude, longitude, kecepatan_kmh, timestamp_gps)
    VALUES
      (v_id_penugasan, p_id_sopir, p_latitude, p_longitude, p_kecepatan, NOW());
  ELSE
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Driver tidak memiliki penugasan aktif hari ini.';
  END IF;
END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────
--  QUERY CONTOH (untuk referensi pengembang):
--
--  1. Admin mendapatkan posisi terkini semua bus yang dipantau:
--     SELECT * FROM v_admin_monitoring WHERE id_admin = 1;
--
--  2. Posisi live semua bus hari ini:
--     SELECT * FROM v_tracking_live;
--
--  3. Driver update posisi (via stored procedure):
--     CALL sp_update_posisi_driver(1, -7.6295, 111.5320, 35.5);
--
--  4. Admin melihat notifikasi belum dibaca:
--     SELECT * FROM notifikasi WHERE id_admin=1 AND sudah_baca=0 ORDER BY created_at DESC;
-- ─────────────────────────────────────────────────────────
