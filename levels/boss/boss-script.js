/* --- VARIABLES --- */

/* --- BANQUES DE DIALOGUES --- */
const TEXTS = {
    FIGHT: [
        "* Vous supprimez un fichier système temporaire.\n* Goliath grimace !",
        "* Vous nettoyez le ventilateur.\n* Goliath a moins chaud mais perd des PV.",
        "* Vous refusez les Cookies.\n* Goliath est affamé !",
        "* Coup critique sur la partition de récupération !"
    ],
    CHECK: [
        "* GOLIATH OS 11 Pro (Obsolète).\n* 80 ATK 10 DEF.\n* Il consomme 8Go de RAM pour rien.",
        "* GOLIATH OS.\n* Il vous force à changer de PC alors qu'il marche encore.",
        "* Analyse : Ce système contient 45 versions d'essai de logiciels payants."
    ],
    INSTALL_LINUX: [
        "* Vous insérez une clé USB Bootable...\n* Le Pingouin effraie le système !",
        "* Vous installez 'Mint' en Dual-Boot.\n* Goliath doit partager son disque !",
        "* Installation de drivers libres...\n* Le matériel revit !",
        "* Vous remplacez le noyau propriétaire.\n* Goliath perd le contrôle !"
    ],
    DEBLOAT: [
        "* Vous désinstallez 'Candy Crush' pré-installé.\n* Le menu Démarrer est plus propre !",
        "* Vous désactivez la Télémétrie.\n* Goliath ne peut plus vous espionner.",
        "* Vous supprimez l'antivirus bloatware.\n* Le PC gagne +50% de vitesse !",
        "* Nettoyage des processus en arrière-plan...\n* La RAM respire enfin !"
    ],
    MERCY: [
        "* Goliath refuse de s'éteindre (Mise à jour en cours 10%...)",
        "* Il prétend que votre matériel est incompatible.",
        "* Goliath vous demande un abonnement mensuel pour survivre."
    ]
};

// Fonction utilitaire pour prendre une phrase au hasard
function getRandomText(category) {
    const list = TEXTS[category];
    return list[Math.floor(Math.random() * list.length)];
}

// Dimensions de l'arène (doit correspondre au CSS)
const ARENA_W = 400;
const ARENA_H = 250;
const HEART_SIZE = 20;

let player = { hp: 20, maxHp: 20, x: ARENA_W/2, y: ARENA_H/2, speed: 5, invulnerable: false };
let boss = { hp: 100, maxHp: 100 };

// État du jeu : 'MENU', 'SUBMENU', 'ENEMY_TURN', 'GAMEOVER'
let gameState = 'MENU'; 

// Index de sélection du menu (0: Fight, 1: Act, 2: Item, 3: Mercy)
let menuIndex = 0;
let subMenuIndex = 0;
let bullets = [];
let actCount = 0;

const heart = document.getElementById('heart');
const dialogueText = document.getElementById('dialogue-text');
const btnWrappers = document.querySelectorAll('.btn-wrapper');
const subOptions = document.querySelectorAll('.sub-option');

// Gestion Clavier
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // NAVIGATION MENU
    if (gameState === 'MENU') {
        if (e.key === 'ArrowRight') {
            menuIndex = (menuIndex + 1) % 4;
            updateMenuUI();
        } else if (e.key === 'ArrowLeft') {
            menuIndex = (menuIndex - 1 + 4) % 4;
            updateMenuUI();
        } else if (e.key === 'Enter') {
            executeMenuAction();
        }
    }
    // NAVIGATION SOUS-MENU (ACT)
    else if (gameState === 'SUBMENU') {
        if (e.key === 'ArrowDown') {
            subMenuIndex = (subMenuIndex + 1) % subOptions.length;
            updateSubMenuUI();
        } else if (e.key === 'ArrowUp') {
            subMenuIndex = (subMenuIndex - 1 + subOptions.length) % subOptions.length;
            updateSubMenuUI();
        } else if (e.key === 'Enter') {
            executeSubAction();
        } else if (e.key === 'Escape') {
            gameState = 'MENU';
            document.getElementById('act-menu').classList.add('hidden');
        }
    }
});

document.addEventListener('keyup', (e) => keys[e.key] = false);

