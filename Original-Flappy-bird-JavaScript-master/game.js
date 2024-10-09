// SELECT CVS
const cvs = document.getElementById("bird");
const ctx = cvs.getContext("2d");

// GAME VARS AND CONSTS
let frames = 0;
const DEGREE = Math.PI / 180;

// LOAD SPRITE IMAGE
const sprite = new Image();
sprite.src = "img/sprite.png";

// LOAD SOUNDS
const SCORE_S = new Audio();
SCORE_S.src = "audio/sfx_point.wav";

const FLAP = new Audio();
FLAP.src = "audio/sfx_flap.wav";

const HIT = new Audio();
HIT.src = "audio/sfx_hit.wav";

const SWOOSHING = new Audio();
SWOOSHING.src = "audio/sfx_swooshing.wav";

const DIE = new Audio();
DIE.src = "audio/sfx_die.wav";

// GAME STATE
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2,
    inputName: 3,
    showRanking: 4
};

// RANKING STORAGE
let ranking = JSON.parse(localStorage.getItem("ranking")) || [];
// CONTROL THE GAME
cvs.addEventListener("click", function(evt) {
    switch (state.current) {
        case state.getReady:
            state.current = state.game;
            SWOOSHING.play();
            break;
            case state.game:
                if (bird.y - bird.radius <= 0) return;
                bird.flap();
                FLAP.play();
                break;
                case state.over:
                    // Start name input
                    state.current = state.inputName;
                    document.getElementById("formContainer").style.display = "block";
                    document.getElementById("playerName").value = ""; // Limpa o campo
                    break;
    }
});

// Form Submission
document.getElementById("submitBtn").addEventListener("click", function() {
    const playerName = document.getElementById("playerName").value;
    if (playerName) {
        console.log(score);
        ranking.push({ name: playerName, score: score.value });
        ranking.sort((a, b) => b.score - a.score);
        
        // Mantém apenas os top 10
        const top10 = ranking.slice(0, 10);
        localStorage.setItem("ranking", JSON.stringify(top10));
        
        // Exibir ranking
        renderRanking(playerName);
        document.getElementById("formContainer").style.display = "none";
        state.current = state.showRanking;
    }
});

// Back to Game Button
document.getElementById("backBtn").addEventListener("click", function() {
    state.current = state.getReady;
    score.reset();
    pipes.reset();
    bird.speedReset();
    document.getElementById("rankingContainer").style.display = "none";
});

// BACKGROUND
const bg = {
    sX: 0,
    sY: 0,
    w: 275,
    h: 226,
    x: 0,
    y: cvs.height - 226,

    draw: function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
}

// FOREGROUND
const fg = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: cvs.height - 112,

    dx: 2,

    draw: function() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },

    update: function() {
        if (state.current == state.game) {
            this.x = (this.x - this.dx) % (this.w / 2);
        }
    }
}

// BIRD
const bird = {
    animation: [
        { sX: 276, sY: 112 },
        { sX: 276, sY: 139 },
        { sX: 276, sY: 164 },
        { sX: 276, sY: 139 }
    ],
    x: 50,
    y: 150,
    w: 34,
    h: 26,

    radius: 12,

    frame: 0,

    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,

    draw: function() {
        let bird = this.animation[this.frame];

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h, -this.w / 2, -this.h / 2, this.w, this.h);

        ctx.restore();
    },

    flap: function() {
        this.speed = -this.jump;
    },

    update: function() {
        this.period = state.current == state.getReady ? 10 : 5;
        this.frame += frames % this.period == 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length;

        if (state.current == state.getReady) {
            this.y = 150;
            this.rotation = 0 * DEGREE;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + this.h / 2 >= cvs.height - fg.h) {
                this.y = cvs.height - fg.h - this.h / 2;
                if (state.current == state.game) {
                    state.current = state.over;
                    DIE.play();
                    // Chame a função de exibição imediatamente
                    document.getElementById("formContainer").style.display = "block";
                }
            }

            if (this.speed >= this.jump) {
                this.rotation = 90 * DEGREE;
                this.frame = 1;
            } else {
                this.rotation = -25 * DEGREE;
            }
        }
    },
    speedReset: function() {
        this.speed = 0;
    }
}

// GET READY MESSAGE
const getReady = {
    sX: 0,
    sY: 228,
    w: 173,
    h: 152,
    x: cvs.width / 2 - 173 / 2,
    y: 80,

    draw: function() {
        if (state.current == state.getReady) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

// PIPES
const pipes = {
    position: [],

    top: {
        sX: 553,
        sY: 0
    },
    bottom: {
        sX: 502,
        sY: 0
    },

    w: 53,
    h: 400,
    gap: 85,
    maxYPos: -150,
    dx: 2,

    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;

            // top pipe
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);

            // bottom pipe
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);
        }
    },

    update: function() {
        if (state.current !== state.game) return;

        if (frames % 100 == 0) {
            this.position.push({
                x: cvs.width,
                y: this.maxYPos * (Math.random() + 1)
            });
        }
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let bottomPipeYPos = p.y + this.h + this.gap;

            // COLLISION DETECTION
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                state.current = state.over;
                HIT.play();
                // Chame a função de exibição imediatamente
                document.getElementById("formContainer").style.display = "block";
            }
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos) {
                state.current = state.over;
                HIT.play();
                // Chame a função de exibição imediatamente
                document.getElementById("formContainer").style.display = "block";
            }

            // MOVE THE PIPES TO THE LEFT
            p.x -= this.dx;

            // REMOVE PIPE IF OFF SCREEN
            if (p.x + this.w <= 0) {
                this.position.shift();
                score.value++;
                SCORE_S.play();
            }
        }
    },

    reset: function() {
        this.position = [];
    }
}

// SCORE
const score = {
    best: parseInt(localStorage.getItem("best")) || 0,
    value: 0,

    draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";

        if (state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, cvs.width / 2, 50);
            ctx.strokeText(this.value, cvs.width / 2, 50);
        }
    },

    reset: function() {
        this.value = 0;
    }
}

// RENDER RANKING
function renderRanking(playerName) {
    const rankingList = document.getElementById("rankingList");
    rankingList.innerHTML = "";

    // Adiciona os 10 melhores jogadores
    const top10 = ranking.slice(0, 10);
    top10.forEach((player, index) => {
        const listItem = document.createElement("li");
        const position = index + 1;
        listItem.textContent = `${position}° ${player.name} - ${player.score}`;
        rankingList.appendChild(listItem);
    });

    // Adiciona uma linha divisória
    const divider = document.createElement("div");
    divider.classList.add("divider");
    rankingList.appendChild(divider);

    // Adiciona a posição do jogador atual
    const playerPosition = ranking.findIndex(player => player.name === playerName);
    const currentPlayerItem = document.createElement("li");

    if (playerPosition >= 0) {
        currentPlayerItem.textContent = `${playerPosition + 1}° ${playerName} - ${ranking[playerPosition].score}`;
    } else {
        // Calcular a posição real
        const realPosition = ranking.length + 1; // se não estiver no ranking
        currentPlayerItem.textContent = `${realPosition}° ${playerName} - ${score.value}`;
    }
    currentPlayerItem.style.color = "#003366"; // Cor azul mais escura
    rankingList.appendChild(currentPlayerItem);
}

// DRAW
function draw() {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReady.draw();
    score.draw();

    if (state.current === state.showRanking) {
        document.getElementById("rankingContainer").style.display = "block";
        renderRanking(document.getElementById("playerName").value);
    }
}

// UPDATE
function update() {
    bird.update();
    fg.update();
    pipes.update();
}

// LOOP
function loop() {
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
}
loop();
