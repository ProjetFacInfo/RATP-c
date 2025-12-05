import * as THREE from 'three';

// --- SCÈNE & LUMIÈRE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.Fog(0xaaccff, 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 5, 12);
camera.lookAt(0, 2, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(30, 50, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// --- DÉCORS ---
// Sol
const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 1000), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2; 
ground.receiveShadow = true; 
scene.add(ground);

// Arbres
function createTree(x, z, scale) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3*scale, 0.5*scale, 2*scale, 6), new THREE.MeshStandardMaterial({ color: 0x4d2926 }));
    trunk.position.y = 1*scale; trunk.castShadow = true; group.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.5*scale, 5*scale, 6), new THREE.MeshStandardMaterial({ color: 0x2d5a27, flatShading: true }));
    leaves.position.y = 3.5*scale; leaves.castShadow = true; group.add(leaves);
    group.position.set(x, 0, z); scene.add(group);
}
for (let i=0; i<80; i++) createTree((Math.random()*50+15)*(Math.random()>0.5?1:-1), -Math.random()*400+50, Math.random()*0.5+0.8);

// Ligne d'arrivée
const finishLineDist = -250;
const canvas = document.createElement('canvas'); canvas.width=64; canvas.height=64; const ctx=canvas.getContext('2d');
ctx.fillStyle='#d32f2f'; ctx.fillRect(0,0,32,64); ctx.fillStyle='#ffffff'; ctx.fillRect(32,0,32,64);
const finishTex=new THREE.CanvasTexture(canvas); finishTex.wrapS=THREE.RepeatWrapping; finishTex.repeat.set(10,1);
const finishLine=new THREE.Mesh(new THREE.BoxGeometry(50,0.2,4), new THREE.MeshStandardMaterial({map:finishTex}));
finishLine.position.set(0,0.1,finishLineDist); scene.add(finishLine);

// Neige
const snowGeo = new THREE.BufferGeometry();
const snowCount = 600;
const posArray = new Float32Array(snowCount * 3);
for(let i=0; i<snowCount*3; i++) posArray[i] = (Math.random() - 0.5) * 120;
snowGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const snowMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.25, transparent: true, opacity: 0.8});
const snowSystem = new THREE.Points(snowGeo, snowMat);
scene.add(snowSystem);

// --- MODÈLE TUX ---
const tuxGroup = new THREE.Group();
scene.add(tuxGroup);
const tuxModel = new THREE.Group();
tuxGroup.add(tuxModel);

const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });

const body = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), blackMat);
body.scale.set(1.1, 1.15, 1.1); body.position.y = 2.2; body.castShadow = true; tuxModel.add(body);

const belly = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 32), whiteMat);
belly.scale.set(1, 0.95, 0.5); belly.position.set(0, 2.3, -1.05); tuxModel.add(belly);

const headGroup = new THREE.Group(); headGroup.position.set(0, 3.9, 0); tuxModel.add(headGroup);
const head = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 32), blackMat); head.castShadow = true; headGroup.add(head);
const face = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), whiteMat); face.scale.set(1, 1, 0.5); face.position.set(0, 0, -0.9); face.rotation.x = 0.1; headGroup.add(face);

const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
const eyeL = new THREE.Mesh(eyeGeo, whiteMat); eyeL.position.set(-0.45, 0.2, -1.35); headGroup.add(eyeL);
const eyeR = new THREE.Mesh(eyeGeo, whiteMat); eyeR.position.set(0.45, 0.2, -1.35); headGroup.add(eyeR);
const pupilGeo = new THREE.SphereGeometry(0.12, 16, 16);
const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const pupilL = new THREE.Mesh(pupilGeo, pupilMat); pupilL.position.set(-0.45, 0.3, -1.6); headGroup.add(pupilL);
const pupilR = new THREE.Mesh(pupilGeo, pupilMat); pupilR.position.set(0.45, 0.3, -1.6); headGroup.add(pupilR);

const beak = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 16), yellowMat);
beak.rotation.x = -Math.PI / 2; beak.scale.set(1.5, 1, 0.5); beak.position.set(0, -0.1, -1.6); headGroup.add(beak);

const flipperGeo = new THREE.CapsuleGeometry(0.25, 2.5, 16, 8);
const flipperL = new THREE.Mesh(flipperGeo, blackMat); flipperL.position.set(-2.1, 2.8, 0); flipperL.rotation.set(0, 0, Math.PI/4); flipperL.scale.z=0.2; flipperL.castShadow=true; tuxModel.add(flipperL);
const flipperR = flipperL.clone(); flipperR.position.set(2.1, 2.8, 0); flipperR.rotation.set(0, 0, -Math.PI/4); tuxModel.add(flipperR);

const feetGroup = new THREE.Group(); tuxModel.add(feetGroup);
const footGeo = new THREE.BoxGeometry(1.3, 0.3, 2.2);
const footL = new THREE.Mesh(footGeo, yellowMat); footL.position.set(-1.1, 0.15, 0); footL.rotation.y=-0.1; footL.castShadow=true; feetGroup.add(footL);
const footR = footL.clone(); footR.position.set(1.1, 0.15, 0); footR.rotation.y=0.1; feetGroup.add(footR);

// --- LOGIQUE JEU ---
let gameState = 'waiting';
let power = 0;
let velocity = 0;
let chargeSpeed = 1.5;
let friction = 0.992;
let isPressing = false;

