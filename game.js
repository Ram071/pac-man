// ============================================================
// PAC-MAN COMPLETE GAME
// ============================================================

// -----------------------------
// CANVAS
// -----------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const livesElement = document.getElementById("lives");

const message = document.getElementById("message");
const restartButton = document.getElementById("restart");


// -----------------------------
// GAME SETTINGS
// -----------------------------

const TILE = 20;
const COLS = 28;
const ROWS = 31;

canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;


// -----------------------------
// MAZE
// -----------------------------

const LEVEL_MAP = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##### ## #####.#     ",
    "     #.##          ##.#     ",
    "     #.## ###GG### ##.#     ",
    "######.## #      # ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "     #.##          ##.#     ",
    "     #.## ######## ##.#     ",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################"
];


// -----------------------------
// GAME VARIABLES
// -----------------------------

let map = [];

let score = 0;

let highScore =
    Number(localStorage.getItem("pacmanHighScore")) || 0;

let lives = 3;

let level = 1;

let pellets = 0;

let state = "READY";

let frightened = false;

let frightenedTimer = 0;

let moveTimer = 0;

let lastTime = 0;


// -----------------------------
// PAC-MAN
// -----------------------------

const pacman = {

    x: 14,

    y: 23,

    direction: "left",

    nextDirection: "left",

    mouth: 0

};


// -----------------------------
// GHOSTS
// -----------------------------

const ghosts = [

    {
        name: "Blinky",

        x: 13,
        y: 14,

        startX: 13,
        startY: 14,

        color: "red",

        direction: "left"
    },

    {
        name: "Pinky",

        x: 14,
        y: 14,

        startX: 14,
        startY: 14,

        color: "pink",

        direction: "right"
    },

    {
        name: "Inky",

        x: 12,
        y: 14,

        startX: 12,
        startY: 14,

        color: "cyan",

        direction: "up"
    },

    {
        name: "Clyde",

        x: 15,
        y: 14,

        startX: 15,
        startY: 14,

        color: "orange",

        direction: "down"
    }

];


// ============================================================
// MAP INITIALIZATION
// ============================================================

function initializeMap() {

    map = [];

    pellets = 0;

    for (let r = 0; r < ROWS; r++) {

        const row = [];

        for (let c = 0; c < COLS; c++) {

            let value = LEVEL_MAP[r]?.[c] || "#";

            // Convert spaces into paths
            if (value === " ") {
                value = ".";
            }

            // Ghost markers become paths
            if (value === "G") {
                value = " ";
            }

            row.push(value);

            if (
                value === "." ||
                value === "o"
            ) {

                pellets++;

            }

        }

        map.push(row);
    }

}


// ============================================================
// DRAW MAZE
// ============================================================

