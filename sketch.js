let mic;
let flowers = [];
let groundHeight = 50;
let lastSoundTime = 0; 
let gameStarted = false; // 用于控制是否点击开始

let flowerColors = ['#FF69B4', '#FFFF00', '#8A2BE2', '#00BFFF', '#FFD700'];
let stemColors = ['#228B22', '#32CD32', '#006400', '#2E8B57', '#6B8E23'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
}

function draw() {
  background(0);

  // 如果还没点击开始，显示提示文字
  if (!gameStarted) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("🌸 Click to make the garden grow 🌸", width / 2, height / 2);
    textSize(14);
    fill(150);
    text("Make sure the mic is on and blowwwwwwww", width / 2, height / 2 + 40);
    return;
  }

  let vol = mic.getLevel();
  let now = millis();

  if (vol > 0.015) {
    lastSoundTime = now;
  }

  // 绘制地面
  fill(15);
  noStroke();
  rect(0, height - groundHeight, width, groundHeight);

  for (let i = flowers.length - 1; i >= 0; i--) {
    let f = flowers[i];
    let isQuiet = (now - lastSoundTime > 3000);
    f.update(vol, isQuiet);
    f.show();

    if (f.isFullyGone()) {
      flowers.splice(i, 1);
      flowers.push(new Flower(random(width * 0.05, width * 0.95), height - groundHeight));
    }
  }
}

// 关键逻辑：用户点击后才真正启动麦克风
function mousePressed() {
  if (!gameStarted) {
    userStartAudio(); // 激活浏览器音频上下文
    mic.start();
    
    // 初始化花朵
    for (let i = 0; i < 45; i++) {
      flowers.push(new Flower(random(width * 0.05, width * 0.95), height - groundHeight));
    }
    gameStarted = true;
  }
}

class Flower {
  constructor(x, y) {
    this.baseX = x;
    this.baseY = y;
    this.currentPercent = 0;
    this.health = 1.0; 
    this.targetX = random(-60, 60);
    this.targetY = -random(150, 400);
    this.cpX = random(-100, 100);
    this.cpY = this.targetY * 0.5;
    this.stemColor = random(stemColors);
    this.petalColor = random(flowerColors);
    this.centerColor = random(flowerColors);
    this.noiseOffset = random(1000); 
    this.petalVariations = [];
    for(let i=0; i<12; i++) {
      this.petalVariations.push({ w: random(0.6, 0.9), h: random(0.7, 1.0), rot: random(-0.08, 0.08) });
    }
  }

  update(v, isQuiet) {
    if (v > 0.02 && this.currentPercent < 1.0) {
      this.currentPercent += v * 0.3;
    }
    if (isQuiet) {
      this.health -= 0.005; 
    } else if (v > 0.02) {
      this.health += 0.01; 
    }
    this.health = constrain(this.health, 0, 1.0);
    this.currentPercent = constrain(this.currentPercent, 0, 1.0);
  }

  isFullyGone() {
    return this.health <= 0;
  }

  show() {
    if (this.health <= 0) return;
    push();
    let wind = map(noise(frameCount * 0.01 + this.noiseOffset), 0, 1, -10, 10) * this.currentPercent;
    translate(wind, 0);
    let steps = 25;
    let lastX = this.baseX;
    let lastY = this.baseY;

    for (let i = 1; i <= steps * this.currentPercent; i++) {
      let t = i / steps;
      let x = (1-t)*(1-t)*this.baseX + 2*(1-t)*t*(this.baseX+this.cpX) + t*t*(this.baseX+this.targetX);
      let y = (1-t)*(1-t)*this.baseY + 2*(1-t)*t*(this.baseY+this.cpY) + t*t*(this.baseY+this.targetY);
      
      let weight = (t > 0.7) ? map(t, 0.7, 1, 3.5, 0.5) : 3.5;
      strokeWeight(weight * this.health); 
      stroke(this.stemColor);
      line(lastX, lastY, x, y);
      lastX = x; lastY = y;
    }

    if (this.currentPercent > 0.7) {
      push();
      translate(lastX, lastY);
      let flowerSize = map(this.currentPercent, 0.7, 1.0, 5, 30) * this.health;
      this.drawFlower(flowerSize);
      pop();
    }
    pop();
  }

  drawFlower(size) {
    if (size < 1) return;
    noStroke();
    fill(this.petalColor);
    for (let i = 0; i < 12; i++) {
      push();
      rotate((TWO_PI / 12) * i + this.petalVariations[i].rot);
      ellipse(size * 0.7, 0, size * this.petalVariations[i].h, size * this.petalVariations[i].w);
      pop();
    }
    fill(this.centerColor);
    ellipse(0, 0, size * 1.1, size * 1.1);
  }
}