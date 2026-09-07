# FIRELINE — System Design

Dokumen ini mendeskripsikan arsitektur dan desain sistem **FIRELINE** dari sudut pandang Software Engineering, mencakup Use Case, Entity Relationship Diagram (ERD), System Architecture, System Design, dan API Contract.

---

## 1. Pendahuluan

**FIRELINE** (Fire Intelligence & Risk Early-warning for Land and Environment) adalah platform intelijen risiko kebakaran hutan dan lahan berbasis AI untuk pencegahan, prioritas respons, dan perlindungan masyarakat di Kalimantan.

### Tujuan Dokumen

Dokumen ini menjadi rujukan teknis bagi tim Software Engineering untuk membangun sistem FIRELINE secara konsisten, mencakup:

- Use Case Diagram (UML) untuk memetakan interaksi pengguna dengan sistem
- Entity Relationship Diagram (ERD) untuk memodelkan struktur data
- System Architecture untuk menunjukkan alur data secara high-level
- System Design untuk mendeskripsikan komponen dan integrasi antar layanan
- API Contract untuk mendefinisikan endpoint dan kontrak data

### Tech Stack

| No  | Teknologi                    | Kegunaan                                                                         | Keunggulan                                                                                                  |
| --- | ---------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | **Cloudflare**               | DNS, proxy, dan proteksi WAF terhadap serangan/abuse pada API publik             | Jaringan edge global dengan latensi rendah; WAF & rate limiting bawaan; tier gratis mencakup fitur inti     |
| 2   | **Flutter**                  | Pengembangan aplikasi mobile lintas platform (Android & iOS) dengan mode offline | Satu codebase untuk dua platform; performa mendekati native; ekosistem package lokal storage (Hive/sqflite) |
| 3   | **PostgreSQL + PostGIS**     | Database utama dengan dukungan query geospasial                                  | PostGIS untuk spatial join, radius search, dan GiST index; tetap relational untuk data terstruktur lain     |
| 4   | **FastAPI (Backend)**        | API utama aplikasi, logika bisnis, integrasi layanan                             | Async native untuk I/O-bound; auto-generate dokumentasi API (Swagger/OpenAPI)                               |
| 5   | **FastAPI (AI Service)**     | Layanan API terpisah untuk model AI, risk assessment, prediksi H-1               | Ekosistem ML Python (pandas, scikit-learn); async request; auto-generate OpenAPI                            |
| 6   | **Redis**                    | Caching data yang sering diakses dan pub/sub real-time                           | In-memory store dengan latensi rendah; pub/sub bawaan untuk notifikasi antar service                        |
| 7   | **RabbitMQ**                 | Message queue untuk notifikasi massal dan job ingestion data satelit             | Acknowledgment & retry bawaan; berbagai pola routing (fanout, topic) untuk broadcast massal                 |
| 8   | **Cloudflare R2**            | Object storage penyimpanan raw data                                              | Kompatibel S3 API; tanpa biaya egress                                                                       |
| 9   | **Firebase Cloud Messaging** | Push notification ke perangkat pengguna                                          | Gratis, lintas platform; terintegrasi Flutter; topic-based messaging untuk targeting per radius             |
| 10  | **Mapbox**                   | Visualisasi peta radar titik api dan sebaran asap                                | Rendering vector tile ringan; custom style layer (GeoJSON) untuk heatmap                                    |

---

## 2. Use Case Diagram

### 2.1 Aktor

| Aktor     | Deskripsi                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------- |
| **Warga** | Pengguna utama aplikasi — masyarakat yang tinggal di daerah rawan kebakaran hutan dan lahan di Kalimantan |

### 2.2 Use Case Utama

#### 2.2.1 Menerima Peringatan Dini H-1

Warga menerima notifikasi peringatan dini kebakaran 1 hari sebelum kejadian berdasarkan analisis risiko spasial dan temporal.

| Relasi        | Use Case Terkait                  |
| ------------- | --------------------------------- |
| `<<include>>` | Mengirimkan Notifikasi Peringatan |
| `<<extend>>`  | Pengingat Resiko Musiman          |

**Deskripsi Alur:**

1. Sistem secara berkala menjalankan risk assessment untuk setiap region
2. Jika risk level mencapai threshold tertentu, Alert Worker membuat alert
3. Notification Worker mengirim push notification via Firebase Cloud Messaging
4. Warga menerima notifikasi di perangkat mobile
5. _(Opsional)_ Pengingat risiko musiman dikirim selama musim kemarau

#### 2.2.2 Lihat Risiko Kebakaran Berdasarkan Lokasi

Warga melihat informasi risiko kebakaran berdasarkan lokasi mereka saat ini.

| Relasi        | Use Case Terkait                                          |
| ------------- | --------------------------------------------------------- |
| `<<include>>` | Deteksi Lokasi Pengguna                                   |
| `<<include>>` | Tampilkan Level Risiko (Low / Moderate / High / Critical) |
| `<<include>>` | Tampilkan Kedekatan dengan Hotspot                        |
| `<<extend>>`  | Lihat Penjelasan Risiko                                   |
| `<<extend>>`  | Melihat Rekomendasi Tindakan                              |

**Sub-Relasi:**

- Lihat Penjelasan Risiko → `<<include>>` Tampilkan konteks prediksi
- Lihat Penjelasan Risiko → `<<include>>` Tampilkan indikator visual
- Melihat Rekomendasi Tindakan → `<<include>>` Tampilkan Pemanduan Keamanan

