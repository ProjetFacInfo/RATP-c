// --- CONFIGURATION 2D (TOP-DOWN) ---
const TILE_SIZE = 32;
const MAP_SIZE = 25;

// --- CODES DE LA MATRICE (Légende) ---
const T_GRASS = 0;       
const T_PATH = 1;        
const T_TREE = 2;        
const T_PORTAL_FINAL = 5;  
const T_PORTAL_HIDDEN = 6; 
const T_PORTAL_ANCIENT = 7; // Portail Actif (Tycoon)
const T_SPAWN = 9;       

// --- ÉTAT GLOBAL (Persistance) ---
window.GAME_STATE = window.GAME_STATE || {
    mapMatrix: null,
    items: {
        csCut: false    
    },
    windosAlive: true   
};

// Fonction : Convertit Grille -> Écran 2D (Centre de la tuile)
function gridToScreen(x, y) {
    return { 
        x: x * TILE_SIZE + (TILE_SIZE / 2), 
        y: y * TILE_SIZE + (TILE_SIZE / 2) 
    };
}

// =========================================================
// SCÈNE 1 : LE VILLAGE (VUE DE DESSUS)
// =========================================================
class VillageScene extends Phaser.Scene {
    constructor() { super({ key: 'VillageScene' }); }

    preload() {
        const g = this.make.graphics({ add: false });
        
        // 1. Herbe (Carré vert)
        g.fillStyle(0x4caf50); g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x388e3c); g.strokeRect(0, 0, 32, 32);
        g.generateTexture('grass', 32, 32);

