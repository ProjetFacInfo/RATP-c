// --- CONFIGURATION ISOMÉTRIQUE ---
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const MAP_SIZE = 25;

// --- CODES DE LA MATRICE (Légende) ---
const T_GRASS = 0;       // Herbe simple
const T_PATH = 1;        // Chemin (Jaune)
const T_TREE = 2;        // Arbre
const T_KEY = 3;         // Clé (Labyrinthe)
const T_PORTAL_PUZZLE = 4; // Portail vers le Puzzle
const T_PORTAL_FINAL = 5;  // Portail de fin (Dans le Château)
const T_PORTAL_HIDDEN = 6; // Portail Secret (CS-Coupe)
const T_PORTAL_ANCIENT = 7; // 4ème Portail (Décoratif/Lore)
const T_SPAWN = 9;       // Point de départ

// --- ÉTAT GLOBAL (Persistance) ---
// --- ÉTAT GLOBAL (Persistance & Chargement) ---
const SAVED_DATA = localStorage.getItem('nird_rpg_save');
let startPlayerPos = null; // Variable temporaire pour la position


if (SAVED_DATA) {
    console.log("Sauvegarde chargée !");
    const parsed = JSON.parse(SAVED_DATA);
    window.GAME_STATE = parsed.gameState;
    startPlayerPos = parsed.playerPos;
} else {
    // État par défaut si aucune sauvegarde
    window.GAME_STATE = {
        mapMatrix: null,
        items: {
            key: false,     // Clé du labyrinthe
            patch: false,   // Clé USB (Puzzle)
            csCut: false    // CS-Coupe (Secret)
        },
        windosAlive: true   // Ennemi
    };
}

// 1. On vérifie si le joueur revient victorieux du laser game
if (localStorage.getItem('has_won_laser_game') === 'true') {

    
    // 2. On donne l'item
    window.GAME_STATE.items.patch = true;
    window.GAME_STATE.items.key = true;
    // 3. IMPORTANT : On supprime immédiatement l'info de la mémoire
    // Pour que si on reload la page (F5), on recommence sans l'item
    //localStorage.removeItem('has_won_laser_game');
}

function isoToScreen(x, y) {
    const screenX = (x - y) * TILE_WIDTH * 0.5;
    const screenY = (x + y) * TILE_HEIGHT * 0.5;
    return { x: screenX, y: screenY };
}

// =========================================================
// SCÈNE 1 : LE VILLAGE
// =========================================================
class VillageScene extends Phaser.Scene {
    constructor() { super({ key: 'VillageScene' }); }

