/* ==========================================================================
   Birthday Surprise Website - Premium JS Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State & Configurations ---
    const CONFIG = {
        name: "Zoha",
        totalPhotos: 34,
        balloonColors: ['#ffcad4', '#fcd5ce', '#e0a899', '#b57c6d', '#d4af37', '#e29578'],
        captions: [
            "Cherished Memories", "Laughter & Joy", "A Day to Remember", 
            "Your Beautiful Smile", "Celebrating You", "Moments of Happiness",
            "A Perfect Day", "Shining Bright", "Unforgettable Times",
            "Pure Gold", "Glow & Warmth", "Infinite Love",
            "Warm Embraces", "Sparkling Eyes", "Another Adventure",
            "A Sweet Song", "A True Friend", "Radiant Energy",
            "Dreaming Big", "Pure Magic", "Peace & Calm",
            "Starlight Nights", "Golden Hour", "Heartfelt Laughs",
            "Simply Stunning", "Cheers to You", "The Journey Ahead",
            "Forever Special", "Beautiful Beginnings", "True Reflection",
            "Joyous Whispers", "Elegance & Grace", "Shared Smiles",
            "Time Stands Still"
        ],
        musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    };

    let audioContext = null;
    let backgroundMusic = null;
    let isMuted = false;
    let currentPhotoIndex = 0;
    const wishesKey = 'hbd_surprise_wishes';

    // --- DOM Elements ---
    const introOverlay = document.getElementById('intro-overlay');
    const enterBtn = document.getElementById('enter-btn');

    const countdownGrid = document.getElementById('countdown');
    const glassCard = document.getElementById('glass-card');
    const galleryGrid = document.getElementById('gallery-grid');
    const wishForm = document.getElementById('wish-form');
    const wishesBoard = document.getElementById('wishes-board');
    const giftBox = document.getElementById('gift-box');
    const giftBoxTrigger = document.getElementById('gift-box-trigger');
    const surpriseCard = document.getElementById('surprise-reveal-card');
    
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const lightboxPlay = document.getElementById('lightbox-play');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    // Floating Player Elements
    const floatingPlayer = document.getElementById('floating-player');
    const playerToggle = document.getElementById('player-toggle');
    const playerPlayPause = document.getElementById('player-play-pause');
    const playerPlayIcon = document.getElementById('player-play-icon');
    const playerPauseIcon = document.getElementById('player-pause-icon');
    const playerMute = document.getElementById('player-mute');
    const playerUnmutedIcon = document.getElementById('player-unmuted-icon');
    const playerMutedIcon = document.getElementById('player-muted-icon');
    const playerVolume = document.getElementById('player-volume');
    const playerProgress = document.getElementById('player-progress');
    const playerTimeCurrent = document.getElementById('player-time-current');
    const playerTimeDuration = document.getElementById('player-time-duration');

    // --- Web Audio API Synth Sound Effects ---
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Synthesize a magical chime (harp-like ascending scale)
    function playChimeSound() {
        initAudioContext();
        if (isMuted) return;

        const now = audioContext.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        
        notes.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.6);
        });
    }

    // Synthesize a realistic balloon pop sound
    function playPopSound() {
        initAudioContext();
        if (isMuted) return;

        const now = audioContext.currentTime;
        
        // Low thump oscillator
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Noise crackle buffer
        const bufferSize = audioContext.sampleRate * 0.05; // 50ms burst
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        
        noise.start(now);
        noise.stop(now + 0.06);
    }

    // --- Floating Background Music Manager ---
    function startMusic() {
        if (!backgroundMusic) {
            backgroundMusic = new Audio(CONFIG.musicUrl);
            backgroundMusic.loop = true;
            backgroundMusic.volume = playerVolume ? (playerVolume.value / 100) : 0.4;
            
            // Set up audio events
            backgroundMusic.addEventListener('timeupdate', updatePlayerProgress);
            backgroundMusic.addEventListener('loadedmetadata', initializePlayerDuration);
            backgroundMusic.addEventListener('ended', () => {
                stopPlayerUI();
            });
        }
        
        backgroundMusic.play()
            .then(() => {
                isMuted = false;
                updatePlayerUI();
                
                // Usability touch: Expand player for 3.5 seconds on first play so they see it
                if (floatingPlayer && floatingPlayer.classList.contains('minimized')) {
                    floatingPlayer.classList.remove('minimized');
                    setTimeout(() => {
                        if (floatingPlayer && !floatingPlayer.matches(':hover')) {
                            floatingPlayer.classList.add('minimized');
                        }
                    }, 3500);
                }
            })
            .catch(err => {
                console.log("Audio autoplay failed, waiting for user click.", err);
            });
    }

    function updatePlayerProgress() {
        if (!backgroundMusic || !playerProgress) return;
        
        const duration = backgroundMusic.duration || 0;
        const currentTime = backgroundMusic.currentTime || 0;
        
        if (duration > 0) {
            playerProgress.value = (currentTime / duration) * 100;
        }
        
        if (playerTimeCurrent) {
            playerTimeCurrent.textContent = formatTime(currentTime);
        }
    }

    function initializePlayerDuration() {
        if (!backgroundMusic || !playerProgress || !playerTimeDuration) return;
        playerTimeDuration.textContent = formatTime(backgroundMusic.duration);
    }

    function formatTime(secs) {
        if (isNaN(secs) || !isFinite(secs)) return '0:00';
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function toggleMusicPlay() {
        if (!backgroundMusic) {
            startMusic();
            return;
        }
        
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            updatePlayerUI();
        } else {
            backgroundMusic.pause();
            stopPlayerUI();
        }
    }

    function updatePlayerUI() {
        if (playerPlayIcon) playerPlayIcon.classList.add('hidden');
        if (playerPauseIcon) playerPauseIcon.classList.remove('hidden');
        if (playerToggle) playerToggle.classList.add('spinning');
        
        const trackStatus = floatingPlayer ? floatingPlayer.querySelector('.player-track-status') : null;
        if (trackStatus) {
            trackStatus.textContent = "Playing";
            trackStatus.style.color = "var(--rose-gold-light)";
        }
    }

    function stopPlayerUI() {
        if (playerPlayIcon) playerPlayIcon.classList.remove('hidden');
        if (playerPauseIcon) playerPauseIcon.classList.add('hidden');
        if (playerToggle) playerToggle.classList.remove('spinning');
        
        const trackStatus = floatingPlayer ? floatingPlayer.querySelector('.player-track-status') : null;
        if (trackStatus) {
            trackStatus.textContent = "Paused";
            trackStatus.style.color = "var(--text-muted)";
        }
    }

    function togglePlayerMute() {
        if (!backgroundMusic) return;
        
        isMuted = !isMuted;
        backgroundMusic.muted = isMuted;
        
        // Mute all narration tracks together with background music
        const narrationAudios = document.querySelectorAll('.section-narration');
        narrationAudios.forEach(aud => {
            aud.muted = isMuted;
        });
        
        if (isMuted) {
            if (playerUnmutedIcon) playerUnmutedIcon.classList.add('hidden');
            if (playerMutedIcon) playerMutedIcon.classList.remove('hidden');
        } else {
            if (playerUnmutedIcon) playerUnmutedIcon.classList.remove('hidden');
            if (playerMutedIcon) playerMutedIcon.classList.add('hidden');
        }
    }

    // Connect player DOM event listeners
    if (playerToggle) {
        playerToggle.addEventListener('click', () => {
            floatingPlayer.classList.toggle('minimized');
        });
    }

    if (playerPlayPause) {
        playerPlayPause.addEventListener('click', toggleMusicPlay);
    }

    if (playerMute) {
        playerMute.addEventListener('click', togglePlayerMute);
    }

    if (playerVolume) {
        playerVolume.addEventListener('input', () => {
            if (!backgroundMusic) return;
            const vol = playerVolume.value / 100;
            backgroundMusic.volume = vol;
            
            // Auto mute if dragged to 0
            if (vol === 0) {
                backgroundMusic.muted = true;
                if (playerUnmutedIcon) playerUnmutedIcon.classList.add('hidden');
                if (playerMutedIcon) playerMutedIcon.classList.remove('hidden');
            } else {
                backgroundMusic.muted = false;
                if (playerUnmutedIcon) playerUnmutedIcon.classList.remove('hidden');
                if (playerMutedIcon) playerMutedIcon.classList.add('hidden');
            }
        });
    }

    if (playerProgress) {
        // Seek while dragging or releasing
        playerProgress.addEventListener('input', () => {
            if (!backgroundMusic || !backgroundMusic.duration) return;
            const pct = playerProgress.value / 100;
            backgroundMusic.currentTime = pct * backgroundMusic.duration;
        });
    }

    // --- Canvas Particle Engine (Rose Gold Sparkles) ---
    const canvas = document.getElementById('sparkle-canvas');
    const ctx = canvas.getContext('2d');
    const mouseGlow = document.getElementById('mouse-glow');
    
    let particles = [];
    let confettiParticles = [];
    let mouse = { x: null, y: null, radius: 110 };
    let isCelebrationUnlocked = false;
    let glowX = 0;
    let glowY = 0;

    window.addEventListener('resize', resizeCanvas);
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
        
        // Spawn cursor trails on mouse move once celebration is unlocked
        if (isCelebrationUnlocked) {
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(mouse.x, mouse.y, true));
            }
        }
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x = null, y = null, isTrail = false) {
            this.isTrail = isTrail;
            
            // Randomize scale multiplier (0.8 - 1.3x)
            this.scaleScale = Math.random() * 0.5 + 0.8;
            // Slight rotation drift
            this.rotationAngle = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.015 - 0.0075;
            
            // Wobble custom amplitude and frequency
            this.wobbleFreq = Math.random() * 0.03 + 0.01;
            this.wobbleAmp = Math.random() * 0.45 + 0.25;

            if (isTrail && x !== null && y !== null) {
                this.x = x;
                this.y = y;
                this.size = (Math.random() * 2.0 + 0.8);
                this.speedX = Math.random() * 2 - 1.0;
                this.speedY = Math.random() * 2 - 1.0;
                this.opacity = 1.0;
                this.opacityDecay = Math.random() * 0.015 + 0.02;
            } else {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = (Math.random() * 1.8 + 0.5);
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 + 0.2;
                this.opacity = Math.random() * 0.6 + 0.2;
                this.opacityDecay = 0;
            }
            
            this.color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
            this.wobble = Math.random() * Math.PI * 2;

            // Types: star, sparkle, heart, firefly, balloon, confetti, butterfly, flower, rose
            const rand = Math.random();
            if (isTrail) {
                if (rand < 0.5) this.type = 'star';
                else this.type = 'sparkle';
            } else {
                if (rand < 0.18) {
                    this.type = 'star';
                } else if (rand < 0.36) {
                    this.type = 'sparkle';
                } else if (rand < 0.48) {
                    this.type = 'heart';
                } else if (rand < 0.60) {
                    this.type = 'firefly';
                    this.speedX = Math.random() * 0.5 - 0.25;
                    this.speedY = Math.random() * 0.5 - 0.25;
                } else if (rand < 0.70) {
                    this.type = 'balloon';
                    this.size = (Math.random() * 3.5 + 4.5);
                    this.speedY = Math.random() * 0.3 + 0.35;
                } else if (rand < 0.80) {
                    this.type = 'confetti';
                    this.size = (Math.random() * 2.0 + 2.0);
                    this.speedY = Math.random() * 0.5 + 0.4;
                } else if (rand < 0.88) {
                    this.type = 'butterfly';
                    this.size = (Math.random() * 2.5 + 3.0);
                    this.speedY = Math.random() * 0.25 + 0.25;
                } else if (rand < 0.94) {
                    this.type = 'flower';
                    this.size = (Math.random() * 2.0 + 3.5);
                } else {
                    this.type = 'rose';
                    this.size = (Math.random() * 2.0 + 3.5);
                }
            }
        }

        update() {
            this.rotationAngle += this.rotationSpeed;
            if (this.isTrail) {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= this.opacityDecay;
            } else {
                this.wobble += this.wobbleFreq;
                
                if (this.type === 'firefly') {
                    this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmp;
                    this.y += this.speedY + Math.cos(this.wobble) * this.wobbleAmp;
                    this.opacity = Math.sin(this.wobble) * 0.35 + 0.5; // Firefly flicker
                } else if (this.type === 'star') {
                    this.y += this.speedY;
                    this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmp;
                    this.opacity = Math.sin(this.wobble * 2.2) * 0.25 + 0.6; // Twinkle flicker
                } else if (this.type === 'heart' || this.type === 'balloon' || this.type === 'butterfly') {
                    this.y -= this.speedY * 0.7;
                    this.x += Math.sin(this.wobble) * this.wobbleAmp;
                } else {
                    this.y += this.speedY;
                    this.x += this.speedX + Math.sin(this.wobble) * this.wobbleAmp;
                }

                if (this.y > canvas.height + 25 || this.y < -25 || this.x > canvas.width + 25 || this.x < -25) {
                    const goesUp = (this.type === 'heart' || this.type === 'balloon' || this.type === 'butterfly');
                    this.y = goesUp ? canvas.height + 20 : -20;
                    this.x = Math.random() * canvas.width;
                    this.opacity = Math.random() * 0.6 + 0.2;
                }

                if (mouse.x !== null && mouse.y !== null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        let force = (mouse.radius - distance) / mouse.radius;
                        this.x += dx * force * 0.02;
                        this.y += dy * force * 0.02;
                    }
                }
            }
        }

        draw() {
            if (this.opacity <= 0) return;
            
            const size = this.size * this.scaleScale;
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = (this.type === 'star' || this.type === 'heart') ? 16 : 10;
            ctx.shadowColor = this.color;

            if (this.type === 'star') {
                // Drop shadow radial glow behind stars
                let glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2.8);
                glowGrad.addColorStop(0, this.color);
                glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(this.x, this.y, size * 2.8, 0, Math.PI * 2);
                ctx.fill();

                // Reset fillStyle to main color and draw star body
                ctx.fillStyle = this.color;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotationAngle);
                const r = size * 2.8;
                ctx.beginPath();
                ctx.moveTo(0, -r);
                ctx.quadraticCurveTo(0, 0, r, 0);
                ctx.quadraticCurveTo(0, 0, 0, r);
                ctx.quadraticCurveTo(0, 0, -r, 0);
                ctx.quadraticCurveTo(0, 0, 0, -r);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (this.type === 'heart') {
                // Drop shadow radial glow behind hearts
                let glowGrad = ctx.createRadialGradient(this.x, this.y + size * 1.5, 0, this.x, this.y + size * 1.5, size * 4);
                glowGrad.addColorStop(0, 'rgba(224, 168, 153, 0.45)');
                glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(this.x, this.y + size * 1.5, size * 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = this.color;
                const w = size * 3.5;
                const h = w;
                ctx.beginPath();
                let topCurveHeight = h * 0.3;
                ctx.moveTo(this.x, this.y + topCurveHeight);
                ctx.bezierCurveTo(
                    this.x - w / 2, this.y - topCurveHeight / 2,
                    this.x - w / 2, this.y + (h + topCurveHeight) / 2,
                    this.x, this.y + h
                );
                ctx.bezierCurveTo(
                    this.x + w / 2, this.y + (h + topCurveHeight) / 2,
                    this.x + w / 2, this.y - topCurveHeight / 2,
                    this.x, this.y + topCurveHeight
                );
                ctx.closePath();
                ctx.fill();
            } else if (this.type === 'firefly') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, size * 1.4, 0, Math.PI * 2);
                ctx.fillStyle = '#fff9e6';
                ctx.shadowColor = '#d4af37';
                ctx.shadowBlur = 18;
                ctx.fill();
            } else if (this.type === 'balloon') {
                // Balloon body
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, size * 1.8, size * 2.3, this.rotationAngle * 0.2, 0, Math.PI * 2);
                ctx.fill();
                // Balloon knot
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + size * 2.3);
                ctx.lineTo(this.x - 3, this.y + size * 2.3 + 3);
                ctx.lineTo(this.x + 3, this.y + size * 2.3 + 3);
                ctx.closePath();
                ctx.fill();
                // Balloon string
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + size * 2.3 + 3);
                ctx.quadraticCurveTo(this.x + Math.sin(this.wobble) * 4, this.y + size * 2.3 + 12, this.x, this.y + size * 2.3 + 22);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (this.type === 'confetti') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.wobble + this.rotationAngle);
                ctx.fillRect(-size, -size * 1.5, size * 2, size * 3);
                ctx.restore();
            } else if (this.type === 'butterfly') {
                const flap = Math.sin(this.wobble * 3.5);
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotationAngle * 0.3);
                // Wings right
                ctx.beginPath();
                ctx.ellipse(5, -2, size * 1.2 * Math.abs(flap), size * 1.6, Math.PI/6, 0, Math.PI * 2);
                ctx.ellipse(3, 3, size * 0.8 * Math.abs(flap), size * 1.1, -Math.PI/6, 0, Math.PI * 2);
                ctx.fill();
                // Wings left
                ctx.beginPath();
                ctx.ellipse(-5, -2, size * 1.2 * Math.abs(flap), size * 1.6, -Math.PI/6, 0, Math.PI * 2);
                ctx.ellipse(-3, 3, size * 0.8 * Math.abs(flap), size * 1.1, Math.PI/6, 0, Math.PI * 2);
                ctx.fill();
                // Antennas
                ctx.beginPath();
                ctx.moveTo(-1, -size * 1.5);
                ctx.quadraticCurveTo(-3, -size * 2.2, -4, -size * 2.0);
                ctx.moveTo(1, -size * 1.5);
                ctx.quadraticCurveTo(3, -size * 2.2, 4, -size * 2.0);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                // Body
                ctx.beginPath();
                ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.restore();
            } else if (this.type === 'flower') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.wobble * 0.6 + this.rotationAngle);
                for (let i = 0; i < 5; i++) {
                    ctx.rotate((Math.PI * 2) / 5);
                    ctx.beginPath();
                    ctx.ellipse(0, -size * 1.3, size * 0.75, size * 1.1, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.restore();
            } else if (this.type === 'rose') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.wobble * 0.3 + this.rotationAngle);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1.0;
                // Outer circle border
                ctx.beginPath();
                ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
                ctx.stroke();
                // Rose swirls
                ctx.beginPath();
                for (let theta = 0; theta < Math.PI * 3.5; theta += 0.15) {
                    let r = (theta / (Math.PI * 3.5)) * size * 1.3;
                    let rx = Math.cos(theta) * r;
                    let ry = Math.sin(theta) * r;
                    if (theta === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    function initParticles() {
        const isMobile = window.innerWidth < 768;
        const maxParticles = isMobile ? 55 : 130;
        const amount = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 11000));
        particles = [];
        for (let i = 0; i < amount; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();

    function easeMouseGlow() {
        if (!mouseGlow) return;
        if (mouse.x === null || mouse.y === null) {
            mouseGlow.style.opacity = 0;
        } else {
            mouseGlow.style.opacity = 1;
            let dx = mouse.x - glowX;
            let dy = mouse.y - glowY;
            glowX += dx * 0.08;
            glowY += dy * 0.08;
            mouseGlow.style.left = `${glowX}px`;
            mouseGlow.style.top = `${glowY}px`;
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].isTrail && particles[i].opacity <= 0) {
                particles.splice(i, 1);
            } else {
                particles[i].draw();
            }
        }
        
        if (confettiParticles.length > 0) {
            updateConfetti();
        }

        easeMouseGlow();

        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --- Welcome Screen Logic ---
    enterBtn.addEventListener('click', () => {
        initAudioContext();
        startMusic();
        playChimeSound();
        
        introOverlay.classList.add('fade-out');
        setTimeout(() => {
            introOverlay.style.display = 'none';
        }, 1000);

        // Unlock cursor trails and animations
        isCelebrationUnlocked = true;

        // Start background decorative balloons
        startDecorativeBalloons();
    });

    // --- Countdown Timer Setup ---
    function setupCountdown() {
        // Set target date to July 8, 2026 local time (Note: 6 is July)
        const targetDate = new Date(2026, 6, 8, 0, 0, 0).getTime();

        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minsEl = document.getElementById('minutes');
        const secsEl = document.getElementById('seconds');
        
        const countdownContainer = document.getElementById('countdown-container');
        const countdownGrid = document.getElementById('countdown');
        const countdownLabel = document.getElementById('countdown-label');
        const countdownFinished = document.getElementById('countdown-finished');
        
        let timerHasEnded = false;

        function updateDigitElement(el, newValue) {
            if (!el) return;
            if (el.textContent !== newValue) {
                el.classList.add('digit-change-anim');
                setTimeout(() => {
                    el.textContent = newValue;
                }, 150);
                setTimeout(() => {
                    el.classList.remove('digit-change-anim');
                }, 300);
            }
        }

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                if (!timerHasEnded) {
                    timerHasEnded = true;
                    
                    // Animate transition: fade out numbers/labels, then hide them and show text banner
                    countdownGrid.classList.add('fade-out');
                    countdownLabel.classList.add('fade-out');
                    
                    setTimeout(() => {
                        countdownGrid.classList.add('hidden');
                        countdownLabel.classList.add('hidden');
                        
                        countdownFinished.classList.remove('hidden');
                        setTimeout(() => {
                            countdownFinished.classList.add('show');
                            if (countdownContainer) {
                                countdownContainer.classList.add('glow-flash-active');
                            }
                        }, 50);
                    }, 500);

                    // Play celebration sound and trigger beautiful fireworks if already unlocked
                    if (isCelebrationUnlocked) {
                        playChimeSound();
                        triggerFireworkShow(12);
                    }
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            updateDigitElement(daysEl, String(days).padStart(2, '0'));
            updateDigitElement(hoursEl, String(hours).padStart(2, '0'));
            updateDigitElement(minsEl, String(minutes).padStart(2, '0'));
            updateDigitElement(secsEl, String(seconds).padStart(2, '0'));
        }

        updateCountdown();
        const intervalId = setInterval(() => {
            updateCountdown();
            if (timerHasEnded) {
                clearInterval(intervalId);
            }
        }, 1000);
    }
    setupCountdown();

    // --- Interactive Glass Birthday Card Logic ---
    let typingTimer = null;
    let typingActive = false;

    if (glassCard) {
        glassCard.addEventListener('click', () => {
            const isOpen = glassCard.classList.toggle('open');
            playChimeSound();
            
            if (isOpen) {
                // Spawn hearts drifting up from inside the card
                spawnCardHearts(glassCard);
                // Trigger dynamic handwritten typewriter effect
                startLetterTypewriter();
                // Trigger mini firework show in the background
                triggerFireworkShow(4);
            } else {
                cancelLetterTypewriter();
            }
        });
    }

    function startLetterTypewriter() {
        const target = document.getElementById('typewriter-text');
        const hiddenSource = document.getElementById('hidden-letter-text');

        if (!target || !hiddenSource) return;

        cancelLetterTypewriter();
        target.innerHTML = '';
        typingActive = true;

        // ── Detect active language ───────────────────────────────────────────
        const isArabic = document.documentElement.getAttribute('lang') === 'ar';

        // ── Set container direction explicitly (not inherited) ────────────────
        // This is critical: some typewriter implementations break under RTL
        // because the caret's insertBefore logic assumes LTR DOM ordering.
        // We set direction directly on the container so it never relies on
        // a parent's dir attribute that may change mid-animation.
        target.style.direction  = isArabic ? 'rtl' : 'ltr';
        target.style.textAlign  = isArabic ? 'right' : '';
        target.style.unicodeBidi = 'embed';

        // ── Build source node list ────────────────────────────────────────────
        // For Arabic we construct a virtual list of {tagName, className, text}
        // objects rather than reading from the hidden English DOM source.
        let sourceElements;

        if (isArabic) {
            // Read LETTER_AR from the i18n IIFE's closure via a global bridge
            // (set by applyLanguage — falls back to hard-coded strings here)
            const ar = window._LETTER_AR || {
                salutation : 'زوها العزيزة،',
                para1      : 'في هذا اليوم الجميل، عيد ميلادك الحادي والعشرون، نريد أن نحتفي بكل ما يجعلك مميَّزة بشكل لا يُوصف. أنت مصدر بهجة دائمة وقوة وإلهام. ضحكتك معدية، وطيبتك لا حدود لها، ووجودك يجعل العالم أكثر إشراقًا وسعادة.',
                para2      : 'هذه البطاقة هي تحيَّة صغيرة لكِ — تحمل بعض ذكرياتنا المفضَّلة وكلمات الحب، ومفاجأة صغيرة تنتظرك. عسى العام القادم يملؤه فرص لا نهاية لها ومحبة عميقة وتحقيق كل أحلامك.',
                signature  : 'مع كل محبتنا،',
                names      : 'أصدقاؤك وعائلتك',
            };
            sourceElements = [
                { tagName: 'H4', className: 'handwritten-title',           text: ar.salutation },
                { tagName: 'P',  className: 'handwritten-paragraph',       text: ar.para1 },
                { tagName: 'P',  className: 'handwritten-paragraph',       text: ar.para2 },
                { tagName: 'P',  className: 'handwritten-signature',       text: ar.signature },
                { tagName: 'P',  className: 'handwritten-signature-names', text: ar.names },
            ];
        } else {
            sourceElements = Array.from(hiddenSource.children).map(el => ({
                tagName   : el.tagName,
                className : el.className,
                text      : el.textContent.trim(),
            }));
        }

        let elementIndex = 0;
        let charIndex    = 0;
        let currentElement = null;

        const caret = document.createElement('span');
        caret.className = 'typewriter-caret';

        // ── Punctuation that triggers a long pause ────────────────────────────
        // Includes ASCII set + Arabic equivalents:
        //   ، Arabic comma   ؟ Arabic question mark   ؛ Arabic semicolon
        //   — em-dash        … ellipsis
        const LONG_PAUSE_CHARS = new Set(['.', ',', '!', '?', '،', '؟', '؛', '—', '…']);

        function typeNext() {
            if (!typingActive || !glassCard.classList.contains('open')) {
                cancelLetterTypewriter();
                return;
            }

            if (elementIndex >= sourceElements.length) {
                typingActive = false;
                return;
            }

            const sourceDef = sourceElements[elementIndex];
            const fullText  = sourceDef.text;

            // Create the output element on first character of each block
            if (charIndex === 0) {
                currentElement = document.createElement(sourceDef.tagName);
                currentElement.className = sourceDef.className;
                // Each block element also gets explicit RTL so the caret
                // appears on the left (visual right) in Arabic
                if (isArabic) {
                    currentElement.style.direction  = 'rtl';
                    currentElement.style.textAlign  = 'right';
                    currentElement.style.unicodeBidi = 'embed';
                }
                target.appendChild(currentElement);
                currentElement.appendChild(caret);
            }

            if (fullText.length > 0 && charIndex < fullText.length) {
                const char = fullText[charIndex];

                // ── RTL-safe character insertion ──────────────────────────────
                // LTR: insert BEFORE the caret so new chars appear to the left of it
                // RTL: insert BEFORE the caret as well — but since the element is
                //      dir=rtl, the caret is visually at the LEFT end, and the new
                //      character appears to its right (i.e., at the visual leading
                //      edge of the RTL text). This keeps the caret at the "end"
                //      of the growing text in both directions.
                currentElement.insertBefore(document.createTextNode(char), caret);
                charIndex++;

                // Auto-scroll the letter container to follow typing
                const contentContainer = target.closest('.letter-paper-content');
                if (contentContainer) {
                    contentContainer.scrollTop = contentContainer.scrollHeight;
                }

                const delay = LONG_PAUSE_CHARS.has(char) ? 320 : 35;
                typingTimer = setTimeout(typeNext, delay);

            } else {
                // Finished this block — move caret to next element
                caret.remove();
                elementIndex++;
                charIndex = 0;

                if (elementIndex < sourceElements.length) {
                    // Longer pause between paragraphs
                    typingTimer = setTimeout(typeNext, 400);
                } else {
                    typingActive = false;
                }
            }
        }

        typingTimer = setTimeout(typeNext, 850);
    }

    function cancelLetterTypewriter() {
        typingActive = false;
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        const target = document.getElementById('typewriter-text');
        if (target) {
            target.innerHTML = '';
            // Reset explicit direction styles on cancel/restart
            target.style.direction   = '';
            target.style.textAlign   = '';
            target.style.unicodeBidi = '';
        }
    }

    // Global bridge so the i18n IIFE can restart the typewriter
    // (needed because startLetterTypewriter lives inside a closure)
    window._restartTypewriter = function () {
        cancelLetterTypewriter();
        // Small delay so cancelLetterTypewriter finishes clearing the DOM
        // before startLetterTypewriter reads the (now-updated) html[lang]
        setTimeout(startLetterTypewriter, 120);
    };

    /* ========================================================================
       Voice Narration Engine — SpeechSynthesis API
       Only starts on explicit user gesture. Highlights words as spoken.
       Falls back gracefully if no suitable voice is available.
    ======================================================================== */
    (function initNarration() {

        if (!('speechSynthesis' in window)) return; // API not supported

        const synth       = window.speechSynthesis;
        const playBtn     = document.getElementById('narration-play');
        const stopBtn     = document.getElementById('narration-stop');
        const statusEl    = document.getElementById('narration-status');
        const playIcon    = document.getElementById('narr-play-icon');
        const pauseIcon   = document.getElementById('narr-pause-icon');
        const labelEl     = document.getElementById('narration-label');

        if (!playBtn || !stopBtn) return;

        let utterance   = null;
        let isPlaying   = false;
        let isPaused    = false;
        let voiceList   = [];

        // ── Collect voices (may fire async on some browsers) ─────────────────
        function loadVoices() {
            voiceList = synth.getVoices();
        }
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }

        // ── Pick the best voice for a given lang code ─────────────────────────
        // Priority: exact locale match → language match → any voice
        function pickVoice(langCode) {
            const lang2 = langCode.split('-')[0].toLowerCase(); // e.g. "ar"
            // 1. Exact locale
            let v = voiceList.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
            // 2. Prefix match (ar-SA, ar-EG, ar-XB …)
            if (!v) v = voiceList.find(v => v.lang.toLowerCase().startsWith(lang2));
            // 3. Default
            if (!v) v = voiceList.find(v => v.default) || voiceList[0] || null;
            return v;
        }

        // ── Build the full letter text to narrate ─────────────────────────────
        function getLetterText(lang) {
            if (lang === 'ar') {
                const ar = window._LETTER_AR || {};
                return [
                    ar.salutation || '',
                    ar.para1      || '',
                    ar.para2      || '',
                    ar.signature  || '',
                    ar.names      || '',
                ].join(' ');
            }
            // English — read from the hidden DOM source
            const src = document.getElementById('hidden-letter-text');
            return src ? src.textContent.trim().replace(/\s+/g, ' ') : '';
        }

        // ── Sentence highlighting ─────────────────────────────────────────────
        // We pre-wrap each word in the #typewriter-text into spans so
        // onboundary can find and highlight them by character offset.
        function wrapWordsForHighlight() {
            const tw = document.getElementById('typewriter-text');
            if (!tw) return;
            // Walk all text nodes and wrap each word
            function wrapNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    // Split preserving spaces
                    const parts = node.textContent.split(/(\s+)/);
                    parts.forEach(part => {
                        if (/\S/.test(part)) {
                            const span = document.createElement('span');
                            span.className = 'narr-word';
                            span.textContent = part;
                            frag.appendChild(span);
                        } else {
                            frag.appendChild(document.createTextNode(part));
                        }
                    });
                    node.parentNode.replaceChild(frag, node);
                } else if (node.nodeType === Node.ELEMENT_NODE
                    && !node.classList.contains('typewriter-caret')) {
                    Array.from(node.childNodes).forEach(wrapNode);
                }
            }
            Array.from(tw.childNodes).forEach(wrapNode);
        }

        // Build a flat word-offset map: [{start, end, el}]
        function buildOffsetMap() {
            const tw = document.getElementById('typewriter-text');
            if (!tw) return [];
            const words = Array.from(tw.querySelectorAll('.narr-word'));
            const map = [];
            let cursor = 0;
            words.forEach(el => {
                const len = el.textContent.length;
                map.push({ start: cursor, end: cursor + len, el });
                cursor += len + 1; // +1 for the space between words
            });
            return map;
        }

        let offsetMap     = [];
        let lastHighlight = null;

        function highlightAt(charIndex) {
            // Find the word span that contains charIndex
            const match = offsetMap.find(
                w => charIndex >= w.start && charIndex < w.end
            );
            if (match && match.el !== lastHighlight) {
                if (lastHighlight) lastHighlight.classList.remove('narration-highlight');
                match.el.classList.add('narration-highlight');
                lastHighlight = match.el;
                // Scroll the highlighted word into view inside the letter
                match.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }

        function clearHighlight() {
            if (lastHighlight) {
                lastHighlight.classList.remove('narration-highlight');
                lastHighlight = null;
            }
        }

        // ── UI helpers ────────────────────────────────────────────────────────
        function setStatus(key) {
            if (!statusEl) return;
            const lang = document.documentElement.getAttribute('lang') || 'en';
            const map = {
                reading  : { en: 'Reading…',   ar: 'يقرأ…'         },
                paused   : { en: 'Paused',      ar: 'متوقف مؤقتًا'  },
                stopped  : { en: '',            ar: ''               },
                novoice  : { en: 'No Arabic voice found on this device — using default', ar: 'لا يوجد صوت عربي على هذا الجهاز — يُستخدم الصوت الافتراضي' },
            };
            statusEl.textContent = (map[key] || {})[lang] || '';
        }

        function setPlayingState(playing, paused) {
            isPlaying = playing;
            isPaused  = paused;
            playIcon.classList.toggle('hidden',  playing && !paused);
            pauseIcon.classList.toggle('hidden', !(playing && !paused));
            stopBtn.disabled = !playing;
            if (!playing) setStatus('stopped');
        }

        // ── Core speak ────────────────────────────────────────────────────────
        function startNarration() {
            synth.cancel(); // clear any queued speech

            const lang    = document.documentElement.getAttribute('lang') || 'en';
            const text    = getLetterText(lang);
            if (!text) return;

            // Wrap words for highlight (typewriter may have finished typing)
            wrapWordsForHighlight();
            offsetMap = buildOffsetMap();

            // Pick voice
            const langCode   = lang === 'ar' ? 'ar-SA' : 'en-US';
            const altCode    = lang === 'ar' ? 'ar-EG' : 'en-GB';
            let voice        = pickVoice(langCode) || pickVoice(altCode);
            const usingFallback = (lang === 'ar' && voice && !voice.lang.toLowerCase().startsWith('ar'));
            if (lang === 'ar' && !voice) {
                setStatus('novoice');
                return; // Can't narrate without any voice
            }
            if (usingFallback) setStatus('novoice');

            utterance      = new SpeechSynthesisUtterance(text);
            utterance.lang  = langCode;
            if (voice) utterance.voice = voice;
            utterance.rate  = lang === 'ar' ? 0.88 : 0.92; // Slightly slower for Arabic
            utterance.pitch = 1.0;

            // Highlight word on boundary events
            utterance.onboundary = function (e) {
                if (e.name === 'word') highlightAt(e.charIndex);
            };

            utterance.onstart = function () {
                setPlayingState(true, false);
                setStatus('reading');
            };

            utterance.onend = function () {
                clearHighlight();
                setPlayingState(false, false);
            };

            utterance.onerror = function (e) {
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.warn('SpeechSynthesis error:', e.error);
                }
                clearHighlight();
                setPlayingState(false, false);
            };

            synth.speak(utterance);
        }

        // ── Button handlers ───────────────────────────────────────────────────
        playBtn.addEventListener('click', function () {
            if (!isPlaying) {
                // Fresh start (also acts as resume if browser supports it)
                if (isPaused && synth.paused) {
                    synth.resume();
                    setPlayingState(true, false);
                    setStatus('reading');
                } else {
                    startNarration();
                }
            } else {
                // Pause
                synth.pause();
                setPlayingState(true, true);
                setStatus('paused');
            }
        });

        stopBtn.addEventListener('click', function () {
            synth.cancel();
            clearHighlight();
            setPlayingState(false, false);
        });

        // Stop narration when card closes
        if (glassCard) {
            glassCard.addEventListener('click', function () {
                if (!glassCard.classList.contains('open')) {
                    synth.cancel();
                    clearHighlight();
                    setPlayingState(false, false);
                }
            });
        }

        // Stop narration when language toggles (new language = fresh start needed)
        window._stopNarration = function () {
            synth.cancel();
            clearHighlight();
            setPlayingState(false, false);
            if (typeof window._stopPreRecordedVoiceover === 'function') {
                window._stopPreRecordedVoiceover();
            }
        };

        // Expose for debugging
        window._narration = { startNarration, pickVoice, loadVoices };

    })(); // end initNarration

    function spawnCardHearts(parent) {
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                if (!glassCard.classList.contains('open')) return;
                
                const heart = document.createElement('div');
                heart.className = 'card-heart';
                
                const size = Math.random() * 8 + 12; // 12px to 20px
                heart.style.width = `${size}px`;
                heart.style.height = `${size}px`;
                
                const startX = Math.random() * 200 + 70; // Center offset in card
                heart.style.left = `${startX}px`;
                heart.style.bottom = `40px`;
                
                const colors = ['#ffcad4', '#fcd5ce', '#e0a899', '#b57c6d', '#e29578'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                heart.style.setProperty('--heart-color', color);
                
                heart.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="${color}">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                `;
                
                parent.appendChild(heart);
                
                let floatSpeed = Math.random() * 1.5 + 1.0;
                let wobble = Math.random() * 2 + 1;
                let wobbleSpeed = Math.random() * 0.05 + 0.01;
                let angle = 0;
                let currentY = 40;
                let opacity = 1.0;
                
                function heartLoop() {
                    if (opacity <= 0 || !glassCard.classList.contains('open')) {
                        heart.remove();
                        return;
                    }
                    
                    currentY += floatSpeed;
                    angle += wobbleSpeed;
                    opacity -= 0.008;
                    
                    const xOffset = Math.sin(angle) * wobble;
                    heart.style.transform = `translate(${xOffset}px, ${-currentY}px) scale(${opacity})`;
                    heart.style.opacity = opacity;
                    
                    requestAnimationFrame(heartLoop);
                }
                requestAnimationFrame(heartLoop);
                
            }, i * 80);
        }
    }

    // --- Premium Grid Photo Gallery Setup ---
    let slideshowInterval = null;
    let isSlideshowPlaying = false;

    function generateGallery() {
        galleryGrid.innerHTML = '';
        
        // Staggered intersection observer for smooth entry on scroll
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };
        
        let intersectCount = 0;
        let intersectTimeout = null;
        const galleryObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    target.style.transitionDelay = `${intersectCount * 40}ms`;
                    target.classList.add('show');
                    intersectCount++;
                    observer.unobserve(target);
                    
                    if (intersectTimeout) clearTimeout(intersectTimeout);
                    intersectTimeout = setTimeout(() => {
                        intersectCount = 0;
                    }, 80); // reset offset counter after batch load completes
                }
            });
        }, observerOptions);

        for (let i = 1; i <= CONFIG.totalPhotos; i++) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const caption = CONFIG.captions[(i - 1) % CONFIG.captions.length];
            
            item.innerHTML = `
                <img src="assets/images/photo_${i}.jpeg" alt="${caption}" loading="lazy" width="400" height="400">
                <div class="gallery-overlay">
                    <p class="gallery-overlay-title">${caption}</p>
                </div>
            `;
            
            // Click to view in Lightbox
            item.addEventListener('click', () => {
                openLightbox(i - 1);
            });
            
            galleryGrid.appendChild(item);
            galleryObserver.observe(item);
        }
    }
    
    generateGallery();

    // --- Lightbox Functionality (Counter & Auto Slideshow) ---
    function updateLightboxImage(index) {
        currentPhotoIndex = index;
        const caption = CONFIG.captions[index % CONFIG.captions.length];
        
        if (lightbox.classList.contains('active')) {
            lightboxImg.classList.add('fade-out');
            
            setTimeout(() => {
                lightboxImg.src = `assets/images/photo_${index + 1}.jpeg`;
                lightboxCaption.textContent = caption;
                if (lightboxCounter) {
                    lightboxCounter.textContent = `${index + 1} / ${CONFIG.totalPhotos}`;
                }
                
                lightboxImg.onload = () => {
                    lightboxImg.classList.remove('fade-out');
                    lightboxImg.classList.remove('ken-burns');
                    void lightboxImg.offsetWidth; // trigger reflow
                    if (isSlideshowPlaying) {
                        lightboxImg.classList.add('ken-burns');
                    }
                };
            }, 280);
        } else {
            lightboxImg.src = `assets/images/photo_${index + 1}.jpeg`;
            lightboxCaption.textContent = caption;
            if (lightboxCounter) {
                lightboxCounter.textContent = `${index + 1} / ${CONFIG.totalPhotos}`;
            }
            
            lightboxImg.onload = () => {
                lightboxImg.classList.remove('fade-out');
                lightboxImg.classList.remove('ken-burns');
                void lightboxImg.offsetWidth;
                if (isSlideshowPlaying) {
                    lightboxImg.classList.add('ken-burns');
                }
            };
        }
    }

    function openLightbox(index) {
        updateLightboxImage(index);
        
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    function closeLightbox() {
        stopSlideshow();
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lightboxImg.classList.remove('ken-burns', 'fade-out');
    }

    function navigateLightbox(dir) {
        const nextIndex = (currentPhotoIndex + dir + CONFIG.totalPhotos) % CONFIG.totalPhotos;
        updateLightboxImage(nextIndex);
    }

    // Auto Slideshow Functions
    function startSlideshow() {
        isSlideshowPlaying = true;
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        lightboxImg.classList.add('ken-burns');
        
        slideshowInterval = setInterval(() => {
            navigateLightbox(1);
        }, 3000);
    }

    function stopSlideshow() {
        isSlideshowPlaying = false;
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        lightboxImg.classList.remove('ken-burns');
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }

    function toggleSlideshow() {
        if (isSlideshowPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    }

    lightboxClose.addEventListener('click', closeLightbox);
    
    lightboxPrev.addEventListener('click', () => {
        stopSlideshow(); // Stop auto slide on manual navigation
        navigateLightbox(-1);
    });
    
    lightboxNext.addEventListener('click', () => {
        stopSlideshow(); // Stop auto slide on manual navigation
        navigateLightbox(1);
    });

    if (lightboxPlay) {
        lightboxPlay.addEventListener('click', toggleSlideshow);
    }
    
    // Close on overlay clicking
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard Accessibility
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
            stopSlideshow();
            navigateLightbox(-1);
        }
        if (e.key === 'ArrowRight') {
            stopSlideshow();
            navigateLightbox(1);
        }
        if (e.key === ' ') {
            e.preventDefault(); // Prevent page scroll
            toggleSlideshow();
        }
    });

    // --- Wishes Board Guestbook Setup ---
    const initialWishes = [];

    function loadWishes() {
        // One-time clear of legacy mock wishes to start fresh
        if (localStorage.getItem(wishesKey + '_fresh_v1') !== 'true') {
            localStorage.removeItem(wishesKey);
            localStorage.setItem(wishesKey + '_fresh_v1', 'true');
        }

        let stored = localStorage.getItem(wishesKey);
        let wishes = stored ? JSON.parse(stored) : [...initialWishes];
        
        wishesBoard.innerHTML = '';
        wishes.forEach(wish => renderWishCard(wish));
    }

    function renderWishCard(wish) {
        const card = document.createElement('div');
        card.className = 'wish-card';
        
        // Random tilt for physical sticky note aesthetic
        const tilt = Math.random() * 6 - 3;
        card.style.transform = `rotate(${tilt}deg)`;
        
        card.innerHTML = `
            <p class="wish-card-text">${escapeHTML(wish.message)}</p>
            <p class="wish-card-author">— ${escapeHTML(wish.name)}</p>
        `;
        
        // Insert at the top of the wishes wall
        wishesBoard.insertBefore(card, wishesBoard.firstChild);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('wish-name');
        const msgInput = document.getElementById('wish-message');
        
        const newWish = {
            name: nameInput.value.trim(),
            message: msgInput.value.trim()
        };

        if (!newWish.name || !newWish.message) return;

        // Save
        let stored = localStorage.getItem(wishesKey);
        let wishes = stored ? JSON.parse(stored) : [...initialWishes];
        wishes.push(newWish);
        localStorage.setItem(wishesKey, JSON.stringify(wishes));

        // Render card with sound
        renderWishCard(newWish);
        playChimeSound();

        // Clear Form and trigger floating animation on button
        nameInput.value = '';
        msgInput.value = '';
        
        // Visual feedback
        const btn = wishForm.querySelector('button');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
    });

    loadWishes();

    // --- Gift Box & Balloon Engine ---
    let giftBoxOpened = false;

    giftBoxTrigger.addEventListener('click', () => {
        if (giftBoxOpened) return;
        giftBoxOpened = true;

        // Open animation trigger
        giftBox.classList.add('open');
        playChimeSound();

        // Trigger particle confetti & reveal surprise voucher
        setTimeout(() => {
            triggerConfettiExplosion();
            surpriseCard.classList.remove('hidden');
            
            // Smooth scroll into focus
            setTimeout(() => {
                surpriseCard.classList.add('show');
                surpriseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
            // Release helium balloons
            releaseBalloons(20);
            
            // Trigger beautiful background fireworks
            triggerFireworkShow(8);
        }, 600);
    });

    // Confetti particles state
    class ConfettiPiece {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.sizeWidth = Math.random() * 8 + 4;
            this.sizeHeight = Math.random() * 12 + 6;
            this.speedX = Math.random() * 10 - 5;
            this.speedY = Math.random() * -12 - 5; // Launch upward
            this.gravity = 0.35;
            this.color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 10 - 5;
            this.opacity = 1;
        }

        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            this.opacity -= 0.008;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.sizeWidth/2, -this.sizeHeight/2, this.sizeWidth, this.sizeHeight);
            ctx.restore();
        }
    }

    class ClickRipple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 2;
            this.maxRadius = Math.random() * 15 + 35; // 35px - 50px
            this.speed = 2.0;
            this.opacity = 1.0;
            this.color = '#fcd5ce'; // matching rose-gold light accent
        }

        update() {
            this.radius += this.speed;
            this.opacity -= 0.022; // fade out over ~45 frames
        }

        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.0;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.stroke();
            ctx.restore();
        }
    }

    class ClickSparkle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2.5 + 1.2;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.gravity = 0.08;
            this.opacity = 1.0;
            this.color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
        }

        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.opacity -= 0.025; // fade out
        }

        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    class FireworkRocket {
        constructor(startX, startY, targetX, targetY, color) {
            this.x = startX;
            this.y = startY;
            this.targetX = targetX;
            this.targetY = targetY;
            this.color = color;
            
            this.speed = Math.random() * 3 + 8; // 8 to 11 px per frame
            this.angle = Math.atan2(targetY - startY, targetX - startX);
            this.velocity = {
                x: Math.cos(this.angle) * this.speed,
                y: Math.sin(this.angle) * this.speed
            };
            this.distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
            this.distanceTraveled = 0;
            this.trail = [];
            this.trailLength = 6;
            this.opacity = 1.0;
        }

        update() {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }

            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.distanceTraveled += this.speed;

            if (this.distanceTraveled >= this.distanceToTarget) {
                this.explode();
                this.opacity = 0; // trigger removal
            }
        }

        draw() {
            if (this.opacity <= 0) return;
            
            ctx.save();
            // Draw gradient trail
            for (let i = 0; i < this.trail.length; i++) {
                const pct = i / this.trail.length;
                ctx.globalAlpha = pct * 0.4;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            
            // Draw glowing head
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }

        explode() {
            const count = Math.floor(Math.random() * 15) + 35;
            for (let i = 0; i < count; i++) {
                confettiParticles.push(new FireworkSparkle(this.x, this.y, this.color));
            }
            
            // Audio feedback
            if (Math.random() < 0.4) {
                playChimeSound();
            } else {
                playPopSound();
            }
        }
    }

    class FireworkSparkle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 2.2 + 1.0;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = Math.random() * 4.5 + 1.5;
            this.velocity = {
                x: Math.cos(this.angle) * this.speed,
                y: Math.sin(this.angle) * this.speed
            };
            this.gravity = 0.05;
            this.friction = 0.97;
            this.opacity = 1.0;
            this.decay = Math.random() * 0.015 + 0.012;
        }

        update() {
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
            this.velocity.y += this.gravity;
            
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.opacity -= this.decay;
        }

        draw() {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function triggerFireworkShow(count = 10) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (!isCelebrationUnlocked) return;
                
                const startX = Math.random() * canvas.width;
                const startY = canvas.height + 20;
                
                const targetX = startX + (Math.random() * 200 - 100);
                const targetY = Math.random() * (canvas.height * 0.45) + (canvas.height * 0.1);
                
                const color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
                
                confettiParticles.push(new FireworkRocket(startX, startY, targetX, targetY, color));
            }, i * 350);
        }
    }

    function triggerConfettiExplosion() {
        const giftRect = giftBoxTrigger.getBoundingClientRect();
        const startX = giftRect.left + giftRect.width/2;
        const startY = giftRect.top;

        for (let i = 0; i < 150; i++) {
            confettiParticles.push(new ConfettiPiece(startX, startY));
        }
    }

    function updateConfetti() {
        for (let i = confettiParticles.length - 1; i >= 0; i--) {
            confettiParticles[i].update();
            confettiParticles[i].draw();
            
            // Cleanup faded particles
            if (confettiParticles[i].opacity <= 0) {
                confettiParticles.splice(i, 1);
            }
        }
    }

    // Helium Balloons logic
    function releaseBalloons(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                createBalloon();
            }, i * 200); // Stagger release
        }
    }

    function createBalloon() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        
        const sizeWidth = Math.random() * 20 + 50; // 50px - 70px
        const sizeHeight = sizeWidth * 1.25;
        balloon.style.width = `${sizeWidth}px`;
        balloon.style.height = `${sizeHeight}px`;

        const color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
        balloon.style.backgroundColor = color;
        balloon.style.color = color; // For the string triangle matching via CSS variable mapping
        balloon.style.setProperty('--balloon-color', color);

        // Position at bottom of window
        const startX = Math.random() * (window.innerWidth - 80) + 10;
        balloon.style.left = `${startX}px`;
        balloon.style.bottom = `-150px`;

        // Render string
        const string = document.createElement('div');
        string.className = 'balloon-string';
        balloon.appendChild(string);

        document.body.appendChild(balloon);

        // Animate floating up using physics loop in DOM
        let speed = Math.random() * 2 + 1.5; // Upward speed
        let wobbleRange = Math.random() * 2 + 1;
        let wobbleSpeed = Math.random() * 0.03 + 0.01;
        let angle = Math.random() * 100;
        let currentY = -150;

        function floatLoop() {
            if (!balloon.parentElement) return; // Balloon popped

            currentY += speed;
            angle += wobbleSpeed;
            const tilt = Math.sin(angle) * wobbleRange;
            
            balloon.style.transform = `translateY(${-currentY}px) rotate(${tilt}deg)`;

            // Recycle or delete when float off screen
            if (currentY > window.innerHeight + 300) {
                balloon.remove();
            } else {
                requestAnimationFrame(floatLoop);
            }
        }
        
        requestAnimationFrame(floatLoop);

        // Click to pop event
        const popHandler = () => {
            playPopSound();
            const rect = balloon.getBoundingClientRect();
            createSparkleBurst(rect.left + rect.width/2, rect.top + rect.height/2, color);
            balloon.remove();
        };

        balloon.addEventListener('click', popHandler);
        balloon.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Avoid mouse click trigger duplication on mobile
            popHandler();
        });
    }

    // Balloon pop sparkle splash particles
    function createSparkleBurst(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const size = Math.random() * 3.5 + 1.5;
            const speedX = Math.random() * 8 - 4;
            const speedY = Math.random() * 8 - 4;
            const opacity = 1;
            
            let p = {
                x: x,
                y: y,
                size: size,
                speedX: speedX,
                speedY: speedY,
                opacity: opacity,
                color: color,
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.opacity -= 0.02;
                },
                draw() {
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = this.color;
                    ctx.fill();
                    ctx.restore();
                }
            };
            
            // Inject pop particles into canvas render loop
            confettiParticles.push(p);
        }
    }

    // --- Background Decorative Balloons ---
    function startDecorativeBalloons() {
        // Spawn 4 initial decorative balloons staggered
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                createDecorativeBalloon();
            }, i * 1500);
        }

        // Spawn a background balloon every 5 seconds
        setInterval(() => {
            createDecorativeBalloon();
        }, 5000);
    }

    function createDecorativeBalloon() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon decorative';
        
        const sizeWidth = Math.random() * 20 + 40; // 40px - 60px
        const sizeHeight = sizeWidth * 1.25;
        balloon.style.width = `${sizeWidth}px`;
        balloon.style.height = `${sizeHeight}px`;

        const color = CONFIG.balloonColors[Math.floor(Math.random() * CONFIG.balloonColors.length)];
        balloon.style.backgroundColor = color;
        balloon.style.color = color;
        balloon.style.setProperty('--balloon-color', color);

        // Position at bottom of window
        const startX = Math.random() * (window.innerWidth - 80) + 10;
        balloon.style.left = `${startX}px`;
        balloon.style.bottom = `-150px`;

        // Render string
        const string = document.createElement('div');
        string.className = 'balloon-string';
        balloon.appendChild(string);

        document.body.appendChild(balloon);

        let speed = Math.random() * 1.0 + 0.6; // Decorative balloons drift slowly
        let wobbleRange = Math.random() * 2 + 1;
        let wobbleSpeed = Math.random() * 0.02 + 0.005;
        let angle = Math.random() * 100;
        let currentY = -150;

        function floatLoop() {
            if (!balloon.parentElement) return;

            currentY += speed;
            angle += wobbleSpeed;
            const tilt = Math.sin(angle) * wobbleRange;
            
            balloon.style.transform = `translateY(${-currentY}px) rotate(${tilt}deg)`;

            // Recycle or delete when float off screen
            if (currentY > window.innerHeight + 300) {
                balloon.remove();
            } else {
                requestAnimationFrame(floatLoop);
            }
        }
        
        requestAnimationFrame(floatLoop);
    }

    // --- Friendship Timeline Scroll Observer ---
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
        const timelineObserverOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const timelineObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    observer.unobserve(entry.target);
                }
            });
        }, timelineObserverOptions);

        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
    }

    // --- Appreciation Cards Scroll Observer ---
    const appreciationCards = document.querySelectorAll('.appreciation-card');
    if (appreciationCards.length > 0) {
        const appreciationObserverOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const appreciationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation delays for cards entering together
                    entry.target.style.transitionDelay = `${(index % 3) * 0.15}s`;
                    entry.target.classList.add('show');
                    observer.unobserve(entry.target);
                }
            });
        }, appreciationObserverOptions);

        appreciationCards.forEach(card => {
            appreciationObserver.observe(card);
        });
    }

    // --- Unified Scroll Reveal Intersection Observer ---
    const revealElements = document.querySelectorAll('.reveal-fade, .reveal-slide-up, .reveal-zoom-in, .reveal-rotate-in, .reveal-bounce-in');
    if (revealElements.length > 0) {
        const revealObserverOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.08
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    observer.unobserve(entry.target);
                }
            });
        }, revealObserverOptions);

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    // --- Pre-recorded Arabic Voice-over Scroll Sync Manager ---
    let activeNarrationAudio = null;

    function fadeAudio(audio, targetVolume, duration, onComplete) {
        if (!audio) return;
        if (audio.fadeInterval) {
            clearInterval(audio.fadeInterval);
        }

        const startVolume = audio.volume;
        const diff = targetVolume - startVolume;
        const stepTime = 20; // 50 steps per second (20ms interval)
        const steps = duration / stepTime;
        let currentStep = 0;

        audio.fadeInterval = setInterval(() => {
            currentStep++;
            let nextVolume = startVolume + (diff * (currentStep / steps));
            if (nextVolume < 0) nextVolume = 0;
            if (nextVolume > 1) nextVolume = 1;
            audio.volume = nextVolume;

            if (currentStep >= steps) {
                clearInterval(audio.fadeInterval);
                audio.fadeInterval = null;
                audio.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, stepTime);
    }

    const narrationObserverOptions = {
        root: null,
        rootMargin: '-15% 0px -15% 0px', // trigger closer to the center of view
        threshold: 0.15
    };

    const narrationObserver = new IntersectionObserver((entries) => {
        // Find which audio elements correspond to the section IDs
        const audioMap = {
            'hero': 'narr-hero',
            'card-section': 'narr-letter',
            'timeline-section': 'narr-timeline',
            'gift-section': 'narr-gift'
        };

        // Check if intro is dismissed and language is Arabic
        const isArabic = document.documentElement.getAttribute('lang') === 'ar';
        const introOverlay = document.getElementById('intro-overlay');
        const isUnlocked = introOverlay ? (introOverlay.classList.contains('hidden') || introOverlay.style.display === 'none') : true;

        if (!isArabic || !isUnlocked) {
            // Stop any playing narration if requirements aren't met
            if (activeNarrationAudio) {
                const current = activeNarrationAudio;
                fadeAudio(current, 0, 400, () => {
                    current.pause();
                    current.currentTime = 0;
                });
                activeNarrationAudio = null;
            }
            return;
        }

        entries.forEach(entry => {
            const audioId = audioMap[entry.target.id];
            const targetAudio = document.getElementById(audioId);
            if (!targetAudio) return;

            if (entry.isIntersecting) {
                // Stop any other currently playing track
                if (activeNarrationAudio && activeNarrationAudio !== targetAudio) {
                    const oldAudio = activeNarrationAudio;
                    fadeAudio(oldAudio, 0, 400, () => {
                        oldAudio.pause();
                    });
                }

                activeNarrationAudio = targetAudio;
                targetAudio.muted = isMuted; // inherit global player mute state

                // Fade in from 0
                targetAudio.volume = 0;
                targetAudio.play().then(() => {
                    fadeAudio(targetAudio, 0.85, 400); // fade in to 85% volume
                }).catch(err => {
                    console.log("Failed to play section narration:", err);
                });
            } else {
                // Section left view — fade out and pause if it's the active track
                if (activeNarrationAudio === targetAudio) {
                    fadeAudio(targetAudio, 0, 400, () => {
                        targetAudio.pause();
                        if (activeNarrationAudio === targetAudio) {
                            activeNarrationAudio = null;
                        }
                    });
                }
            }
        });
    }, narrationObserverOptions);

    // Observe the 4 narrative sections
    ['hero', 'card-section', 'timeline-section', 'gift-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) narrationObserver.observe(el);
    });

    // Unified stop pre-recorded voice-over bridge
    window._stopPreRecordedVoiceover = function () {
        if (activeNarrationAudio) {
            const aud = activeNarrationAudio;
            fadeAudio(aud, 0, 300, () => {
                aud.pause();
                aud.currentTime = 0;
            });
            activeNarrationAudio = null;
        }
    };

    // --- Scroll-Linked Parallax Effects (Lerped / Smoothed) ---
    const heroCard = document.getElementById('hero-glass-card');
    const giftBoxContainer = document.getElementById('gift-box-trigger');
    
    let scrolled = window.pageYOffset;
    let currentHeroY = 0;
    let targetHeroY = 0;
    let currentGiftY = 0;
    let targetGiftY = 0;

    window.addEventListener('scroll', () => {
        scrolled = window.pageYOffset;
    }, { passive: true });

    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    function smoothParallaxLoop() {
        targetHeroY = scrolled * 0.15;
        
        if (giftBoxContainer) {
            const rect = giftBoxContainer.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                targetGiftY = (window.innerHeight - rect.top) * 0.08;
            } else {
                targetGiftY = 0;
            }
        }
        
        // Easing interpolation factor (0.08 matches typical 60Hz/120Hz smooth sways)
        currentHeroY = lerp(currentHeroY, targetHeroY, 0.08);
        currentGiftY = lerp(currentGiftY, targetGiftY, 0.08);
        
        // Output styles if differences remain visually detectable (> 0.01px threshold)
        if (heroCard && Math.abs(currentHeroY - targetHeroY) > 0.01) {
            heroCard.style.setProperty('--parallax-y', `${currentHeroY.toFixed(2)}px`);
        }
        if (giftBoxContainer && Math.abs(currentGiftY - targetGiftY) > 0.01) {
            giftBoxContainer.style.setProperty('--parallax-y', `${currentGiftY.toFixed(2)}px`);
        }
        
        requestAnimationFrame(smoothParallaxLoop);
    }
    smoothParallaxLoop();

    // --- Appreciation Cards 3D Tilt Interaction ---
    if (appreciationCards.length > 0) {
        appreciationCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const percentX = (x - centerX) / centerX;
                const percentY = (y - centerY) / centerY;
                
                const rotateX = (-percentY * 7).toFixed(2);
                const rotateY = (percentX * 7).toFixed(2);
                
                card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) rotateX(0deg) rotateY(0deg) scale(1)';
            });
        });
    }

    // --- Window Click Premium Cursor Ripple & Sparkle Effects ---
    window.addEventListener('click', (e) => {
        if (!isCelebrationUnlocked) return;
        
        // Spawn expanding ripple ring
        confettiParticles.push(new ClickRipple(e.clientX, e.clientY));
        
        // Spawn 10 exploding sparkles
        for (let i = 0; i < 10; i++) {
            confettiParticles.push(new ClickSparkle(e.clientX, e.clientY));
        }
    });
});

/* ==========================================================================
   Bilingual Support Engine — English / Arabic (i18n)
   ========================================================================== */

(function () {

    // ── Translation table ─────────────────────────────────────────────────────
    const T = {
        'intro-title':         { en: 'An Invitation to Celebrate',          ar: 'دعوة للاحتفال' },
        'intro-subtitle':      { en: 'A luxury interactive experience designed exclusively for your special day.', ar: 'تجربة تفاعلية فاخرة مصمَّمة حصريًا ليومك المميَّز.' },
        'intro-btn':           { en: 'Unlock the Magic',                     ar: 'افتح السحر' },
        'hero-pretitle':       { en: 'CELEBRATING A MAGICAL SOUL',           ar: 'احتفاءً بروحٍ ساحرة' },
        'hero-title':          { en: 'Happy 21st Birthday',                  ar: 'عيد ميلاد سعيد الحادي والعشرون' },
        'hero-name':           { en: 'Zoha',                                 ar: 'زوها' },
        'hero-tagline':        { en: '"A small surprise made with code ❤️"', ar: '"مفاجأة صغيرة صُنعت بالكود ❤️"' },
        'countdown-label':     { en: 'THE CELEBRATION CONTINUES IN',         ar: 'الاحتفال يستمر خلال' },
        'time-days':           { en: 'Days',                                 ar: 'أيام'   },
        'time-hours':          { en: 'Hours',                                ar: 'ساعات'  },
        'time-mins':           { en: 'Mins',                                 ar: 'دقائق'  },
        'time-secs':           { en: 'Secs',                                 ar: 'ثواني'  },
        'countdown-finished':  { en: 'Happy Birthday Zoha Taiyaba 🎉',       ar: 'عيد ميلاد سعيد زوها طيبة 🎉' },
        'hero-btn-open':       { en: 'Open Surprise',                        ar: 'افتح المفاجأة' },
        'hero-btn-view':       { en: 'View Memories',                        ar: 'استعرض الذكريات' },
        'card-title':          { en: 'A Special Greeting',                   ar: 'تحيَّة خاصة' },
        'card-subtitle':       { en: 'Tap the card below to open and reveal its contents', ar: 'انقر على البطاقة أدناه لفتحها وكشف محتواها' },
        'card-front-title':    { en: 'FOR ZOHA TAIYABA',                     ar: 'إلى زوها طيبة' },
        'card-front-subtitle': { en: 'Tap to Reveal the Wishes',             ar: 'انقر لرؤية الأمنيات' },
        'timeline-title':      { en: 'Our Friendship Story',                 ar: 'قصة صداقتنا' },
        'timeline-subtitle':   { en: 'A journey through our favorite milestones together', ar: 'رحلة عبر أجمل محطاتنا معًا' },
        'tl1-date':   { en: 'The Beginning',          ar: 'البداية' },
        'tl1-title':  { en: 'First Conversation',     ar: 'أول حديث' },
        'tl1-text':   { en: 'A simple hello that started it all. Who would have guessed that a random chat would grow into the most cherished bond in our lives? From shy exchanges to talking for hours about everything and nothing.', ar: 'مجرد مرحبا بسيطة أطلقت كل شيء. من كان يظن أن دردشة عابرة ستتحوَّل إلى أعمق رابطة في حياتنا؟ من تبادل خجول إلى حديث لساعات عن كل شيء ولا شيء.' },
        'tl2-date':   { en: 'Campus Days',            ar: 'أيام الحرم الجامعي' },
        'tl2-title':  { en: 'College Memories',       ar: 'ذكريات الجامعة' },
        'tl2-text':   { en: "Late-night study sessions, endless cups of tea, bunking lectures, and sharing dreams under the campus trees. College wasn't just about the degrees, it was about finding a lifelong companion.", ar: 'جلسات دراسة متأخرة، أكواب شاي لا تنتهي، وغياب عن المحاضرات ومشاركة الأحلام تحت أشجار الحرم. الجامعة لم تكن فقط للدراسة، بل لإيجاد رفيق عمر.' },
        'tl3-date':   { en: 'Lending a Hand',         ar: 'يد العون' },
        'tl3-title':  { en: 'Helping Each Other',     ar: 'نساعد بعضنا' },
        'tl3-text':   { en: 'Through every exam stress, career doubt, and life dilemma, we stood by each other. Helping each other grow, study, prepare, and step confidently into our futures.', ar: 'في كل ضغط امتحانات وتردد مهني وأزمة حياتية، وقفنا جنبًا إلى جنب نتعلَّم ونستعدّ ونمشي بثقة نحو المستقبل.' },
        'tl4-date':   { en: 'Inside Jokes',           ar: 'نكات داخلية' },
        'tl4-title':  { en: 'Funny Moments',          ar: 'لحظات مضحكة' },
        'tl4-text':   { en: 'The uncontrollable giggles in silent rooms, weird memes only we understand, hilarious struggles, and absolute chaotic energy. Our laughter is the soundtrack of our friendship.', ar: 'الضحكات التي لا تُكبت في الغرف الصامتة، الميمز التي لا يفهمها أحد غيرنا، والطاقة الفوضوية الكاملة. ضحكنا هو موسيقى صداقتنا.' },
        'tl5-date':   { en: 'Shoulder to Cry On',    ar: 'كتف للبكاء عليه' },
        'tl5-title':  { en: 'Supporting Each Other', ar: 'ندعم بعضنا' },
        'tl5-text':   { en: 'No matter how dark the days got, we knew we had a safe haven. Celebrating every small success and comforting each other through failures. Unconditional support, always.', ar: 'مهما اشتدَّ الظلام، كنَّا نعرف أن لدينا ملاذًا آمنًا. نحتفي بكل نجاح صغير ونواسي بعضنا في الإخفاقات. دعم بلا شروط، دائمًا.' },
        'tl6-date':   { en: 'Looking Forward',        ar: 'إلى الأمام' },
        'tl6-title':  { en: 'Future Dreams',          ar: 'أحلام المستقبل' },
        'tl6-text':   { en: "Talking about our bucket lists, dream homes, trips to far-off lands, and conquering our careers. The future is exciting because we know we'll be sharing it as constants.", ar: 'نتحدث عن قوائم أحلامنا وبيوتنا المثالية ورحلاتنا وإنجازاتنا المهنية. المستقبل مثير لأننا نعرف أننا سنعيشه معًا.' },
        'tl7-date':   { en: 'Always & Forever',       ar: 'دائمًا وإلى الأبد' },
        'tl7-title':  { en: 'Forever Friends',        ar: 'صديقتان للأبد' },
        'tl7-text':   { en: 'Seven milestones and infinite more to go. Seasons change, cities change, but this bond remains unbreakable. Happy 21st Birthday to my constant, my partner in crime, and forever friend.', ar: 'سبع محطات ولا نهاية لما هو قادم. تتغير الفصول وتتغير المدن، لكن هذه الرابطة تبقى راسخة. عيد ميلاد سعيد يا رفيقتي الدائمة.' },
        'appr-title':    { en: 'Why We Appreciate You',                            ar: 'لماذا نقدِّرك' },
        'appr-subtitle': { en: 'A collection of qualities that make you so special', ar: 'مجموعة من الصفات التي تجعلك مميَّزة جدًا' },
        'appr1-title': { en: 'Heart of Gold',    ar: 'قلب من ذهب' },
        'appr1-text':  { en: 'Your selfless kindness and how you put others first. Your empathy and warmth make everyone feel valued, Zoha.', ar: 'طيبتك النقية وحرصك على الآخرين قبل نفسك. تعاطفك ودفؤك يجعل الجميع يشعر بقيمته، زوها.' },
        'appr2-title': { en: 'Brilliant Mind',   ar: 'عقل لامع' },
        'appr2-text':  { en: 'Your curiosity and intelligence. Whether writing code or debating ideas, your analytical spark always shines bright.', ar: 'فضولك وذكاؤك لا يُضاهَيان. سواء كنت تكتبين كودًا أو تتناقشين حول الأفكار، شرارة تحليلك تضيء دائمًا.' },
        'appr3-title': { en: 'Contagious Joy',   ar: 'فرح معدٍ' },
        'appr3-text':  { en: 'Your laughter and radiant smile. Your joyful energy instantly lifts the spirits of everyone around you.', ar: 'ضحكتك وابتسامتك المشرقة. طاقتك البهيجة ترفع معنويات كل من حولك في الحال.' },
        'appr4-title': { en: 'Quiet Strength',   ar: 'قوة هادئة' },
        'appr4-text':  { en: "Your resilience and grace. You meet life's obstacles with quiet determination, never letting difficulties dim your light.", ar: 'صمودك ورشاقتك. تواجهين عقبات الحياة بعزم هادئ، لا تدعين الصعوبات تُخمد نورك.' },
        'appr5-title': { en: 'Creative Spark',   ar: 'شرارة إبداعية' },
        'appr5-text':  { en: 'Your unique aesthetic sense and visual eye. Everything you create, plan, or style has a signature touch of elegance.', ar: 'ذوقك الجمالي الفريد وعينك البصرية. كل ما تصنعينه أو تخططين له يحمل توقيعًا خاصًا من الأناقة.' },
        'appr6-title': { en: 'Constant Support', ar: 'دعم لا يتوقف' },
        'appr6-text':  { en: 'Your loyalty and advice. Knowing you are a steadfast anchor who stands by friends through thick and thin.', ar: 'وفاؤك ونصائحك لا تقدَّر بثمن. معرفة أنك مرساة ثابتة تقفين مع الأصدقاء في السراء والضراء.' },
        'gallery-title':    { en: 'Chasing Memories',                                   ar: 'نلاحق الذكريات' },
        'gallery-subtitle': { en: 'A collection of beautiful moments captured in time', ar: 'مجموعة لحظات جميلة محفورة في الزمن' },
        'wishes-title':    { en: 'Wishes & Blessings',                           ar: 'أمنيات وتبريكات' },
        'wishes-subtitle': { en: 'Leave a message or read the love left by others', ar: 'اتركي رسالة أو اقرئي محبة الآخرين' },
        'wish-name-label': { en: 'Your Name',                                    ar: 'اسمك' },
        'wish-msg-label':  { en: 'Write your birthday wish...',                  ar: 'اكتبي أمنيتك لعيد الميلاد...' },
        'wish-btn':        { en: 'Post Wish',                                    ar: 'نشر الأمنية' },
        'gift-title':        { en: 'The Big Surprise',                                      ar: 'المفاجأة الكبرى' },
        'gift-subtitle':     { en: 'Tap the box below to claim your virtual birthday gift', ar: 'انقري على الصندوق أدناه للحصول على هديتك الافتراضية' },
        'gift-reveal-title': { en: 'Happy Birthday!',                                       ar: 'عيد ميلاد سعيد!' },
        'gift-reveal-msg':   { en: 'Congratulations! You have unlocked your surprise voucher.', ar: 'تهانينا! لقد فتحت قسيمة مفاجأتك.' },
        'voucher-stamp':     { en: 'APPROVED',                                              ar: 'مُعتمد' },
        'voucher-title':     { en: 'GOLDEN SURPRISE TICKET',                                ar: 'تذكرة المفاجأة الذهبية' },
        'voucher-benefit':   { en: 'Good for One Day of Pampering, Coffee, and Whatever Your Heart Desires!', ar: 'صالحة ليوم كامل من الدلال والقهوة وكل ما تشتهيه!' },
        'gift-footnote':     { en: 'Enjoy every second of your day. Pop all the balloons and watch the sparkles dance!', ar: 'استمتعي بكل ثانية من يومك. افقعي البالونات وشاهدي البريق يرقص!' },
        'footer-title':   { en: 'Happy 21st Birthday Zoha', ar: 'عيد ميلاد سعيد الحادي والعشرون يا زوها' },
        'footer-tagline': { en: 'Forever Friends',          ar: 'صديقتان للأبد' },
        'footer-badge1':  { en: '🎂 21 Milestone',          ar: '🎂 ٢١ حدثًا' },
        'footer-badge2':  { en: '💖 Cherished Bond',        ar: '💖 رابطة عزيزة' },
        'footer-badge3':  { en: '🌟 Made with Code',        ar: '🌟 صُنع بالكود' },
        'footer-copy':    { en: '© 2026. A Small Surprise for a Beautiful Soul.', ar: '© ٢٠٢٦. مفاجأة صغيرة لروح جميلة.' },
        // Narration panel
        'narration-label':    { en: 'Listen to Letter',    ar: 'استمعي إلى الرسالة' },
        'narration-no-voice': { en: 'No voice available on this device', ar: 'لا يوجد صوت متاح على هذا الجهاز' },
        'narration-reading':  { en: 'Reading…',            ar: 'يقرأ…' },
        'narration-paused':   { en: 'Paused',              ar: 'متوقف مؤقتًا' },
    };

    // Arabic birthday letter text — also exposed globally so the
    // typewriter engine in the main DOMContentLoaded IIFE can read it.
    const LETTER_AR = {
        salutation : 'زوها العزيزة،',
        para1      : 'في هذا اليوم الجميل، عيد ميلادك الحادي والعشرون، نريد أن نحتفي بكل ما يجعلك مميَّزة بشكل لا يُوصف. أنت مصدر بهجة دائمة وقوة وإلهام. ضحكتك معدية، وطيبتك لا حدود لها، ووجودك يجعل العالم أكثر إشراقًا وسعادة.',
        para2      : 'هذه البطاقة هي تحيَّة صغيرة لكِ — تحمل بعض ذكرياتنا المفضَّلة وكلمات الحب، ومفاجأة صغيرة تنتظرك. عسى العام القادم يملؤه فرص لا نهاية لها ومحبة عميقة وتحقيق كل أحلامك.',
        signature  : 'مع كل محبتنا،',
        names      : 'أصدقاؤك وعائلتك',
    };
    // Bridge: make letter data accessible from the main IIFE
    window._LETTER_AR = LETTER_AR;

    // ── State ─────────────────────────────────────────────────────────────────
    let currentLang = localStorage.getItem('hbd_lang') || 'en';

    // ── Core apply function ───────────────────────────────────────────────────
    function applyLanguage(lang) {
        const html = document.documentElement;
        html.setAttribute('lang', lang);
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            var entry = T[key];
            if (!entry) return;
            // footer-made contains a child <span> — rebuild innerHTML
            if (key === 'footer-made') {
                el.innerHTML = lang === 'ar'
                    ? 'صُنع بـ <span class="footer-heart">❤️</span> باستخدام HTML وCSS وJavaScript'
                    : 'Made with <span class="footer-heart">❤️</span> using HTML, CSS &amp; JavaScript';
            } else {
                el.textContent = entry[lang];
            }
        });

        // Toggle button glow highlights
        var enSpan = document.querySelector('.lang-en');
        var arSpan = document.querySelector('.lang-ar');
        if (enSpan) enSpan.classList.toggle('active', lang === 'en');
        if (arSpan) arSpan.classList.toggle('active', lang === 'ar');

        // If the birthday card is open, restart the typewriter in the new language
        // instead of doing a static innerHTML dump — this keeps the animated effect.
        var cardEl = document.getElementById('glass-card');
        var tw = document.getElementById('typewriter-text');
        if (cardEl && cardEl.classList.contains('open') && tw) {
            // Stop any active narration first (language has changed)
            if (typeof window._stopNarration === 'function') {
                window._stopNarration();
            }
            // Call the bridge function exposed by the main IIFE
            if (typeof window._restartTypewriter === 'function') {
                window._restartTypewriter();
            }
        }

        localStorage.setItem('hbd_lang', lang);
        currentLang = lang;
    }

    // ── Wire up toggle button ─────────────────────────────────────────────────
    function initLangToggle() {
        var btn = document.getElementById('lang-toggle-btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            applyLanguage(currentLang === 'en' ? 'ar' : 'en');
        });
    }

    // Boot — script is at end of <body> so DOM is ready
    initLangToggle();
    // Restore saved language preference
    if (currentLang === 'ar') applyLanguage('ar');

})();