**Deskripsi Alur:**

1. Aplikasi mendeteksi lokasi pengguna (GPS / manual input koordinat)
2. Sistem mengirim request ke `/risk?lat={lat}&lng={lng}`
3. Backend mendeteksi region dari koordinat dan mengambil risk assessment terbaru
4. Aplikasi menampilkan level risiko, proximity ke hotspot, dan fasilitas terdekat
5. Warga dapat melihat penjelasan risiko dan rekomendasi tindakan

#### 2.2.3 Menghubungi Nomor Darurat

Warga menghubungi kontak darurat (BPBD, relawan, polisi) yang tersedia di region mereka.

**Deskripsi Alur:**

1. Warga mengakses halaman kontak darurat
2. Aplikasi mengambil daftar kontak dari `/regions/{region_id}/emergency-contacts`
3. Warga memilih kontak dan melakukan panggilan telepon

### 2.3 Use Case Diagram (Visual)

```
                          ┌─────────────────────────────────────────────┐
                          │         FIRELINE Application                │
                          │                                             │
┌─────────┐              │  ┌──────────────────────────┐              │
│         │              │  │ Menerima Peringatan      │              │
│         │  ────────────┼──│ Dini H-1                 │              │
│         │              │  │  ├─ <<include>> Mengirimkan│             │
│         │              │  │  │  Notifikasi Peringatan  │             │
│         │              │  │  └─ <<extend>> Pengingat   │             │
│         │              │  │     Resiko Musiman        │             │
│         │              │  └──────────────────────────┘              │
│         │              │                                             │
│         │              │  ┌──────────────────────────┐              │
│         │  ────────────┼──│ Lihat Risiko Kebakaran   │              │
│         │              │  │ Berdasarkan Lokasi        │              │
│  Warga  │              │  │  ├─ <<include>> Deteksi   │             │
│         │              │  │  │  Lokasi Pengguna       │              │
│         │              │  │  ├─ <<include>> Tampilkan │             │
│         │              │  │  │  Level Risiko          │              │
│         │              │  │  ├─ <<include>> Tampilkan │             │
│         │              │  │  │  Kedekatan Hotspot     │              │
│         │              │  │  ├─ <<extend>> Lihat      │             │
│         │              │  │  │  Penjelasan Risiko     │              │
│         │              │  │  └─ <<extend>> Melihat    │             │
│         │              │  │     Rekomendasi Tindakan  │              │
│         │              │  └──────────────────────────┘              │
│         │              │                                             │
│         │              │  ┌──────────────────────────┐              │
│         │  ────────────┼──│ Menghubungi Nomor        │              │
│         │              │  │ Darurat                   │              │
└─────────┘              │  └──────────────────────────┘              │
                          └─────────────────────────────────────────────┘
```

---

## 3. Entity Relationship Diagram (ERD)

### 3.1 Daftar Entitas

| No  | Entitas                   | Deskripsi                                        |
| --- | ------------------------- | ------------------------------------------------ |
| 1   | `user`                    | Data pengguna aplikasi (warga)                   |
| 2   | `region`                  | Data region/daerah di Kalimantan                 |
| 3   | `hotspot`                 | Data hotspot kebakaran dari NASA FIRMS           |
| 4   | `facility`                | Data fasilitas umum (sekolah, faskes, dll)       |
| 5   | `weather_reading`         | Data cuaca dari BMKG                             |
| 6   | `air_quality`             | Data kualitas udara (PM2.5, AQI)                 |
| 7   | `region_vulnerability`    | Data kerentanan region (populasi, tutupan lahan) |
| 8   | `region_threshold_config` | Konfigurasi threshold risiko                     |
| 9   | `risk_assessment`         | Hasil kalkulasi risiko per hotspot               |
| 10  | `safety_guide`            | Panduan keamanan berdasarkan level risiko        |
| 11  | `alert`                   | Notifikasi/alert yang dikirim ke user            |
| 12  | `emergency_contact`       | Kontak darurat per region                        |

### 3.2 Diagram Relasi

