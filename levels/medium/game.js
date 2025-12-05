// --- CONFIGURATION ISOMÉTRIQUE ---
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const MAP_SIZE = 25;

// --- CODES DE LA MATRICE (Légende) ---
const T_GRASS = 0;       
const T_PATH = 1;        
const T_TREE = 2;        
const T_KEY = 3;         
const T_PORTAL_PUZZLE = 4; 
const T_PORTAL_FINAL = 5;  
const T_PORTAL_HIDDEN = 6; 
const T_PORTAL_ANCIENT = 7; 
const T_PORTAL_JS = 8;      // <--- NOUVEAU : Portail JS
const T_SPAWN = 9;       

// --- ÉTAT GLOBAL (Persistance & Chargement) ---
const SAVED_DATA = localStorage.getItem('nird_rpg_save');
let startPlayerPos = null;

if (SAVED_DATA) {
    console.log("Sauvegarde chargée !");
    const parsed = JSON.parse(SAVED_DATA);
    window.GAME_STATE = parsed.gameState;
    startPlayerPos = parsed.playerPos;
} else {
    window.GAME_STATE = {
        mapMatrix: null,
        items: {
            key: false,     
            patch: false,   
            csCut: false    
        },
        windosAlive: true   
    };
}

// Vérification retour Laser Game
if (localStorage.getItem('has_won_laser_game') === 'true') {
    window.GAME_STATE.items.patch = true;
    window.GAME_STATE.items.key = true;
    // localStorage.removeItem('has_won_laser_game'); // Optionnel : nettoyer
}

function isoToScreen(x, y) {
    const screenX = (x - y) * TILE_WIDTH * 0.5;
    const screenY = (x + y) * TILE_HEIGHT * 0.5;
    return { x: screenX, y: screenY };
}

