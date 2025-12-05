import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

let scene, camera, renderer, composer;
let core, gridTop, gridBottom;
let spectrumGroup;
let windowsGroup = [];

let penguinsArray = [];
let penguinTex;
let canLaunch = true; 

let analyser, dataArray, audioContext;
let baseFov = 75;

// --- CRÉATION DE TEXTURES ---

function createTextTexture(text, color, bgColor) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = bgColor; ctx.fillRect(0,0, 256, 128);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8; ctx.strokeRect(0,0, 256, 128);
    ctx.fillStyle = color; ctx.font = "bold 40px Consolas"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 64); return new THREE.CanvasTexture(canvas);
}
const texBSOD = createTextTexture("ERROR", "#fff", "#0000aa");
const texWARN = createTextTexture("ALERT", "#000", "#ffcc00");

function createPenguinTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128; 
    const ctx = canvas.getContext('2d'); const cx = 64; const cy = 64;
    
    // Couleurs grisées pour réduire la luminosité du bloom
    ctx.fillStyle = "#cccccc"; ctx.beginPath(); ctx.ellipse(cx, cy, 52, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111111"; ctx.beginPath(); ctx.ellipse(cx, cy, 48, 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#bbbbbb"; ctx.beginPath(); ctx.moveTo(cx, cy-20); ctx.bezierCurveTo(cx+40, cy-10, cx+30, cy+50, cx, cy+55); ctx.bezierCurveTo(cx-30, cy+50, cx-40, cy-10, cx, cy-20); ctx.fill();
    ctx.fillStyle = "#dddddd"; ctx.beginPath(); ctx.arc(cx-15, cy-25, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+15, cy-25, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(cx-15, cy-25, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+15, cy-25, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#ff9900"; ctx.beginPath(); ctx.moveTo(cx-10, cy-5); ctx.lineTo(cx+10, cy-5); ctx.lineTo(cx, cy+15); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx-25, cy+55, 15, 8, Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+25, cy+55, 15, 8, -Math.PI/4, 0, Math.PI*2); ctx.fill();
    
    const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.NearestFilter; return tex;
}

// --- INITIALISATION ---

function init() {
    scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000000, 0.02);
    // Caméra reculée pour voir le gros noyau
    camera = new THREE.PerspectiveCamera(baseFov, window.innerWidth / window.innerHeight, 0.1, 1000); camera.position.set(0, 0, 50);
    
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85); bloomPass.threshold = 0; bloomPass.strength = 1.6; bloomPass.radius = 0.5;
    composer = new EffectComposer(renderer); composer.addPass(renderScene); composer.addPass(bloomPass);
    
    penguinTex = createPenguinTexture();
    createWorld(); createSpectrum();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function createWorld() {
    // Noyau XXL
    const geoCore = new THREE.IcosahedronGeometry(12, 2); const matCore = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    core = new THREE.Mesh(geoCore, matCore); const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    core.add(inner); scene.add(core);
    
    const gridHelper = new THREE.GridHelper(200, 40, 0x004400, 0x002200);
    gridBottom = gridHelper; gridBottom.position.y = -15; scene.add(gridBottom);
    gridTop = gridHelper.clone(); gridTop.position.y = 15; scene.add(gridTop);
    
    const planeGeo = new THREE.PlaneGeometry(3, 1.5);
    for(let i=0; i<40; i++) {
        const mat = Math.random()>0.5 ? new THREE.MeshBasicMaterial({ map: texBSOD }) : new THREE.MeshBasicMaterial({ map: texWARN });
        const mesh = new THREE.Mesh(planeGeo, mat);
        const angle = Math.random() * Math.PI * 2; const r = 35 + Math.random() * 30;
        mesh.position.set(Math.cos(angle)*r, Math.sin(angle)*r, (Math.random()-0.5)*100);
        mesh.userData = { baseX: mesh.position.x, baseY: mesh.position.y, speed: Math.random()*0.5 + 0.1 };
        scene.add(mesh); windowsGroup.push(mesh);
    }
}

function createSpectrum() {
    spectrumGroup = new THREE.Group(); const count = 64; const radius = 22; const barGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5); const barMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    for(let i=0; i<count; i++) {
        const mesh = new THREE.Mesh(barGeo, barMat);
        const angle = (i / count) * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0); mesh.rotation.z = angle;
        spectrumGroup.add(mesh);
    }
    scene.add(spectrumGroup);
}

