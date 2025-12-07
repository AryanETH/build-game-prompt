import { useEffect, useRef } from 'react';

interface DinoGameProps {
  color: string;
  landType: string;
  onScoreUpdate: (score: number) => void;
  onRetry?: () => void;
}

export const DinoGame = ({ color, landType, onScoreUpdate, onRetry }: DinoGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 150;
    
    const FPS = 60;
    const GRAVITY = 0.5; // Reduced from 0.6 for more floaty jump
    
    // Environment colors based on land type
    const envColors = {
      Grass: { bg: '#87CEEB', ground: '#7CB342', obstacle: '#558B2F', cloud: '#FFFFFF' },
      Desert: { bg: '#FFE4B5', ground: '#DEB887', obstacle: '#8B4513', cloud: '#F5DEB3' },
      Ice: { bg: '#E0F7FA', ground: '#B3E5FC', obstacle: '#4FC3F7', cloud: '#FFFFFF' }
    };
    
    const currentEnv = envColors[landType as keyof typeof envColors] || envColors.Grass;
    
    // Sound effects
    const playSound = (frequency: number, duration: number, type: OscillatorType = 'square') => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (e) {
        // Silently fail if audio context not available
      }
    };
    
    const jumpSound = () => playSound(400, 0.1, 'sine');
    const scoreSound = () => playSound(800, 0.1, 'square');
    const crashSound = () => {
      // More pleasant crash sound - descending notes
      playSound(600, 0.15, 'triangle');
      setTimeout(() => playSound(400, 0.15, 'triangle'), 80);
      setTimeout(() => playSound(200, 0.2, 'triangle'), 160);
    };
    
    // Game state
    let gameRunning = false;
    let crashed = false;
    let score = 0;
    let currentSpeed = 4; // Start slower for easier beginning
    let distanceRan = 0;
    let time = 0;
    let msPerFrame = 1000 / FPS;
    let lastScoreMilestone = 0;
    
    // T-Rex
    const tRex = {
      x: 50,
      y: 0,
      groundY: 0,
      width: 44,
      height: 47,
      dy: 0,
      jumping: false,
      ducking: false,
      jumpVelocity: -12, // Increased from -10 for higher jump
      minJumpHeight: 50, // Increased from 30 for higher jump
      reachedMinHeight: false,
      speedDrop: false,
      color: color,
      
      init() {
        this.groundY = canvas.height - this.height - 10;
        this.y = this.groundY;
      },
      
      startJump() {
        if (!this.jumping && !this.ducking) {
          this.jumping = true;
          this.dy = this.jumpVelocity;
          this.reachedMinHeight = false;
          this.speedDrop = false;
          jumpSound(); // Play jump sound
        }
      },
      
      endJump() {
        if (this.reachedMinHeight && this.dy < -5) {
          this.dy = -5;
        }
      },
      
      updateJump(deltaTime: number) {
        const msPerFrame = 1000 / FPS;
        const framesElapsed = deltaTime / msPerFrame;
        
        if (this.speedDrop) {
          this.y += Math.round(this.dy * 3 * framesElapsed);
        } else {
          this.y += Math.round(this.dy * framesElapsed);
        }
        
        this.dy += GRAVITY * framesElapsed;
        
        if (this.y < this.groundY - this.minJumpHeight || this.speedDrop) {
          this.reachedMinHeight = true;
        }
        
        if (this.y < this.groundY - 60 || this.speedDrop) {
          this.endJump();
        }
        
        if (this.y > this.groundY) {
          this.reset();
        }
      },
      
      reset() {
        this.y = this.groundY;
        this.dy = 0;
        this.jumping = false;
        this.ducking = false;
        this.speedDrop = false;
      },
      
      draw() {
        // Draw pixelated dinosaur matching the reference image
        ctx.fillStyle = this.color;
        
        const frame = !this.jumping && Math.floor(Date.now() / 100) % 2;
        
        // Improved dino pixel art pattern (more detailed, matching reference)
        const pixels = [
          // Row 0-3: Head top
          [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0],
          [0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0],
          [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0],
          [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0],
          // Row 4-7: Head with eye
          [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
          [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
          [0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
          // Row 8-11: Neck/Body
          [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
          // Row 12-13: Lower body
          [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
          [0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
          // Row 14-15: Tail
          [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
          [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
          // Row 16-19: Legs
          [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
        ];
        
        // Animate legs for running
        if (frame === 1 && !this.jumping) {
          pixels[16] = [0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0];
          pixels[17] = [0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0];
          pixels[18] = [0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0];
          pixels[19] = [0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0];
        }
        
        const pixelSize = 2.5;
        pixels.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              ctx.fillRect(
                this.x + x * pixelSize,
                this.y + y * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          });
        });
        
        // Eye (white square)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + 17, this.y + 10, 4, 4);
        
        // Mouth line
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 30, this.y + 18, 8, 2);
      }
    };
    
    // Obstacles
    const obstacles: any[] = [];
    
    class Obstacle {
      x: number;
      y: number;
      width: number;
      height: number;
      remove: boolean;
      gap: number;
      
      constructor(speed: number, distance: number) {
        // Start with small obstacles, gradually introduce variety
        let types;
        if (distance < 500) {
          // Early game: only small obstacles
          types = [{ width: 17, height: 30 }];
        } else if (distance < 1000) {
          // Mid game: small and medium
          types = [
            { width: 17, height: 30 },
            { width: 25, height: 35 }
          ];
        } else {
          // Late game: all sizes but consistent heights
          types = [
            { width: 17, height: 30 },
            { width: 25, height: 35 },
            { width: 34, height: 30 }
          ];
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        this.width = type.width;
        this.height = type.height;
        this.x = canvas.width;
        this.y = canvas.height - this.height - 10;
        this.remove = false;
        this.gap = this.getGap(speed, distance);
      }
      
      getGap(speed: number, distance: number): number {
        // Start with larger gaps, gradually decrease
        let baseGap = 200;
        if (distance < 500) {
          baseGap = 300; // Easier at start
        } else if (distance < 1000) {
          baseGap = 250;
        }
        
        const minGap = Math.round(this.width * speed + baseGap);
        const maxGap = Math.round(minGap * 1.3);
        return Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
      }
      
      update(deltaTime: number, speed: number) {
        if (!this.remove) {
          this.x -= Math.floor((speed * FPS / 1000) * deltaTime);
          this.draw();
          
          if (this.x + this.width < 0) {
            this.remove = true;
          }
        }
      }
      
      draw() {
        ctx.fillStyle = currentEnv.obstacle;
        
        // Draw pixelated cactus/obstacle based on land type
        if (landType === 'Ice') {
          // Ice spikes
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + this.height);
          ctx.lineTo(this.x + this.width / 2, this.y);
          ctx.lineTo(this.x + this.width, this.y + this.height);
          ctx.closePath();
          ctx.fill();
        } else if (landType === 'Desert') {
          // Cactus
          ctx.fillRect(this.x + this.width / 2 - 4, this.y, 8, this.height);
          if (this.width > 20) {
            ctx.fillRect(this.x, this.y + 10, 6, 15);
            ctx.fillRect(this.x + this.width - 6, this.y + 10, 6, 15);
          }
        } else {
          // Grass - rocks/bushes
          ctx.fillRect(this.x, this.y + this.height - 15, this.width, 15);
          ctx.fillRect(this.x + 5, this.y + this.height - 25, this.width - 10, 10);
        }
      }
      
      collidesWith(dino: typeof tRex): boolean {
        const dinoBox = {
          x: dino.x + 5,
          y: dino.y + 5,
          width: dino.width - 10,
          height: dino.height - 10
        };
        
        return (
          dinoBox.x < this.x + this.width &&
          dinoBox.x + dinoBox.width > this.x &&
          dinoBox.y < this.y + this.height &&
          dinoBox.y + dinoBox.height > this.y
        );
      }
    }
    
    // Horizon line
    let horizonX = 0;
    
    function drawHorizon() {
      const lineY = canvas.height - 10;
      
      // Draw ground
      ctx.fillStyle = currentEnv.ground;
      ctx.fillRect(0, lineY, canvas.width, 10);
      
      // Draw ground pattern
      ctx.strokeStyle = currentEnv.obstacle;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < canvas.width + 20; i += 20) {
        const x = (i + horizonX) % (canvas.width + 20);
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + 10, lineY);
      }
      ctx.stroke();
    }
    
    function updateHorizon(deltaTime: number, speed: number) {
      const increment = Math.floor(speed * (FPS / 1000) * deltaTime);
      horizonX -= increment;
      if (horizonX <= -20) {
        horizonX = 0;
      }
      drawHorizon();
    }
    
    // Clouds
    const clouds: any[] = [];
    
    class Cloud {
      x: number;
      y: number;
      width: number;
      height: number;
      remove: boolean;
      
      constructor() {
        this.width = 46;
        this.height = 14;
        this.x = canvas.width;
        this.y = Math.random() * 50 + 20;
        this.remove = false;
      }
      
      update(speed: number) {
        if (!this.remove) {
          this.x -= speed * 0.5;
          this.draw();
          
          if (this.x + this.width < 0) {
            this.remove = true;
          }
        }
      }
      
      draw() {
        ctx.fillStyle = currentEnv.cloud;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + 10, this.y - 5, 26, 5);
        ctx.globalAlpha = 1.0;
      }
    }
    
    // Game loop
    function update() {
      if (!gameRunning) return;
      
      const now = Date.now();
      const deltaTime = now - time;
      time = now;
      
      // Clear canvas with environment background
      ctx.fillStyle = currentEnv.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update horizon
      updateHorizon(deltaTime, currentSpeed);
      
      // Update clouds
      clouds.forEach(cloud => cloud.update(currentSpeed));
      clouds.filter(cloud => !cloud.remove);
      
      if (Math.random() < 0.005 && clouds.length < 5) {
        clouds.push(new Cloud());
      }
      
      // Update T-Rex
      if (tRex.jumping) {
        tRex.updateJump(deltaTime);
      }
      tRex.draw();
      
      // Update obstacles
      distanceRan += currentSpeed * deltaTime / msPerFrame;
      
      if (obstacles.length === 0 || 
          obstacles[obstacles.length - 1].x < canvas.width - obstacles[obstacles.length - 1].gap) {
        obstacles.push(new Obstacle(currentSpeed, distanceRan));
      }
      
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update(deltaTime, currentSpeed);
        
        if (obstacles[i].remove) {
          obstacles.splice(i, 1);
        } else if (obstacles[i].collidesWith(tRex)) {
          crashSound(); // Play crash sound
          gameOver();
          return;
        }
      }
      
      // Update score
      score = Math.floor(distanceRan * 0.025);
      onScoreUpdate(score);
      
      // Play sound every 100 points
      if (Math.floor(score / 100) > lastScoreMilestone) {
        lastScoreMilestone = Math.floor(score / 100);
        scoreSound();
      }
      
      // Gradually increase speed (slower progression)
      if (currentSpeed < 13) {
        currentSpeed = 4 + Math.floor(distanceRan * 0.0015);
      }
      
      requestAnimationFrame(update);
    }
    
    function gameOver() {
      gameRunning = false;
      crashed = true;
      
      // Draw game over overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw game over text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Montserrat, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.font = '18px Montserrat, Arial, sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
      
      ctx.font = '14px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText('Click or press SPACE to restart', canvas.width / 2, canvas.height / 2 + 30);
    }
    
    function restart() {
      crashed = false;
      gameRunning = true;
      score = 0;
      distanceRan = 0;
      currentSpeed = 4; // Start slow
      lastScoreMilestone = 0;
      obstacles.length = 0;
      clouds.length = 0;
      horizonX = 0;
      tRex.reset();
      time = Date.now();
      update();
    }
    
    // Event handlers
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (crashed) {
          restart();
        } else if (gameRunning) {
          tRex.startJump();
        }
      }
      
      if (e.code === 'ArrowDown' && tRex.jumping) {
        e.preventDefault();
        tRex.speedDrop = true;
      }
    }
    
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameRunning && tRex.jumping) {
          tRex.endJump();
        }
      }
      
      if (e.code === 'ArrowDown') {
        tRex.speedDrop = false;
      }
    }
    
    function handleClick() {
      if (crashed) {
        restart();
      } else if (gameRunning) {
        tRex.startJump();
      }
    }
    
    // Initialize
    tRex.init();
    time = Date.now();
    restart();
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);
    
    // Cleanup
    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [color, onScoreUpdate]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full rounded cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