const uiStart = document.getElementById('start-screen');
const uiBarCont = document.getElementById('power-bar-container');
const uiBar = document.getElementById('power-bar');
const uiMessage = document.getElementById('message');
const uiResultText = document.getElementById('result-text');
const nextBtn = document.getElementById('next-btn'); // Le bouton continuer

function startPress() {
    if (gameState === 'waiting') {
        gameState = 'charging'; isPressing = true;
        uiStart.style.display = 'none'; uiBarCont.style.display = 'block';
    }
}
function endPress() {
    if (gameState === 'charging') {
        isPressing = false; gameState = 'sliding';
        velocity = (power / 100) * 4.5; uiBarCont.style.display = 'none';
    }
}

window.addEventListener('mousedown', startPress); window.addEventListener('mouseup', endPress);
window.addEventListener('touchstart', (e)=>{e.preventDefault();startPress()},{passive:false});
window.addEventListener('touchend', (e)=>{e.preventDefault();endPress()},{passive:false});
window.addEventListener('keydown', (e)=>{if(e.code==='Space')startPress()});
window.addEventListener('keyup', (e)=>{if(e.code==='Space')endPress()});

function animate() {
    requestAnimationFrame(animate);

    // Neige
    const positions = snowGeo.attributes.position.array;
    for(let i=1; i<positions.length; i+=3) {
        positions[i] -= 0.2;
        if(positions[i] < 0) positions[i] = 50;
        if(gameState === 'sliding') {
            positions[i+1] += velocity * 2;
            if(positions[i+1] > 20) positions[i+1] = -100;
        }
    }
    snowGeo.attributes.position.needsUpdate = true;

    if (gameState === 'charging') {
        if (isPressing) {
            power += chargeSpeed; if (power >= 100 || power <= 0) chargeSpeed *= -1;
            uiBar.style.width = Math.max(0, Math.min(100, power)) + '%';
            tuxModel.rotation.z = (Math.random() - 0.5) * 0.1;
            tuxModel.scale.y = 1 - (power/100)*0.1;
        }
    }
    else if (gameState === 'sliding') {
        tuxGroup.position.z -= velocity;
        velocity *= friction;

        // Animations Glisse
        tuxModel.rotation.x = THREE.MathUtils.lerp(tuxModel.rotation.x, -1.5, 0.08);
        tuxGroup.position.y = THREE.MathUtils.lerp(tuxGroup.position.y, -0.6, 0.08);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 1.3, 0.08);
        feetGroup.rotation.x = THREE.MathUtils.lerp(feetGroup.rotation.x, -0.8, 0.08);
        flipperL.rotation.z = THREE.MathUtils.lerp(flipperL.rotation.z, Math.PI/1.8, 0.1);
        flipperR.rotation.z = THREE.MathUtils.lerp(flipperR.rotation.z, -Math.PI/1.8, 0.1);
        
        // Caméra
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, tuxGroup.position.z + 10, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.5, 0.1);
        camera.lookAt(0, 1, tuxGroup.position.z - 20);

        if (velocity < 0.05) { velocity = 0; gameState = 'ended'; checkWin(); }
    } 
    else if (gameState === 'ended') {
        // Redressement
        tuxGroup.position.y = THREE.MathUtils.lerp(tuxGroup.position.y, 0, 0.05);
        tuxModel.rotation.x = THREE.MathUtils.lerp(tuxModel.rotation.x, 0, 0.05);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0, 0.05);
        feetGroup.rotation.x = THREE.MathUtils.lerp(feetGroup.rotation.x, 0, 0.05);
        flipperL.rotation.z = THREE.MathUtils.lerp(flipperL.rotation.z, Math.PI/4, 0.05);
        flipperR.rotation.z = THREE.MathUtils.lerp(flipperR.rotation.z, -Math.PI/4, 0.05);
        tuxGroup.position.y += Math.sin(Date.now() * 0.005) * 0.005; // Idle
    }
    else if (gameState === 'waiting') {
        tuxModel.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.02;
        camera.position.set(0, 5, 12); camera.lookAt(0, 2, -10);
    }
    renderer.render(scene, camera);
}

function checkWin() {
    uiMessage.style.display = 'block';
    
    // CONDITION DE VICTOIRE
    if (tuxGroup.position.z <= finishLineDist) {
        uiResultText.innerHTML = "<span class='win-text'>Champion !</span><br>Tux a franchi la ligne !";
        nextBtn.style.display = 'inline-block'; // AFFICHER LE BOUTON
    } else {
        const remaining = Math.round(tuxGroup.position.z - finishLineDist);
        uiResultText.innerHTML = `<span class='lose-text'>Raté...</span><br>Encore ${remaining}m.<br>Réessaie !`;
        nextBtn.style.display = 'none'; // CACHER LE BOUTON
    }
}

window.resetGame = function() {
    tuxGroup.position.set(0, 0, 0); 
    tuxModel.rotation.set(0,0,0);
    gameState = 'waiting'; 
    power = 0; velocity = 0;
    
    // Réinitialiser les parties du corps
    headGroup.rotation.x = 0; 
    feetGroup.rotation.x = 0;
    flipperL.rotation.z = Math.PI/4; 
    flipperR.rotation.z = -Math.PI/4;
    
    uiMessage.style.display = 'none'; 
    uiStart.style.display = 'block'; 
    uiBar.style.width = '0%';
    
    nextBtn.style.display = 'none'; // CACHER LE BOUTON AU RESET
}

window.addEventListener('resize', () => { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
});

animate();