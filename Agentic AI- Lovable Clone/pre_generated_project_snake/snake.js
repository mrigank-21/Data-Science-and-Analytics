// Snake Game Core Logic
// Constants
const CANVAS_ID = "game-canvas";
const CELL_SIZE = 20; // size of each cell in pixels
const BOARD_WIDTH = 400 / CELL_SIZE; // number of cells horizontally
const BOARD_HEIGHT = 400 / CELL_SIZE; // number of cells vertically
const INITIAL_SNAKE_LENGTH = 5;
const FPS = 10; // game updates per second

// Helper to get canvas and context
const canvas = document.getElementById(CANVAS_ID);
const ctx = canvas.getContext("2d");

// Snake class
class Snake {
  constructor() {
    // Start in the middle of the board, moving right
    const startX = Math.floor(BOARD_WIDTH / 2);
    const startY = Math.floor(BOARD_HEIGHT / 2);
    this.segments = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      this.segments.push({ x: startX - i, y: startY });
    }
    this.direction = "right"; // current direction
    this.nextDirection = "right"; // direction set by user, applied on next move
    this.growSegments = 0; // how many extra segments to add
  }

  setDirection(dir) {
    const opposites = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    if (dir && dir !== opposites[this.direction]) {
      this.nextDirection = dir;
    }
  }

  move() {
    // Apply any pending direction change
    if (this.nextDirection) {
      this.direction = this.nextDirection;
    }
    const head = this.segments[0];
    const newHead = { x: head.x, y: head.y };
    switch (this.direction) {
      case "up":
        newHead.y -= 1;
        break;
      case "down":
        newHead.y += 1;
        break;
      case "left":
        newHead.x -= 1;
        break;
      case "right":
        newHead.x += 1;
        break;
    }
    this.segments.unshift(newHead);
    if (this.growSegments > 0) {
      this.growSegments--;
    } else {
      this.segments.pop();
    }
  }

  grow() {
    this.growSegments++;
  }

  hasCollided() {
    const head = this.segments[0];
    // Wall collision
    if (
      head.x < 0 ||
      head.x >= BOARD_WIDTH ||
      head.y < 0 ||
      head.y >= BOARD_HEIGHT
    ) {
      return true;
    }
    // Self collision (ignore head when checking)
    for (let i = 1; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (seg.x === head.x && seg.y === head.y) {
        return true;
      }
    }
    return false;
  }

  draw(context) {
    context.fillStyle = "green";
    this.segments.forEach(seg => {
      context.fillRect(
        seg.x * CELL_SIZE,
        seg.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });
  }
}

// Food class
class Food {
  constructor() {
    this.position = { x: 0, y: 0 };
  }

  place(snakeSegments) {
    let valid = false;
    while (!valid) {
      const x = Math.floor(Math.random() * BOARD_WIDTH);
      const y = Math.floor(Math.random() * BOARD_HEIGHT);
      // Ensure food does not appear on the snake
      valid = !snakeSegments.some(seg => seg.x === x && seg.y === y);
      if (valid) {
        this.position = { x, y };
      }
    }
  }

  draw(context) {
    context.fillStyle = "red";
    context.beginPath();
    context.arc(
      this.position.x * CELL_SIZE + CELL_SIZE / 2,
      this.position.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2,
      0,
      Math.PI * 2
    );
    context.fill();
  }
}

// Game class
class Game {
  constructor() {
    this.snake = new Snake();
    this.food = new Food();
    this.food.place(this.snake.segments);
    this.score = 0;
    this.isRunning = false;
    this.animationId = null;
    this.lastTimestamp = null;
    // Bind key handler
    document.addEventListener("keydown", this.handleKey.bind(this));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = null;
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  pause() {
    if (!this.isRunning) return;
    cancelAnimationFrame(this.animationId);
    this.isRunning = false;
  }

  restart() {
    this.pause();
    // Reset state
    this.snake = new Snake();
    this.food = new Food();
    this.food.place(this.snake.segments);
    this.score = 0;
    this.clearCanvas();
    this.updateScoreDisplay();
    this.start();
  }

  clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  updateScoreDisplay() {
    const scoreEl = document.getElementById("score");
    if (scoreEl) scoreEl.textContent = this.score;
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const delta = timestamp - this.lastTimestamp;
    if (delta >= 1000 / FPS) {
      // Update game state
      this.snake.move();

      // Check food consumption
      const head = this.snake.segments[0];
      if (head.x === this.food.position.x && head.y === this.food.position.y) {
        this.score++;
        this.snake.grow();
        this.food.place(this.snake.segments);
        this.updateScoreDisplay();
      }

      // Collision detection
      if (this.snake.hasCollided()) {
        this.gameOver();
        return; // stop loop
      }

      // Render
      this.clearCanvas();
      this.food.draw(ctx);
      this.snake.draw(ctx);

      this.lastTimestamp = timestamp;
    }
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  gameOver() {
    this.pause();
    alert(`Game Over! Your score: ${this.score}`);
  }

  handleKey(e) {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    const dir = keyMap[e.key];
    if (dir) {
      this.snake.setDirection(dir);
    }
  }
}

// Expose global instance and control functions
window.snakeGame = new Game();
window.startGame = () => window.snakeGame.start();
window.pauseGame = () => window.snakeGame.pause();
window.restartGame = () => window.snakeGame.restart();
