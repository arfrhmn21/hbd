const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const cakeContainer = document.getElementById("cakeContainer");
const candle = document.getElementById("candle");
const flame = document.querySelector(".flame");
const spark = document.querySelector(".spark");
const balloonContainer = document.getElementById("balloonContainer");
const textBalloonContainer = document.getElementById("textBalloonContainer");
const handPointer = document.getElementById("handPointer");
const letterOverlay = document.getElementById("letterOverlay");
const closeLetter = document.getElementById("closeLetter");
const typingTextElement = document.getElementById("typingText");
const signatureElement = document.getElementById("signature");
const canvas = document.getElementById("fireworksCanvas");
const ctx = canvas.getContext("2d");

const MAX_BALLOONS = 30;
const wishText = "HBD ALCHA";
const message =
    "Selamat ulang tahun! Semoga hari kamu selalu seru, penuh tawa, dan dikelilingi orang-orang yang kamu sayang. Semoga sehat terus, rezekinya makin lancar, dan semua hal yang kamu impikan pelan-pelan bisa tercapai. Makasih yaa udah jadi orang yang selalu asik dan bikin hari-hari jadi lebih berwarna. Semoga ke depannya makin banyak momen bahagia yang bisa kamu rasain, dan jangan lupa tetap jadi diri kamu yang sekarang, tetap jadi keren dengan caramu sendiri!";
const sound = new Audio("sounds/hbd_song.mp3");

let lastColor = "";
let playCount = 0;
let candleClicked = false;
let balloonInterval = null;
let fireworkInterval = null;
let isPageVisible = true;
let charIndex = 0;
let particles = [];
let escapeCount = 0;
const MAX_ESCAPE = 20;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8,
        };
        this.alpha = 1;
        this.friction = 0.97;
        this.decayRate = 0.02;
        this.size = 2.5;
        this.trail = [];
        this.maxTrailLength = 12;
        this.isDead = false;
    }

    createTrail() {
        if (this.alpha > 0.1) {
            this.trail.push({
                x: this.x,
                y: this.y,
                alpha: this.alpha * 0.4,
                size: this.size * 0.5,
                life: 1.0,
            });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
    }

    updateTrail() {
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha *= 0.92;
            this.trail[i].life -= 0.08;
            if (this.trail[i].life <= 0 || this.trail[i].alpha <= 0.01) {
                this.trail.splice(i, 1);
            }
        }
    }

    draw() {
        ctx.save();
        this.trail.forEach((trailParticle, index) => {
            const trailAlpha =
                trailParticle.alpha * (1 - index / this.maxTrailLength);
            if (trailAlpha > 0.01) {
                ctx.globalAlpha = trailAlpha;
                ctx.beginPath();
                ctx.arc(
                    trailParticle.x,
                    trailParticle.y,
                    trailParticle.size,
                    0,
                    Math.PI * 2,
                );
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 6;
                ctx.fill();
            }
        });
        ctx.restore();

        if (this.alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }
    }

    update() {
        if (this.isDead) return;
        this.createTrail();
        this.updateTrail();
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.y += 0.08;
        this.alpha -= this.decayRate;
        this.size *= 0.995;
        if (this.alpha <= 0.01 && this.trail.length === 0) {
            this.isDead = true;
        }
    }
}

let currentHue = Math.random();

function getUltraEstheticColor() {
    const goldenRatioConjugate = 0.618033988749895;

    currentHue += goldenRatioConjugate;
    currentHue %= 1;

    const h = Math.floor(currentHue * 360);

    const s = 70 + Math.random() * 10;
    const l = 60 + Math.random() * 10;

    return `hsl(${h}, ${s}%, ${l}%)`;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function typeWriter() {
    if (charIndex < message.length) {
        typingTextElement.innerHTML += message.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 50);
    } else {
        signatureElement.classList.remove("hidden");
        signatureElement.style.opacity = "1";
        setTimeout(() => {
            closeLetter.classList.add("show");
        }, 500);
    }
}

