/**
 * Tangkap Bintang - Precision Camera & Motion Tracker Engine
 * Pengesanan tangan tepat (MediaPipe Hands sehingga 4 tangan),
 * Penjajaran aspek nisbah 'object-fit: cover' tanpa sesaran koordinat,
 * dan visualisasi rangka tangan (Hand Skeleton & Glow Aura).
 */

// Sambungan sendi tangan MediaPipe Hands
const HAND_CONNECTIONS = [
  // Ibu jari (Thumb)
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Jari telunjuk (Index)
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Jari hantu (Middle)
  [9, 10], [10, 11], [11, 12],
  // Jari manis (Ring)
  [13, 14], [14, 15], [15, 16],
  // Jari kelinking (Pinky)
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Tapak tangan (Palm cross)
  [5, 9], [9, 13], [13, 17]
];

class CameraTracker {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.stream = null;
    this.isReady = false;
    this.hands = null;
    this.mpCamera = null;
    this.isProcessingFrame = false;

    // Mod permainan: 'single' (1 pemain 2 tangan) | 'dual' (P1 vs P2)
    this.playerMode = 'single';

    // Senarai tangan dikesan lengkap dengan rangka & titik interaksi
    this.detectedHands = [];
    this.touchPoints = [];
    this.prevTouchPoints = [];

    // Metrik saiz video padanan canvas (object-fit: cover)
    this.viewMetrics = {
      renderW: 1280,
      renderH: 720,
      offsetX: 0,
      offsetY: 0
    };

    // Optical Motion Fallback jika MediaPipe tidak aktif
    this.motionCanvas = document.createElement('canvas');
    this.motionCanvas.width = 64;
    this.motionCanvas.height = 48;
    this.motionCtx = this.motionCanvas.getContext('2d', { willReadFrequently: true });
    this.prevFrameData = null;
    this.noHandsCount = 0;