```
┌──────────────────┐       ┌──────────────────┐
│      region      │       │       user       │
├──────────────────┤       ├──────────────────┤
│ id          (PK) │◄──┐   │ user_id     (PK) │
│ nama_daerah      │   │   │ home_lat         │
│ geom_lat         │   ├───│ home_lng         │
│ geom_lng         │   │   │ region_id    (FK)│──┐
└──────┬───────────┘   │   │ notif_status_tar │  │
       │               │   │ notification_    │  │
       │               │   │   method_pref    │  │
       │               │   │ disability_flag  │  │
       │               │   │ disability_note  │  │
       │               │   └──────────────────┘  │
       │               │                          │
       │               │   ┌──────────────────┐  │
       │               │   │    alert         │  │
       │               │   ├──────────────────┤  │
       │               │   │ id           (PK)│  │
       │               ├───│ user_id      (FK)│◄─┘
       │               │   │ risk_assessment_ │
       │               │   │   id         (FK)│
       │               │   │ safety_guide_id  │
       │               │   │   (FK)           │
       │               │   │ type             │
       │               │   │ message          │
       │               │   │ is_read          │
       │               │   │ sent_at          │
       │               │   │ read_at          │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │  risk_assessment  │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ hotspot_id   (FK)│
       │               │   │ risk_level       │
       │               │   │ intensity_score  │
       │               │   │ exposure_score   │
       │               │   │ total_risk_score │
       │               │   │ assessment_type  │
       │               │   │ valid_for_date   │
       │               │   │ calculated_at    │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │     hotspot      │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ latitude         │
       │               │   │ longitude        │
       │               │   │ frp              │
       │               │   │ source           │
       │               │   │ status           │
       │               │   │ detected_at      │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │    facility      │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ name             │
       │               │   │ type             │
       │               │   │ latitude         │
       │               │   │ longitude        │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │ weather_reading  │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ temperature      │
       │               │   │ humidity         │
       │               │   │ wind_speed       │
       │               │   │ wind_direction   │
       │               │   │ rainfall         │
       │               │   │ reading_date     │
       │               │   │ source           │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │   air_quality    │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ pm25             │
       │               │   │ aqi              │
       │               │   │ smoke_direction  │
       │               │   │ reading_date     │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │region_vulnerability│
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ population_      │
       │               │   │   density        │
       │               │   │ vulnerable_      │
       │               │   │   population_count│
       │               │   │ land_cover_type  │
       │               │   │ updated_at       │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │region_threshold_ │
       │               │   │     config       │
       │               │   ├──────────────────┤
       │               ├───│ id           (PK)│
       │               │   │ region_id    (FK)│
       │               │   │ pm25_score       │
       │               │   │ aqi_score        │
       │               │   │ temp_score       │
       │               │   │ humidity_score   │
       │               │   │ weight_temp      │
       │               │   │ weight_humidity  │
       │               │   │ updated_at       │
       │               │   └──────────────────┘
       │               │
       │               │   ┌──────────────────┐
       │               │   │ emergency_contact│
       │               │   ├──────────────────┤
       │               └───│ id           (PK)│
       │                   │ region_id    (FK)│
       │                   │ name             │
       │                   │ phone            │
       │                   │ type             │
       │                   └──────────────────┘
       │
       │               ┌──────────────────┐
       │               │   safety_guide   │
       │               ├──────────────────┤
       └──────────────►│ id           (PK)│
                       │ risk_level       │
                       │ title            │
                       │ description      │
                       │ image_url        │
                       │ category         │
                       └──────────────────┘
```

### 3.3 Detail Field per Entitas

#### `user`

| Field                      | Tipe    | Constraint  | Deskripsi                               |
| -------------------------- | ------- | ----------- | --------------------------------------- |
| `user_id`                  | UUID    | PK          | Identitas unik pengguna                 |
| `home_lat`                 | FLOAT   |             | Latitude lokasi rumah                   |
| `home_lng`                 | FLOAT   |             | Longitude lokasi rumah                  |
| `notif_status_tar`         | INT     |             | Status notifikasi (0=off, 1=on)         |
| `region_id`                | UUID    | FK → region | Region tempat tinggal                   |
| `notification_method_pref` | VARCHAR |             | Preferensi metode notifikasi (push/sms) |
| `disability_flag`          | BOOLEAN |             | Penanda disabilitas                     |
| `disability_note`          | VARCHAR |             | Catatan disabilitas                     |

#### `region`

| Field         | Tipe    | Constraint | Deskripsi                 |
| ------------- | ------- | ---------- | ------------------------- |
| `id`          | UUID    | PK         | Identitas unik region     |
| `nama_daerah` | VARCHAR |            | Nama daerah/kabupaten     |
| `geom_lat`    | FLOAT   |            | Latitude centroid region  |
| `geom_lng`    | FLOAT   |            | Longitude centroid region |

#### `hotspot`

| Field         | Tipe      | Constraint  | Deskripsi                 |
| ------------- | --------- | ----------- | ------------------------- |
| `id`          | UUID      | PK          | Identitas unik hotspot    |
| `region_id`   | UUID      | FK → region | Region lokasi hotspot     |
| `latitude`    | FLOAT     |             | Latitude hotspot          |
| `longitude`   | FLOAT     |             | Longitude hotspot         |
| `frp`         | FLOAT     |             | Fire Radiative Power (MW) |
| `source`      | VARCHAR   |             | Sumber data (NASA FIRMS)  |
| `status`      | VARCHAR   |             | Status hotspot            |
| `detected_at` | TIMESTAMP |             | Waktu deteksi             |

#### `facility`

| Field       | Tipe    | Constraint  | Deskripsi                   |
| ----------- | ------- | ----------- | --------------------------- |
| `id`        | UUID    | PK          | Identitas unik fasilitas    |
| `region_id` | UUID    | FK → region | Region lokasi fasilitas     |
| `name`      | VARCHAR |             | Nama fasilitas              |
| `type`      | VARCHAR |             | Tipe (sekolah, faskes, dll) |
| `latitude`  | FLOAT   |             | Latitude fasilitas          |
| `longitude` | FLOAT   |             | Longitude fasilitas         |

#### `weather_reading`

| Field            | Tipe    | Constraint  | Deskripsi                |
| ---------------- | ------- | ----------- | ------------------------ |
| `id`             | UUID    | PK          | Identitas unik reading   |
| `region_id`      | UUID    | FK → region | Region lokasi pengukuran |
| `temperature`    | FLOAT   |             | Suhu (°C)                |
| `humidity`       | FLOAT   |             | Kelembaban (%)           |
| `wind_speed`     | FLOAT   |             | Kecepatan angin (m/s)    |
| `wind_direction` | VARCHAR |             | Arah angin               |
| `rainfall`       | FLOAT   |             | Curah hujan (mm)         |
| `reading_date`   | DATE    |             | Tanggal pengukuran       |
| `source`         | VARCHAR |             | Sumber data (BMKG)       |

