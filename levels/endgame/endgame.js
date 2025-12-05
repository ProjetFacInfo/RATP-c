// --- 1. GESTION DES CONFETTIS ---
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Ajuster la taille du canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Appel initial

const particles = [];
const colors = ['#2ecc71', '#e67e22', '#f1c40f', '#3498db', '#e74c3c'];

function createParticle() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
    };
}

// Créer 150 confettis initiaux
for(let i=0; i<150; i++) particles.push(createParticle());

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) + p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset si le confetti sort en bas de l'écran
        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
    });

    requestAnimationFrame(animateConfetti);
}
// Lancer l'animation
animateConfetti();


// --- 2. LOGIQUE DE RESET (BOUTON REBOOT) ---
document.getElementById('restart-btn').addEventListener('click', function() {
    if(confirm("Voulez-vous vraiment effacer votre progression et recommencer l'aventure ?")) {
        // Nettoyage complet du localStorage
        localStorage.removeItem('nird_rpg_save');
        localStorage.removeItem('has_won_laser_game');
        localStorage.removeItem('previous_map');
        
        // Retour à l'intro (Assurez-vous que ce chemin est correct par rapport à votre dossier 'end')
        window.location.href = "../../index.html"; 
    }
});