function drawMaze() {

    for (let r = 0; r < ROWS; r++) {

        for (let c = 0; c < COLS; c++) {

            const x = c * TILE;
            const y = r * TILE;

            const cell = map[r][c];


            // WALL
            if (cell === "#") {

                ctx.fillStyle = "#1010a8";

                ctx.fillRect(
                    x,
                    y,
                    TILE,
                    TILE
                );

                ctx.strokeStyle = "#4444ff";

                ctx.lineWidth = 1;

                ctx.strokeRect(
                    x + 1,
                    y + 1,
                    TILE - 2,
                    TILE - 2
                );

            }

            // PATH
            else {

                ctx.fillStyle = "black";

                ctx.fillRect(
                    x,
                    y,
                    TILE,
                    TILE
                );


                // NORMAL PELLET
                if (cell === ".") {

                    ctx.fillStyle = "white";

                    ctx.beginPath();

                    ctx.arc(
                        x + TILE / 2,
                        y + TILE / 2,
                        2,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                }


                // POWER PELLET
                if (cell === "o") {

                    ctx.fillStyle = "white";

                    ctx.beginPath();

                    ctx.arc(
                        x + TILE / 2,
                        y + TILE / 2,
                        6,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();

                }

            }

        }

    }

}


// ============================================================
// DRAW PAC-MAN
// ============================================================

function drawPacman() {

    const x =
        pacman.x * TILE + TILE / 2;

    const y =
        pacman.y * TILE + TILE / 2;


    let angle = 0;


    if (pacman.direction === "right") {
        angle = 0;
    }

    if (pacman.direction === "down") {
        angle = Math.PI / 2;
    }

    if (pacman.direction === "left") {
        angle = Math.PI;
    }

    if (pacman.direction === "up") {
        angle = -Math.PI / 2;
    }


    const mouth =
        Math.abs(Math.sin(pacman.mouth)) * 0.45;


    ctx.fillStyle = "yellow";

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.arc(
        x,
        y,
        TILE / 2 - 2,
        angle + mouth,
        angle + Math.PI * 2 - mouth
    );

    ctx.closePath();

    ctx.fill();

}


// ============================================================
// DRAW GHOST
// ============================================================

function drawGhost(ghost) {

    const x =
        ghost.x * TILE + TILE / 2;

    const y =
        ghost.y * TILE + TILE / 2;

    const radius =
        TILE / 2 - 2;


    // Ghost color

    if (frightened) {

        // Flash near end of power mode

        if (
            frightenedTimer < 30 &&
            Math.floor(frightenedTimer / 5) % 2 === 0
        ) {

            ctx.fillStyle = "white";

        }

        else {

            ctx.fillStyle = "#2020ff";

        }

    }

    else {

        ctx.fillStyle = ghost.color;

    }


    // HEAD

    ctx.beginPath();

    ctx.arc(
        x,
        y - 1,
        radius,
        Math.PI,
        0
    );


    // BODY

    ctx.lineTo(
        x + radius,
        y + radius
    );

    ctx.lineTo(
        x + radius / 2,
        y + radius - 4
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.lineTo(
        x - radius / 2,
        y + radius - 4
    );

    ctx.lineTo(
        x - radius,
        y + radius
    );

    ctx.closePath();

    ctx.fill();


    // Eyes

    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.arc(
        x - 5,
        y - 3,
        4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 5,
        y - 3,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle = "black";

    ctx.beginPath();

    ctx.arc(
        x - 5,
        y - 3,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 5,
        y - 3,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


// ============================================================
// WALL CHECK
// ============================================================

function isWall(x, y) {

    if (
        x < 0 ||
        x >= COLS ||
        y < 0 ||
        y >= ROWS
    ) {

        return true;

    }

    return map[y][x] === "#";

}


function canMove(x, y) {

    return !isWall(x, y);

}


// ============================================================
// POSITION CALCULATION
// ============================================================

function getNextPosition(
    x,
    y,
    direction
) {

    let nx = x;
    let ny = y;


    if (direction === "up") {
        ny--;
    }

    if (direction === "down") {
        ny++;
    }

    if (direction === "left") {
        nx--;
    }

    if (direction === "right") {
        nx++;
    }


    // Tunnel

    if (nx < 0) {

        nx = COLS - 1;

    }

    if (nx >= COLS) {

        nx = 0;

    }


    return {
        x: nx,
        y: ny
    };

}


// ============================================================
// PAC-MAN MOVEMENT
// ============================================================

function movePacman() {

    // Try requested direction

    const requested =
        getNextPosition(
            pacman.x,
            pacman.y,
            pacman.nextDirection
        );


    if (
        canMove(
            requested.x,
            requested.y
        )
    ) {

        pacman.direction =
            pacman.nextDirection;

    }


    // Move current direction

    const next =
        getNextPosition(
            pacman.x,
            pacman.y,
            pacman.direction
        );


    if (
        canMove(
            next.x,
            next.y
        )
    ) {

        pacman.x = next.x;

        pacman.y = next.y;

    }


    collectPellet();

}


// ============================================================
// COLLECT PELLET
// ============================================================

function collectPellet() {

    const cell =
        map[pacman.y][pacman.x];


    // NORMAL PELLET

    if (cell === ".") {

        map[pacman.y][pacman.x] = " ";

        score += 10;

        pellets--;

        pelletSound();

    }


    // POWER PELLET

    if (cell === "o") {

        map[pacman.y][pacman.x] = " ";

        score += 50;

        pellets--;

        frightened = true;

        frightenedTimer = 120;

        powerPelletSound();

    }


    updateUI();


    // LEVEL COMPLETE

    if (pellets <= 0) {

        levelComplete();

    }

}


// ============================================================
// GHOST MOVEMENT
// ============================================================

function moveGhosts() {

    ghosts.forEach(
        (ghost, index) => {

            let directions = [
                "up",
                "down",
                "left",
                "right"
            ];


            // Find valid directions

            let valid =
                directions.filter(
                    direction => {

                        const next =
                            getNextPosition(
                                ghost.x,
                                ghost.y,
                                direction
                            );

                        return canMove(
                            next.x,
                            next.y
                        );

                    }
                );


            if (valid.length === 0) {
                return;
            }


            // Prevent instant reverse

            const opposite = {

                up: "down",

                down: "up",

                left: "right",

                right: "left"

            };


            if (valid.length > 1) {

                const filtered =
                    valid.filter(
                        direction =>
                            direction !==
                            opposite[
                                ghost.direction
                            ]
                    );


                if (filtered.length > 0) {

                    valid = filtered;

                }

            }


            // AI

            if (Math.random() < 0.80) {

                valid.sort(
                    (a, b) => {

                        const distanceA =
                            ghostDistance(
                                ghost,
                                a,
                                index
                            );

                        const distanceB =
                            ghostDistance(
                                ghost,
                                b,
                                index
                            );


                        if (frightened) {

                            // Run away

                            return (
                                distanceB -
                                distanceA
                            );

                        }


                        // Chase

                        return (
                            distanceA -
                            distanceB
                        );

                    }
                );

            }


            const chosen =
                valid[
                    Math.floor(
                        Math.random() *
                        valid.length
                    )
                ];


            ghost.direction = chosen;


            const next =
                getNextPosition(
                    ghost.x,
                    ghost.y,
                    ghost.direction
                );


            ghost.x = next.x;

            ghost.y = next.y;

        }
    );

}


// ============================================================
// GHOST AI
// ============================================================

function ghostDistance(
    ghost,
    direction,
    index
) {

    const next =
        getNextPosition(
            ghost.x,
            ghost.y,
            direction
        );


    let targetX = pacman.x;

    let targetY = pacman.y;


    // BLINKY

    if (index === 0) {

        targetX = pacman.x;

        targetY = pacman.y;

    }


    // PINKY

    if (index === 1) {

        targetX = pacman.x;

        targetY = pacman.y;


        if (pacman.direction === "up") {

            targetY -= 4;

        }

        if (pacman.direction === "down") {

            targetY += 4;

        }

        if (pacman.direction === "left") {

            targetX -= 4;

        }

        if (pacman.direction === "right") {

            targetX += 4;

        }

    }


    // INKY

    if (index === 2) {

        targetX =
            pacman.x +
            Math.floor(
                Math.random() * 7 - 3
            );

        targetY =
            pacman.y +
            Math.floor(
                Math.random() * 7 - 3
            );

    }


    // CLYDE

    if (index === 3) {

        const distance =
            Math.abs(
                ghost.x - pacman.x
            ) +
            Math.abs(
                ghost.y - pacman.y
            );


        if (distance < 8) {

            targetX = 1;

            targetY = ROWS - 2;

        }

    }


    return (
        Math.abs(
            next.x - targetX
        ) +
        Math.abs(
            next.y - targetY
        )
    );

}


// ============================================================
// COLLISION
// ============================================================

function checkGhostCollision() {

    for (const ghost of ghosts) {

        if (
            ghost.x === pacman.x &&
            ghost.y === pacman.y
        ) {

            // FRIGHTENED GHOST

            if (frightened) {

                score += 200;

                ghostEatenSound();


                // Send ghost home

                ghost.x =
                    ghost.startX;

                ghost.y =
                    ghost.startY;

                updateUI();

            }


            // NORMAL GHOST

            else {

                loseLife();

                return;

            }

        }

    }

}


// ============================================================
// LOSE LIFE
// ============================================================

function loseLife() {

    lives--;

    updateUI();

    deathSound();


    if (lives <= 0) {

        state = "GAMEOVER";

        showMessage(
            "GAME OVER",
            "Press ENTER to restart"
        );

        return;

    }


    state = "READY";


    resetPositions();


    showMessage(
        "READY!",
        "Press ENTER to continue"
    );

}


// ============================================================
// RESET POSITIONS
// ============================================================

function resetPositions() {

    pacman.x = 14;

    pacman.y = 23;

    pacman.direction = "left";

    pacman.nextDirection = "left";


    ghosts.forEach(
        ghost => {

            ghost.x =
                ghost.startX;

            ghost.y =
                ghost.startY;

        }
    );

}


// ============================================================
// LEVEL COMPLETE
// ============================================================

function levelComplete() {

    levelCompleteSound();

    level++;

    frightened = false;

    initializeMap();

    resetPositions();

    state = "READY";

    showMessage(
        "LEVEL " + level,
        "Press ENTER to continue"
    );

    updateUI();

}


// ============================================================
// UI
// ============================================================

function updateUI() {

    scoreElement.textContent =
        score;


    livesElement.textContent =
        lives;


    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "pacmanHighScore",
            highScore
        );

    }


    highScoreElement.textContent =
        highScore;

}


// ============================================================
// GAME MESSAGE
// ============================================================

function showMessage(
    title,
    text
) {

    message.style.display = "block";


    message.innerHTML = `

        <h2>${title}</h2>

        <p>${text}</p>

    `;

}


function hideMessage() {

    message.style.display = "none";

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    initAudio();


    if (state === "GAMEOVER") {

        score = 0;

        lives = 3;

        level = 1;

        frightened = false;

        initializeMap();

        resetPositions();

        updateUI();

    }


    if (
        state === "READY" ||
        state === "GAMEOVER"
    ) {

        startSound();

        state = "PLAYING";

        hideMessage();

    }

}


// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    initAudio();


    if (state === "PLAYING") {

        state = "PAUSED";

        showMessage(
            "PAUSED",
            "Press P to continue"
        );

    }

    else if (state === "PAUSED") {

        state = "PLAYING";

        hideMessage();

    }

}


// ============================================================
// KEYBOARD CONTROLS
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();


        if (
            key === "arrowup" ||
            key === "w"
        ) {

            pacman.nextDirection = "up";

            event.preventDefault();

        }


        if (
            key === "arrowdown" ||
            key === "s"
        ) {

            pacman.nextDirection = "down";

            event.preventDefault();

        }


        if (
            key === "arrowleft" ||
            key === "a"
        ) {

            pacman.nextDirection = "left";

            event.preventDefault();

        }


        if (
            key === "arrowright" ||
            key === "d"
        ) {

            pacman.nextDirection = "right";

            event.preventDefault();

        }


        if (key === "enter") {

            startGame();

        }


        if (key === "p") {

            togglePause();

        }

    }
);


// ============================================================
// MOBILE CONTROLS
// ============================================================

document
    .querySelectorAll(
        ".mobile-controls button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                initAudio();

                pacman.nextDirection =
                    directionFromKey(
                        button.dataset.key
                    );

            }
        );

    });