#### `air_quality`

| Field             | Tipe    | Constraint  | Deskripsi                 |
| ----------------- | ------- | ----------- | ------------------------- |
| `id`              | UUID    | PK          | Identitas unik reading    |
| `region_id`       | UUID    | FK → region | Region lokasi pengukuran  |
| `pm25`            | FLOAT   |             | Konsentrasi PM2.5 (µg/m³) |
| `aqi`             | INT     |             | Air Quality Index         |
| `smoke_direction` | VARCHAR |             | Arah sebaran asap         |
| `reading_date`    | DATE    |             | Tanggal pengukuran        |

#### `region_vulnerability`

| Field                         | Tipe      | Constraint  | Deskripsi                                     |
| ----------------------------- | --------- | ----------- | --------------------------------------------- |
| `id`                          | UUID      | PK          | Identitas unik                                |
| `region_id`                   | UUID      | FK → region | Region terkait                                |
| `population_density`          | FLOAT     |             | Kepadatan penduduk (jiwa/km²)                 |
| `vulnerable_population_count` | INT       |             | Jumlah populasi rentan (lansia, anak)         |
| `land_cover_type`             | VARCHAR   |             | Tipe tutupan lahan (hutan, lahan gambut, dll) |
| `updated_at`                  | TIMESTAMP |             | Waktu update terakhir                         |

#### `region_threshold_config`

| Field             | Tipe      | Constraint  | Deskripsi                        |
| ----------------- | --------- | ----------- | -------------------------------- |
| `id`              | UUID      | PK          | Identitas unik                   |
| `region_id`       | UUID      | FK → region | Region terkait                   |
| `pm25_score`      | FLOAT     |             | Bobot skor PM2.5                 |
| `aqi_score`       | FLOAT     |             | Bobot skor AQI                   |
| `temp_score`      | FLOAT     |             | Bobot skor suhu                  |
| `humidity_score`  | FLOAT     |             | Bobot skor kelembaban            |
| `weight_temp`     | FLOAT     |             | Bobot temperatur dalam composite |
| `weight_humidity` | FLOAT     |             | Bobot kelembaban dalam composite |
| `updated_at`      | TIMESTAMP |             | Waktu update terakhir            |

#### `risk_assessment`

| Field              | Tipe      | Constraint   | Deskripsi                                 |
| ------------------ | --------- | ------------ | ----------------------------------------- |
| `id`               | UUID      | PK           | Identitas unik assessment                 |
| `hotspot_id`       | UUID      | FK → hotspot | Hotspot terkait                           |
| `risk_level`       | VARCHAR   |              | Level risiko (Low/Moderate/High/Critical) |
| `intensity_score`  | FLOAT     |              | Skor intensitas (0-1)                     |
| `exposure_score`   | FLOAT     |              | Skor eksposur (0-1)                       |
| `total_risk_score` | FLOAT     |              | Total skor risiko (0-1)                   |
| `assessment_type`  | VARCHAR   |              | Tipe assessment (current/predicted_h1)    |
| `valid_for_date`   | DATE      |              | Berlaku untuk tanggal                     |
| `calculated_at`    | TIMESTAMP |              | Waktu kalkulasi                           |

#### `safety_guide`

| Field         | Tipe    | Constraint | Deskripsi              |
| ------------- | ------- | ---------- | ---------------------- |
| `id`          | UUID    | PK         | Identitas unik panduan |
| `risk_level`  | VARCHAR |            | Level risiko terkait   |
| `title`       | VARCHAR |            | Judul panduan          |
| `description` | TEXT    |            | Deskripsi panduan      |
| `image_url`   | VARCHAR |            | URL gambar ilustrasi   |
| `category`    | VARCHAR |            | Kategori panduan       |

#### `alert`

| Field                | Tipe      | Constraint           | Deskripsi            |
| -------------------- | --------- | -------------------- | -------------------- |
| `id`                 | UUID      | PK                   | Identitas unik alert |
| `user_id`            | UUID      | FK → user            | User penerima        |
| `risk_assessment_id` | UUID      | FK → risk_assessment | Assessment terkait   |
| `safety_guide_id`    | UUID      | FK → safety_guide    | Panduan terkait      |
| `type`               | VARCHAR   |                      | Tipe alert           |
| `message`            | TEXT      |                      | Isi pesan alert      |
| `is_read`            | BOOLEAN   |                      | Status baca          |
| `sent_at`            | TIMESTAMP |                      | Waktu kirim          |
| `read_at`            | TIMESTAMP |                      | Waktu dibaca         |

#### `emergency_contact`

| Field       | Tipe    | Constraint  | Deskripsi                  |
| ----------- | ------- | ----------- | -------------------------- |
| `id`        | UUID    | PK          | Identitas unik kontak      |
| `region_id` | UUID    | FK → region | Region terkait             |
| `name`      | VARCHAR |             | Nama organisasi            |
| `phone`     | VARCHAR |             | Nomor telepon              |
| `type`      | VARCHAR |             | Tipe (BPBD/Relawan/Polisi) |

---

## 4. System Architecture (High-Level)

