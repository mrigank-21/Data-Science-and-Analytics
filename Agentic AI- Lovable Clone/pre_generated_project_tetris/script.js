// Core constants and canvas utilities for the Simple Tetris game

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid dimensions
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;

// Draw a single cell at grid coordinates (x, y) with the specified color
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// Clear the entire canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Expose globally for other modules
window.COLS = COLS;
window.ROWS = ROWS;
window.CELL_SIZE = CELL_SIZE;
window.drawCell = drawCell;
window.clearCanvas = clearCanvas;

// ------------------------------------------------------------
// Task 2 – Tetromino shape definitions and Tetromino class
// ------------------------------------------------------------

// Shape definitions (matrix of 0/1 values)
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

// Optional: a simple colour mapping for each tetromino type
const COLORS = {
    I: 'cyan',
    O: 'yellow',
    T: 'purple',
    S: 'lime',
    Z: 'red',
    J: 'blue',
    L: 'orange'
};

/**
 * Tetromino class representing a falling piece.
 */
class Tetromino {
    /**
     * @param {string} type - One of the keys from SHAPES (I, O, T, S, Z, J, L).
     * @param {Array<Array<number>>} shape - The matrix describing the blocks.
     * @param {string} color - Fill colour for rendering.
     * @param {number} x - Horizontal grid position (column) of the piece's origin.
     * @param {number} y - Vertical grid position (row) of the piece's origin.
     */
    constructor(type, shape, color, x, y) {
        this.type = type;               // keep the type for colour lookup etc.
        this.shape = shape;             // current rotation matrix
        this.color = color;
        this.x = x;
        this.y = y;
        this.rotationIndex = 0;         // 0‑3, increments on each rotate
    }

    /**
     * Rotates the tetromino clockwise.
     * Uses matrix transpose + reverse each row.
     */
    rotate() {
        // Transpose
        const transposed = this.shape[0].map((_, colIndex) =>
            this.shape.map(row => row[colIndex])
        );
        // Reverse each row to achieve clockwise rotation
        this.shape = transposed.map(row => row.reverse());
        this.rotationIndex = (this.rotationIndex + 1) % 4;
    }

    /**
     * Returns an array of block coordinates occupied by this tetromino on the grid.
     * Each element is an object {x: gridX, y: gridY}.
     */
    getBlocks() {
        const blocks = [];
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    blocks.push({
                        x: this.x + col,
                        y: this.y + row
                    });
                }
            }
        }
        return blocks;
    }
}

/**
 * Creates a new Tetromino with a random shape and colour.
 * The piece spawns roughly in the middle of the board.
 * @returns {Tetromino}
 */