function spawnTextBalloons() {
    textBalloonContainer.innerHTML = "";
    const letters = wishText.split("");
    letters.forEach((letter, index) => {
        if (letter === " ") {
            const spacer = document.createElement("div");
            spacer.classList.add("text-balloon-spacer");
            textBalloonContainer.appendChild(spacer);
            return;
        }
        const balloon = document.createElement("div");
        balloon.classList.add("text-balloon");
        balloon.style.setProperty("--color", getUltraEstheticColor());
        const letterSpan = document.createElement("span");
        letterSpan.classList.add("text-balloon-letter");
        letterSpan.innerText = letter.toUpperCase();
        balloon.appendChild(letterSpan);
        const appearanceDelay = 2 + index * 0.2;
        balloon.style.animationDelay = appearanceDelay + "s";
        const swayDuration = (Math.random() * 2 + 2.5).toFixed(2) + "s";
        const swayDelay = (Math.random() * 2).toFixed(2) + "s";
        balloon.style.setProperty("--sway-duration", swayDuration);
        balloon.style.setProperty("--sway-delay", swayDelay);
        textBalloonContainer.appendChild(balloon);
    });
}

function createBackgroundBalloon() {
    const balloon = document.createElement("div");
    balloon.classList.add("balloon");
    const xPos = Math.random() * 95;
    balloon.style.left = xPos + "%";
    balloon.style.setProperty("--color", getUltraEstheticColor());
    const drift = Math.random() * 200 - 100 + "px";
    balloon.style.setProperty("--drift", drift);
    const duration = 6 + Math.random() * 4 + "s";
    balloon.style.animationDuration = duration;
    balloonContainer.appendChild(balloon);
    setTimeout(
        () => {
            balloon.remove();
        },
        parseFloat(duration) * 1000,
    );
}

function animateFireworks() {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        if (particle.isDead) {
            particles.splice(i, 1);
            continue;
        }
        particle.draw();
    }
    requestAnimationFrame(animateFireworks);
}

function startAnimations() {
    if (!balloonInterval) {
        balloonInterval = setInterval(createBackgroundBalloon, 800);
    }
    if (!fireworkInterval) {
        fireworkInterval = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height * 0.4);
            const size = 0.7 + Math.random() * 0.6;
            const particleCount = Math.floor(40 * size);
            for (let i = 0; i < particleCount; i++) {
                particles.push(
                    new Particle(
                        x,
                        y,
                        `hsl(${Math.random() * 360}, 100%, 60%)`,
                    ),
                );
            }
        }, 800);
    }
}

function stopAnimations() {
    clearInterval(balloonInterval);
    clearInterval(fireworkInterval);
    balloonInterval = null;
    fireworkInterval = null;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

sound.addEventListener("ended", () => {
    playCount++;
    sound.currentTime = 0;
    sound.play();
    if (playCount === 1) {
        handPointer.classList.remove("hidden");
        candle.style.cursor = "pointer";
    }
});

startButton.addEventListener("click", function () {
    setTimeout(() => {
        sound.play().catch((error) => console.log("Autoplay dicegah", error));
    }, 1500);
    overlay.classList.add("fade-out");
    setTimeout(() => {
        overlay.classList.add("hidden");
        cakeContainer.classList.remove("hidden");
        balloonContainer.classList.remove("hidden");
        spawnTextBalloons();
        startAnimations();
        animateFireworks();
    }, 1000);
});

candle.addEventListener("animationend", (e) => {
    if (
        !cakeContainer.classList.contains("hidden") &&
        e.animationName === "fallBounce"
    ) {
        spark.style.animation = "sparkFlash 0.4s ease";
        setTimeout(() => {
            flame.classList.add("on");
        }, 300);
    }
});

candle.addEventListener("click", function () {
    if (candleClicked) return;
    if (cakeContainer.classList.contains("hidden") || playCount === 0) return;

    candleClicked = true;
    this.classList.add("off");
    this.style.cursor = "default";
    handPointer.classList.add("hidden");
    setTimeout(() => {
        letterOverlay.classList.remove("hidden");
        setTimeout(() => {
            letterOverlay.classList.add("show");
            typingTextElement.innerHTML = "";
            charIndex = 0;
            signatureElement.classList.add("hidden");
            closeLetter.classList.remove("show");
            typeWriter();
        }, 10);
    }, 1200);
    document.title = "HBD ALCHA";
});

closeLetter.addEventListener("click", () => {
    letterOverlay.classList.remove("show");
    setTimeout(() => {
        letterOverlay.classList.add("hidden");
    }, 500);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        isPageVisible = false;
        stopAnimations();
    } else {
        isPageVisible = true;
        if (overlay.classList.contains("hidden")) {
            startAnimations();
        }
    }
});

function typeWriterToElement(element, text, speed = 50, callback) {
    element.innerHTML = "";
    let i = 0;

    function type() {
        if (i < text.length) {
            const char = text.charAt(i);
            element.innerHTML += char === "\n" ? "<br>" : char;
            i++;
            setTimeout(type, speed);
        } else {
            if (callback) callback();
        }
    }

    type();
}