    preload() {
        const g = this.make.graphics({ add: false });

        // 1. Herbe
        g.fillStyle(0x4caf50); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fill();
        g.lineStyle(1, 0x388e3c); g.strokePath(); g.generateTexture('grass', 64, 32);

        // 2. Chemin
        g.clear(); g.fillStyle(0xffca28); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fill();
        g.lineStyle(1, 0xc49000); g.strokePath(); g.generateTexture('path', 64, 32);

        // 3. Spawn
        g.clear(); g.fillStyle(0xd32f2f); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fill();
        g.generateTexture('spawn_point', 64, 32);

        // 4. Château
        g.clear(); g.fillStyle(0x757575); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fill();
        g.fillStyle(0x424242); g.beginPath(); g.moveTo(64, 16); g.lineTo(64, 48); g.lineTo(32, 64); g.lineTo(32, 32); g.closePath(); g.fill();
        g.fillStyle(0x616161); g.beginPath(); g.moveTo(0, 16); g.lineTo(0, 48); g.lineTo(32, 64); g.lineTo(32, 32); g.closePath(); g.fill();
        g.generateTexture('wall_castle', 64, 64);

        // 5. Arbre
        g.clear(); g.fillStyle(0x2e7d32); g.fillCircle(16, 16, 16); g.fillStyle(0x3e2723); g.fillRect(12, 30, 8, 10);
        g.generateTexture('tree', 32, 40);

        // 6. Tux
        g.clear(); g.fillStyle(0x111111); g.fillEllipse(16, 22, 20, 18); g.fillStyle(0xffffff); g.fillEllipse(16, 24, 14, 14);
        g.fillStyle(0x111111); g.fillCircle(16, 10, 9); g.fillStyle(0xff9800); g.fillTriangle(14, 12, 18, 12, 16, 16);
        g.generateTexture('tux', 32, 36);

        // 7. Ennemi WindOS
        g.clear(); g.fillStyle(0x0277bd); g.fillRect(0,0,32,32); g.lineStyle(2, 0xffffff); g.strokeRect(0,0,32,32);
        g.generateTexture('windos', 32, 32);

        // 8. Portail Puzzle (Cyan)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0x00e5ff, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x00acc1); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_tex', 64, 80);

        // 9. Portail Final (Or)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0xffd700, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0xc6a700); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_final_tex', 64, 80);

        // 10. Portail Secret (Violet)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0x9c27b0, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x7b1fa2); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_hidden_tex', 64, 80);

        // 11. Portail Ancien (Gris/Rouge - Décoratif)
        g.clear(); g.lineStyle(2, 0xaaaaaa, 0.5); g.fillStyle(0x555555, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x333333); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_ancient_tex', 64, 80);

        // 12. Clé
        g.clear(); g.lineStyle(2, 0xffd700); g.strokeCircle(16, 10, 6); g.beginPath(); g.moveTo(16, 16); g.lineTo(16, 28); g.strokePath();
        g.generateTexture('item_key', 32, 32);
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        this.cameras.main.setZoom(1.2);

        this.obstacles = [];
        this.floorTiles = new Map();
        this.centerX = this.sys.game.config.width / 2;
        this.centerY = this.sys.game.config.height / 4;

        if (!window.GAME_STATE.mapMatrix) this.generateNewMap();
        this.mapMatrix = window.GAME_STATE.mapMatrix;

        this.renderMap();

        // Spawn Logic (MODIFIÉ)
        if (startPlayerPos) {
            // 1. Priorité : Reprendre là où on a sauvegardé
            this.playerIso = startPlayerPos;
            startPlayerPos = null; // On vide pour ne pas interférer avec les futurs respawns
        }
        else if (window.GAME_STATE.items.patch && !this.playerIso) {
            // 2. Retour du Puzzle
            this.playerIso = { x: 22, y: 3 };
        }
        else if (!this.playerIso) {
            // 3. Nouvelle partie
            this.playerIso = { x: 2, y: 22 };
        }

        const pPos = isoToScreen(this.playerIso.x, this.playerIso.y);
        // ... (reste du code inchangé) ...
        this.player = this.add.image(this.centerX + pPos.x, this.centerY + pPos.y, 'tux');
        this.player.setOrigin(0.5, 0.85);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.lastMove = 0;

        this.updateInventoryUI();

        if(!window.GAME_STATE.items.csCut) {
            this.showUI("Astuce: Un portail secret est caché derrière le château...");
        }
    }

    generateNewMap() {
        // 1. Initialisation
        const matrix = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(T_GRASS));
        const setM = (x, y, val) => { if(x>=0 && x<MAP_SIZE && y>=0 && y<MAP_SIZE) matrix[y][x] = val; };

        // Zone Château (Exclusion)
        const castleRect = { x: 1, y: 1, w: 7, h: 7 };

        // Helper: Dessine chemin Jaune
        const drawJaggedPath = (x1, y1, x2, y2) => {
            let cx = x1, cy = y1;
            setM(cx, cy, T_PATH);
            while(cx !== x2 || cy !== y2) {
                let dirX = Math.sign(x2 - cx);
                let dirY = Math.sign(y2 - cy);
                if(Math.random() < 0.3) {
                    if(Math.random() > 0.5) cx += (Math.random() > 0.5 ? 1 : -1); else cy += (Math.random() > 0.5 ? 1 : -1);
                } else {
                    if(cx !== x2 && (Math.random() > 0.5 || cy === y2)) cx += dirX; else if(cy !== y2) cy += dirY;
                }
                cx = Phaser.Math.Clamp(cx, 0, MAP_SIZE-1); cy = Phaser.Math.Clamp(cy, 0, MAP_SIZE-1);
                setM(cx, cy, T_PATH);
            }
        };

const spawnX=2, spawnY=22;
        const castleGateX=4, castleGateY=6;
        const forestEntryX=18, forestEntryY=18;

