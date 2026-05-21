-- ============================================================
--  Database: Bus Sekolah Kota Madiun
--  Berdasarkan ERD SKPL TSP Bus Sekolah
--  DBMS: MySQL / phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS `bus_sekolah_madiun`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `bus_sekolah_madiun`;

-- ─────────────────────────────────────────────────────────
--  1. TABEL ADMIN
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin` (
  `id_admin`    INT(11)      NOT NULL AUTO_INCREMENT,
  `nama`        VARCHAR(100) NOT NULL,
  `username`    VARCHAR(50)  NOT NULL UNIQUE,
  `password`    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `email`       VARCHAR(100) DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  2. TABEL SEKOLAH
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sekolah` (
  `id_sekolah`  INT(11)       NOT NULL AUTO_INCREMENT,
  `nama_sekolah`VARCHAR(150)  NOT NULL,
  `kecamatan`   VARCHAR(100)  DEFAULT 'Manguharjo',
  `latitude`    DECIMAL(10,7) NOT NULL,
  `longitude`   DECIMAL(10,7) NOT NULL,
  `node_code`   CHAR(1)       NOT NULL COMMENT 'Kode node graf (A-H)',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sekolah`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  3. TABEL RUTE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rute` (
  `id_rute`         INT(11)       NOT NULL AUTO_INCREMENT,
  `id_sekolah`      INT(11)       NOT NULL,
  `urutan`          TINYINT(3)    NOT NULL COMMENT 'Urutan kunjungan dalam rute',
  `jarak_ke_next`   DECIMAL(5,2)  DEFAULT NULL COMMENT 'Jarak ke node berikutnya (KM)',
  `total_jarak`     DECIMAL(6,2)  DEFAULT NULL COMMENT 'Total jarak rute ini',
  `metode`          VARCHAR(50)   DEFAULT 'MNN' COMMENT 'Modified Nearest Neighbor',
  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rute`),
  FOREIGN KEY (`id_sekolah`) REFERENCES `sekolah`(`id_sekolah`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  4. TABEL SOPIR (Driver)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sopir` (
  `id_sopir`    INT(11)      NOT NULL AUTO_INCREMENT,
  `nama`        VARCHAR(100) NOT NULL,
  `username`    VARCHAR(50)  NOT NULL UNIQUE,
  `password`    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `no_hp`       VARCHAR(20)  DEFAULT NULL,
  `no_sim`      VARCHAR(30)  DEFAULT NULL COMMENT 'Nomor SIM',
  `alamat`      TEXT         DEFAULT NULL,
  `foto`        VARCHAR(255) DEFAULT NULL,
  `status_aktif`TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=aktif, 0=nonaktif',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sopir`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  5. TABEL BUS (Kendaraan)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bus` (
  `id_bus`         INT(11)      NOT NULL AUTO_INCREMENT,
  `plat_kendaraan` VARCHAR(20)  NOT NULL UNIQUE,
  `merk`           VARCHAR(100) DEFAULT NULL,
  `warna`          VARCHAR(50)  DEFAULT NULL,
  `kecamatan`      VARCHAR(100) DEFAULT 'Manguharjo',
  `kapasitas`      TINYINT(3)   DEFAULT 30 COMMENT 'Jumlah penumpang',
  `tahun`          YEAR         DEFAULT NULL,
  `status`         ENUM('aktif','tidak_aktif','perbaikan') NOT NULL DEFAULT 'aktif',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_bus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  6. TABEL PENUGASAN (Bus dikendalikan oleh Sopir)
--     Relasi: Bus N--1 Sopir (per shift)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `penugasan` (
  `id_penugasan`   INT(11)   NOT NULL AUTO_INCREMENT,
  `id_bus`         INT(11)   NOT NULL,
  `id_sopir`       INT(11)   NOT NULL,
  `tanggal`        DATE      NOT NULL,
  `shift`          ENUM('pagi','siang','sore') NOT NULL DEFAULT 'pagi',
  `jam_mulai`      TIME      DEFAULT NULL,
  `jam_selesai`    TIME      DEFAULT NULL,
  `status`         ENUM('terjadwal','aktif','selesai','dibatalkan') NOT NULL DEFAULT 'terjadwal',
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_penugasan`),
  FOREIGN KEY (`id_bus`)   REFERENCES `bus`(`id_bus`)     ON DELETE CASCADE,
  FOREIGN KEY (`id_sopir`) REFERENCES `sopir`(`id_sopir`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  7. TABEL STATUS KEBERANGKATAN / KEPULANGAN
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `status` (
  `id_status`    INT(11)   NOT NULL AUTO_INCREMENT,
  `id_sopir`     INT(11)   NOT NULL,
  `id_bus`       INT(11)   NOT NULL,
  `waktu`        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `posisi`       ENUM('keberangkatan','kepulangan','transit') NOT NULL,
  `keterangan`   TEXT      DEFAULT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_status`),
  FOREIGN KEY (`id_sopir`) REFERENCES `sopir`(`id_sopir`) ON DELETE CASCADE,
  FOREIGN KEY (`id_bus`)   REFERENCES `bus`(`id_bus`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  8. TABEL TRACKING (Posisi GPS Real-Time)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tracking` (
  `id_tracking`       INT(11)       NOT NULL AUTO_INCREMENT,
  `id_penugasan`      INT(11)       NOT NULL,
  `id_sopir`          INT(11)       NOT NULL,
  `latitude`          DECIMAL(10,7) NOT NULL,
  `longitude`         DECIMAL(10,7) NOT NULL,
  `jadwal_berangkat`  DATETIME      DEFAULT NULL,
  `jadwal_pulang`     DATETIME      DEFAULT NULL,
  `kecepatan_kmh`     DECIMAL(5,1)  DEFAULT NULL,
  `heading_derajat`   DECIMAL(5,2)  DEFAULT NULL COMMENT 'Arah (0-360 derajat)',
  `akurasi_meter`     DECIMAL(7,2)  DEFAULT NULL,
  `timestamp_gps`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tracking`),
  INDEX `idx_tracking_sopir` (`id_sopir`),
  INDEX `idx_tracking_penugasan` (`id_penugasan`),
  INDEX `idx_tracking_timestamp` (`timestamp_gps`),
  FOREIGN KEY (`id_penugasan`) REFERENCES `penugasan`(`id_penugasan`) ON DELETE CASCADE,
  FOREIGN KEY (`id_sopir`)     REFERENCES `sopir`(`id_sopir`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  9. TABEL LAPORAN HARIAN
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `laporan_harian` (
  `id_laporan`      INT(11)      NOT NULL AUTO_INCREMENT,
  `id_penugasan`    INT(11)      NOT NULL,
  `id_admin`        INT(11)      DEFAULT NULL COMMENT 'Admin yang menerima laporan',
  `tanggal_laporan` DATE         NOT NULL,
  `total_jarak_km`  DECIMAL(6,2) DEFAULT NULL,
  `jumlah_siswa`    SMALLINT(5)  DEFAULT NULL,
  `catatan`         TEXT         DEFAULT NULL,
  `status_laporan`  ENUM('terkirim','diterima','ditolak') NOT NULL DEFAULT 'terkirim',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_laporan`),
  FOREIGN KEY (`id_penugasan`) REFERENCES `penugasan`(`id_penugasan`) ON DELETE CASCADE,
  FOREIGN KEY (`id_admin`)     REFERENCES `admin`(`id_admin`)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────
--  DATA AWAL (Seed Data)
-- ─────────────────────────────────────────────────────────

-- Admin default (password: admin123 — ganti setelah deploy!)
INSERT INTO `admin` (`nama`, `username`, `password`, `email`) VALUES
('Super Admin', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@bussekolah.madiun.id');

-- Data Sekolah (Node Graf berdasarkan SKPL)
INSERT INTO `sekolah` (`nama_sekolah`, `kecamatan`, `latitude`, `longitude`, `node_code`) VALUES
('Bus Pool Kecamatan Manguharjo', 'Manguharjo', -7.6298000, 111.5200000, 'A'),
('SMPN 07 Madiun',                'Manguharjo', -7.6380000, 111.5230000, 'B'),
('SDN 03 Nambangan Kidul',        'Manguharjo', -7.6220000, 111.5270000, 'C'),
('SDN 01 Nambangan Kidul',        'Manguharjo', -7.6295000, 111.5320000, 'D'),
('SDN 02 Nambangan Kidul',        'Manguharjo', -7.6220000, 111.5470000, 'E'),
('SDN 05 Madiun Lor',             'Manguharjo', -7.6295000, 111.5410000, 'F'),
('SMPN 01 Madiun',                'Manguharjo', -7.6380000, 111.5470000, 'G'),
('SMPN 03 Madiun',                'Manguharjo', -7.6295000, 111.5510000, 'H');

-- Data Bus
INSERT INTO `bus` (`plat_kendaraan`, `merk`, `warna`, `kecamatan`, `kapasitas`, `tahun`) VALUES
('AE 1234 AB', 'Mitsubishi Colt Diesel', 'Kuning', 'Manguharjo', 30, 2019),
('AE 5678 CD', 'Isuzu Elf',             'Kuning', 'Manguharjo', 25, 2020),
('AE 9012 EF', 'Mitsubishi Colt Diesel', 'Kuning', 'Manguharjo', 30, 2021),
('AE 3456 GH', 'Hino Bus',              'Kuning', 'Manguharjo', 35, 2022);

-- Data Sopir
INSERT INTO `sopir` (`nama`, `username`, `password`, `no_hp`, `no_sim`) VALUES
('Budi Santoso',  'budi',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567001', 'B-1234567-JI'),
('Andi Wijaya',   'andi',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567002', 'B-2345678-JI'),
('Rizky Pratama', 'rizky', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567003', 'B-3456789-JI'),
('Doni Setiawan', 'doni',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567004', 'B-4567890-JI');

-- Rute MNN (urutan hasil algoritma: A→B→D→C→F→G→H→E→C→A)
INSERT INTO `rute` (`id_sekolah`, `urutan`, `jarak_ke_next`, `total_jarak`, `metode`) VALUES
(1, 1, 0.80, 15.30, 'MNN'),  -- A → B
(2, 2, 0.90, 15.30, 'MNN'),  -- B → D
(4, 3, 0.70, 15.30, 'MNN'),  -- D → C
(3, 4, 3.60, 15.30, 'MNN'),  -- C → F
(6, 5, 0.20, 15.30, 'MNN'),  -- F → G
(7, 6, 0.10, 15.30, 'MNN'),  -- G → H
(8, 7, 3.80, 15.30, 'MNN'),  -- H → E
(5, 8, 5.20, 15.30, 'MNN');  -- E → C → A (return)

-- Penugasan hari ini (contoh)
INSERT INTO `penugasan` (`id_bus`, `id_sopir`, `tanggal`, `shift`, `jam_mulai`, `jam_selesai`, `status`) VALUES
(1, 1, CURDATE(), 'pagi', '06:30:00', '08:00:00', 'aktif'),
(2, 2, CURDATE(), 'pagi', '06:30:00', '08:00:00', 'aktif'),
(3, 3, CURDATE(), 'pagi', '06:30:00', '08:00:00', 'aktif'),
(4, 4, CURDATE(), 'pagi', '06:30:00', '08:00:00', 'terjadwal');

-- ─────────────────────────────────────────────────────────
--  VIEW BERGUNA
-- ─────────────────────────────────────────────────────────

-- View: Status bus hari ini
CREATE OR REPLACE VIEW `v_bus_hari_ini` AS
SELECT
  p.id_penugasan,
  b.plat_kendaraan,
  b.merk,
  CONCAT('Bus 0', b.id_bus) AS nama_bus,
  s.nama                    AS nama_sopir,
  s.no_hp                   AS hp_sopir,
  p.shift,
  p.jam_mulai,
  p.jam_selesai,
  p.status                  AS status_penugasan,
  p.tanggal
FROM `penugasan` p
JOIN `bus`   b ON b.id_bus   = p.id_bus
JOIN `sopir` s ON s.id_sopir = p.id_sopir
WHERE p.tanggal = CURDATE();

-- View: Tracking terbaru per sopir
CREATE OR REPLACE VIEW `v_tracking_terbaru` AS
SELECT
  t.id_sopir,
  s.nama AS nama_sopir,
  t.latitude,
  t.longitude,
  t.kecepatan_kmh,
  t.timestamp_gps,
  p.id_bus,
  b.plat_kendaraan
FROM `tracking` t
JOIN `sopir`     s ON s.id_sopir     = t.id_sopir
JOIN `penugasan` p ON p.id_penugasan = t.id_penugasan
JOIN `bus`       b ON b.id_bus       = p.id_bus
WHERE t.timestamp_gps = (
  SELECT MAX(t2.timestamp_gps)
  FROM `tracking` t2
  WHERE t2.id_sopir = t.id_sopir
);