// =========================================================
// SCÈNE 1 : LE VILLAGE (ISOMÉTRIQUE)
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

        // 8. Portail Puzzle (Cyan Clair)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0x00e5ff, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x00acc1); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_tex', 64, 80);

        // 9. Portail Final (Or)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0xffd700, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0xc6a700); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_final_tex', 64, 80);

        // 10. Portail Secret (Violet)
        g.clear(); g.lineStyle(2, 0xffffff, 0.5); g.fillStyle(0x9c27b0, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x7b1fa2); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_hidden_tex', 64, 80);

        // 11. Portail Ancien (Gris)
        g.clear(); g.lineStyle(2, 0xaaaaaa, 0.5); g.fillStyle(0x555555, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x333333); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_ancient_tex', 64, 80);

        // 12. NOUVEAU : Portail JS (Cyan Foncé / Teal)
        g.clear(); g.lineStyle(2, 0x00ffff, 0.8); g.fillStyle(0x0088aa, 0.7); g.fillEllipse(32, 40, 40, 60); g.strokeEllipse(32, 40, 40, 60);
        g.fillStyle(0x005577); g.fillEllipse(32, 65, 30, 15); g.generateTexture('portal_js_tex', 64, 80);

        // 13. Clé
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

        // Spawn Logic
        if (startPlayerPos) {
            this.playerIso = startPlayerPos;
            startPlayerPos = null;
        }
        else if (window.GAME_STATE.items.patch && !this.playerIso) {
            this.playerIso = { x: 22, y: 3 }; // Retour Puzzle
        }
        else if (!this.playerIso) {
            this.playerIso = { x: 2, y: 22 }; // Spawn normal
        }

        const pPos = isoToScreen(this.playerIso.x, this.playerIso.y);
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
        const matrix = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(T_GRASS));
        const setM = (x, y, val) => { if(x>=0 && x<MAP_SIZE && y>=0 && y<MAP_SIZE) matrix[y][x] = val; };

        const castleRect = { x: 1, y: 1, w: 7, h: 7 };

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
        
        // --- NOUVEAU PORTAIL JS ---
        const portalJsX=3, portalJsY=24; 

        // 1. Spawn
        setM(spawnX, spawnY, T_SPAWN);

        // 2. Chemins
        drawJaggedPath(spawnX, spawnY, castleGateX, castleGateY);
        drawJaggedPath(castleGateX, castleGateY, 12, 12);
        drawJaggedPath(12, 12, forestEntryX, forestEntryY);
        drawJaggedPath(forestEntryX, forestEntryY, portalPuzzleX, portalPuzzleY);
        drawJaggedPath(12, 12, portalAncientX, portalAncientY);
        
        // Chemin vers le nouveau portail
        drawJaggedPath(spawnX, spawnY, portalJsX, portalJsY);

        // 3. Objets
        setM(portalFinalX, portalFinalY, T_PORTAL_FINAL);
        setM(portalPuzzleX, portalPuzzleY, T_PORTAL_PUZZLE); 
        setM(portalHiddenX, portalHiddenY, T_PORTAL_HIDDEN);
        setM(portalAncientX, portalAncientY, T_PORTAL_ANCIENT);
        setM(portalJsX, portalJsY, T_PORTAL_JS); // <--- Placement
        setM(keyX, keyY, T_KEY);

        // Points Protégés
        const protectedPoints = [
            {x: spawnX, y: spawnY},
            {x: keyX, y: keyY}, {x: keyX-1, y: keyY-1},
            {x: portalFinalX, y: portalFinalY},
            {x: portalPuzzleX, y: portalPuzzleY},
            {x: portalHiddenX, y: portalHiddenY},
            {x: portalAncientX, y: portalAncientY},
            {x: portalJsX, y: portalJsY}, // <--- Protection
            {x: castleGateX, y: castleGateY},
            {x: forestEntryX, y: forestEntryY}
        ];

        // Arbres
        for(let y=0; y<MAP_SIZE; y++) {
            for(let x=0; x<MAP_SIZE; x++) {
                if(matrix[y][x] !== T_GRASS) continue;
                if (x >= castleRect.x && x < castleRect.x + castleRect.w &&
                    y >= castleRect.y && y < castleRect.y + castleRect.h) continue;
                
                const isProtected = protectedPoints.some(p => p.x === x && p.y === y);
                if (isProtected) continue;

                if(Phaser.Math.Between(0,100) < 20) matrix[y][x] = T_TREE;
            }
        }

        // Bulldozer (Garantie d'accès)
        const ensureAccessibility = (targetX, targetY) => {
            let cx = 12; let cy = 12;
            while(cx !== targetX || cy !== targetY) {
                if(cx < targetX) cx++; else if(cx > targetX) cx--;
                if(cy < targetY) cy++; else if(cy > targetY) cy--;
                if(matrix[cy][cx] === T_TREE) matrix[cy][cx] = T_GRASS;
            }
        };

        ensureAccessibility(keyX, keyY);             
        ensureAccessibility(portalPuzzleX, portalPuzzleY); 
        ensureAccessibility(portalAncientX, portalAncientY);
        ensureAccessibility(portalJsX, portalJsY); // <--- Accès garanti

        // Chemin secret
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

                if (val === T_KEY && window.GAME_STATE.items.key) val = T_GRASS;
                if (val === T_PORTAL_HIDDEN && window.GAME_STATE.items.csCut) val = T_GRASS;

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
                    p.sprite.setTint(0x888888); 
                }
                else if (val === T_PORTAL_HIDDEN && !window.GAME_STATE.items.csCut) {
                    this.addObj(x, y, 'portal_hidden_tex', true, 'portal_hidden', false);
                }
                // --- Rendu Nouveau Portail ---
                else if (val === T_PORTAL_JS) {
                    this.addObj(x, y, 'portal_js_tex', true, 'portal_js', false);
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

    saveProgress() {
        const data = {
            gameState: window.GAME_STATE,
            playerPos: this.playerIso
        };
        localStorage.removeItem('nird_rpg_save');
        localStorage.setItem('nird_rpg_save', JSON.stringify(data));
        console.log("Progression sauvegardée.");
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
                window.GAME_STATE.items.csCut = true;
                this.updateInventoryUI();
                this.saveProgress();
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
                localStorage.removeItem('nird_rpg_save'); 
                localStorage.removeItem('has_won_laser_game');
                this.time.delayedCall(500, () => window.location.href = "../end/end.html");
                return false;
            }
            if (obs.type === 'portal_ancient') {
                this.showUI("Un portail obsolète. Il ne fonctionne plus.");
                return false;
            }
            
            // --- NOUVEAU PORTAIL VISUALISATION ---
            if (obs.type === 'portal_js') {
                this.showUI("Lancement de la Visualisation Audio...");
                // Sauvegarde 'medium' comme demandé
                localStorage.setItem("previous_map", "medium");
                
                this.time.delayedCall(500, () => window.location.href = "../visualisation-audio/visual-audio.html");
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
// INIT
// =========================================================
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#000000',
    scene: [ VillageScene ],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);