System Architecture FIRELINE menggambarkan alur data dari sumber eksternal hingga sampai ke aplikasi warga.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES (External)                             │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  NASA FIRMS  │  │    BMKG     │  │ Data Sekolah │  │   Populasi   │   │
│  │  (Hotspot)   │  │  (Cuaca)    │  │  (Fasilitas) │  │  (Demografi) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │             │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FEATURE ENGINEERING & SPATIAL JOIN                       │
│                                                                             │
│  • Menggabungkan data hotspot dengan data cuaca, fasilitas, dan populasi   │
│  • Melakukan spatial join berdasarkan region                                │
│  • Menghitung fitur-fitur risiko (intensity, exposure)                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONFIG & THRESHOLD STORE                               │
│                                                                             │
│  • Konfigurasi threshold risiko                                   │
│  • Bobot scoring (intensity, exposure)                                      │
│  • Parameter model yang dapat dikonfigurasi                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
              ┌──────────────────────┐  ┌──────────────────────┐
              │    RISK SCORING      │  │    SURGE MODEL        │
              │                      │  │                      │
              │ • intensity_score    │  │ • Prediksi surge      │
              │ • exposure_score     │  │ • Tren temporal       │
              │ • total_risk_score   │  │ • Pola musiman        │
              │ • risk_level         │  │                      │
              └──────────┬───────────┘  └──────────┬───────────┘
                         │                         │
                         └────────────┬────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API & CACHE                                   │
│                                                                             │
│  • REST API untuk client mobile                                             │
│  • Redis cache untuk performa                                               │
│  • Alert generation & notification pipeline                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       APLIKASI WARGA (Mobile)                               │
│                                                                             │
│  • Lihat risiko berdasarkan lokasi                                          │
│  • Terima notifikasi peringatan dini                                        │
│  • Akses panduan keamanan & kontak darurat                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. System Design (Detailed)

