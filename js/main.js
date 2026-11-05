/**
 * Tangkap Bintang - Application Bootstrap & Controller
 */
window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('webcamVideo');
  const canvas = document.getElementById('gameCanvas');
  const muteBtn = document.getElementById('muteBtn');
  const modeBtn = document.getElementById('modeBtn');
  const playerModeBtn = document.getElementById('playerModeBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const cameraStatus = document.getElementById('cameraStatus');
  const permissionModal = document.getElementById('permissionModal');
  const allowCameraBtn = document.getElementById('allowCameraBtn');

  // Inisialisasi komponen
  const tracker = new window.CameraTracker(video, canvas);
  const sound = window.soundEffects;
  const particles = window.particleSystem;
  const game = new window.GameEngine(canvas, tracker, sound, particles);

  game.init();

  // Status & Maklum balas Kamera
  tracker.onReadyCallback = () => {
    if (cameraStatus) {
      cameraStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mr-2"></span>Kamera Aktif';
    }
    if (permissionModal) {
      permissionModal.classList.add('hidden');
    }
  };

  tracker.onErrorCallback = (err) => {
    console.error('Kamera error:', err);
    if (cameraStatus) {
      cameraStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-2"></span>Kamera Ditolak';
    }
    if (permissionModal) {
      permissionModal.classList.remove('hidden');
    }
  };

  const requestCamera = () => {
    tracker.startCamera();
  };

  if (allowCameraBtn) {
    allowCameraBtn.addEventListener('click', () => {
      requestCamera();
    });
  }

  // Auto-request bila halaman dimuat
  requestCamera();

  // Butang Tukar Mod Pemain (1 Pemain vs 2 Pemain)
  if (playerModeBtn) {
    playerModeBtn.addEventListener('click', () => {
      if (game.state === 'PLAYING') return;
      const newMode = game.playerMode === 'single' ? 'dual' : 'single';
      game.setPlayerMode(newMode);
      playerModeBtn.innerHTML = newMode === 'single' ? '👤 1 Pemain (2 Tangan)' : '👥 2 Pemain (P1 vs P2)';
      game.showToast(`Mod ditukar kepada: ${newMode === 'single' ? '1 Pemain (2 Tangan: Kiri & Kanan)' : '2 Pemain (P1 Kiri vs P2 Kanan)'}`);
    });
  }

  // Butang Mod Masa (60s vs 3 Nyawa)
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      if (game.state === 'PLAYING') return;
      game.gameMode = game.gameMode === 'time' ? 'survival' : 'time';
      modeBtn.innerHTML = game.gameMode === 'time' ? '⏱️ 60 Saat' : '❤️ 3 Nyawa';
      game.showToast(`Mod masa ditukar kepada: ${game.gameMode === 'time' ? '60 Saat' : 'Survival (3 Nyawa)'}`);
    });
  }

  // Butang Audio
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      muteBtn.innerHTML = isMuted ? '🔇 Bisu' : '🔊 Bunyi';
    });
  }

  // Skrin Penuh
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Gagal skrin penuh:', err);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Klik tetikus/touch pada butang maya
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const currentBtns = game.virtualButtons.filter(b => b.state === game.state);
    for (const btn of currentBtns) {
      if (
        clickX >= btn.x &&
        clickX <= btn.x + btn.width &&
        clickY >= btn.y &&
        clickY <= btn.y + btn.height
      ) {
        btn.action();
        break;
      }
    }
  });

  // Utama Game Loop 60 FPS
  function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
