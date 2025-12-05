// --- CONFIGURATION 2D VUE DE DESSUS ---
const TILE_SIZE = 32; // Tuiles carrées
const MAP_SIZE = 25;

// --- CODES DE LA MATRICE (Identique à la version Medium) ---
const T_GRASS = 0;       
const T_PATH = 1;        
const T_TREE = 2;        
const T_KEY = 3;         
const T_PORTAL_PUZZLE = 4; 
const T_PORTAL_FINAL = 5;  
const T_PORTAL_HIDDEN = 6; 
const T_PORTAL_ANCIENT = 7; 
const T_SPAWN = 9;       

// --- ÉTAT GLOBAL ---
window.GAME_STATE = window.GAME_STATE || {
    mapMatrix: null,
    items: { key: false, patch: false, csCut: false },
    windosAlive: true
};

// Fonction Simple : Convertit Grille -> Écran 2D (X, Y)
function gridToScreen(x, y) {
    return { 
        x: x * TILE_SIZE + (TILE_SIZE / 2), 
        y: y * TILE_SIZE + (TILE_SIZE / 2) 
    };
}

// =========================================================
// SCÈNE INTRO : VUE DE DESSUS (TOP-DOWN)
// =========================================================
class IntroScene extends Phaser.Scene {
    constructor() { super({ key: 'IntroScene' }); }

    preload() {
        const g = this.make.graphics({ add: false });
        
        // 1. Herbe (Carré vert simple)
        g.fillStyle(0x4caf50); g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x388e3c); g.strokeRect(0, 0, 32, 32);
        g.generateTexture('grass', 32, 32);

