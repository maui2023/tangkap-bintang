/**
 * Tangkap Bintang - Game Engine (Single & Dual Player Mode)
 * Menyokong Mod 1 Pemain (2 Tangan: Kiri & Kanan) dan Mod 2 Pemain (P1 Kiri vs P2 Kanan).
 */
class GameEngine {
  constructor(canvas, tracker, sound, particles) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tracker = tracker;
    this.sound = sound;
    this.particles = particles;

    // Keadaan Permainan: 'MENU', 'COUNTDOWN', 'PLAYING', 'GAMEOVER'
    this.state = 'MENU';

    // Mod Pemain: 'single' (1 Pemain) | 'dual' (2 Pemain P1 vs P2)
    this.playerMode = 'single';
    this.tracker.playerMode = this.playerMode;

    // Mod Permainan: 'time' (60s) | 'survival' (3 nyawa)
    this.gameMode = 'time';
    this.timeLeft = 60;
    this.lives = 3;
    this.maxLives = 3;

    // Skor Mod Single Player
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('tb_highscore') || '0', 10);
    this.starsCaught = 0;
    this.bombsHit = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastCatchTime = 0;

    // Skor Mod Dual Player (P1 vs P2)
    this.p1Score = 0;
    this.p1Combo = 0;
    this.p1MaxCombo = 0;
    this.p1StarsCaught = 0;
    this.p1BombsHit = 0;
    this.p1LastCatchTime = 0;

    this.p2Score = 0;
    this.p2Combo = 0;
    this.p2MaxCombo = 0;
    this.p2StarsCaught = 0;
    this.p2BombsHit = 0;
    this.p2LastCatchTime = 0;

    this.comboTimeout = 2500; // ms

    // Fever Mode
    this.isFever = false;
    this.feverTimer = 0;

    // Objek Jatuh
    this.items = [];
    this.spawnTimer = 0;
    this.spawnInterval = 34;

    // Kiraan Undur
    this.countdownValue = 3;
    this.countdownInterval = null;

    // Kesan Gegaran Skrin
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Butang Maya di Udara
    this.virtualButtons = [];
    this.hoverProgress = 0;
    this.activeHoverButton = null;

    this.lastFrameTime = performance.now();
    this.fps = 60;
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.showToast('🚀 Permainan ini 100% menggunakan kamera web! Tiada papan kekunci.');
      }
    });

    this.setupVirtualButtons();
  }

  setPlayerMode(mode) {
    this.playerMode = mode;
    this.tracker.playerMode = mode;
    this.setupVirtualButtons();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.tracker.updateViewMetrics();
    this.setupVirtualButtons();
  }

  setupVirtualButtons() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.virtualButtons = [
      {
        id: 'start',
        text: '🖐️ MULA BERMAIN',
        subtext: 'Tahan tangan di sini atau klik',
        x: w / 2 - 145,
        y: h / 2 + 75,
        width: 290,
        height: 75,
        state: 'MENU',
        action: () => this.startCountdown()
      },
      {
        id: 'toggle_player_mode',
        text: this.playerMode === 'single' ? '👥 TUKAR KE 2 PEMAIN' : '👤 TUKAR KE 1 PEMAIN',
        subtext: 'Sentuh untuk tukar mod',
        x: w / 2 - 130,
        y: h / 2 + 165,
        width: 260,
        height: 52,
        state: 'MENU',
        action: () => {
          const newMode = this.playerMode === 'single' ? 'dual' : 'single';
          this.setPlayerMode(newMode);
          const pBtn = document.getElementById('playerModeBtn');
          if (pBtn) {
            pBtn.innerHTML = newMode === 'single' ? '👤 1 Pemain (2 Tangan)' : '👥 2 Pemain (P1 vs P2)';
          }
          this.showToast(`Mod ditukar kepada: ${newMode === 'single' ? '1 Pemain (2 Tangan)' : '2 Pemain (P1 vs P2)'}`);
        }
      },
      {
        id: 'restart',
        text: '🔄 MAIN SEMULA',
        subtext: 'Tahan tangan di sini untuk mula lagi',
        x: w / 2 - 140,
        y: h / 2 + 140,
        width: 280,
        height: 72,
        state: 'GAMEOVER',
        action: () => this.startCountdown()
      }
    ];
  }

  showToast(msg) {
    const toast = document.getElementById('toastNotification');
    if (toast) {
      toast.textContent = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      toast.classList.add('opacity-100');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('opacity-100');
      }, 2500);
    }
  }

  startCountdown() {
    this.state = 'COUNTDOWN';
    this.countdownValue = 3;
    this.sound.playCountdown(false);

    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue > 0) {
        this.sound.playCountdown(false);
      } else if (this.countdownValue === 0) {
        this.sound.playCountdown(true);
      } else {
        clearInterval(this.countdownInterval);
        this.startGame();
      }
    }, 1000);
  }

  startGame() {
    this.state = 'PLAYING';
    this.timeLeft = 60;
    this.lives = this.maxLives;
    this.items = [];
    this.particles.clear();
    this.isFever = false;
    this.feverTimer = 0;

    // Reset Skor Single
    this.score = 0;
    this.starsCaught = 0;
    this.bombsHit = 0;
    this.combo = 0;
    this.maxCombo = 0;

    // Reset Skor Dual
    this.p1Score = 0;
    this.p1Combo = 0;
    this.p1MaxCombo = 0;
    this.p1StarsCaught = 0;
    this.p1BombsHit = 0;

    this.p2Score = 0;
    this.p2Combo = 0;
    this.p2MaxCombo = 0;
    this.p2StarsCaught = 0;
    this.p2BombsHit = 0;

    this.sound.startBgm();

    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => {
      if (this.state === 'PLAYING') {
        if (this.gameMode === 'time') {
          this.timeLeft--;
          if (this.timeLeft <= 0) {
            this.endGame();
          }
        }

        if (this.isFever) {
          this.feverTimer--;
          if (this.feverTimer <= 0) {
            this.isFever = false;
          }
        }
      }
    }, 1000);
  }

  endGame() {
    this.state = 'GAMEOVER';
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.sound.stopBgm();
    this.sound.playGameOver();

    if (this.playerMode === 'single') {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('tb_highscore', this.highScore.toString());
        this.particles.createStarBurst(this.canvas.width / 2, this.canvas.height / 2, '#38bdf8', 60);
      }
    } else {
      // Raikan pemenang dalam mod dual player
      const winnerX = this.p1Score > this.p2Score ? this.canvas.width * 0.25 : this.canvas.width * 0.75;
      const winnerColor = this.p1Score > this.p2Score ? '#38bdf8' : '#f43f5e';
      this.particles.createStarBurst(winnerX, this.canvas.height / 2, winnerColor, 70);
    }
  }

  spawnItem() {
    const w = this.canvas.width;
    const rand = Math.random();

    let newItem;
    if (this.isFever) {
      newItem = rand < 0.6 ? new window.StarEntities.GoldStar(w) : new window.StarEntities.YellowStar(w);
    } else {
      if (rand < 0.52) newItem = new window.StarEntities.YellowStar(w);
      else if (rand < 0.76) newItem = new window.StarEntities.GoldStar(w);
      else if (rand < 0.88) newItem = new window.StarEntities.MeteorObstacle(w);
      else newItem = new window.StarEntities.RainbowStar(w);
    }

    // Dalam mod dual player, pastikan bintang diagihkan ke zon P1 dan P2
    if (this.playerMode === 'dual') {
      const zoneChoice = Math.random();
      if (zoneChoice < 0.45) {
        // Zon P1 (Kiri)
        newItem.x = Math.random() * (w * 0.42 - 70) + 40;
        if (newItem.baseX) newItem.baseX = newItem.x;
      } else if (zoneChoice < 0.90) {
        // Zon P2 (Kanan)
        newItem.x = Math.random() * (w * 0.42 - 70) + (w * 0.54);
        if (newItem.baseX) newItem.baseX = newItem.x;
      } else {
        // Zon Rebutan Tengah (Center Contest)
        newItem.x = w * 0.5 + (Math.random() * 80 - 40);
        if (newItem.baseX) newItem.baseX = newItem.x;
      }
    }

    this.items.push(newItem);
  }

  triggerScreenShake(intensity = 18, duration = 18) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update() {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.fps = Math.round(1000 / (dt || 16));

    // Optical Motion Fallback jika MediaPipe tidak mengembalikan tangan
    if (this.tracker.isReady) {
      this.tracker.processMotionDifference();
    }

    this.particles.update();

    // Semak tamat kombo
    if (this.playerMode === 'single') {
      if (this.combo > 0 && (now - this.lastCatchTime) > this.comboTimeout) {
        this.combo = 0;
      }
    } else {
      if (this.p1Combo > 0 && (now - this.p1LastCatchTime) > this.comboTimeout) {
        this.p1Combo = 0;
      }
      if (this.p2Combo > 0 && (now - this.p2LastCatchTime) > this.comboTimeout) {
        this.p2Combo = 0;
      }
    }

    this.updateVirtualButtons();

    if (this.state === 'PLAYING') {
      this.spawnTimer++;
      const currentInterval = this.isFever ? 16 : (this.playerMode === 'dual' ? 24 : this.spawnInterval);
      if (this.spawnTimer >= currentInterval) {
        this.spawnTimer = 0;
        this.spawnItem();
      }

      const touchPoints = this.tracker.touchPoints;

      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        item.update();

        let hit = false;
        for (const pt of touchPoints) {
          if (item.checkCollision(pt.x, pt.y, pt.radius)) {
            hit = true;
            this.handleItemHit(item, pt);
            break;
          }
        }

        if (hit || item.isDead) {
          this.items.splice(i, 1);
        }
      }
    }
  }

  handleItemHit(item, touchPoint) {
    const now = performance.now();
    const hitX = touchPoint.x;
    const hitY = touchPoint.y;

    // Tentukan pemain yang menangkap
    const isP1 = this.playerMode === 'dual' ? (touchPoint.role === 'p1' || hitX < this.canvas.width / 2) : true;
    const playerColor = isP1 ? '#38bdf8' : '#f43f5e';
    const playerPrefix = this.playerMode === 'dual' ? (isP1 ? 'P1 ' : 'P2 ') : '';

    // 1. Jika terkena Bom / Meteor
    if (item.type === 'bomb') {
      this.sound.playBomb();
      this.triggerScreenShake(20, 20);
      this.particles.createBombBurst(hitX, hitY);

      if (this.playerMode === 'single') {
        this.bombsHit++;
        this.combo = 0;
        if (this.gameMode === 'survival') {
          this.lives--;
          this.particles.createScorePopup(hitX, hitY, '💔 -1 NYAWA!', '#ef4444', 32);
          if (this.lives <= 0) this.endGame();
        } else {
          this.score = Math.max(0, this.score - 20);
          this.particles.createScorePopup(hitX, hitY, '-20', '#ef4444', 30);
        }
      } else {
        // Dual Player Bom
        if (isP1) {
          this.p1BombsHit++;
          this.p1Combo = 0;
          this.p1Score = Math.max(0, this.p1Score - 20);
          this.particles.createScorePopup(hitX, hitY, 'P1 -20!', '#ef4444', 30);
        } else {
          this.p2BombsHit++;
          this.p2Combo = 0;
          this.p2Score = Math.max(0, this.p2Score - 20);
          this.particles.createScorePopup(hitX, hitY, 'P2 -20!', '#ef4444', 30);
        }
      }
      return;
    }

    // 2. Berjaya Tangkap Bintang!
    let comboCount = 1;
    if (this.playerMode === 'single') {
      this.starsCaught++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.lastCatchTime = now;
      comboCount = this.combo;
    } else {
      if (isP1) {
        this.p1StarsCaught++;
        this.p1Combo++;
        if (this.p1Combo > this.p1MaxCombo) this.p1MaxCombo = this.p1Combo;
        this.p1LastCatchTime = now;
        comboCount = this.p1Combo;
      } else {
        this.p2StarsCaught++;
        this.p2Combo++;
        if (this.p2Combo > this.p2MaxCombo) this.p2MaxCombo = this.p2Combo;
        this.p2LastCatchTime = now;
        comboCount = this.p2Combo;
      }
    }

    // Pengganda skor
    let mult = 1;
    if (comboCount >= 10) mult = 3.0;
    else if (comboCount >= 5) mult = 2.0;
    else if (comboCount >= 3) mult = 1.5;

    if (this.isFever) mult *= 2.0;

    const earned = Math.round(item.points * mult);

    if (this.playerMode === 'single') {
      this.score += earned;
    } else {
      if (isP1) this.p1Score += earned;
      else this.p2Score += earned;
    }

    // Audio & Kesan Zarah mengikut jenis bintang
    if (item.type === 'yellow') {
      this.sound.playCatch(1.0 + Math.min(comboCount * 0.05, 1.0));
      this.particles.createStarBurst(hitX, hitY, '#facc15', 22);
      this.particles.createScorePopup(hitX, hitY, `${playerPrefix}+${earned}`, playerColor, 26);
    } else if (item.type === 'gold') {
      this.sound.playGoldCatch();
      this.particles.createStarBurst(hitX, hitY, '#f59e0b', 32);
      this.particles.createScorePopup(hitX, hitY, `${playerPrefix}⭐ +${earned}!`, playerColor, 30);
    } else if (item.type === 'rainbow') {
      this.sound.playRainbowCatch();
      this.isFever = true;
      this.feverTimer = 6;
      this.particles.createStarBurst(hitX, hitY, '#38bdf8', 45);
      this.particles.createScorePopup(hitX, hitY, `${playerPrefix}🌈 FEVER 2X!`, '#38bdf8', 34);
    }

    if (comboCount >= 3 && comboCount % 3 === 0) {
      this.particles.createScorePopup(hitX, hitY - 35, `${playerPrefix}COMBO x${comboCount}!`, '#e879f9', 28);
    }
  }

  updateVirtualButtons() {
    const currentBtns = this.virtualButtons.filter(b => b.state === this.state);
    if (currentBtns.length === 0) {
      this.activeHoverButton = null;
      this.hoverProgress = 0;
      return;
    }

    let hoveredBtn = null;
    const touchPoints = this.tracker.touchPoints;

    for (const btn of currentBtns) {
      for (const pt of touchPoints) {
        if (
          pt.x >= btn.x &&
          pt.x <= btn.x + btn.width &&
          pt.y >= btn.y &&
          pt.y <= btn.y + btn.height
        ) {
          hoveredBtn = btn;
          break;
        }
      }
      if (hoveredBtn) break;
    }

    if (hoveredBtn) {
      if (this.activeHoverButton === hoveredBtn) {
        this.hoverProgress += 3.5;
        if (this.hoverProgress >= 100) {
          this.hoverProgress = 0;
          hoveredBtn.action();
        }
      } else {
        this.activeHoverButton = hoveredBtn;
        this.hoverProgress = 10;
      }
    } else {
      this.activeHoverButton = null;
      this.hoverProgress = Math.max(0, this.hoverProgress - 6);
    }
  }

  draw() {
    this.ctx.save();

    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
      this.shakeDuration--;
    }

    // 1. Lukis suapan kamera cermin
    this.tracker.drawMirroredVideo();

    // 2. Jika mod Dual Player, lukis garisan tenaga pemisah tengah
    if (this.playerMode === 'dual') {
      this.drawCenterDivider();
    }

    // 3. Lukis bintang & objek jatuh
    if (this.state === 'PLAYING') {
      for (const item of this.items) {
        item.draw(this.ctx);
      }
    }

    // 4. Lukis zarah letupan & teks skor
    this.particles.draw(this.ctx);

    // 5. Lukis rangka tangan & titik sasaran fokus
    this.tracker.drawTouchPoints();

    // 6. Lukis UI
    this.drawUI();

    this.ctx.restore();
  }

  // Garisan tenaga pemisah zon P1 (Kiri) dan P2 (Kanan)
  drawCenterDivider() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const midX = w / 2;

    this.ctx.save();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.setLineDash([12, 12]);

    this.ctx.beginPath();
    this.ctx.moveTo(midX, 90);
    this.ctx.lineTo(midX, h - 20);
    this.ctx.stroke();

    // Penanda zon
    this.ctx.font = '800 13px "Outfit", sans-serif';
    this.ctx.textAlign = 'center';

    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    this.ctx.fillText('◄ ZON PEMAIN 1', midX - 90, h - 30);

    this.ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    this.ctx.fillText('ZON PEMAIN 2 ►', midX + 90, h - 30);

    this.ctx.restore();
  }

  drawUI() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.state === 'MENU') {
      this.drawLobbyUI(w, h);
    } else if (this.state === 'COUNTDOWN') {
      this.drawCountdownUI(w, h);
    } else if (this.state === 'PLAYING') {
      this.drawHUD(w, h);
    } else if (this.state === 'GAMEOVER') {
      this.drawGameOverUI(w, h);
    }
  }

  drawLobbyUI(w, h) {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    this.ctx.lineWidth = 2;
    this.roundRect(w / 2 - 290, h / 2 - 240, 580, 480, 24, true, true);

    // Tajuk
    this.ctx.font = '900 44px "Outfit", sans-serif, system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#fde047';
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 18;
    this.ctx.fillText('🌟 TANGKAP BINTANG', w / 2, h / 2 - 165);

    // Lencana Mod Aktif
    this.ctx.font = '700 15px "Outfit", sans-serif, system-ui';
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = this.playerMode === 'single' ? '#38bdf8' : '#f43f5e';
    const modeBadge = this.playerMode === 'single' ? '👤 MOD 1 PEMAIN (2 TANGAN: KIRI & KANAN)' : '👥 MOD 2 PEMAIN (P1 KIRI VS P2 KANAN)';
    this.ctx.fillText(modeBadge, w / 2, h / 2 - 125);

    // Panduan Posisi Tangan
    this.ctx.font = '500 15px "Outfit", sans-serif, system-ui';
    this.ctx.fillStyle = '#cbd5e1';
    if (this.playerMode === 'single') {
      this.ctx.fillText('🖐️ Gunakan kedua-dua belah tangan (Kiri & Kanan) untuk menangkap.', w / 2, h / 2 - 80);
      this.ctx.fillText('Rangka sendi tangan dilukis kemas untuk mengesahkan posisi.', w / 2, h / 2 - 55);
    } else {
      this.ctx.fillText('👥 Pemain 1 berdiri di sebelah KIRI, Pemain 2 di sebelah KANAN.', w / 2, h / 2 - 80);
      this.ctx.fillText('Kedua-dua pemain bersaing merebut bintang terbanyak!', w / 2, h / 2 - 55);
    }

    this.ctx.fillText('⭐ Kuning (+10) | 🌟 Emas (+30) | 🌈 Pelangi (Fever) | 💣 Bom (Elak!)', w / 2, h / 2 - 20);

    // Rekod Tertinggi
    if (this.playerMode === 'single') {
      this.ctx.font = '700 17px "Outfit", sans-serif, system-ui';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText(`🏆 Rekod Tertinggi: ${this.highScore} Mata`, w / 2, h / 2 + 25);
    }

    // Lukis Butang Maya
    this.drawVirtualButton(this.virtualButtons.find(b => b.id === 'start'));
    this.drawVirtualButton(this.virtualButtons.find(b => b.id === 'toggle_player_mode'));

    this.ctx.restore();
  }

  drawCountdownUI(w, h) {
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.font = '900 120px "Outfit", sans-serif, system-ui';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 35;

    const text = this.countdownValue > 0 ? this.countdownValue.toString() : 'MULA!';
    this.ctx.fillText(text, w / 2, h / 2 + 30);

    this.ctx.font = '700 24px "Outfit", sans-serif, system-ui';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 10;
    const prepText = this.playerMode === 'single' ? 'Angkat kedua-dua belah tangan...' : 'P1 Kiri & P2 Kanan, bersedia!';
    this.ctx.fillText(prepText, w / 2, h / 2 + 95);
    this.ctx.restore();
  }

  drawHUD(w, h) {
    this.ctx.save();

    if (this.playerMode === 'single') {
      // 1. Mod Single Player HUD
      // Skor Kiri
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      this.ctx.lineWidth = 1.5;
      this.roundRect(24, 24, 210, 75, 16, true, true);

      this.ctx.textAlign = 'left';
      this.ctx.font = '600 13px "Outfit", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText('JUMLAH SKOR', 42, 48);

      this.ctx.font = '900 32px "Outfit", sans-serif';
      this.ctx.fillStyle = '#facc15';
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 12;
      this.ctx.fillText(`${this.score}`, 42, 84);

      // Pemasa Tengah
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      this.roundRect(w / 2 - 95, 24, 190, 75, 16, true, true);

      this.ctx.textAlign = 'center';
      this.ctx.font = '600 13px "Outfit", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText(this.gameMode === 'time' ? 'MASA TINGGAL' : 'NYAWA', w / 2, 48);

      this.ctx.font = '900 32px "Outfit", sans-serif';
      if (this.gameMode === 'time') {
        this.ctx.fillStyle = this.timeLeft <= 10 ? '#ef4444' : '#38bdf8';
        this.ctx.fillText(`${this.timeLeft}s`, w / 2, 84);
      } else {
        const hearts = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, this.maxLives - this.lives));
        this.ctx.font = '22px "Outfit", sans-serif';
        this.ctx.fillText(hearts, w / 2, 84);
      }

      // Kombo Kanan
      if (this.combo > 1) {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
        this.roundRect(w - 234, 24, 210, 75, 16, true, true);

        this.ctx.textAlign = 'right';
        this.ctx.font = '600 13px "Outfit", sans-serif';
        this.ctx.fillStyle = '#c084fc';
        this.ctx.fillText('STREAK KOMBO', w - 44, 48);

        this.ctx.font = '900 32px "Outfit", sans-serif';
        this.ctx.fillStyle = '#e879f9';
        this.ctx.shadowColor = '#e879f9';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`x${this.combo}`, w - 44, 84);
      }
    } else {
      // 2. Mod Dual Player HUD (P1 Kiri vs P2 Kanan)
      // Kad P1 (Kiri Atas)
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      this.ctx.lineWidth = 2;
      this.roundRect(24, 24, 230, 80, 16, true, true);

      this.ctx.textAlign = 'left';
      this.ctx.font = '800 14px "Outfit", sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText('🔵 PEMAIN 1 (KIRI)', 42, 48);

      this.ctx.font = '900 32px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`${this.p1Score}`, 42, 86);
      if (this.p1Combo > 1) {
        this.ctx.font = '800 16px "Outfit", sans-serif';
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillText(`x${this.p1Combo}`, 160, 86);
      }

      // Pemasa Tengah
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      this.roundRect(w / 2 - 80, 24, 160, 75, 16, true, true);

      this.ctx.textAlign = 'center';
      this.ctx.font = '600 13px "Outfit", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText('MASA', w / 2, 48);

      this.ctx.font = '900 32px "Outfit", sans-serif';
      this.ctx.fillStyle = this.timeLeft <= 10 ? '#ef4444' : '#facc15';
      this.ctx.fillText(`${this.timeLeft}s`, w / 2, 84);

      // Kad P2 (Kanan Atas)
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      this.ctx.lineWidth = 2;
      this.roundRect(w - 254, 24, 230, 80, 16, true, true);

      this.ctx.textAlign = 'right';
      this.ctx.font = '800 14px "Outfit", sans-serif';
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillText('🔴 PEMAIN 2 (KANAN)', w - 42, 48);

      this.ctx.font = '900 32px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`${this.p2Score}`, w - 42, 86);
      if (this.p2Combo > 1) {
        this.ctx.font = '800 16px "Outfit", sans-serif';
        this.ctx.fillStyle = '#f43f5e';
        this.ctx.fillText(`x${this.p2Combo}`, w - 160, 86);
      }
    }

    if (this.isFever) {
      this.ctx.textAlign = 'center';
      this.ctx.font = '900 24px "Outfit", sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 16;
      this.ctx.fillText(`🌈 FEVER MODE! 2X MATA (${this.feverTimer}s)`, w / 2, 125);
    }

    this.ctx.restore();
  }

  drawGameOverUI(w, h) {
    this.ctx.save();

    if (this.playerMode === 'single') {
      // Game Over Single Player
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
      this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      this.ctx.lineWidth = 2;
      this.roundRect(w / 2 - 270, h / 2 - 240, 540, 480, 24, true, true);

      this.ctx.textAlign = 'center';
      this.ctx.font = '900 44px "Outfit", sans-serif, system-ui';
      this.ctx.fillStyle = '#ef4444';
      this.ctx.shadowColor = '#ef4444';
      this.ctx.shadowBlur = 20;
      this.ctx.fillText('TAMAT PERMAINAN!', w / 2, h / 2 - 160);

      this.ctx.font = '600 16px "Outfit", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText('MARKAH AKHIR', w / 2, h / 2 - 115);

      this.ctx.font = '900 54px "Outfit", sans-serif';
      this.ctx.fillStyle = '#facc15';
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText(`${this.score}`, w / 2, h / 2 - 60);

      this.ctx.shadowBlur = 0;
      this.ctx.font = '500 17px "Outfit", sans-serif';
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillText(`⭐ Bintang Ditangkap: ${this.starsCaught}  |  🔥 Kombo Maks: ${this.maxCombo}`, w / 2, h / 2 - 10);
      this.ctx.fillText(`🏆 Rekod Tertinggi: ${this.highScore} Mata`, w / 2, h / 2 + 25);

      let rank = '🌟 Penangkap Bintang Perantis';
      if (this.score >= 500) rank = '👑 RAJA GALAKSI BINTANG';
      else if (this.score >= 300) rank = '🚀 Wira Angkasa Lepas';
      else if (this.score >= 150) rank = '✨ Pemburu Bintang Mahir';

      this.ctx.font = '700 20px "Outfit", sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText(`Gelaran: ${rank}`, w / 2, h / 2 + 70);
    } else {
      // Game Over Dual Player (P1 vs P2)
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      this.ctx.lineWidth = 2;
      this.roundRect(w / 2 - 320, h / 2 - 250, 640, 500, 24, true, true);

      this.ctx.textAlign = 'center';
      this.ctx.font = '900 40px "Outfit", sans-serif';

      let winnerText = '🤝 KEPUTUSAN SERI!';
      let winnerColor = '#facc15';
      if (this.p1Score > this.p2Score) {
        winnerText = '🏆 PEMAIN 1 MENANG!';
        winnerColor = '#38bdf8';
      } else if (this.p2Score > this.p1Score) {
        winnerText = '🏆 PEMAIN 2 MENANG!';
        winnerColor = '#f43f5e';
      }

      this.ctx.fillStyle = winnerColor;
      this.ctx.shadowColor = winnerColor;
      this.ctx.shadowBlur = 20;
      this.ctx.fillText(winnerText, w / 2, h / 2 - 170);

      // Perbandingan Skor P1 vs P2
      this.ctx.shadowBlur = 0;
      // Kolum P1
      this.ctx.textAlign = 'center';
      this.ctx.font = '800 20px "Outfit", sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText('🔵 PEMAIN 1 (KIRI)', w / 2 - 140, h / 2 - 110);
      this.ctx.font = '900 48px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`${this.p1Score}`, w / 2 - 140, h / 2 - 50);
      this.ctx.font = '500 15px "Outfit", sans-serif';
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillText(`⭐ Bintang: ${this.p1StarsCaught}`, w / 2 - 140, h / 2 - 15);
      this.ctx.fillText(`🔥 Kombo: ${this.p1MaxCombo}`, w / 2 - 140, h / 2 + 15);

      // Kolum P2
      this.ctx.font = '800 20px "Outfit", sans-serif';
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.fillText('🔴 PEMAIN 2 (KANAN)', w / 2 + 140, h / 2 - 110);
      this.ctx.font = '900 48px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(`${this.p2Score}`, w / 2 + 140, h / 2 - 50);
      this.ctx.font = '500 15px "Outfit", sans-serif';
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillText(`⭐ Bintang: ${this.p2StarsCaught}`, w / 2 + 140, h / 2 - 15);
      this.ctx.fillText(`🔥 Kombo: ${this.p2MaxCombo}`, w / 2 + 140, h / 2 + 15);

      // Garis tengah pemisah skor
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.beginPath();
      this.ctx.moveTo(w / 2, h / 2 - 120);
      this.ctx.lineTo(w / 2, h / 2 + 50);
      this.ctx.stroke();

      this.ctx.font = '700 16px "Outfit", sans-serif';
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillText('Perlawanan yang sengit!', w / 2, h / 2 + 85);
    }

    this.drawVirtualButton(this.virtualButtons.find(b => b.id === 'restart'));
    this.ctx.restore();
  }

  drawVirtualButton(btn) {
    if (!btn) return;
    const isHovered = this.activeHoverButton === btn;

    this.ctx.save();
    this.ctx.fillStyle = isHovered ? 'rgba(14, 165, 233, 0.9)' : 'rgba(2, 132, 199, 0.72)';
    this.ctx.strokeStyle = isHovered ? '#ffffff' : '#38bdf8';
    this.ctx.lineWidth = isHovered ? 3.5 : 2;
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = isHovered ? 24 : 10;

    this.roundRect(btn.x, btn.y, btn.width, btn.height, 18, true, true);

    if (isHovered && this.hoverProgress > 0) {
      this.ctx.beginPath();
      this.ctx.arc(btn.x + 35, btn.y + btn.height / 2, 18, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (this.hoverProgress / 100)));
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
    }

    this.ctx.textAlign = 'center';
    this.ctx.font = '800 20px "Outfit", sans-serif, system-ui';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(btn.text, btn.x + btn.width / 2 + (isHovered ? 10 : 0), btn.y + btn.height / 2);

    if (btn.subtext) {
      this.ctx.font = '500 11px "Outfit", sans-serif, system-ui';
      this.ctx.fillStyle = '#e0f2fe';
      this.ctx.fillText(btn.subtext, btn.x + btn.width / 2 + (isHovered ? 10 : 0), btn.y + btn.height / 2 + 18);
    }

    this.ctx.restore();
  }

  roundRect(x, y, width, height, radius, fill, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    if (fill) this.ctx.fill();
    if (stroke) this.ctx.stroke();
  }
}

window.GameEngine = GameEngine;
