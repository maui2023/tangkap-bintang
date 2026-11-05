# 🌟 Tangkap Bintang — Spesifikasi & Konsep Permainan (Camera-Based)

Dokumen ini merincikan spesifikasi, mekanik, seni bina, dan panduan pembangunan untuk **"Tangkap Bintang"**, sebuah permainan interaktif berasaskan **kamera web sepenuhnya (100% Webcam / Motion Tracking)** tanpa sebarang kawalan papan kekunci (tiada kekunci kiri/kanan).

---

## 1. 🎯 Konsep Utama Permainan

* **Nama Permainan:** Tangkap Bintang (Star Catcher)
* **Genre:** Interactive Motion / Augmented Reality (AR) Casual Arcade
* **Platform:** Web Browser (Desktop & Laptop dengan Webcam)
* **Kawalan Utama:** **100% Gerakan Fizikal melalui Kamera Web**
  * ❌ **Tiada Papan Kekunci Kiri/Kanan:** Tiada kekunci anak panah (`ArrowLeft`, `ArrowRight`, `A`, `D`) atau tetikus untuk menggerakkan watak.
  * ✅ **Interaksi Semulajadi:** Pemain menggunakan tangan kiri dan tangan kanan secara fizikal di hadapan kamera untuk menyentuh dan menangkap bintang.

---

## 2. 👥 Mod Pemain: Single Player & Dual Player (1 vs 1)

Permainan ini menyokong dua mod permainan utama:

### A. Mod Single Player (1 Pemain — 2 Tangan: Kiri & Kanan)
* **1 Pemain menggunakan kedua-dua belah tangan (Tangan Kiri & Kangan Kanan)** secara serentak.
* Pengesanan tangan pintar membezakan:
  * ✋ **Tangan Kiri (Cyan Glow):** Titik capaian bahagian kiri skrin.
  * ✋ **Tangan Kanan (Amber/Gold Glow):** Titik capaian bahagian kanan skrin.
* Rangka sendi tangan (Hand Skeleton & Fingertip Hitboxes) dilukis dengan kemas secara langsung di atas tangan pemain.
* Matlamat: Mengumpul skor maksimum, kombo berantai, dan mengelak bom dalam masa 60 saat.

### B. Mod Dual Player (2 Pemain — Pertarungan Kiri vs Kanan)
* **2 Pemain serentak di hadapan 1 kamera web** (sehingga 4 tangan dikesan serentak):
  * 🔵 **Pemain 1 (Zon Kiri):** Warna Tema Biru / Cyan Neon. Menjaga dan menangkap bintang di separuh skrin kiri ($X < \text{Width} / 2$).
  * 🔴 **Pemain 2 (Zon Kanan):** Warna Tema Oren / Merah Neon. Menjaga dan menangkap bintang di separuh skrin kanan ($X \ge \text{Width} / 2$).
* Garisan pemisah tenaga bercahaya (*Center Energy Divider*) membelah zon permainan.
* Papan skor berasingan: **Skor P1 vs Skor P2**, Kombo P1 vs Kombo P2.
* Skrin Tamat mengumumkan pemenang: **"🏆 PEMAIN 1 MENANG!"** atau **"🏆 PEMAIN 2 MENANG!"** beserta perbandingan statistik kedua-dua pemain.

---

## 3. 🖐️ Ketepatan Pengesanan Tangan (Precision Hand Tracking)

Bagi memastikan posisi tangan dikesan dengan kemas dan tepat tanpa ralat sesaran (*coordinate drift*):

1. **Penjajaran Aspek Nisbah Skrin (*Pixel-Perfect Aspect Ratio Fit*):**
   * Mengira saiz suapan video secara `object-fit: cover` agar kedudukan video dan koordinat MediaPipe berpadanan 100% dengan saiz tingkap pelayar.
2. **Visualisasi Rangka Tangan (Skeleton & Joint Overlay):**
   * Setiap tulang sendi jari (Thumb, Index, Middle, Ring, Pinky, Palm) dilukis dengan garisan bercahaya secara langsung pada badan tangan pemain.
3. **Titik Sentuhan Fokus (Fingertip & Palm Hitboxes):**
   * Titik fokus sentuhan diletakkan pada **hujung jari telunjuk (Index Tip)** dan **tengah tapak tangan (Palm Center)** dengan lingkaran sasaran bercahaya (*glow targeting rings*).
4. **Penapisan Pergerakan (*EMA Smoothing Filter*):**
   * Menggunakan algoritma *Exponential Moving Average (Lerp)* untuk menghapuskan gegaran getaran (*jitter*) supaya pergerakan sasaran kelihatan lancar dan stabil pada 60 FPS.

---

## 4. 🕹️ Mekanik Permainan (Gameplay Mechanics)

### Objek & Bintang (Game Items)
1. ⭐ **Bintang Kuning (Asas):** +10 Mata.
2. 🌟 **Bintang Emas (Pantas):** +30 Mata, bergerak melantun/beralun.
3. 🌈 **Bintang Pelangi (Power-up):** +50 Mata & mencetuskan **Fever Mode (2x Multiplier)** selama 5 saat.
4. 💣 **Meteor / Bom Berduri (Halangan):** Menolak mata (-20) atau menolak nyawa.

### Butang Maya di Udara (Hover Dwell Activation)
* Butang seperti "MULA", "MOD PEMAIN", dan "MAIN SEMULA" boleh diaktifkan tanpa menyentuh papan kekunci atau tetikus — pemain hanya perlu menahan tangan di atas butang selama 0.7 saat.

---

## 5. 🛠️ Tech Stack & Arkitektur

* **Frontend:** HTML5 Canvas, Tailwind CSS, Google Font `Outfit`
* **Computer Vision:** Google MediaPipe Hands (sehingga 4 tangan serentak) + `@mediapipe/camera_utils` + `@mediapipe/drawing_utils`
* **Audio:** Web Audio API Real-Time Synthesizer (Sifar muat turun mp3 luaran)
* **Sistem Partikel:** Particle Engine untuk habuk bintang, letupan bom, dan skor terapung dwipemain.
