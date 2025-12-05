// --- CONFIGURATION ---
let level = 1;
const speedGain = 0.8;
let activeWindows = [];

// --- NOUVELLES VARIABLES D'ETAT ---
let currentWindowCount = 1;  // Nombre de fenêtres actuel
let currentDensity = 0;      // Nombre d'éléments BONUS par fenêtre

const windowsSetupText = {
    'title-text' : "System Error",
    'title-h2' : "Erreur Critique",
    'msg-p' : "Windows tente de résoudre le problème...",
    'input-text' : "Non répondant...",
    'btn1' : "Déboguer",
    'btn2' : "Fermer",
    'title-btn' : "X",
    'label-text' : "Status :",
    'status-bar' : "En attente...",
    // Textes pour les éléments bonus
    'extra-checkbox' : "Mode sans échec",
    'extra-radio' : "Administrateur",
    'extra-link' : "Aide..."
}

const linuxSetupText = {
    'title-text' : "TERMINAL ROOT",
    'title-h2' : "ACCESS GRANTED",
    'msg-p' : "Injecting payload... Success.",
    'input-text' : "ssh root@192.168.1.1",
    'btn-text' : "EXEC",
    'extra-checkbox' : "-v (verbose)",
    'extra-radio' : "sudo",
    'extra-link' : "man help"
}

const phrases = [
    "ROOT ACCESS", "SUDO SU", "APT-GET UPDATE", 
    "KERNEL PANIC", "rm -rf /", "404 ERROR", 
    "HACKED", "LINUX MINT", "UBUNTU", "ARCH BTW"
];

// --- INITIALISATION DU NIVEAU ---
function initLevel() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; 
    activeWindows = []; 

    // Si c'est le tout premier niveau, on reset les stats
    if (level === 1) {
        currentWindowCount = 1;
        currentDensity = 0;
    }

    // On crée les fenêtres selon les variables actuelles
    for (let i = 0; i < currentWindowCount; i++) {
        spawnWindow(container, i);
    }

    document.getElementById('level-display').innerText = level;
    updateScoreUI();
}

// --- FONCTION DE GENERATION DE CONTENU ALEATOIRE ---
function generateExtraContent(quantity) {
    let html = '';
    for (let i = 0; i < quantity; i++) {
        const type = Math.random();
        
        if (type < 0.33) {
            // Ajouter un Input
            html += `<input type="text" value="Code erreur..." class="win-style clickable input-text" style="width: 90%; margin-top:5px;">`;
        } else if (type < 0.66) {
            // Ajouter un Bouton supplémentaire
            html += `<div class="win-btn win-style clickable btn-text" style="display:block; margin:5px auto; width: 60%;">Annuler</div>`;
        } else {
            // Ajouter une "Checkbox" (simulée)
            html += `
            <div class="clickable extra-checkbox" style="font-size:12px; margin:5px;">
                <span style="border:1px solid gray; background:white; padding:0 3px;">X</span> 
                <span>Mode sans échec</span>
            </div>`;
        }
    }
    return html;
}

// --- SPAWN WINDOW ---
function spawnWindow(container, index) {
    const win = document.createElement('div');
    win.className = 'win-window win-style moving-window clickable';
    
    // Taille dynamique : plus il y a d'éléments, plus la fenêtre est grande
    // On laisse la hauteur en 'auto' via le CSS, mais on s'assure qu'elle ne dépasse pas l'écran
    
    const winWidth = 380;
    const maxX = window.innerWidth - winWidth - 20; 
    const maxY = window.innerHeight - 300; // Marge de sécurité hauteur
    
    const startX = Math.max(0, Math.random() * maxX);
    const startY = Math.max(0, Math.random() * maxY);
    
    win.style.left = startX + 'px';
    win.style.top = startY + 'px';
    
    // On génère le contenu supplémentaire ici
    const extraContent = generateExtraContent(currentDensity);

    win.innerHTML = `
        <div class="title-bar clickable">
            <span class="clickable title-text">System Error</span>
            <div class="title-btn clickable title-btn">X</div>
        </div>
        <div class="content-area" style="padding:10px; background:white; display:flex; flex-direction:column; gap:5px;">
            <h2 class="clickable title-h2" style="margin-top:0;">Erreur Critique</h2>
            <p class="clickable msg-p">Windows tente de résoudre le problème...</p>
            
            ${extraContent}

            <div style="display: flex; gap: 10px; justify-content: center; margin: 10px 0;">
                <div class="win-btn win-style clickable btn1 btn-text">Déboguer</div>
                <div class="win-btn win-style clickable btn2 btn-text">Fermer</div>
            </div>
            
            <label class="clickable label-text">Status :</label>
            <input type="text" value="Non répondant..." class="win-style clickable input-text" style="width: 90%;">
        </div>
        <div class="status-bar win-style clickable status-bar" style="font-size: 12px; padding: 2px;">En attente...</div>
    `;
    
    container.appendChild(win);

    // Physique
    let vx = 0, vy = 0;
    if (level > 1) {
        let baseSpeed = level * speedGain;
        // Légère variation : les grosses fenêtres (haute densité) vont un peu plus lentement
        let weight = 1 - (currentDensity * 0.05); // Ralentit de 5% par élément extra
        let actualSpeed = Math.max(0.5, baseSpeed * weight); 
        
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * actualSpeed;
        vy = Math.sin(angle) * actualSpeed;
    }

    activeWindows.push({
        element: win,
        x: startX,
        y: startY,
        vx: vx,
        vy: vy
    });
}

