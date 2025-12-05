// Delete all saves when restarting the game from the main menu
localStorage.removeItem('nird_rpg_save'); // Suppression de la sauvegarde
localStorage.removeItem('has_won_laser_game'); // Suppression de l'info Laser Game

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    const animDuration = 2000;  // Temps du zoom et du fondu (en ms)
    const pauseDuration = 1000;  // Temps de pause APRES l'animation avant de changer de page (en ms)
    
    // --- ELEMENTS ---
    const startBtn = document.getElementById('start-btn');
    const mainContent = document.getElementById('main-content');
    const bgWrapper = document.getElementById('bg-wrapper');

    // --- LOGIQUE ---
    startBtn.addEventListener('click', function(e) {
        e.preventDefault(); 
        const destination = this.href;

        // 1. Animation du Fond (Zoom + Lumière)
        const bgAnim = bgWrapper.animate([
            { transform: 'scale(1)', filter: 'brightness(0.4)' },
            { transform: 'scale(1.2)', filter: 'brightness(1)' }
        ], {
            duration: animDuration,
            easing: 'ease-in-out',
            fill: 'forwards' // L'état final reste figé pendant la pause
        });

        // 2. Animation du Conteneur (Disparition)
        const contentAnim = mainContent.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.95)' }
        ], {
            duration: animDuration * 0.8, // Un peu plus rapide pour laisser voir le fond
            easing: 'ease-in',
            fill: 'forwards'
        });

        // 3. Gestion de la fin et de la pause
        bgAnim.onfinish = () => {
            // Une fois le zoom fini, on attend un peu (pauseDuration)
            setTimeout(() => {
                window.location.href = destination;
            }, pauseDuration);
        };
    });

    // --- SECURITÉ ANTI-CACHE (Bouton Retour) ---
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // On annule tout pour remettre la page à zéro si on revient en arrière
            document.getAnimations().forEach(anim => {
                anim.cancel();
            });
        }
    });
});