### 5.1 Komponen Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FIRELINE SYSTEM DESIGN                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        MOBILE CLIENT                                │   │
│  │                        (Flutter App)                                │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                         │   │
│  │  │   Mapbox SDK    │  │  Local Storage  │                         │   │
│  │  │  (Peta & Heatmap│  │  (Hive/sqflite) │                         │   │
│  │  └─────────────────┘  └─────────────────┘                         │   │
│  │                                                                     │   │
│  │  • HTTP Request ──────────────────────────────────┐                │   │
│  │  • Push Notification (FCM) ◄──────────────────┐   │                │   │
│  └───────────────────────────────────────────────┼───┼────────────────┘   │
│                                                  │   │                    │
│                                                  │   │                    │
│  ┌───────────────────────────────────────────────┼───┼────────────────┐   │
│  │                     CLOUDFLARE                │   │                │   │
│  │              (DNS, Proxy, WAF)                │   │                │   │
│  │                                               ▼   │                │   │
│  │  • Rate Limiting ────────────►  FastAPI Backend API                │   │
│  │  • DDoS Protection                                             │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                  │                        │
│                                                  ▼                        │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                 FASTAPI BACKEND API (Python)                        │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                       │   │
│  │  │  Alert Worker   │    │Ingestion Worker │                       │   │
│  │  │                 │    │                 │                       │   │
│  │  │ • Generate alert│    │ • Fetch raw data│                       │   │
│  │  │ • Publish to    │    │ • Process &     │                       │   │
│  │  │   RabbitMQ      │    │   transform     │                       │   │
│  │  └────────┬────────┘    └────────┬────────┘                       │   │
│  │           │                      │                                 │   │
│  └───────────┼──────────────────────┼─────────────────────────────────┘   │
│              │                      │                                      │
│              ▼                      ▼                                      │
│  ┌────────────────────┐  ┌────────────────────┐                          │
│  │     RABBITMQ       │  │   DATA PIPELINE    │                          │
│  │   (Message Queue)  │  │                    │                          │
│  │                    │  │ ┌────────────────┐ │                          │
│  │ • Alert Queue      │  │ │ NASA FIRMS API │ │                          │
│  │ • Ingestion Queue  │  │ └────────────────┘ │                          │
│  │ • Fanout/Topic     │  │ ┌────────────────┐ │                          │
│  │   routing          │  │ │   BMKG API     │ │                          │
│  └─────────┬──────────┘  │ └────────────────┘ │                          │
│            │             │ ┌────────────────┐ │                          │
│            │             │ │Data cuaca,     │ │                          │
│            │             │ │infrastruktur & │ │                          │
│            │             │ │demografi       │ │                          │
│            │             │ └────────────────┘ │                          │
│            ▼             └────────────────────┘                          │
│  ┌────────────────────┐         │                                        │
│  │  NOTIFICATION      │         ▼                                        │
│  │  WORKER            │  ┌────────────────────┐                          │
│  │                    │  │  CLOUDFLARE R2     │                          │
│  │ • Consume from     │  │  STORAGE           │                          │
│  │   RabbitMQ         │  │                    │                          │
│  │ • Send via FCM     │  │ • Raw data archive │                          │
│  └─────────┬──────────┘  │ • Processed data   │                          │
│            │             └────────────────────┘                          │
│            ▼                                                            │
│  ┌────────────────────┐  ┌────────────────────┐                          │
│  │ FIREBASE CLOUD     │  │  FASTAPI AI        │                          │
│  │ MESSAGING (FCM)    │  │  SERVICE (Python)  │                          │
│  │                    │  │                    │                          │
│  │ • Push Notification│  │ ┌────────────────┐ │                          │
│  │ • Topic-based      │  │ │ Risk Scoring   │ │                          │
│  │   delivery         │  │ └────────────────┘ │                          │
│  └─────────┬──────────┘  │ ┌────────────────┐ │                          │
│            │             │ │ Surge Model    │ │                          │
│            │             │ └────────────────┘ │                          │
│            ▼             │                    │                          │
│  ┌────────────────────┐  │ • Get Cache ◄─────┤──┐                       │
│  │  MOBILE CLIENT     │  │ • Set Cache ──────►│  │                       │
│  │  (Push Notif)      │  └────────────────────┘  │                       │
│  └────────────────────┘                          │                       │
│                                                  │                       │
│  ┌────────────────────┐  ┌────────────────────┐  │                       │
│  │      REDIS         │  │    DATABASE        │  │                       │
│  │      (Cache)       │  │  (PostgreSQL +     │  │                       │
│  │                    │  │   PostGIS)         │  │                       │
│  │ • Risk assessment  │  │                    │  │                       │
│  │ • Weather data     │  │ • Read/Write data  │──┘                       │
│  │ • Hotspot cache    │  │ • Spatial queries  │                          │
│  └────────────────────┘  └────────────────────┘                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Alur Data & Integrasi

#### 5.2.1 Data Ingestion Flow

```
NASA FIRMS API ──┐
BMKG API ────────┤──► Ingestion Worker ──► RabbitMQ ──► Cloudflare R2 (Raw Archive)
Data Demografi ──┘                          │                 │
                                            │                 ▼
                                            │         Feature Engineering
                                            │         & Spatial Join
                                            │                 │
                                            │                 ▼
                                            │         PostgreSQL + PostGIS
                                            │         (Processed Data)
                                            │
                                            └──► Redis (cache invalidation)
```

#### 5.2.2 Risk Assessment Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Data Input      │     │  FastAPI AI      │     │  Output          │
│                  │     │  Service         │     │                  │
│ • Hotspot data   │────►│ • Risk Scoring   │────►│ • risk_level     │
│ • Weather data   │     │ • Surge Model    │     │ • scores         │
│ • Facility data  │     │                  │     │ • assessment     │
│ • Population     │     │ ◄── Redis Cache  │     │                  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                                                   ┌──────────────────┐
                                                   │  Alert Worker    │
                                                   │  (FastAPI)       │
                                                   │                  │
                                                   │ • Threshold check│
                                                   │ • Publish to     │
                                                   │   RabbitMQ       │
                                                   └────────┬─────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │    RabbitMQ      │
                                                   │  (Message Queue) │
                                                   │                  │
                                                   │ • Alert Queue    │
                                                   └────────┬─────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │  Notification    │
                                                   │  Worker          │
                                                   │                  │
                                                   │ • Consume alert  │
                                                   │ • Send via FCM   │
                                                   └────────┬─────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │   Firebase FCM   │
                                                   │   → Mobile App   │
                                                   └──────────────────┘
```

#### 5.2.3 Client Request Flow

```
Flutter App ──► Cloudflare (WAF/Rate Limit) ──► FastAPI Backend ──► PostgreSQL + PostGIS
                        │                              │
                        │                              ├──► Redis (cache check)
                        │                              │
                        ◄──────────────────────────────┘
                        │
                  HTTP Response
                        │
                        ▼
                  Flutter App
                  (Mapbox + Render UI)
```

#### 5.2.4 Notification Flow (via RabbitMQ)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Alert Worker    │     │    RabbitMQ      │     │  Notification    │
│  (Publisher)     │     │  (Message Queue) │     │  Worker          │
│                  │     │                  │     │  (Consumer)      │
│ • Risk threshold │────►│ • Alert Queue    │────►│                  │
│   exceeded       │     │ • Ack/Retry      │     │ • Consume message│
│ • Create alert   │     │ • Fanout routing │     │ • Target users   │
│ • Publish event  │     │                  │     │ • Send FCM push  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                                                   ┌──────────────────┐
                                                   │   Mobile App     │
                                                   │   (Push Notif)   │
                                                   └──────────────────┘
```

### 5.3 Component Description

| Komponen                 | Fungsi                                                                     | Teknologi                                                     |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Mobile Client**        | Aplikasi Warga untuk melihat risiko, peta heatmap, dan menerima notifikasi | **Flutter** (Android & iOS, offline support via Hive/sqflite) |
| **Mapbox SDK**           | Visualisasi peta radar titik api dan sebaran asap di mobile                | **Mapbox** (vector tile, custom GeoJSON layer)                |
| **Cloudflare**           | DNS, proxy, proteksi WAF, rate limiting untuk API publik                   | **Cloudflare** (edge global, tier gratis)                     |
| **FastAPI Backend**      | REST API server, logika bisnis, integrasi seluruh layanan                  | **FastAPI (Python)** (async, auto-generate OpenAPI)           |
| **Alert Worker**         | Membuat alert berdasarkan risk assessment, publish ke RabbitMQ             | FastAPI background task                                       |
| **Ingestion Worker**     | Mengambil dan memproses data dari sumber eksternal                         | FastAPI background task                                       |
| **RabbitMQ**             | Message queue untuk notifikasi massal dan job ingestion                    | **RabbitMQ** (ack/retry, fanout/topic routing)                |
| **Notification Worker**  | Mengirim notifikasi ke user melalui FCM                                    | Consumer RabbitMQ                                             |
| **FastAPI AI Service**   | Risk scoring, surge prediction, kalkulasi H-1                              | **FastAPI (Python)** (pandas, scikit-learn)                   |
| **Redis**                | Caching layer untuk data yang sering diakses + pub/sub                     | **Redis** (in-memory, latensi rendah)                         |
| **PostgreSQL + PostGIS** | Database utama dengan spatial extension untuk query geospasial             | **PostgreSQL + PostGIS** (GiST index, spatial join)           |
| **Cloudflare R2**        | Object storage untuk raw data archive                                      | **Cloudflare R2** (S3-compatible, tanpa biaya egress)         |
| **Firebase FCM**         | Push notification delivery ke perangkat user                               | **Firebase Cloud Messaging** (topic-based, lintas platform)   |

### 5.4 Risk Scoring Formula

```
intensity = 0.60 × minmax(log1p(FRP)) + 0.20 × minmax(brightness) + 0.20 × minmax(confidence)

exposure = 0.50 × exp(-school_distance_km / 5) + 0.30 × minmax(log1p(schools_5km)) + 0.20 × minmax(log1p(province_population))

risk_score = 0.45 × intensity + 0.55 × exposure
```

**Risk Level Thresholds:**

| Level    | Threshold         | Keterangan           |
| -------- | ----------------- | -------------------- |
| Critical | ≥ 95th percentile | Risiko sangat tinggi |
| High     | ≥ 80th percentile | Risiko tinggi        |
| Moderate | ≥ 50th percentile | Risiko sedang        |
| Low      | < 50th percentile | Risiko rendah        |

---

## 6. API Contract (Konseptual)

### 6.1 Base URL

```
https://api.fireline.app/v1
```

### 6.2 Kualitas Udara dan Indikator Musiman

#### GET `/regions/{region_id}/air-quality`

Mengambil bacaan PM2.5, AQI, dan arah sebaran asap terbaru untuk region.

**Response:**

```json
{
  "id": "uuid",
  "region_id": "uuid",
  "pm25": 45.2,
  "aqi": 120,
  "smoke_direction": "SE",
  "reading_date": "2026-09-01"
}
```

#### GET `/regions/{region_id}/seasonal-indicator`

Mengambil status siaga musiman untuk region, diturunkan dari konfigurasi threshold aktif.

**Response:**

```json
{
  "risk_level": "High",
  "min_score": 0.65,
  "max_score": 0.89,
  "weight_intensity": 0.45,
  "weight_exposure": 0.55,
  "updated_at": "2026-09-01T08:00:00Z"
}
```

### 6.3 Lihat Risiko Lingkungan

#### GET `/risk?lat={lat}&lng={lng}`

Deteksi region dari koordinat, kembalikan risk_assessment current untuk region tersebut.

**Response:**

```json
{
  "id": "uuid",
  "region_id": "uuid",
  "risk_level": "High",
  "intensity_score": 0.72,
  "exposure_score": 0.81,
  "assessment_type": "current",
  "valid_for_date": "2026-09-01",
  "calculated_at": "2026-09-01T06:00:00Z"
}
```

#### GET `/regions/{region_id}/risk`

Mengambil risk assessment terbaru untuk region tertentu (current dan predicted_h1).

**Response:**

```json
{
  "id": "uuid",
  "region_id": "uuid",
  "risk_level": "High",
  "intensity_score": 0.72,
  "exposure_score": 0.81,
  "assessment_type": "current",
  "valid_for_date": "2026-09-01",
  "calculated_at": "2026-09-01T06:00:00Z"
}
```

#### GET `/regions/{region_id}/hotspots?radius={m}`

Daftar hotspot dalam radius tertentu dari region/koordinat.

**Response:**

```json
[
  {
    "id": "uuid",
    "region_id": "uuid",
    "latitude": -0.1234,
    "longitude": 109.5678,
    "frp": 45.2,
    "source": "NASA FIRMS",
    "status": "active",
    "detected_at": "2026-09-01T12:00:00Z"
  }
]
```

#### GET `/regions/{region_id}/facilities?radius=5000`

Daftar sekolah/faskes dalam radius 5 km dari region.

**Response:**

```json
[
  {
    "id": "uuid",
    "region_id": "uuid",
    "name": "SDN 01 Pontianak",
    "type": "school",
    "latitude": -0.1234,
    "longitude": 109.5678
  }
]
```

### 6.4 Notifikasi dan Pemberitahuan

#### GET `/alerts`

Daftar alert milik user (histori notifikasi).

**Response:**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "risk_assessment_id": "uuid",
    "action_guide_id": "uuid",
    "type": "fire_warning",
    "message": "Risiko kebakaran tinggi di wilayah Anda",
    "sent_at": "2026-09-01T08:00:00Z",
    "read_at": null
  }
]
```

#### GET `/alerts/{id}`

Detail satu alert, dipakai saat user tap notifikasi.

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "risk_assessment_id": "uuid",
  "action_guide_id": "uuid",
  "type": "fire_warning",
  "message": "Risiko kebakaran tinggi di wilayah Anda",
  "sent_at": "2026-09-01T08:00:00Z",
  "read_at": null
}
```