/* --- BOUCLE DE JEU (Mouvement & Balles) --- */
function gameLoop() {
    if (gameState === 'ENEMY_TURN') {
        movePlayerHeart();
        updateBullets();
        checkCollisions();
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();

/* --- LOGIQUE MENU --- */
function updateMenuUI() {
    btnWrappers.forEach((btn, idx) => {
        if (idx === menuIndex) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function updateSubMenuUI() {
    subOptions.forEach((opt, idx) => {
        if (idx === subMenuIndex) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
}
function executeMenuAction() {
    // --- CORRECTIF ANTI-SPAM ---
    // Si on n'est pas strictement dans le menu (ex: animation en cours), on arrête tout.
    if (gameState !== 'MENU') return;

    // On verrouille immédiatement l'état pour empêcher un 2ème clic
    gameState = 'WAITING'; 
    // ---------------------------

    const action = ['FIGHT', 'ACT', 'ITEM', 'MERCY'][menuIndex];

    if (action === 'FIGHT') {
        const text = getRandomText('FIGHT');
        
        typeText(text, () => {
            boss.hp -= 15;
            updateBossUI();
            
            // Effet visuel
            const logo = document.querySelector('.goliath-logo');
            if(logo) {
                logo.style.filter = "brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)";
                setTimeout(() => logo.style.filter = "", 200);
            }
            
            setTimeout(startEnemyTurn, 1000);
        });
    } 
    else if (action === 'ACT') {
        // Pour ACT, on passe en sous-menu, donc c'est ok de changer l'état
        gameState = 'SUBMENU';
        document.getElementById('act-menu').classList.remove('hidden');
        subMenuIndex = 0;
        updateSubMenuUI();
    }
    else if (action === 'ITEM') {
        player.hp = Math.min(player.hp + 10, player.maxHp);
        updatePlayerUI();
        typeText("* Vous utilisez un Tuto en ligne.\n* Vos PV sont restaurés !", () => setTimeout(startEnemyTurn, 1000));
    }
    else if (action === 'MERCY') {
        if (boss.hp <= 0 || actCount >= 3) {
            victory();
        } else {
            const text = getRandomText('MERCY');
            typeText(text, () => setTimeout(startEnemyTurn, 1000));
        }
    }
}
function executeSubAction() {
    // --- CORRECTIF ANTI-SPAM ---
    if (gameState !== 'SUBMENU') return;
    gameState = 'WAITING'; // On verrouille
    // ---------------------------

    document.getElementById('act-menu').classList.add('hidden');
    const actType = subOptions[subMenuIndex].dataset.act;
    
    if (actType === 'CHECK') {
        const text = getRandomText('CHECK');
        typeText(text, () => setTimeout(startEnemyTurn, 2000));
    } 
    else if (actType === 'INSTALL_LINUX') {
        actCount++;
        boss.hp -= 12;
        updateBossUI();
        const text = getRandomText('INSTALL_LINUX');
        typeText(text, () => setTimeout(startEnemyTurn, 1500));
    } 
    else if (actType === 'DEBLOAT') {
        actCount++;
        player.hp = Math.min(player.hp + 2, player.maxHp);
        updatePlayerUI();
        const text = getRandomText('DEBLOAT');
        typeText(text, () => setTimeout(startEnemyTurn, 1500));
    }
}

/* --- LOGIQUE ENNEMI --- */
function startEnemyTurn() {
    gameState = 'ENEMY_TURN';
    // Reset position coeur
    player.x = ARENA_W / 2;
    player.y = ARENA_H / 2;
    updateHeartPos();
    
    // Spawn balles
    let wave = Math.random();
    let duration = 5000;
    
    if (wave < 0.33) spawnWindows();
    else if (wave < 0.66) spawnCookies();
    else spawnErrors();

    setTimeout(() => {
        bullets = [];
        document.getElementById('bullets-container').innerHTML = '';
        gameState = 'MENU';
        typeText("* Goliath OS ventile bruyamment.");
    }, duration);
}

/* --- MOUVEMENT CŒUR --- */
function movePlayerHeart() {
    // Calcul de la vitesse selon touches
    let dx = 0, dy = 0;
    if (keys['ArrowUp']) dy -= player.speed;
    if (keys['ArrowDown']) dy += player.speed;
    if (keys['ArrowLeft']) dx -= player.speed;
    if (keys['ArrowRight']) dx += player.speed;

    player.x += dx;
    player.y += dy;

    // Limites de l'arène
    // On garde une marge de 10px (taille coeur / 2)
    if (player.x < 10) player.x = 10;
    if (player.x > ARENA_W - 10) player.x = ARENA_W - 10;
    if (player.y < 10) player.y = 10;
    if (player.y > ARENA_H - 10) player.y = ARENA_H - 10;

    updateHeartPos();
}

function updateHeartPos() {
    heart.style.left = player.x + 'px';
    heart.style.top = player.y + 'px';
}

/* --- BALLES --- */
function spawnWindows() {
    let int = setInterval(() => {
        if(gameState !== 'ENEMY_TURN') { clearInterval(int); return; }
        createBullet('🟦', Math.random() * ARENA_W, 0, 0, 3);
    }, 200);
}

function spawnCookies() {
    let int = setInterval(() => {
        if(gameState !== 'ENEMY_TURN') { clearInterval(int); return; }
        let b = createBullet('🍪', Math.random() * ARENA_W, 0, 0, 0);
        b.homing = true;
    }, 500);
}

function spawnErrors() {
    let int = setInterval(() => {
        if(gameState !== 'ENEMY_TURN') { clearInterval(int); return; }
        createBullet('⚠️', ARENA_W, Math.random() * ARENA_H, -4, 0);
    }, 300);
}

function createBullet(char, x, y, vx, vy) {
    const el = document.createElement('div');
    el.classList.add('bullet');
    el.innerText = char;
    document.getElementById('bullets-container').appendChild(el);
    bullets.push({ el, x, y, vx, vy, char });
    return bullets[bullets.length-1];
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        if (b.homing) {
            let dx = player.x - b.x;
            let dy = player.y - b.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            b.vx = (dx/dist) * 2;
            b.vy = (dy/dist) * 2;
        }

        b.x += b.vx;
        b.y += b.vy;
        b.el.style.left = b.x + 'px';
        b.el.style.top = b.y + 'px';

        if (b.x < -20 || b.x > ARENA_W + 20 || b.y < -20 || b.y > ARENA_H + 20) {
            b.el.remove();
            bullets.splice(i, 1);
        }
    }
}

function checkCollisions() {
    if (player.invulnerable) return;
    bullets.forEach(b => {
        // Distance simple (cercle collision)
        let dx = player.x - b.x;
        let dy = player.y - b.y;
        if (Math.sqrt(dx*dx + dy*dy) < 15) {
            takeDamage();
        }
    });
}

function takeDamage() {
    player.hp -= 5;
    updatePlayerUI();
    player.invulnerable = true;
    heart.classList.add('hurt');
    setTimeout(() => {
        player.invulnerable = false;
        heart.classList.remove('hurt');
    }, 1000);

    if(player.hp <= 0) {
        gameState = 'GAMEOVER';
        document.getElementById('overlay-screen').classList.remove('hidden');
    }
}

/* --- UI HELPERS --- */
function typeText(text, cb) {
    dialogueText.innerHTML = ""; // Utiliser innerHTML pour gérer les <br>
    let i = 0;
    
    // On remplace les \n par des <br> pour l'affichage HTML correct
    // Mais pour l'effet machine à écrire, on garde le string brut pour l'itération
    let displayHtml = ""; 
    
    let int = setInterval(() => {
        const char = text[i];
        
        if (char === '\n') {
            displayHtml += "<br>"; // Saut de ligne HTML propre
        } else {
            displayHtml += char;
        }
        
        dialogueText.innerHTML = displayHtml;
        i++;
        
        if (i >= text.length) {
            clearInterval(int);
            if (cb) cb();
        }
    }, 20); // Vitesse de frappe (plus bas = plus vite)
}

function updateBossUI() {
    document.getElementById('boss-hp-fill').style.width = Math.max(0, boss.hp) + '%';
    if(boss.hp <= 0) victory();
}

function updatePlayerUI() {
    document.getElementById('player-hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hp-text').innerText = player.hp + " / " + player.maxHp;
}

/* --- GESTION DE LA FIN DE PARTIE --- */

function gameOver() {
    gameState = 'GAMEOVER';
    const overlay = document.getElementById('overlay-screen');
    overlay.classList.remove('hidden');
    
    // Config Défaite
    document.getElementById('end-title').innerText = "GAME OVER";
    document.getElementById('end-title').style.color = "red";
    document.getElementById('end-desc').innerText = "Le système propriétaire vous a écrasé.";
    
    // Boutons
    document.getElementById('retry-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

function victory() {
    gameState = 'GAMEOVER';
    const overlay = document.getElementById('overlay-screen');
    overlay.classList.remove('hidden');
    
    // Config Victoire
    document.getElementById('end-title').innerText = "LIBÉRATION !";
    document.getElementById('end-title').style.color = "#0f0";
    document.getElementById('end-title').style.textShadow = "0 0 20px #0f0";
    document.getElementById('end-desc').innerText = "Goliath OS est maintenant Open Source.";
    
    // Boutons : On cache "Réessayer" et on montre "Suivant"
    document.getElementById('retry-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    
    // On peut aussi focus le bouton pour faciliter la navigation au clavier
    document.getElementById('next-btn').focus();
}

document.getElementById('skip-btn').addEventListener('click', () => {
    // 1. On tue le boss instantanément
    boss.hp = 0;
    
    // 2. On met à jour la barre de vie visuellement (pour qu'elle tombe à 0)
    updateBossUI();
    
    // 3. On déclenche la séquence de victoire immédiatement
    victory();
    
    // 4. Petit message dans la boîte de dialogue pour le style
    typeText("* HACK ACTIVÉ : GOLIATH SUPPRIMÉ.");
});