        const portalFinalX=2, portalFinalY=2;
        const portalPuzzleX=22, portalPuzzleY=2;
        const portalHiddenX=0, portalHiddenY=0;
        const portalAncientX=20, portalAncientY=22;
        const keyX=20, keyY=20;

        // 1. D'ABORD : Le Spawn (Peut être écrasé par le début du chemin, on le remettra si besoin, mais le spawn est spécial)
        setM(spawnX, spawnY, T_SPAWN);

        // 2. ENSUITE : Les Chemins (Ils vont écrire des T_PATH partout sur leur passage)
        drawJaggedPath(spawnX, spawnY, castleGateX, castleGateY);
        drawJaggedPath(castleGateX, castleGateY, 12, 12);
        drawJaggedPath(12, 12, forestEntryX, forestEntryY);
        drawJaggedPath(forestEntryX, forestEntryY, portalPuzzleX, portalPuzzleY);
        drawJaggedPath(12, 12, portalAncientX, portalAncientY);

        // 3. ENFIN : On place les Portails et la Clé (Pour écraser le chemin à l'arrivée)
        setM(portalFinalX, portalFinalY, T_PORTAL_FINAL);
        setM(portalPuzzleX, portalPuzzleY, T_PORTAL_PUZZLE); // <- Maintenant il écrase le chemin
        setM(portalHiddenX, portalHiddenY, T_PORTAL_HIDDEN);
        setM(portalAncientX, portalAncientY, T_PORTAL_ANCIENT); // <- Idem
        setM(keyX, keyY, T_KEY);

        // --- LISTE DES POINTS PROTÉGÉS ---
        const protectedPoints = [
            {x: spawnX, y: spawnY},
            {x: keyX, y: keyY}, {x: keyX-1, y: keyY-1},
            {x: portalFinalX, y: portalFinalY},
            {x: portalPuzzleX, y: portalPuzzleY},
            {x: portalHiddenX, y: portalHiddenY},
            {x: portalAncientX, y: portalAncientY},
            {x: castleGateX, y: castleGateY},
            {x: forestEntryX, y: forestEntryY}
        ];

        // --- GÉNÉRATION DES ARBRES ---
        for(let y=0; y<MAP_SIZE; y++) {
            for(let x=0; x<MAP_SIZE; x++) {
                // Si la case n'est pas de l'herbe (C'est un chemin, un portail ou le spawn), on ne touche pas
                if(matrix[y][x] !== T_GRASS) continue;

                // Exclusion Château
                if (x >= castleRect.x && x < castleRect.x + castleRect.w &&
                    y >= castleRect.y && y < castleRect.y + castleRect.h) {
                    continue;
                }

                // Points Protégés (Sécurité supplémentaire)
                const isProtected = protectedPoints.some(p => p.x === x && p.y === y);
                if (isProtected) continue;

                // Hasard
                if(Phaser.Math.Between(0,100) < 20) {
                    matrix[y][x] = T_TREE;
                }
            }
        }
        // --- FONCTION DE GARANTIE D'ACCÈS (LE BULLDOZER) ---
        // Cette fonction s'assure qu'aucun arbre ne bloque le chemin direct vers un objectif
        const ensureAccessibility = (targetX, targetY) => {
            // On part du spawn ou d'un point central
            let cx = 12; // Point central de la map
            let cy = 12;

            // On marche vers la cible
            while(cx !== targetX || cy !== targetY) {
                // Déplacement simple
                if(cx < targetX) cx++; else if(cx > targetX) cx--;
                if(cy < targetY) cy++; else if(cy > targetY) cy--;

                // Si on tombe sur un arbre ou un mur (sauf château), on nettoie
                if(matrix[cy][cx] === T_TREE) {
                    matrix[cy][cx] = T_GRASS; // COUPE L'ARBRE AUTOMATIQUEMENT
                }
            }
        };

        // --- VÉRIFICATION DES 5 OBJECTIFS MAJEURS ---
        ensureAccessibility(keyX, keyY);             // Accès Clé
        ensureAccessibility(portalPuzzleX, portalPuzzleY); // Accès Portail Puzzle
        ensureAccessibility(portalAncientX, portalAncientY); // Accès Portail Ancien
        // Pour le portail secret, on doit faire un chemin spécial qui contourne le château
        // On force un chemin d'herbe sur le bord haut de la map
        for(let x=0; x<10; x++) { if(matrix[0][x] === T_TREE) matrix[0][x] = T_GRASS; }
        for(let y=0; y<5; y++) { if(matrix[y][0] === T_TREE) matrix[y][0] = T_GRASS; }