#### PATCH `/alerts/{id}/read`

Tandai alert sudah dibaca oleh user.

**Response:**

```json
{
  "read_at": "2026-09-01T09:30:00Z"
}
```

### 6.5 Kontak Darurat

#### GET `/regions/{region_id}/emergency-contacts`

Daftar kontak darurat (BPBD/relawan/polisi) untuk region.

**Response:**

```json
[
  {
    "id": "uuid",
    "region_id": "uuid",
    "org_name": "BPBD Kota Pontianak",
    "phone": "+62-561-123456",
    "type": "BPBD"
  },
  {
    "id": "uuid",
    "region_id": "uuid",
    "org_name": "Relawan Masyarakat",
    "phone": "+62-812-3456-7890",
    "type": "Relawan"
  }
]
```

### 6.6 User & Profile

#### GET `/user/profile`

Mengambil profil user yang sedang login.

**Response:**

```json
{
  "user_id": "uuid",
  "home_lat": -0.1234,
  "home_lng": 109.5678,
  "notif_status_tar": 1,
  "region_id": "uuid",
  "notification_method_pref": "push",
  "disability_flag": false,
  "disability_note": null
}
```

#### PUT `/user/profile`

Update profil user (preferensi notifikasi, lokasi, dll).

**Request:**

```json
{
  "home_lat": -0.1234,
  "home_lng": 109.5678,
  "notif_status_tar": 1,
  "notification_method_pref": "push"
}
```