function randomTetromino() {
    const types = Object.keys(SHAPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const shape = SHAPES[randomType].map(row => row.slice()); // deep copy
    const color = COLORS[randomType] || 'white';
    const startX = Math.floor(COLS / 2) - 2; // centre of board, adjusted for width
    const startY = 0;
    return new Tetromino(randomType, shape, color, startX, startY);
}

// Export to the global scope for later modules
window.Tetromino = Tetromino;
window.randomTetromino = randomTetromino;

// ------------------------------------------------------------
// Task 3 – Grid management via Grid class
// ------------------------------------------------------------

/**
 * Grid class handling the game board state.
 * It stores a 2‑D array of cells where 0 indicates empty and any other value
 * (typically a colour string) indicates a locked block.
 */
class Grid {
    constructor() {
        // Initialise a ROWS x COLS matrix filled with 0 (empty)
        this.cells = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    /**
     * Checks whether the given coordinates are within the grid bounds.
     * @param {number} x - Column index.
     * @param {number} y - Row index.
     * @returns {boolean}
     */
    isInside(x, y) {
        return x >= 0 && x < COLS && y >= 0 && y < ROWS;
    }

    /**
     * Returns true if the cell at (x, y) is empty (0).
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isEmpty(x, y) {
        return this.cells[y][x] === 0;
    }

    /**
     * Determines whether a tetromino can be placed at its current position.
     * It must be inside the board and all occupied cells must be empty.
     * @param {Tetromino} tetromino
     * @returns {boolean}
     */
    canPlace(tetromino) {
        const blocks = tetromino.getBlocks();
        for (const { x, y } of blocks) {
            if (!this.isInside(x, y) || !this.isEmpty(x, y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Locks a tetromino onto the board by writing its colour into the cells.
     * @param {Tetromino} tetromino
     */
    place(tetromino) {
        const blocks = tetromino.getBlocks();
        for (const { x, y } of blocks) {
            if (this.isInside(x, y)) {
                this.cells[y][x] = tetromino.color;
            }
        }
    }

    /**
     * Clears any fully‑filled rows, shifts remaining rows down, and adds empty rows at the top.
     * @returns {number} Number of cleared lines.
     */
    clearFullLines() {
        const newRows = [];
        let cleared = 0;
        for (let row = 0; row < ROWS; row++) {
            const isFull = this.cells[row].every(cell => cell !== 0);
            if (!isFull) {
                newRows.push(this.cells[row]);
            } else {
                cleared++;
            }
        }
        // Add empty rows at the top for each cleared line
        const emptyRow = Array(COLS).fill(0);
        for (let i = 0; i < cleared; i++) {
            newRows.unshift(emptyRow.slice());
        }
        this.cells = newRows;
        return cleared;
    }

    /**
     * Checks if any cell in the top row is occupied, signalling game over.
     * @returns {boolean}
     */
    isGameOver() {
        return this.cells[0].some(cell => cell !== 0);
    }
}

// Export Grid globally for later use
window.Grid = Grid;

// ------------------------------------------------------------
// Task 4 – Rendering functions for the grid and active tetromino
// ------------------------------------------------------------

/**
 * Render the static grid cells onto the canvas.
 * @param {Grid} grid
 */
function renderGrid(grid) {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cellColor = grid.cells[y][x];
            if (cellColor !== 0) {
                drawCell(x, y, cellColor);
            }
        }
    }
}

/**
 * Render the currently falling tetromino.
 * @param {Tetromino} tetromino
 */
function renderTetromino(tetromino) {
    const blocks = tetromino.getBlocks();
    for (const block of blocks) {
        drawCell(block.x, block.y, tetromino.color);
    }
}

/**
 * Clear the canvas and render both the grid and the active tetromino.
 * @param {Grid} grid
 * @param {Tetromino} activeTetromino
 */
function render(grid, activeTetromino) {
    clearCanvas();
    renderGrid(grid);
    if (activeTetromino) {
        renderTetromino(activeTetromino);
    }
}

// Export render globally for the game loop
window.render = render;

// ------------------------------------------------------------
// Task 5 – User input handling
// ------------------------------------------------------------

/**
 * INPUT object tracks the current state of player controls.
 * Each property is a boolean indicating whether the corresponding key is pressed.
 */
const INPUT = {
    left: false,
    right: false,
    rotate: false,
    softDrop: false,
    hardDrop: false
};

// Key down events – set the corresponding INPUT flags to true
document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft':
            INPUT.left = true;
            break;
        case 'ArrowRight':
            INPUT.right = true;
            break;
        case 'ArrowUp':
            INPUT.rotate = true;
            break;
        case 'ArrowDown':
            INPUT.softDrop = true;
            break;
        case 'Space':
            INPUT.hardDrop = true;
            break;
        case 'KeyR':
            // Restart the game if it's over
            if (gameOver) {
                resetGame();
            }
            break;
        default:
            // ignore other keys
            break;
    }
});

// Key up events – reset the INPUT flags to false
document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowLeft':
            INPUT.left = false;
            break;
        case 'ArrowRight':
            INPUT.right = false;
            break;
        case 'ArrowUp':
            INPUT.rotate = false;
            break;
        case 'ArrowDown':
            INPUT.softDrop = false;
            break;
        case 'Space':
            INPUT.hardDrop = false;
            break;
        default:
            // ignore other keys
            break;
    }
});

// Export INPUT globally so the game loop can read the current control state.
window.INPUT = INPUT;

// ------------------------------------------------------------
// Task 6 – Core game loop and state management (with Task 7 enhancements)
// ------------------------------------------------------------

let grid = new Grid();
let activeTetromino = randomTetromino();
let dropCounter = 0;
const DROP_INTERVAL = 500; // ms
let gameOver = false;
let score = 0; // Track player score

// UI elements (created on load)
let overlay; // will hold the overlay div
let scoreDiv; // will hold the score display

