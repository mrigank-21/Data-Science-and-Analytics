// Classic Snake Game Engine
// This script implements the full game logic as described in the task specification.

// ------------------------------------------------------------
// 1. Constants & Configuration
// ------------------------------------------------------------
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gridSize = 20; // each cell is 20px
// Ensure canvas is square; we will set its width/height based on CSS later.
const initialCanvasSize = canvas.width; // assume square canvas initially (e.g., 400)
const cellCount = initialCanvasSize / gridSize; // number of cells per side

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

// ------------------------------------------------------------
// 2. Game State Variables
// ------------------------------------------------------------
let snake = [{ x: Math.floor(cellCount / 2), y: Math.floor(cellCount / 2) }]; // start in centre
let currentDirection = directions.ArrowRight; // moving right initially
let nextDirection = currentDirection; // buffered direction
let food = { x: 0, y: 0 };
let score = 0;
let gameLoopId = null;
let isPaused = false;

// ------------------------------------------------------------
// 3. UI Element References
// ------------------------------------------------------------
const scoreEl = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// ------------------------------------------------------------
// 4. Sound Effects (optional)
// ------------------------------------------------------------
let eatSound, gameOverSound;
if (window.Audio) {
  eatSound = new Audio('assets/eat.wav');
  gameOverSound = new Audio('assets/gameover.wav');
}

// ------------------------------------------------------------
// 5. Helper Functions
// ------------------------------------------------------------
/**
 * Randomly places food on the board ensuring it does not overlap the snake.
 */
function placeFood() {
  let valid = false;
  while (!valid) {
    const x = Math.floor(Math.random() * cellCount);
    const y = Math.floor(Math.random() * cellCount);
    // Check collision with snake
    valid = !snake.some(seg => seg.x === x && seg.y === y);
    if (valid) {
      food.x = x;
      food.y = y;
    }
  }
}

/**
 * Draw a single cell at grid coordinates (x, y) with the given colour.
 */
function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

/**
 * Render the entire snake.
 */
function drawSnake() {
  snake.forEach((segment, index) => {
    const color = index === 0 ? '#006400' : '#00A000'; // head darker
    drawCell(segment.x, segment.y, color);
  });
}

/**
 * Render the food.
 */
function drawFood() {
  drawCell(food.x, food.y, 'red');
}

/**
 * Update the score display in the DOM.
 */
function updateScore() {
  if (scoreEl) scoreEl.textContent = score;
}

/**
 * Reset the entire game state to its initial conditions.
 * Also clears the canvas and sets UI button states.
 */
function resetGame() {
  clearInterval(gameLoopId);
  gameLoopId = null;
  snake = [{ x: Math.floor(cellCount / 2), y: Math.floor(cellCount / 2) }];
  currentDirection = directions.ArrowRight;
  nextDirection = currentDirection;
  score = 0;
  isPaused = false;
  updateScore();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  restartBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
}

// ------------------------------------------------------------
// 6. Core Game Loop (tick function)
// ------------------------------------------------------------
function gameTick() {
  if (isPaused) return;

  // Apply buffered direction
  currentDirection = nextDirection;

  // Compute new head position with wrap‑around behaviour
  const newHead = {
    x: (snake[0].x + currentDirection.x + cellCount) % cellCount,
    y: (snake[0].y + currentDirection.y + cellCount) % cellCount,
  };

  // Self‑collision detection
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    endGame();
    return;
  }

  // Add new head
  snake.unshift(newHead);

  // Food handling
  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    updateScore();
    if (eatSound) {
      eatSound.currentTime = 0;
      eatSound.play();
    }
    placeFood();
  } else {
    // Remove tail when no food eaten
    snake.pop();
  }

  // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFood();
  drawSnake();
}

// ------------------------------------------------------------
// 7. Event Listeners
// ------------------------------------------------------------
// Keyboard – buffer direction changes, prevent 180° reversal
document.addEventListener('keydown', e => {
  const proposed = directions[e.key];
  if (proposed) {
    if (proposed.x !== -currentDirection.x || proposed.y !== -currentDirection.y) {
      nextDirection = proposed;
    }
  }
});

// Button controls
startBtn.onclick = () => startGame();
pauseBtn.onclick = () => togglePause();
restartBtn.onclick = () => {
  resetGame();
  startGame();
};

// ------------------------------------------------------------
// 8. Game Control Functions
// ------------------------------------------------------------
function startGame() {
  if (gameLoopId) return; // already running
  isPaused = false;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  restartBtn.disabled = false;
  placeFood();
  gameLoopId = setInterval(gameTick, 100); // 10 FPS
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function endGame() {
  clearInterval(gameLoopId);
  gameLoopId = null;
  if (gameOverSound) {
    gameOverSound.play();
  }
  alert('Game Over! Your score: ' + score);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  restartBtn.disabled = false;
}

// ------------------------------------------------------------
// 9. Canvas Resize Handling (optional responsive support)
// ------------------------------------------------------------
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  // No need to recalculate cellCount – we keep logical grid fixed.
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ------------------------------------------------------------
// 10. Initialisation (nothing runs until user clicks Start)
// ------------------------------------------------------------
// UI button states are defined in HTML. No auto‑start.