**Response:**

```json
{
  "user_id": "uuid",
  "home_lat": -0.1234,
  "home_lng": 109.5678,
  "notif_status_tar": 1,
  "region_id": "uuid",
  "notification_method_pref": "push",
  "disability_flag": false,
  "disability_note": null
}
```

### 6.7 Authentication

#### POST `/auth/login`

Login user.

**Request:**

```json
{
  "phone": "+62-812-3456-7890",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user_id": "uuid",
  "region_id": "uuid"
}
```

#### POST `/auth/register`

Register user baru.

**Request:**

```json
{
  "phone": "+62-812-3456-7890",
  "password": "securepassword",
  "name": "Budi Santoso",
  "home_lat": -0.1234,
  "home_lng": 109.5678
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user_id": "uuid",
  "region_id": "uuid"
}
```

#### POST `/auth/logout`

Logout user.

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Lampiran

### A. Endpoint Summary

| Kategori          | Method | Endpoint                                      | Deskripsi                            |
| ----------------- | ------ | --------------------------------------------- | ------------------------------------ |
| Kualitas Udara    | GET    | `/regions/{region_id}/air-quality`            | Bacaan PM2.5, AQI, arah sebaran asap |
| Indikator Musiman | GET    | `/regions/{region_id}/seasonal-indicator`     | Status siaga musiman                 |
| Risiko            | GET    | `/risk?lat={lat}&lng={lng}`                   | Deteksi region dari koordinat        |
| Risiko            | GET    | `/regions/{region_id}/risk`                   | Risk assessment terbaru              |
| Hotspot           | GET    | `/regions/{region_id}/hotspots?radius={m}`    | Hotspot dalam radius                 |
| Fasilitas         | GET    | `/regions/{region_id}/facilities?radius=5000` | Fasilitas dalam 5km                  |
| Alert             | GET    | `/alerts`                                     | Daftar alert milik user              |
| Alert             | GET    | `/alerts/{id}`                                | Detail satu alert                    |
| Alert             | PATCH  | `/alerts/{id}/read`                           | Tandai alert sudah dibaca            |
| Kontak Darurat    | GET    | `/regions/{region_id}/emergency-contacts`     | Daftar kontak darurat                |
| User              | GET    | `/user/profile`                               | Profil user                          |
| User              | PUT    | `/user/profile`                               | Update profil user                   |
| Auth              | POST   | `/auth/login`                                 | Login                                |
| Auth              | POST   | `/auth/register`                              | Register                             |
| Auth              | POST   | `/auth/logout`                                | Logout                               |

### B. Glossary

| Istilah             | Definisi                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Hotspot**         | Deteksi anomali termal oleh satelit (NASA FIRMS), bukan konfirmasi kebakaran di lapangan                  |
| **FRP**             | Fire Radiative Power — ukuran energi termal yang dipancarkan (MW)                                         |
| **AQI**             | Air Quality Index — indeks kualitas udara                                                                 |
| **PM2.5**           | Partikel matter berdiameter ≤ 2.5 µm                                                                      |
| **Risk Level**      | Level risiko kebakaran: Low, Moderate, High, Critical                                                     |
| **Assessment Type** | current (saat ini) atau predicted_h1 (prediksi H-1)                                                       |
| **BPBD**            | Badan Penanggulangan Bencana Daerah                                                                       |
| **PostGIS**         | Ekstensi geospasial untuk PostgreSQL yang mendukung spatial join, radius search, dan GiST index           |
| **FastAPI**         | Framework Python untuk membangun API dengan performa tinggi, async native, dan auto-generate OpenAPI docs |
| **RabbitMQ**        | Message broker yang mendukung acknowledgment, retry, dan berbagai pola routing (fanout, topic)            |
| **Mapbox**          | Platform peta dengan vector tile rendering dan custom style layer untuk visualisasi heatmap               |
| **WAF**             | Web Application Filter — proteksi dari serangan HTTP seperti SQL injection dan DDoS                       |
| **FCM**             | Firebase Cloud Messaging — layanan push notification gratis dari Google untuk Android dan iOS             |
| **Cloudflare R2**   | Object storage S3-compatible tanpa biaya egress untuk penyimpanan data mentah                             |