        window.GAME_STATE.mapMatrix = matrix;
    }

    renderMap() {
        this.obstacles = [];
        this.children.list.filter(c => c.texture && c.texture.key !== 'tux').forEach(c => c.destroy());
        this.floorTiles.clear();

        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let val = this.mapMatrix[y][x];

                // Gestion état des objets
                if (val === T_KEY && window.GAME_STATE.items.key) val = T_GRASS;
                if (val === T_PORTAL_HIDDEN && window.GAME_STATE.items.csCut) val = T_GRASS;

                // Textures Sol
                let tex = 'grass';
                if (val === T_PATH || val === T_SPAWN) tex = 'path';

                const pos = isoToScreen(x, y);
                const tile = this.add.image(this.centerX + pos.x, this.centerY + pos.y, tex);
                tile.setDepth(-1000 + (y + x));
                this.floorTiles.set(`${x},${y}`, tile);

                // Objets
                if (val === T_TREE) this.addObj(x, y, 'tree', true, 'tree', false);
                else if (val === T_KEY && !window.GAME_STATE.items.key) this.addObj(x, y, 'item_key', false, 'item_key', false);
                else if (val === T_PORTAL_PUZZLE) this.addObj(x, y, 'portal_tex', true, 'portal_puzzle', false);
                else if (val === T_PORTAL_FINAL) this.addObj(x, y, 'portal_final_tex', true, 'portal_final', false);
                else if (val === T_PORTAL_ANCIENT) {
                    let p = this.addObj(x, y, 'portal_ancient_tex', true, 'portal_ancient', false);
                    p.sprite.setTint(0x888888); // Grisâtre
                }
                else if (val === T_PORTAL_HIDDEN && !window.GAME_STATE.items.csCut) {
                    this.addObj(x, y, 'portal_hidden_tex', true, 'portal_hidden', false);
                }
            }
        }
        this.buildCastle();
    }

    buildCastle() {
        const cx=1, cy=1, cw=6, ch=6;
        for(let i=0; i<cw; i++) {
            this.addObj(cx+i, cy, 'wall_castle', true, 'wall', true);
            this.addObj(cx+i, cy+ch-1, 'wall_castle', true, 'wall', true);
        }
        for(let j=0; j<ch; j++) {
            this.addObj(cx, cy+j, 'wall_castle', true, 'wall', true);
            this.addObj(cx+cw-1, cy+j, 'wall_castle', true, 'wall', true);
        }
        const gateX = cx+3, gateY = cy+ch-1;
        this.removeObjAt(gateX, gateY);

        if (window.GAME_STATE.windosAlive) {
            this.addObj(gateX, gateY, 'windos', true, 'enemy', true);
        }
    }

    addObj(gx, gy, texture, isSolid, type, removeFloor) {
        const pos = isoToScreen(gx, gy);
        if (removeFloor) {
            const key = `${gx},${gy}`;
            if (this.floorTiles.has(key)) {
                this.floorTiles.get(key).destroy();
                this.floorTiles.delete(key);
            }
        }
        const spr = this.add.image(this.centerX + pos.x, this.centerY + pos.y, texture);
        if(type.includes('portal')) spr.setOrigin(0.5, 0.85);
        else if(type.includes('item')) spr.setOrigin(0.5, 0.7);
        else spr.setOrigin(0.5, 0.9);

        spr.setDepth(spr.y);
        this.obstacles.push({ gx, gy, solid: isSolid, type: type, sprite: spr });
        return { sprite: spr };
    }

    removeObjAt(gx, gy) {
        const idx = this.obstacles.findIndex(o => o.gx === gx && o.gy === gy);
        if(idx !== -1) {
            this.obstacles[idx].sprite.destroy();
            this.obstacles.splice(idx, 1);
        }
    }

    update(time) {
        this.player.setDepth(this.player.y);
        if (time > this.lastMove + 150) {
            let dx = 0; let dy = 0;
            if (this.cursors.left.isDown) { dx = -1; this.player.setFlipX(true); }
            else if (this.cursors.right.isDown) { dx = 1; this.player.setFlipX(false); }
            else if (this.cursors.up.isDown) { dy = -1; }
            else if (this.cursors.down.isDown) { dy = 1; }

            if (dx !== 0 || dy !== 0) {
                const nextX = this.playerIso.x + dx;
                const nextY = this.playerIso.y + dy;
                if (this.isValidMove(nextX, nextY)) {
                    this.checkItems(nextX, nextY);
                    this.playerIso.x = nextX;
                    this.playerIso.y = nextY;
                    const newPos = isoToScreen(nextX, nextY);
                    this.tweens.add({
                        targets: this.player,
                        x: this.centerX + newPos.x,
                        y: this.centerY + newPos.y,
                        duration: 100
                    });
                    this.lastMove = time;
                }
            }
        }
    }

    checkItems(x, y) {
        const idx = this.obstacles.findIndex(o => o.gx === x && o.gy === y && o.type === 'item_key');
        if (idx !== -1) {
            this.obstacles[idx].sprite.destroy();
            this.obstacles.splice(idx, 1);
            window.GAME_STATE.items.key = true;
            this.updateInventoryUI();
            this.showUI("Clé Système trouvée !");
        }
    }

	// fonction pour sauvegarder tout le jeu
    saveProgress() {
        const data = {
            gameState: window.GAME_STATE,
            playerPos: this.playerIso
        };
        localStorage.setItem('nird_rpg_save', JSON.stringify(data));
        console.log("Progression sauvegardée dans le LocalStorage.");
    }

    saveProgress(name) {
        const data = {
            gameState: window.GAME_STATE,
            playerPos: this.playerIso
        };
        localStorage.setItem(name, JSON.stringify(data));
        console.log("Progression sauvegardée dans le LocalStorage.");
    }

    updateInventoryUI() {
        const slot1 = document.getElementById('slot-1');
        const slot2 = document.getElementById('slot-2');
        const slot3 = document.getElementById('slot-3');

        if(window.GAME_STATE.items.key) {
            slot1.classList.add('filled'); slot1.title = "Clé Système"; slot1.style.borderColor = "#FFD700";
        }
        if(window.GAME_STATE.items.patch) {
            slot2.classList.add('filled'); slot2.title = "Patch USB"; slot2.innerHTML = "💾"; slot2.style.borderColor = "#00E5FF";
        }
        if(window.GAME_STATE.items.csCut) {
            slot3.classList.add('filled'); slot3.title = "CS-Coupe"; slot3.innerHTML = "✂️"; slot3.style.borderColor = "#9c27b0";
        }
    }

    isValidMove(x, y) {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;

        const obs = this.obstacles.find(o => o.gx === x && o.gy === y);
        if (obs) {
            // CS-COUPE
            if (obs.type === 'tree') {
                if(window.GAME_STATE.items.csCut) {
                    this.showUI("Coupe ! Arbre détruit.");
                    obs.sprite.destroy();
                    this.obstacles.splice(this.obstacles.indexOf(obs), 1);
                    this.mapMatrix[y][x] = T_GRASS;
                    return false;
                } else {
                    return false;
                }
            }
            // PORTAIL SECRET
            if (obs.type === 'portal_hidden') {
                this.showUI("Vous trouvez la CS-Coupe ! Sauvegarde effectuée.");

                // 1. Mettre à jour l'inventaire
                window.GAME_STATE.items.csCut = true;
                this.updateInventoryUI();

                // 2. SAUVEGARDER LE JEU MAINTENANT
                this.saveProgress();

                // 3. Nettoyer l'objet sur la carte
                obs.sprite.destroy();
                this.obstacles.splice(this.obstacles.indexOf(obs), 1);

                setTimeout(() => window.location.href = "../snake/snake.html", 1000);

                return false;
            }
            // ENNEMI
            if (obs.type === 'enemy') {
                if (window.GAME_STATE.items.patch) {
                    this.showUI("Patch appliqué ! WindOS supprimé.");
                    obs.sprite.destroy();
                    this.obstacles.splice(this.obstacles.indexOf(obs), 1);
                    window.GAME_STATE.windosAlive = false;
                    return true;
                } else {
                    this.showUI("WindOS : 'Accès refusé !'");
                    return false;
                }
            }
            // PORTAILS
            if (obs.type === 'portal_puzzle') {
                if(window.GAME_STATE.items.key) {
                    this.showUI("Lancement du Laser Game...");
                    this.saveProgress();
                    this.time.delayedCall(500, () => window.location.href = "../La_Zerguem/la_zerguem.html");
                } else {
                    this.showUI("Portail crypté (Besoin Clé).");
                }
                return false;
            }
            if (obs.type === 'portal_final') {                    
                this.showUI("Lancement de la carte finale...");
                localStorage.removeItem('nird_rpg_save'); // Suppression de la sauvegarde
                localStorage.removeItem('has_won_laser_game'); // Suppression de l'info Laser Game
                this.time.delayedCall(500, () => window.location.href = "../end/end.html");
                return false;
            }
            if (obs.type === 'portal_ancient') {
                this.showUI("Un portail obsolète. Il ne fonctionne plus.");
                return false;
            }

            if (obs.solid) return false;
        }
        return true;
    }

    showUI(text) {
        const div = document.getElementById('ui-message');
        if(div) {
            div.innerText = text;
            div.style.display = 'block';
            if(this.uiTimer) clearTimeout(this.uiTimer);
            this.uiTimer = setTimeout(() => { div.style.display = 'none'; }, 3000);
        }
    }
}