function directionFromKey(key) {

    if (key === "ArrowUp") {

        return "up";

    }

    if (key === "ArrowDown") {

        return "down";

    }

    if (key === "ArrowLeft") {

        return "left";

    }

    return "right";

}


// ============================================================
// RESTART BUTTON
// ============================================================

restartButton.addEventListener(
    "click",
    () => {

        initAudio();

        buttonSound();


        score = 0;

        lives = 3;

        level = 1;

        frightened = false;

        frightenedTimer = 0;

        initializeMap();

        resetPositions();

        updateUI();

        state = "READY";

        showMessage(
            "PAC-MAN",
            "Press ENTER to Start"
        );

    }
);


// ============================================================
// SOUND SYSTEM
// ============================================================

let audioContext = null;

let soundEnabled = true;


// -----------------------------
// INITIALIZE AUDIO
// -----------------------------

function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

}


// -----------------------------
// BASIC TONE
// -----------------------------

function tone(
    frequency,
    duration,
    type = "square",
    volume = 0.05
) {

    if (!soundEnabled) {
        return;
    }


    initAudio();


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = type;


    oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
    );


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();


    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


// ============================================================
// PELLET SOUND
// ============================================================

function pelletSound() {

    tone(
        650,
        0.045,
        "square",
        0.035
    );

}