    this.onReadyCallback = null;
    this.onErrorCallback = null;
  }

  async startCamera() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();

      this.isReady = true;
      this.updateViewMetrics();

      // Mulakan MediaPipe Hands dengan pengesanan sehingga 4 tangan
      this.initMediaPipe();

      if (this.onReadyCallback) {
        this.onReadyCallback();
      }
    } catch (err) {
      console.error('Ralat kamera:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
    }
  }

  updateViewMetrics() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const vw = this.video.videoWidth || 1280;
    const vh = this.video.videoHeight || 720;

    const videoAspect = vw / vh;
    const canvasAspect = cw / ch;

    let renderW, renderH, offsetX, offsetY;

    if (canvasAspect > videoAspect) {
      // Skrin lebih lebar daripada video
      renderW = cw;
      renderH = cw / videoAspect;
      offsetX = 0;
      offsetY = (ch - renderH) / 2;
    } else {
      // Skrin lebih tinggi daripada video
      renderH = ch;
      renderW = ch * videoAspect;
      offsetX = (cw - renderW) / 2;
      offsetY = 0;
    }

    this.viewMetrics = { renderW, renderH, offsetX, offsetY };
  }

  initMediaPipe() {
    if (typeof window.Hands !== 'undefined') {
      try {
        this.hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
          maxNumHands: 4, // Boleh kesan sehingga 4 tangan (sesuai untuk 2 pemain serentak)
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => this.onMediaPipeResults(results));

        // Gunakan Camera utils loop yang stabil
        if (typeof window.Camera !== 'undefined') {
          this.mpCamera = new window.Camera(this.video, {
            onFrame: async () => {
              if (!this.isProcessingFrame && this.video.readyState >= 2) {
                this.isProcessingFrame = true;
                try {
                  await this.hands.send({ image: this.video });
                } catch (e) {
                  // Frame drop
                }
                this.isProcessingFrame = false;
              }
            },
            width: 1280,
            height: 720
          });
          this.mpCamera.start();
          console.log('✅ MediaPipe Camera loop aktif (sehingga 4 tangan).');
        } else {
          // Fallback manual requestAnimationFrame jika window.Camera tiada
          this.manualProcessLoop();
        }
      } catch (err) {
        console.warn('Gagal memulakan MediaPipe:', err);
      }
    }
  }

  async manualProcessLoop() {
    if (this.hands && this.video && this.video.readyState >= 2) {
      if (!this.isProcessingFrame) {
        this.isProcessingFrame = true;
        try {
          await this.hands.send({ image: this.video });
        } catch (e) {}
        this.isProcessingFrame = false;
      }
    }
    requestAnimationFrame(() => this.manualProcessLoop());
  }

  onMediaPipeResults(results) {
    this.updateViewMetrics();
    const { renderW, renderH, offsetX, offsetY } = this.viewMetrics;
    const cw = this.canvas.width;

    const detected = [];
    const points = [];

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.noHandsCount = 0;

      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const rawLandmarks = results.multiHandLandmarks[i];

        // Tukar koordinat MediaPipe (0..1) ke koordinat piksel cermin yang tepat
        const screenLandmarks = rawLandmarks.map((lm) => {
          // Mirrored horizontal: 1 - lm.x
          const normX = 1 - lm.x;
          return {
            x: offsetX + normX * renderW,
            y: offsetY + lm.y * renderH
          };
        });

        // Kira titik pusat tangan (tapak tangan - landmark 9)
        const palmCenter = screenLandmarks[9] || screenLandmarks[0];
        const isLeftOfScreen = palmCenter.x < cw / 2;

        let role = 'single';
        let handLabel = '';
        let themeColor = '#38bdf8'; // Default Cyan

        if (this.playerMode === 'single') {
          // 1 Pemain: Tangan Kiri vs Tangan Kanan
          if (isLeftOfScreen) {
            handLabel = '✋ TANGAN KIRI';
            themeColor = '#38bdf8'; // Biru / Cyan
          } else {
            handLabel = '✋ TANGAN KANAN';
            themeColor = '#fbbf24'; // Kuning / Emas
          }
          role = isLeftOfScreen ? 'left_hand' : 'right_hand';
        } else {
          // 2 Pemain: Pemain 1 (Kiri) vs Pemain 2 (Kanan)
          if (isLeftOfScreen) {
            handLabel = '🔵 PEMAIN 1';
            themeColor = '#38bdf8'; // Cyan / Biru
            role = 'p1';
          } else {
            handLabel = '🔴 PEMAIN 2';
            themeColor = '#f43f5e'; // Merah / Pink
            role = 'p2';
          }
        }

        detected.push({
          landmarks: screenLandmarks,
          center: palmCenter,
          label: handLabel,
          color: themeColor,
          role: role
        });

        // Masukkan titik tangkapan fokus:
        // 1. Hujung Jari Telunjuk (Landmark 8)
        const tipIndex = screenLandmarks[8];
        if (tipIndex) {
          points.push({
            x: tipIndex.x,
            y: tipIndex.y,
            radius: 36,
            role: role,
            color: themeColor,
            isFingertip: true
          });
        }

        // 2. Hujung Jari Hantu (Landmark 12)
        const tipMiddle = screenLandmarks[12];
        if (tipMiddle) {
          points.push({
            x: tipMiddle.x,
            y: tipMiddle.y,
            radius: 30,
            role: role,
            color: themeColor,
            isFingertip: true
          });
        }

        // 3. Tapak Tangan (Landmark 9)
        if (palmCenter) {
          points.push({
            x: palmCenter.x,
            y: palmCenter.y,
            radius: 44,
            role: role,
            color: themeColor,
            isPalm: true
          });
        }
      }
    } else {
      this.noHandsCount++;
    }

    this.detectedHands = detected;
    this.touchPoints = this.smoothPoints(points);
  }

  // Penapisan getaran (Lerp Smoothing)
  smoothPoints(newPoints) {
    if (newPoints.length === 0) return [];
    if (this.prevTouchPoints.length === 0) {
      this.prevTouchPoints = newPoints;
      return newPoints;
    }

    const smoothed = newPoints.map((pt, i) => {
      const prev = this.prevTouchPoints[i] || pt;
      return {
        ...pt,
        x: prev.x + (pt.x - prev.x) * 0.65,
        y: prev.y + (pt.y - prev.y) * 0.65
      };
    });

    this.prevTouchPoints = smoothed;
    return smoothed;
  }

  // Optical Motion Tracking jika tiada tangan dikesan MediaPipe
  processMotionDifference() {
    if (this.noHandsCount < 12) return;
    if (!this.video || this.video.readyState < 2) return;

    const w = this.motionCanvas.width;
    const h = this.motionCanvas.height;

    this.motionCtx.save();
    this.motionCtx.scale(-1, 1);
    this.motionCtx.drawImage(this.video, -w, 0, w, h);
    this.motionCtx.restore();

    const currImgData = this.motionCtx.getImageData(0, 0, w, h);
    const currData = currImgData.data;

    if (this.prevFrameData) {
      let activeX = 0;
      let activeY = 0;
      let motionCount = 0;
      const pointsFound = [];

      for (let i = 0; i < currData.length; i += 4) {
        const diff = (Math.abs(currData[i] - this.prevFrameData[i]) +
                      Math.abs(currData[i+1] - this.prevFrameData[i+1]) +
                      Math.abs(currData[i+2] - this.prevFrameData[i+2])) / 3;

        if (diff > 30) {
          const pixelIndex = i / 4;
          activeX += pixelIndex % w;
          activeY += Math.floor(pixelIndex / w);
          motionCount++;
        }
      }

      if (motionCount > 18) {
        const avgX = (activeX / motionCount) * (this.canvas.width / w);
        const avgY = (activeY / motionCount) * (this.canvas.height / h);
        const isP1 = avgX < this.canvas.width / 2;

        pointsFound.push({
          x: avgX,
          y: avgY,
          radius: 50,
          role: this.playerMode === 'dual' ? (isP1 ? 'p1' : 'p2') : 'single',
          color: isP1 ? '#38bdf8' : '#fbbf24',
          isMotion: true
        });
      }

      this.touchPoints = pointsFound;
    }

    this.prevFrameData = new Uint8ClampedArray(currData);
  }

  // Lukis suapan kamera dengan cermin tepat
  drawMirroredVideo() {
    if (!this.isReady || this.video.readyState < 2) return;

    const { renderW, renderH, offsetX, offsetY } = this.viewMetrics;
    const cw = this.canvas.width;

    this.ctx.save();
    // Balikkan secara mendatar (Horizontal Flip Mirror)
    this.ctx.translate(cw, 0);
    this.ctx.scale(-1, 1);

    this.ctx.drawImage(this.video, offsetX, offsetY, renderW, renderH);
    this.ctx.restore();

    // Lapisan gelap separa telus untuk kontras tinggi HUD dan bintang
    this.ctx.fillStyle = 'rgba(11, 15, 25, 0.45)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Lukis Rangka Tangan (Skeleton) dan Titik Sasaran Fokus
  drawTouchPoints() {
    const ctx = this.ctx;

    // 1. Lukis garisan rangka tangan MediaPipe
    for (const hand of this.detectedHands) {
      const lm = hand.landmarks;
      const color = hand.color;

      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // Lukis sambungan tulang sendi
      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        if (lm[startIdx] && lm[endIdx]) {
          ctx.beginPath();
          ctx.moveTo(lm[startIdx].x, lm[startIdx].y);
          ctx.lineTo(lm[endIdx].x, lm[endIdx].y);
          ctx.stroke();
        }
      }

      // Lukis sendi-sendi jari
      for (const pt of lm) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Label Tangan (TANGAN KIRI, TANGAN KANAN, P1, P2)
      ctx.font = '800 14px "Outfit", sans-serif, system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.shadowBlur = 0;
      // Latar belakang label
      const labelY = Math.max(30, hand.center.y - 75);
      const textWidth = ctx.measureText(hand.label).width;
      ctx.fillStyle = color;
      ctx.fillRect(hand.center.x - textWidth / 2 - 8, labelY - 16, textWidth + 16, 22);

      ctx.fillStyle = '#0f172a';
      ctx.fillText(hand.label, hand.center.x, labelY);

      ctx.restore();
    }

    // 2. Lukis titik sasaran fokus (Fingertips & Palms)
    for (const pt of this.touchPoints) {
      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = pt.color || '#38bdf8';

      // Gelang sasaran beranimasi
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = pt.color || '#38bdf8';
      ctx.stroke();

      // Titik tengah bercahaya putih
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();

      // Zarah habuk tangan jika ada sistem zarah
      if (window.particleSystem) {
        window.particleSystem.createHandTrail(pt.x, pt.y, pt.color || '#38bdf8');
      }
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    this.isReady = false;
  }
}

window.CameraTracker = CameraTracker;
