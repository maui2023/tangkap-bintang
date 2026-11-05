# 🌟 Tangkap Bintang (Star Catcher)

Permainan arked interaktif berasaskan **kamera web (Webcam) 100% tanpa sebarang kawalan papan kekunci**. Pemain menggunakan pergerakan tangan dan badan secara fizikal di hadapan kamera untuk menangkap bintang-bintang yang jatuh dari langit!

---

## 🎮 Ciri-Ciri Utama Permainan

- 🖐️ **100% Kawalan Kamera Web (Tiada Keyboard Kiri/Kanan):**
  - Tiada kekunci panah atau WASD. Interaksi berlaku sepenuhnya melalui pergerakan tangan fizikal anda di hadapan kamera.
- 👤 **Mod 1 Pemain (2 Tangan: Kiri & Kanan):**
  - 1 pemain menggunakan kedua-dua belah tangan secara serentak.
  - Tangan Kiri (biru cyan) dan Tangan Kanan (kuning emas) dikesan secara bebas dengan rangka sendi jari yang kemas dan jelas.
- 👥 **Mod 2 Pemain (P1 vs P2):**
  - 2 pemain bermain serentak di hadapan kamera yang sama!
  - **Pemain 1 (Kiri):** Zon biru di sebelah kiri skrin.
  - **Pemain 2 (Kanan):** Zon merah/pink di sebelah kanan skrin.
  - Papan skor berasingan (Skor P1 vs Skor P2) dan pengumuman pemenang di akhir permainan.
- 🎯 **Pengesanan Tangan Tepat (*Precision Hand Tracking*):**
  - Menggunakan **MediaPipe Hands** (sehingga 4 tangan serentak) dengan visualisasi rangka sendi tangan (*hand skeleton*) bercahaya neon.
  - Penjajaran nisbah aspek skrin (*object-fit: cover*) memastikan titik sentuhan berada tepat di atas tangan fizikal anda tanpa sebarang sesaran koordinat (*no drift*).
- ⭐ **Pelbagai Jenis Bintang & Halangan:**
  - **Bintang Kuning:** +10 mata
  - **Bintang Emas (Laju):** +30 mata
  - **Bintang Pelangi:** +50 mata & mengaktifkan **Fever Mode (2x Multiplier)**
  - **Bom / Meteor Berduri:** Perlu dielakkan! Menolak mata (-20) atau mengurangkan nyawa.
- 🕹️ **Butang Maya di Udara (Hover Dwell Click):**
  - Lambaikan dan tahan tangan anda di atas butang "MULA", "TUKAR MOD", atau "MAIN SEMULA" di skrin untuk berinteraksi tanpa menyentuh papan kekunci atau tetikus.
- 🔊 **Enjin Audio Arked Penuh (Web Audio API):**
  - Kesan bunyi sintesis (chimes, arpeggio, letupan, kombo, BGM retro) tanpa memerlukan muat turun fail audio luaran.

---

## 🚀 Cara Menjalankan Permainan

### Kaedah 1: Klik Terus Fail `.bat` (Paling Pantas)
Klik dua kali pada fail:
```
start.bat
```
Pelayar web anda akan dibuka secara automatik ke alamat `http://localhost:8000/`.

---

### Kaedah 2: Melalui Terminal (Python)
Jalankan arahan berikut di PowerShell:
```powershell
& "C:\Users\Maui\AppData\Local\Programs\Python\Python311\python.exe" server.py
```
Buka pelayar web dan layari:
👉 `http://localhost:8000/`

---

## 📋 Arahan Permainan

1. Benarkan akses kamera apabila pelayar memintanya (*Allow Camera Access*).
2. Pilih mod anda:
   * **👤 1 Pemain (2 Tangan):** Berdiri di tengah kamera dan gunakan kedua-dua belah tangan kiri & kanan.
   * **👥 2 Pemain (P1 vs P2):** Pemain 1 berdiri di sebelah kiri kamera, Pemain 2 di sebelah kanan.
3. Tahan tangan anda di atas butang **🖐️ MULA BERMAIN** (atau klik pada butang tersebut).
4. Selepas kiraan undur `3, 2, 1, MULA!`, gerakkan tangan anda untuk menyentuh dan menangkap bintang!
