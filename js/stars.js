/**
 * Tangkap Bintang - Star & Item Entities
 * Melukis bintang dan objek jatuh secara prosedural (Canvas 2D) dengan visual bercahaya.
 */

// Fungsi bantuan melukis bentuk bintang 5 bucu
function drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius, fillStyle, strokeStyle = null) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

class BaseItem {
  constructor(canvasWidth, type = 'star') {
    this.type = type;
    this.canvasWidth = canvasWidth;
    this.radius = 28; // Hitbox radius
    this.x = Math.random() * (canvasWidth - 100) + 50;
    this.y = -40;
    this.vy = Math.random() * 2 + 2.5; // Kelajuan jatuh
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.05;
    this.isDead = false;
  }

  update() {
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    if (this.y > window.innerHeight + 60) {
      this.isDead = true;
    }
  }

  checkCollision(tx, ty, touchRadius = 35) {
    const dist = Math.hypot(this.x - tx, this.y - ty);
    return dist < (this.radius + touchRadius);
  }
}

// 1. Bintang Kuning Biasa
class YellowStar extends BaseItem {
  constructor(canvasWidth) {
    super(canvasWidth, 'yellow');
    this.points = 10;
    this.color = '#fde047'; // yellow-300
    this.glowColor = 'rgba(250, 204, 21, 0.8)';
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.shadowBlur = 18;
    ctx.shadowColor = this.glowColor;

    drawStarShape(ctx, 0, 0, 5, this.radius, this.radius * 0.48, this.color, '#ca8a04');

    // Kilauan tengah (highlight)
    ctx.beginPath();
    ctx.arc(-4, -6, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}

// 2. Bintang Emas Pantas / Beralun
class GoldStar extends BaseItem {
  constructor(canvasWidth) {
    super(canvasWidth, 'gold');
    this.points = 30;
    this.color = '#fbbf24';
    this.glowColor = 'rgba(245, 158, 11, 0.9)';
    this.vy = Math.random() * 2.5 + 4.0; // Lebih laju
    this.baseX = this.x;
    this.waveAngle = Math.random() * Math.PI;
    this.waveSpeed = 0.06;
    this.waveAmp = 35;
  }

  update() {
    this.waveAngle += this.waveSpeed;
    this.x = this.baseX + Math.sin(this.waveAngle) * this.waveAmp;
    super.update();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * 1.5);

    ctx.shadowBlur = 24;
    ctx.shadowColor = this.glowColor;

    drawStarShape(ctx, 0, 0, 6, this.radius * 1.15, this.radius * 0.45, '#f59e0b', '#fffbeb');

    // Kilauan mata berlian
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}

// 3. Bintang Pelangi (Fever Mode / Powerup)
class RainbowStar extends BaseItem {
  constructor(canvasWidth) {
    super(canvasWidth, 'rainbow');
    this.points = 50;
    this.radius = 32;
    this.hue = 0;
    this.vy = 2.8;
  }

  update() {
    this.hue = (this.hue + 4) % 360;
    super.update();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const rainbowColor = `hsl(${this.hue}, 100%, 65%)`;
    ctx.shadowBlur = 28;
    ctx.shadowColor = rainbowColor;

    drawStarShape(ctx, 0, 0, 5, this.radius * 1.2, this.radius * 0.5, rainbowColor, '#ffffff');

    // Gegelung pelangi berkilau
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}

// 4. Meteor / Bom Berduri (Halangan)
class MeteorObstacle extends BaseItem {
  constructor(canvasWidth) {
    super(canvasWidth, 'bomb');
    this.points = -20;
    this.radius = 26;
    this.vy = Math.random() * 2 + 3.2;
    this.smokeTimer = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Cahaya bahaya merah
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';

    // Badan bom hitam berduri
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Duri-duri bom
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spikeX = Math.cos(angle) * (this.radius + 8);
      const spikeY = Math.sin(angle) * (this.radius + 8);
      ctx.beginPath();
      ctx.arc(spikeX, spikeY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // Tanda bahaya "X" di tengah
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -7);
    ctx.lineTo(7, 7);
    ctx.moveTo(7, -7);
    ctx.lineTo(-7, 7);
    ctx.stroke();

    ctx.restore();
  }
}

window.StarEntities = {
  YellowStar,
  GoldStar,
  RainbowStar,
  MeteorObstacle
};