// --- BOUCLE DE JEU ---
function gameLoop() {
    const maxX = window.innerWidth;
    const maxY = window.innerHeight - 40; 

    activeWindows.forEach(winObj => {
        winObj.x += winObj.vx;
        winObj.y += winObj.vy;

        // Rebonds
        if (winObj.x <= 0) {
            winObj.x = 0; winObj.vx *= -1; playBounceSound();
        } else if (winObj.x + winObj.element.offsetWidth >= maxX) {
            winObj.x = maxX - winObj.element.offsetWidth; winObj.vx *= -1; playBounceSound();
        }

        if (winObj.y <= 0) {
            winObj.y = 0; winObj.vy *= -1; playBounceSound();
        } else if (winObj.y + winObj.element.offsetHeight >= maxY) {
            winObj.y = maxY - winObj.element.offsetHeight; winObj.vy *= -1; playBounceSound();
        }

        winObj.element.style.left = winObj.x + 'px';
        winObj.element.style.top = winObj.y + 'px';
    });

    requestAnimationFrame(gameLoop);
}

initLevel();
gameLoop();

// --- INTERACTIONS ---
document.addEventListener('mousedown', (e) => {
    shootLaser(e.clientX, e.clientY);
    const target = e.target.closest('.clickable');

    if (target && !target.classList.contains('linux-style')) {
        convertToLinux(target);
    }
});

function convertToLinux(element) {
    element.classList.add('linux-style');
    changeTextContent(element);
    updateScoreUI();
    checkLevelComplete();
}

function changeTextContent(element) {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    let result = null;

    // Mapping intelligent
    for (const aClass of element.classList) {
        if (linuxSetupText[aClass] !== undefined) {
            result = linuxSetupText[aClass];
            break;
        }
    }

    // Gestion spécifique des spans (comme notre fausse checkbox)
    if(element.tagName === 'SPAN') {
        // Ne rien faire de spécial, le parent gère souvent le style
    }

    if (result !== null) {
        if (element.tagName === 'INPUT') element.value = result;
        else if (element.children.length === 0) element.innerText = result; // Modifie le texte seulement si pas d'enfants
        else {
             // Si c'est un conteneur (ex: la checkbox div > span), on cherche le texte à l'intérieur
             const textSpan = element.querySelector('span:last-child');
             if(textSpan) textSpan.innerText = result;
        }
    } 
    else if (element.children.length === 0) { 
        element.innerText = randomPhrase;
    }
}

function checkLevelComplete() {
    const allClickables = document.querySelectorAll('#game-container .clickable');
    const allLinux = document.querySelectorAll('#game-container .linux-style');
    
    if (allClickables.length > 0 && allLinux.length === allClickables.length) {
        playLevelUpSound();
        level++;
        
        // --- LOGIQUE DE PROGRESSION ALEATOIRE ---
        // Pile ou face :
        // 50% de chance d'ajouter une nouvelle fenêtre
        // 50% de chance d'ajouter plus d'éléments dans les fenêtres existantes
        
        const randomChoice = Math.random();
        
        // Petite sécurité : si on a déjà 5 fenêtres, on force la densité pour pas saturer l'écran
        // Inversement : si on a déjà 6 éléments bonus, on force une nouvelle fenêtre
        if (currentWindowCount >= 5) {
            currentDensity++;
        } else if (currentDensity >= 6) {
            currentWindowCount++;
        } else {
            // Choix normal
            if (randomChoice > 0.5) {
                currentWindowCount++; // Nouvelle fenêtre
            } else {
                currentDensity++; // Fenêtre plus complexe
            }
        }

        document.body.style.backgroundColor = "black";
        setTimeout(() => {
            document.body.style.backgroundColor = "#008080";
            initLevel(); 
        }, 1500);
    }
}

function updateScoreUI() {
    const allClickables = document.querySelectorAll('#game-container .clickable');
    const allLinux = document.querySelectorAll('#game-container .linux-style');
    
    if (allClickables.length === 0) return;

    const percent = Math.floor((allLinux.length / allClickables.length) * 100);
    document.getElementById('score').innerText = percent;
}

// --- AUDIO (Inchangé) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function shootLaser(x, y) {
    const laser = document.createElement('div');
    laser.className = 'laser-beam';
    document.body.appendChild(laser);

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight;
    const deltaX = x - startX; const deltaY = y - startY;
    const length = Math.sqrt(deltaX**2 + deltaY**2);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    laser.style.width = length + 'px';
    laser.style.left = startX + 'px';
    laser.style.top = startY + 'px';
    laser.style.transform = `rotate(${angle}deg)`;

    const impact = document.createElement('div');
    impact.className = 'impact';
    impact.style.left = x + 'px'; impact.style.top = y + 'px';
    document.body.appendChild(impact);

    playSynthSound(880, 100, 0.1, 'sawtooth');

    setTimeout(() => { laser.remove(); impact.remove(); }, 200);
}

function playSynthSound(startFreq, endFreq, duration, type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}
function playBounceSound() { playSynthSound(150, 50, 0.1, 'sine'); }
function playLevelUpSound() { 
    setTimeout(() => playSynthSound(440, 440, 0.1, 'square'), 0);
    setTimeout(() => playSynthSound(554, 554, 0.1, 'square'), 100);
    setTimeout(() => playSynthSound(659, 659, 0.2, 'square'), 200);
}