/**
 * Tangkap Bintang - Particle & FX System
 * Menguruskan zarah berkilau, letupan bintang, dan teks skor terapung.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.scorePopups = [];
  }

  // Cipta letupan partikel bintang bila disentuh
  createStarBurst(x, y, color = '#facc15', count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      const size = Math.random() * 5 + 3;
      const life = Math.random() * 25 + 25; // frames

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        alpha: 1,
        life: life,
        maxLife: life,
        gravity: 0.15,
        sparkle: Math.random() > 0.4
      });
    }
  }

  // Cipta letupan bom / meteor (hitam / oren / merah)
  createBombBurst(x, y) {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      const size = Math.random() * 7 + 4;
      const life = Math.random() * 20 + 20;

      const colors = ['#ef4444', '#f97316', '#dc2626', '#475569', '#1e293b'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        alpha: 1,
        life: life,
        maxLife: life,
        gravity: 0.2,
        sparkle: false
      });
    }
  }

  // Jejak habuk bintang pada hujung tangan pemain
  createHandTrail(x, y, color = '#67e8f9') {
    if (Math.random() > 0.4) {
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 16 - 8),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 2,
        color: color,
        alpha: 0.8,
        life: 15,
        maxLife: 15,
        gravity: -0.05,
        sparkle: true
      });
    }
  }

  // Teks skor terapung (+10, +50, COMBO x2!)
  createScorePopup(x, y, text, color = '#facc15', fontSize = 26) {
    this.scorePopups.push({
      x: x,
      y: y,
      text: text,
      color: color,
      fontSize: fontSize,
      alpha: 1,
      vy: -2.2,
      life: 40,
      maxLife: 40
    });
  }

  update() {
    // Kemaskini partikel
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Kemaskini teks skor terapung
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      popup.y += popup.vy;
      popup.life--;
      popup.alpha = Math.max(0, popup.life / popup.maxLife);

      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Lukis partikel
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.sparkle ? 10 : 0;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lukis teks skor terapung
    for (const popup of this.scorePopups) {
      ctx.globalAlpha = popup.alpha;
      ctx.font = `900 ${popup.fontSize}px 'Outfit', sans-serif, system-ui`;
      ctx.textAlign = 'center';

      // Garis tepi hitam untuk kontras tinggi di atas suapan kamera
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(popup.text, popup.x, popup.y);

      ctx.fillStyle = popup.color;
      ctx.shadowColor = popup.color;
      ctx.shadowBlur = 12;
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.scorePopups = [];
  }
}

window.particleSystem = new ParticleSystem();