        // 2. Chemin (Carré jaune)
        g.clear(); g.fillStyle(0xffca28); g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0xc49000); g.strokeRect(0, 0, 32, 32);
        g.generateTexture('path', 32, 32);

        // 3. Spawn (Carré Rouge)
        g.clear(); g.fillStyle(0xd32f2f); g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0xffffff); g.strokeRect(4,4,24,24);
        g.generateTexture('spawn_point', 32, 32);

        // 4. Mur Château (Carré Gris)
        g.clear(); g.fillStyle(0x757575); g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x424242); g.strokeRect(0, 0, 32, 32);
        g.fillStyle(0x555555); g.fillRect(8, 8, 16, 16); // Relief
        g.generateTexture('wall_castle', 32, 32);

        // 5. Arbre (Rond vert)
        g.clear(); g.fillStyle(0x2e7d32); g.fillCircle(16, 16, 14); 
        g.fillStyle(0x1b5e20); g.fillCircle(16, 16, 4); // Centre
        g.generateTexture('tree', 32, 32);

        // 6. Tux (Rond noir/blanc)
        g.clear(); g.fillStyle(0x111111); g.fillCircle(16, 16, 14); 
        g.fillStyle(0xffffff); g.fillCircle(16, 12, 10); 
        g.fillStyle(0xff9800); g.fillTriangle(12, 8, 20, 8, 16, 16); 
        g.generateTexture('tux', 32, 32);

        // 7. Ennemi WindOS (Carré Bleu)
        g.clear(); g.fillStyle(0x0277bd); g.fillRect(2, 2, 28, 28);
        g.lineStyle(2, 0xffffff); g.strokeRect(2, 2, 28, 28);
        g.generateTexture('windos', 32, 32);

        // 8. Portail Final (Or - Rond)
        g.clear(); g.lineStyle(2, 0xffd700); g.strokeCircle(16, 16, 14);
        g.fillStyle(0xc6a700, 0.7); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_final_tex', 32, 32);
        
        // 9. Portail Secret (Violet - Rond)
        g.clear(); g.lineStyle(2, 0x9c27b0); g.strokeCircle(16, 16, 14);
        g.fillStyle(0x7b1fa2, 0.7); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_hidden_tex', 32, 32);

        // 10. Portail Ancien (Rouge - Rond)
        g.clear(); g.lineStyle(2, 0xff5555); g.strokeCircle(16, 16, 14);
        g.fillStyle(0xaa2222, 0.7); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_ancient_tex', 32, 32);

        // 11. Clé
        g.clear(); g.lineStyle(2, 0xffd700); g.strokeCircle(16, 16, 10); 
        g.lineStyle(2, 0xffd700); g.beginPath(); g.moveTo(16, 20); g.lineTo(22, 26); g.strokePath();
        g.generateTexture('item_key', 32, 32);
    }

    create() {
        this.cameras.main.setBackgroundColor('#222'); // Fond gris foncé

        this.obstacles = [];
        this.floorTiles = new Map();
        
        // Centrage de la carte
        this.mapOffsetX = (this.sys.game.config.width - (MAP_SIZE * TILE_SIZE)) / 2;
        this.mapOffsetY = (this.sys.game.config.height - (MAP_SIZE * TILE_SIZE)) / 2;
        
        // Conteneur pour tout le niveau
        this.levelContainer = this.add.container(this.mapOffsetX, this.mapOffsetY);

        if (!window.GAME_STATE.mapMatrix) this.generateNewMap();
        this.mapMatrix = window.GAME_STATE.mapMatrix;

        this.renderMap();

        // Spawn
        if (!this.playerGridPos) this.playerGridPos = { x: 2, y: 22 };
        const pPos = gridToScreen(this.playerGridPos.x, this.playerGridPos.y);
        
        this.player = this.add.image(pPos.x, pPos.y, 'tux');
        this.levelContainer.add(this.player);

        // Camera follow
        //this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        // On recentre le conteneur par rapport à la caméra
        // Note: En 2D simple, si la map est petite, on peut juste centrer la cam
        //this.cameras.main.setZoom(1.5);
        //this.cameras.main.centerOn(this.mapOffsetX + pPos.x, this.mapOffsetY + pPos.y);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.lastMove = 0;

        this.updateInventoryUI();
        
        if(!window.GAME_STATE.items.csCut) {
            this.showUI("Le Portail Rouge mène au défi Tycoon...");
        }
    }

    generateNewMap() {
        // --- MEME LOGIQUE ROBUSTE QUE LA VERSION ISO ---
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
        const portalHiddenX=0, portalHiddenY=0; 
        const portalAncientX=20, portalAncientY=22; 

        // 1. Spawn & Chemins
        setM(spawnX, spawnY, T_SPAWN);
        drawJaggedPath(spawnX, spawnY, castleGateX, castleGateY);
        drawJaggedPath(castleGateX, castleGateY, 12, 12);
        drawJaggedPath(12, 12, forestEntryX, forestEntryY);
        drawJaggedPath(forestEntryX, forestEntryY, portalAncientX, portalAncientY);

        // 2. Objets (Après les chemins)
        setM(portalFinalX, portalFinalY, T_PORTAL_FINAL);
        setM(portalHiddenX, portalHiddenY, T_PORTAL_HIDDEN);
        setM(portalAncientX, portalAncientY, T_PORTAL_ANCIENT);

        // 3. Protection
        const protectedPoints = [
            {x: spawnX, y: spawnY},
            {x: portalFinalX, y: portalFinalY}, {x: portalHiddenX, y: portalHiddenY},
            {x: portalAncientX, y: portalAncientY},
            {x: castleGateX, y: castleGateY}, {x: forestEntryX, y: forestEntryY}
        ];

        // 4. Arbres
        for(let y=0; y<MAP_SIZE; y++) {
            for(let x=0; x<MAP_SIZE; x++) {
                if(matrix[y][x] !== T_GRASS) continue;
                if (x >= castleRect.x && x < castleRect.x + castleRect.w && y >= castleRect.y && y < castleRect.y + castleRect.h) continue;
                if (protectedPoints.some(p => p.x === x && p.y === y)) continue;
                if(Phaser.Math.Between(0,100) < 20) matrix[y][x] = T_TREE;
            }
        }
        
        // 5. Bulldozer
        const ensureAccessibility = (targetX, targetY) => {
            let cx = 12; let cy = 12; 
            while(cx !== targetX || cy !== targetY) {
                if(cx < targetX) cx++; else if(cx > targetX) cx--;
                if(cy < targetY) cy++; else if(cy > targetY) cy--;
                if(matrix[cy][cx] === T_TREE) matrix[cy][cx] = T_GRASS; 
            }
        };
        ensureAccessibility(portalAncientX, portalAncientY); 
        for(let x=0; x<10; x++) { if(matrix[0][x] === T_TREE) matrix[0][x] = T_GRASS; }
        for(let y=0; y<5; y++) { if(matrix[y][0] === T_TREE) matrix[y][0] = T_GRASS; }

        window.GAME_STATE.mapMatrix = matrix;
    }

    renderMap() {
        this.obstacles = [];
        // Nettoyage conteneur sauf player
        this.levelContainer.each(child => {
            if (child !== this.player) child.destroy();
        });

        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let val = this.mapMatrix[y][x];
                
                if (val === T_PORTAL_HIDDEN && window.GAME_STATE.items.csCut) val = T_GRASS; 

                let tex = 'grass';
                if (val === T_PATH || val === T_SPAWN) tex = 'path';
                
                const pos = gridToScreen(x, y);
                // Sol
                const tile = this.add.image(pos.x, pos.y, tex);
                this.levelContainer.add(tile);
                this.levelContainer.sendToBack(tile); // Le sol toujours en bas

                // Objets
                let objTex = null;
                let solid = false;
                let type = 'prop';

                if (val === T_TREE) { objTex = 'tree'; solid = true; type='tree'; }
                else if (val === T_PORTAL_FINAL) { objTex = 'portal_final_tex'; type='portal_final'; solid=false; }
                else if (val === T_PORTAL_ANCIENT) { objTex = 'portal_ancient_tex'; type='portal_ancient'; solid=false; }
                else if (val === T_PORTAL_HIDDEN && !window.GAME_STATE.items.csCut) { objTex = 'portal_hidden_tex'; type='portal_hidden'; solid=false; }

                if (objTex) {
                    const obj = this.add.image(pos.x, pos.y, objTex);
                    this.levelContainer.add(obj);
                    this.obstacles.push({ gx: x, gy: y, solid: solid, type: type, sprite: obj });
                }
            }
        }
        this.buildCastle2D();
    }

    buildCastle2D() {
        const cx=1, cy=1, cw=6, ch=6;
        for(let y=cy; y<cy+ch; y++) {
            for(let x=cx; x<cx+cw; x++) {
                // Murs sur le périmètre
                if(x===cx || x===cx+cw-1 || y===cy || y===cy+ch-1) {
                    // Porte Sud
                    if(x === cx+3 && y === cy+ch-1) {
                        if (window.GAME_STATE.windosAlive) {
                            const pos = gridToScreen(x, y);
                            const w = this.add.image(pos.x, pos.y, 'windos');
                            this.levelContainer.add(w);
                            this.obstacles.push({ gx: x, gy: y, solid: true, type: 'enemy', sprite: w });
                        }
                    } else {
                        const pos = gridToScreen(x, y);
                        const w = this.add.image(pos.x, pos.y, 'wall_castle');
                        this.levelContainer.add(w);
                        this.obstacles.push({ gx: x, gy: y, solid: true, type: 'wall' });
                    }
                }
            }
        }
    }

    update(time) {
        if (time > this.lastMove + 150) {
            let dx = 0; let dy = 0;
            if (this.cursors.left.isDown) dx = -1;
            else if (this.cursors.right.isDown) dx = 1;
            else if (this.cursors.up.isDown) dy = -1;
            else if (this.cursors.down.isDown) dy = 1;

            if (dx !== 0 || dy !== 0) {
                const nx = this.playerGridPos.x + dx;
                const ny = this.playerGridPos.y + dy;

                if (this.isValidMove(nx, ny)) {
                    // Check items sur la case (car pas solides)
                    this.checkItems(nx, ny);

                    this.playerGridPos.x = nx;
                    this.playerGridPos.y = ny;
                    const dest = gridToScreen(nx, ny);
                    
                    this.tweens.add({
                        targets: this.player,
                        x: dest.x,
                        y: dest.y,
                        duration: 100
                    });
                    
                    this.lastMove = time;
                }
            }
        }
    }

    checkItems(x, y) {
        return;
    }

    updateInventoryUI() {
        const slot3 = document.getElementById('slot-3');
        
        if(window.GAME_STATE.items.csCut) {
            slot3.classList.add('filled'); slot3.title = "CS-Coupe"; slot3.innerHTML = "✂️"; slot3.style.borderColor = "#9c27b0";
        }
    }

    isValidMove(x, y) {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
        
        const obs = this.obstacles.find(o => o.gx === x && o.gy === y);
        if (obs) {
            // CS-COUPE (Arbres)
            if (obs.type === 'tree') {
                if(window.GAME_STATE.items.csCut) {
                    this.showUI("Coupe ! Arbre détruit.");
                    obs.sprite.destroy();
                    this.obstacles.splice(this.obstacles.indexOf(obs), 1);
                    this.mapMatrix[y][x] = T_GRASS; 
                    return false; // On attend le prochain tour pour avancer
                } else {
                    return false;
                }
            }
            // PORTAIL SECRET
            if (obs.type === 'portal_hidden') {
                this.showUI("Vous trouvez la CS-Coupe !");
                window.GAME_STATE.items.csCut = true;
                this.updateInventoryUI();
                obs.sprite.destroy(); 
                this.obstacles.splice(this.obstacles.indexOf(obs), 1);
                return false;
            }
            // ENNEMI
            if (obs.type === 'enemy') {
                 this.showUI("WindOS : 'Accès refusé !'");
                 return false;
            }
            // PORTAIL FINAL
            if (obs.type === 'portal_final') {
                this.showUI("Victoire ! Système Linux restauré.");
                return false;
            }
            // PORTAIL ANCIEN -> TYCOON
            if (obs.type === 'portal_ancient') {
                this.showUI("Chargement du NIRD Tycoon...");
                startTycoonMinigame(); // Lancement du minijeu externe
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
// MINIGAME : CHARGEMENT DU TYCOON EXTERNE (IFRAME)
// =========================================================
function startTycoonMinigame() {
    const overlay = document.createElement('div');
    overlay.id = 'tycoon-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '9999';
    overlay.style.backgroundColor = '#000';
    
    const iframe = document.createElement('iframe');
    iframe.src = '../Nird_Tycoon_2025/nird_tycoon.html'; 
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    document.getElementById('game-container').style.display = 'none';

    window.addEventListener('message', function(event) {
        if (event.data === 'TYCOON_VICTORY') {
            closeTycoon(true);
        } else if (event.data === 'TYCOON_EXIT') {
            closeTycoon(false); 
        }
    }, { once: true });
}

function closeTycoon(victory) {
    const overlay = document.getElementById('tycoon-overlay');
    if(overlay) overlay.remove();

    document.getElementById('game-container').style.display = 'block';

    if (victory) {
        window.GAME_STATE.windosAlive = false;
        game.scene.getScene('VillageScene').scene.restart();
    }
}

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