function launchPenguin() {
    // Couleur grise pour réduire la luminosité du bloom
    const material = new THREE.SpriteMaterial({ map: penguinTex, color: 0x999999 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(8, 8, 1); sprite.position.set(0, 0, 0); 
    const angle = Math.random() * Math.PI * 2;
    // Vitesse ralentie
    const speedXY = 0.1 + Math.random() * 0.4; const speedZ = 0.2 + Math.random() * 1.2;
    const velocity = new THREE.Vector3(Math.cos(angle) * speedXY, Math.sin(angle) * speedXY, speedZ);
    penguinsArray.push({ mesh: sprite, velocity: velocity }); scene.add(sprite);
}

// --- GESTION AUDIO UNIFIÉE ---

const audioEl = document.getElementById('audio');
const overlay = document.getElementById('overlay');
const stopBtn = document.getElementById('stop-btn');

// Fonction pour démarrer l'AudioContext
function startAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        const src = audioContext.createMediaElementSource(audioEl);
        src.connect(analyser);
        analyser.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
}

function startPlayback() {
    overlay.classList.add('hidden'); // Cacher menu
    stopBtn.classList.remove('hidden'); // Montrer bouton Stop
}

function resetToMenu() {
    audioEl.pause();
    audioEl.currentTime = 0;
    
    overlay.classList.remove('hidden'); // Montrer menu
    stopBtn.classList.add('hidden'); // Cacher bouton Stop
    
    // Reset couleur noyau
    if(core) {
        core.children[0].material.color.setRGB(0, 1, 0);
        core.material.color.setRGB(0, 1, 0);
    }
}

// CAS 1 : Upload
document.getElementById('audio-input').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        startAudioContext();
        audioEl.src = URL.createObjectURL(file);
        audioEl.play();
        startPlayback();
    }
});

// CAS 2 : Preset
document.getElementById('play-preset-btn').addEventListener('click', function() {
    const selectedPath = document.getElementById('preset-select').value;
    if (selectedPath) {
        startAudioContext();
        audioEl.src = selectedPath;
        audioEl.play().catch(e => console.error("Erreur lecture:", e));
        startPlayback();
    }
});

// Événement Fin de musique
audioEl.addEventListener('ended', resetToMenu);

// Événement Bouton Stop
stopBtn.addEventListener('click', resetToMenu);

// --- GESTION BOUTON RETOUR ---
document.getElementById('exit-btn').addEventListener('click', () => {
    const prev = localStorage.getItem('previous_map');
    let url = '../intro/intro.html';
    if(prev === 'medium') url = '../medium/medium.html';
    else if(prev === 'end') url = '../end/end.html';
    window.location.href = url;
});

// --- ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    let bass = 0; let avgVolume = 0;

    if(analyser) {
        analyser.getByteFrequencyData(dataArray);
        let bSum = 0; for(let i=0; i<10; i++) bSum += dataArray[i]; bass = bSum / 10;
        let total = 0; for(let i=0; i<dataArray.length; i++) total += dataArray[i]; avgVolume = total / dataArray.length;

        spectrumGroup.children.forEach((bar, i) => {
            const val = dataArray[i];
            const scale = 1 + (val / 10); bar.scale.set(scale, 1, 1);
            const hue = 120 - (val / 255) * 120; bar.material.color.setHSL(hue / 360, 1, 0.5);
        });
    }

    const r = Math.min(1, avgVolume / 150); const g = Math.max(0, 1 - (avgVolume / 200));
    core.children[0].material.color.setRGB(r, g, 0); core.material.color.setRGB(r, g, 0);

    const heatPercent = Math.min(100, (avgVolume / 200) * 100);
    document.getElementById('intensity').innerText = Math.floor(heatPercent) + "%";
    document.getElementById('heat-bar').style.width = heatPercent + "%";
    if(heatPercent > 65) document.getElementById('heat-bar').style.background = "#ff0000";
    else document.getElementById('heat-bar').style.background = "#00ff00";

    // Lancer Pingouin si Surchauffe (Volume > 130)
    if (avgVolume > 130 && canLaunch) {
        launchPenguin(); canLaunch = false; setTimeout(() => { canLaunch = true; }, 150); 
    }

    for (let i = penguinsArray.length - 1; i >= 0; i--) {
        const p = penguinsArray[i]; p.mesh.position.add(p.velocity); p.mesh.material.rotation += 0.01; 
        if (p.mesh.position.z > 60 || p.mesh.position.length() > 250) { scene.remove(p.mesh); penguinsArray.splice(i, 1); }
    }
    document.getElementById('penguin-count').innerText = penguinsArray.length;

    const pulse = Math.pow(bass / 200, 3); const scaleCore = 1 + pulse;
    core.scale.set(scaleCore, scaleCore, scaleCore); core.rotation.z += 0.01; core.rotation.y += 0.02;

    const targetFov = baseFov + (bass / 255) * 10; camera.fov += (targetFov - camera.fov) * 0.1; camera.updateProjectionMatrix();

    windowsGroup.forEach(w => {
        w.position.z += w.userData.speed + (avgVolume / 50);
        if(w.position.z > 30) w.position.z = -150;
        const push = Math.pow(bass / 255, 4) * 5; 
        w.position.x = w.userData.baseX + Math.sign(w.userData.baseX) * push;
        w.position.y = w.userData.baseY + Math.sign(w.userData.baseY) * push;
        w.rotation.z += (Math.random()-0.5) * (avgVolume/1000);
    });

    gridTop.position.z += 0.5 + (avgVolume/100); gridBottom.position.z += 0.5 + (avgVolume/100);
    if(gridTop.position.z > 20) gridTop.position.z = 0; if(gridBottom.position.z > 20) gridBottom.position.z = 0;

    composer.render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
}

init();