// ============================================================
// POWER PELLET SOUND
// ============================================================

function powerPelletSound() {

    tone(
        250,
        0.12,
        "square",
        0.06
    );


    setTimeout(
        () => {

            tone(
                500,
                0.12,
                "square",
                0.06
            );

        },
        120
    );

}


// ============================================================
// GHOST EATEN SOUND
// ============================================================

function ghostEatenSound() {

    tone(
        800,
        0.08,
        "square",
        0.06
    );


    setTimeout(
        () => {

            tone(
                1200,
                0.12,
                "square",
                0.06
            );

        },
        80
    );

}


// ============================================================
// DEATH SOUND
// ============================================================

function deathSound() {

    if (!soundEnabled) {
        return;
    }


    initAudio();


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = "sawtooth";


    oscillator.frequency.setValueAtTime(
        700,
        audioContext.currentTime
    );


    oscillator.frequency.exponentialRampToValueAtTime(
        80,
        audioContext.currentTime + 1
    );


    gain.gain.setValueAtTime(
        0.08,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 1
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();


    oscillator.stop(
        audioContext.currentTime + 1
    );

}


// ============================================================
// START SOUND
// ============================================================

function startSound() {

    tone(
        400,
        0.12,
        "square",
        0.05
    );


    setTimeout(
        () => {

            tone(
                600,
                0.12,
                "square",
                0.05
            );

        },
        130
    );


    setTimeout(
        () => {

            tone(
                800,
                0.18,
                "square",
                0.05
            );

        },
        260
    );

}


// ============================================================
// LEVEL COMPLETE SOUND
// ============================================================

function levelCompleteSound() {

    const notes = [
        400,
        500,
        600,
        700,
        800
    ];


    notes.forEach(
        (frequency, index) => {

            setTimeout(
                () => {

                    tone(
                        frequency,
                        0.15,
                        "square",
                        0.06
                    );

                },
                index * 130
            );

        }
    );

}


// ============================================================
// BUTTON SOUND
// ============================================================

function buttonSound() {

    tone(
        500,
        0.07,
        "square",
        0.04
    );

}


// ============================================================
// SOUND ON / OFF
// ============================================================

function toggleSound() {

    soundEnabled =
        !soundEnabled;


    const button =
        document.getElementById(
            "soundButton"
        );


    if (!button) {
        return;
    }


    button.textContent =
        soundEnabled
            ? "🔊 SOUND ON"
            : "🔇 SOUND OFF";


    if (soundEnabled) {

        initAudio();

        buttonSound();

    }

}


// ============================================================
// MAIN UPDATE
// ============================================================

function update() {

    if (state !== "PLAYING") {

        return;

    }


    movePacman();

    moveGhosts();

    checkGhostCollision();


    pacman.mouth += 0.3;


    if (frightened) {

        frightenedTimer--;


        if (frightenedTimer <= 0) {

            frightened = false;

        }

    }

}


// ============================================================
// DRAW EVERYTHING
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawMaze();

    drawPacman();


    ghosts.forEach(
        ghost => {

            drawGhost(ghost);

        }
    );

}


// ============================================================
// MAIN GAME LOOP
// ============================================================

function gameLoop(timestamp) {

    if (!lastTime) {

        lastTime = timestamp;

    }


    const delta =
        timestamp - lastTime;


    lastTime = timestamp;


    moveTimer += delta;


    // Game speed

    if (moveTimer >= 130) {

        update();

        moveTimer = 0;

    }


    draw();


    requestAnimationFrame(
        gameLoop
    );

}


// ============================================================
// GAME INITIALIZATION
// ============================================================

initializeMap();

resetPositions();

updateUI();

showMessage(
    "PAC-MAN",
    "Press ENTER to Start"
);


// Start game loop

requestAnimationFrame(
    gameLoop
);