// =========================================================
// SCÈNE 2 : PUZZLE
// =========================================================
class PuzzleScene extends Phaser.Scene {
    constructor() { super({ key: 'PuzzleScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        this.add.text(this.scale.width/2, 50, "Parcours le chemin sans revenir sur tes pas !", {
            font: "20px monospace", fill: "#0f0"
        }).setOrigin(0.5);

        this.gridSize = 8;
        this.tileSize = 50;
        this.startX = (this.scale.width - (this.gridSize * this.tileSize)) / 2;
        this.startY = 150;

        this.tiles = [];
        this.playerPos = { x: 0, y: 0 };
        this.activeTiles = 0;

        const g = this.make.graphics();
        g.fillStyle(0x000000, 0.5); g.fillRect(0,0,48,48); g.lineStyle(2, 0x00ff00); g.strokeRect(0,0,48,48);
        g.generateTexture('tile_empty', 50, 50);
        g.clear(); g.fillStyle(0x00ff00, 0.6); g.fillRect(0,0,48,48);
        g.generateTexture('tile_active', 50, 50);

        for(let y=0; y<this.gridSize; y++) {
            let row = [];
            for(let x=0; x<this.gridSize; x++) {
                let t = this.add.image(this.startX + x*50, this.startY + y*50, 'tile_empty').setOrigin(0);
                row.push({ spr: t, active: false });
            }
            this.tiles.push(row);
        }

        this.player = this.add.image(this.startX + 25, this.startY + 25, 'tux');
        this.activateTile(0, 0);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', this.handleInput, this);
    }