/**
 * Reset the entire game state – used when player presses 'R' after game over.
 */
function resetGame() {
    grid = new Grid();
    activeTetromino = randomTetromino();
    dropCounter = 0;
    gameOver = false;
    score = 0;
    if (overlay) overlay.style.display = 'none';
    if (scoreDiv) scoreDiv.innerText = score;
    lastTimestamp = 0; // reset timing
    requestAnimationFrame(loop);
}

/**
 * Attempts to move the active tetromino left/right/down or rotate it.
 * Uses the INPUT flags and respects collision detection via Grid.canPlace.
 * @param {number} deltaTime - Time elapsed since last frame (ms).
 */
function update(deltaTime) {
    if (gameOver) return;

    dropCounter += deltaTime;

    // ----- Handle horizontal movement -----
    if (INPUT.left) {
        activeTetromino.x -= 1;
        if (!grid.canPlace(activeTetromino)) {
            activeTetromino.x += 1; // revert
        }
    }
    if (INPUT.right) {
        activeTetromino.x += 1;
        if (!grid.canPlace(activeTetromino)) {
            activeTetromino.x -= 1; // revert
        }
    }

    // ----- Handle rotation -----
    if (INPUT.rotate) {
        // rotate once
        activeTetromino.rotate();
        if (!grid.canPlace(activeTetromino)) {
            // revert rotation (rotate three more times)
            activeTetromino.rotate();
            activeTetromino.rotate();
            activeTetromino.rotate();
        }
    }

    // ----- Hard drop -----
    if (INPUT.hardDrop) {
        // Move piece down until it collides
        while (true) {
            activeTetromino.y += 1;
            if (!grid.canPlace(activeTetromino)) {
                activeTetromino.y -= 1; // step back to last valid position
                break;
            }
        }
        // Lock piece immediately
        grid.place(activeTetromino);
        const cleared = grid.clearFullLines();
        if (cleared) score += cleared * 100;
        if (grid.isGameOver()) {
            gameOver = true;
            return;
        }
        activeTetromino = randomTetromino();
        dropCounter = 0;
        // Reset hardDrop flag so it doesn't repeat on next frame
        INPUT.hardDrop = false;
        return; // skip normal drop this frame
    }

    // ----- Soft drop (increase speed) -----
    const effectiveDropInterval = INPUT.softDrop ? DROP_INTERVAL / 10 : DROP_INTERVAL;

    // ----- Automatic drop -----
    if (dropCounter >= effectiveDropInterval) {
        activeTetromino.y += 1;
        if (!grid.canPlace(activeTetromino)) {
            // Can't move down – lock piece
            activeTetromino.y -= 1; // revert to last valid position
            grid.place(activeTetromino);
            const cleared = grid.clearFullLines();
            if (cleared) score += cleared * 100;
            if (grid.isGameOver()) {
                gameOver = true;
                return;
            }
            activeTetromino = randomTetromino();
            dropCounter = 0;
        } else {
            // Successful drop, reset counter for next interval
            dropCounter = 0;
        }
    }
}

let lastTimestamp = 0;
function loop(timestamp) {
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    update(delta);
    render(grid, activeTetromino);
    // Update score display after each render
    if (scoreDiv) scoreDiv.innerText = score;
    if (!gameOver) {
        requestAnimationFrame(loop);
    } else {
        // Show overlay UI instead of canvas‑based message
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.innerText = 'Game Over – Press R to Restart';
        }
    }
}

window.onload = () => {
    // Ensure the canvas size matches the grid
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;

    // Create UI overlay if it does not exist
    overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'none';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#fff';
        overlay.style.fontSize = '2rem';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        document.body.appendChild(overlay);
    }

    // Create score display if it does not exist
    scoreDiv = document.getElementById('score');
    if (!scoreDiv) {
        scoreDiv = document.createElement('div');
        scoreDiv.id = 'score';
        // Simple positioning – top‑left corner
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.top = '10px';
        scoreDiv.style.left = '10px';
        scoreDiv.style.color = '#fff';
        scoreDiv.style.fontSize = '1.5rem';
        scoreDiv.innerText = score;
        document.body.appendChild(scoreDiv);
    }

    requestAnimationFrame(loop);
};