        // 2. Chemin (Carré jaune terreux)
        g.clear(); g.fillStyle(0xffca28); g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0xc49000); g.strokeRect(0, 0, 32, 32);
        g.generateTexture('path', 32, 32);

        // 3. Spawn (Carré Rouge avec un X)
        g.clear(); g.fillStyle(0xd32f2f); g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0xffffff); g.beginPath(); g.moveTo(4,4); g.lineTo(28,28); g.moveTo(28,4); g.lineTo(4,28); g.strokePath();
        g.generateTexture('spawn_point', 32, 32);

        // 4. Mur Château (Carré Gris pierre vue de haut)
        g.clear(); g.fillStyle(0x757575); g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x424242); g.strokeRect(0, 0, 32, 32); // Bordure
        g.fillStyle(0x555555); g.fillRect(8, 8, 16, 16); // Détail relief
        g.generateTexture('wall_castle', 32, 32);

        // 5. Arbre (Rond vue de dessus)
        g.clear(); g.fillStyle(0x2e7d32, 0.8); g.fillCircle(16, 16, 14); // Feuillage
        g.fillStyle(0x1b5e20); g.fillCircle(16, 16, 4); // Centre (Tronc vu de haut)
        g.generateTexture('tree', 32, 32);

        // 6. Tux (Rond bleu/noir)
        g.clear(); g.fillStyle(0x111111); g.fillCircle(16, 16, 14); // Corps
        g.fillStyle(0xffffff); g.fillCircle(16, 12, 10); // Tête/Ventre
        g.fillStyle(0xff9800); g.fillTriangle(12, 8, 20, 8, 16, 16); // Bec
        g.generateTexture('tux', 32, 32);

        // 7. Ennemi WindOS (Carré Bleu)
        g.clear(); g.fillStyle(0x0277bd); g.fillRect(2, 2, 28, 28);
        g.lineStyle(2, 0xffffff); g.strokeRect(2, 2, 28, 28);
        g.generateTexture('windos', 32, 32);

        // 8. Portail Puzzle (Cyan - Cercles concentriques)
        g.clear(); g.lineStyle(2, 0x00e5ff); g.strokeCircle(16, 16, 14);
        g.fillStyle(0x00acc1, 0.5); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_tex', 32, 32);

        // 9. Portail Final (Or)
        g.clear(); g.lineStyle(2, 0xffd700); g.strokeCircle(16, 16, 14);
        g.fillStyle(0xc6a700, 0.5); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_final_tex', 32, 32);

        // 10. Portail Secret (Violet)
        g.clear(); g.lineStyle(2, 0x9c27b0); g.strokeCircle(16, 16, 14);
        g.fillStyle(0x7b1fa2, 0.5); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_hidden_tex', 32, 32);

        // 11. Portail Ancien (Gris/Rouge)
        g.clear(); g.lineStyle(2, 0xaa4444); g.strokeCircle(16, 16, 14);
        g.fillStyle(0x552222, 0.5); g.fillCircle(16, 16, 10);
        g.generateTexture('portal_ancient_tex', 32, 32);

        // 12. Clé
        g.clear(); g.lineStyle(2, 0xffd700); g.strokeCircle(16, 16, 8);
        g.lineStyle(2, 0xffd700); g.beginPath(); g.moveTo(16, 24); g.lineTo(24, 24); g.strokePath();
        g.generateTexture('item_key', 32, 32);
    }

    create() {
        this.cameras.main.setBackgroundColor('#222222'); // Fond gris foncé
        
        // Centrer la caméra
        this.centerX = (this.sys.game.config.width - (MAP_SIZE * TILE_SIZE)) / 2;
        this.centerY = (this.sys.game.config.height - (MAP_SIZE * TILE_SIZE)) / 2;
        
        // Conteneur pour tout le niveau (permet de centrer la grille)
        this.levelContainer = this.add.container(this.centerX, this.centerY);

        this.obstacles = [];
        this.floorTiles = new Map();

        // On réutilise la MEME logique de génération que le niveau Medium
        if (!window.GAME_STATE.mapMatrix) this.generateNewMap();
        this.mapMatrix = window.GAME_STATE.mapMatrix;

        this.renderMap();

        // Spawn
        if (!this.playerGridPos) this.playerGridPos = { x: 2, y: 22 };
        const pPos = gridToScreen(this.playerGridPos.x, this.playerGridPos.y);
        
        this.player = this.add.image(pPos.x, pPos.y, 'tux');
        this.levelContainer.add(this.player);

        // Caméra
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(this.centerX + pPos.x, this.centerY + pPos.y);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.lastMove = 0;
    }

    // --- MÊME LOGIQUE DE GÉNÉRATION QUE MEDIUM (Copier/Coller fonctionnel) ---
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

        setM(spawnX, spawnY, T_SPAWN);
        drawJaggedPath(spawnX, spawnY, castleGateX, castleGateY);
        drawJaggedPath(castleGateX, castleGateY, 12, 12);
        drawJaggedPath(12, 12, forestEntryX, forestEntryY);
        drawJaggedPath(forestEntryX, forestEntryY, portalPuzzleX, portalPuzzleY);
        drawJaggedPath(12, 12, portalAncientX, portalAncientY);

        setM(portalFinalX, portalFinalY, T_PORTAL_FINAL);
        setM(portalPuzzleX, portalPuzzleY, T_PORTAL_PUZZLE);
        setM(portalHiddenX, portalHiddenY, T_PORTAL_HIDDEN);
        setM(portalAncientX, portalAncientY, T_PORTAL_ANCIENT);
        setM(keyX, keyY, T_KEY);

        const protectedPoints = [
            {x: spawnX, y: spawnY}, {x: keyX, y: keyY}, {x: keyX-1, y: keyY-1},
            {x: portalFinalX, y: portalFinalY}, {x: portalPuzzleX, y: portalPuzzleY},
            {x: portalHiddenX, y: portalHiddenY}, {x: portalAncientX, y: portalAncientY},
            {x: castleGateX, y: castleGateY}, {x: forestEntryX, y: forestEntryY}
        ];

        for(let y=0; y<MAP_SIZE; y++) {
            for(let x=0; x<MAP_SIZE; x++) {
                if(matrix[y][x] !== T_GRASS) continue;
                if (x >= castleRect.x && x < castleRect.x + castleRect.w && y >= castleRect.y && y < castleRect.y + castleRect.h) continue;
                if (protectedPoints.some(p => p.x === x && p.y === y)) continue;
                if(Phaser.Math.Between(0,100) < 20) matrix[y][x] = T_TREE;
            }
        }
        
        // Nettoyage Bulldozer
        const ensureAccess = (tx, ty) => {
            let cx = 12, cy = 12;
            while(cx !== tx || cy !== ty) {
                if(cx < tx) cx++; else if(cx > tx) cx--;
                if(cy < ty) cy++; else if(cy > ty) cy--;
                if(matrix[cy][cx] === T_TREE) matrix[cy][cx] = T_GRASS;
            }
        };
        ensureAccess(keyX, keyY); ensureAccess(portalPuzzleX, portalPuzzleY); ensureAccess(portalAncientX, portalAncientY);
        for(let x=0; x<10; x++) { if(matrix[0][x] === T_TREE) matrix[0][x] = T_GRASS; }

        window.GAME_STATE.mapMatrix = matrix;
    }

    renderMap() {
        // Dessin "à plat"
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let val = this.mapMatrix[y][x];
                // Masquer items pris
                if (val === T_KEY && window.GAME_STATE.items.key) val = T_GRASS;
                if (val === T_PORTAL_HIDDEN && window.GAME_STATE.items.csCut) val = T_GRASS;

                let tex = 'grass';
                if (val === T_PATH || val === T_SPAWN) tex = 'path';

                const pos = gridToScreen(x, y);
                // Fond (Sol)
                const tile = this.add.image(pos.x, pos.y, tex);
                this.levelContainer.add(tile);

                // Objets (Par dessus le sol)
                let objTex = null;
                let solid = false;
                let type = 'prop';

                if (val === T_TREE) { objTex = 'tree'; solid = true; type='tree'; }
                else if (val === T_KEY && !window.GAME_STATE.items.key) { objTex = 'item_key'; type='item_key'; }
                else if (val === T_PORTAL_PUZZLE) { objTex = 'portal_tex'; type='portal_puzzle'; solid=true; }
                else if (val === T_PORTAL_FINAL) { objTex = 'portal_final_tex'; type='portal_final'; solid=true; }
                else if (val === T_PORTAL_ANCIENT) { objTex = 'portal_ancient_tex'; type='portal_ancient'; solid=true; }
                else if (val === T_PORTAL_HIDDEN && !window.GAME_STATE.items.csCut) { objTex = 'portal_hidden_tex'; type='portal_hidden'; solid=true; }

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
        // Création des murs "carrés"
        for(let y=cy; y<cy+ch; y++) {
            for(let x=cx; x<cx+cw; x++) {
                // On dessine le contour seulement
                if(x===cx || x===cx+cw-1 || y===cy || y===cy+ch-1) {
                    // Sauf la porte
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
                    // Logic Items
                    const itemIdx = this.obstacles.findIndex(o => o.gx === nx && o.gy === ny && o.type === 'item_key');
                    if(itemIdx !== -1) {
                        this.obstacles[itemIdx].sprite.destroy();
                        this.obstacles.splice(itemIdx, 1);
                        window.GAME_STATE.items.key = true;
                        alert("Clé trouvée !");
                    }

                    this.playerGridPos.x = nx;
                    this.playerGridPos.y = ny;
                    const dest = gridToScreen(nx, ny);
                    
                    this.tweens.add({
                        targets: this.player,
                        x: dest.x,
                        y: dest.y,
                        duration: 100
                    });
                    
                    // Suivi caméra fluide
                    this.tweens.add({
                        targets: this.cameras.main,
                        scrollX: (this.centerX + dest.x) - this.cameras.main.width/2,
                        scrollY: (this.centerY + dest.y) - this.cameras.main.height/2,
                        duration: 100
                    });

                    this.lastMove = time;
                }
            }
        }
    }

    isValidMove(x, y) {
        if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return false;
        const obs = this.obstacles.find(o => o.gx === x && o.gy === y);
        if (obs) {
            if (obs.solid) return false;
        }
        return true;
    }
}

// Config simplifiée pour la démo 2D
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [ IntroScene ],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

const game = new Phaser.Game(config);