    handleInput(event) {
        let dx = 0; let dy = 0;
        if(event.key === "ArrowUp") dy = -1;
        else if(event.key === "ArrowDown") dy = 1;
        else if(event.key === "ArrowLeft") dx = -1;
        else if(event.key === "ArrowRight") dx = 1;

        if(dx !== 0 || dy !== 0) {
            let nx = this.playerPos.x + dx;
            let ny = this.playerPos.y + dy;

            if(nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                this.playerPos = { x: nx, y: ny };
                this.player.x = this.startX + nx*50 + 25;
                this.player.y = this.startY + ny*50 + 25;

                let tile = this.tiles[ny][nx];
                if(tile.active) {
                    this.cameras.main.shake(200);
                    alert("Circuit brisé !");
                    this.scene.start('VillageScene');
                } else {
                    this.activateTile(nx, ny);
                    if(this.activeTiles === this.gridSize * this.gridSize) {
                        alert("Victoire !");
                        window.GAME_STATE.items.patch = true;
                        this.scene.start('VillageScene');
                    }
                }
            }
        }
    }

    activateTile(x, y) {
        this.tiles[y][x].active = true;
        this.tiles[y][x].spr.setTexture('tile_active');
        this.activeTiles++;
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#000000',
    scene: [ VillageScene, PuzzleScene ],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);
