/* --- DONNÉES DU JEU --- */
let gameState = {
    budget: 0,
    independence: 0, // Pourcentage de 0 à 100
    clickValue: 1,
    autoIncome: 0,   // Euros par seconde
    unlockedItems: []
};

// Configuration des Items (Bâtiments & Upgrades)
// Type: 'upgrade' (boost click) ou 'building' (revenu passif)
const shopItems = [
    {
        id: 'usb_stick',
        name: 'Clé USB Live Linux',
        type: 'upgrade',
        cost: 15,
        effect: 1, // +1 par click
        desc: "Permet de tester sans installer. Click +1€.",
        indepBonus: 2
    },
    {
        id: 'eleve_geek',
        name: 'Club Info Élèves',
        type: 'building',
        cost: 50,
        effect: 2, // +2€ / sec
        desc: "Des élèves passionnés réparent les vieux PC.",
        indepBonus: 5
    },
    {
        id: 'libre_office',
        name: 'Suite LibreOffice',
        type: 'upgrade',
        cost: 150,
        effect: 5,
        desc: "Adieu les licences coûteuses ! Click +5€.",
        indepBonus: 10
    },
    {
        id: 'reconditionne',
        name: 'PC Reconditionnés',
        type: 'building',
        cost: 500,
        effect: 15,
        desc: "Moins cher et écolo. Revenu +15€/s.",
        indepBonus: 15
    },
    {
        id: 'server_debian',
        name: 'Serveur Debian Local',
        type: 'building',
        cost: 1500,
        effect: 50,
        desc: "Souveraineté des données ! Revenu +50€/s.",
        indepBonus: 25
    },
    {
        id: 'forge_communs',
        name: 'Rejoindre la Forge',
        type: 'upgrade',
        cost: 5000,
        effect: 100,
        desc: "Partage de ressources national. Click +100€.",
        indepBonus: 40
    }
];

/* --- LOGIQUE --- */

// Initialisation
function startGame() {
    document.getElementById('welcome-modal').style.display = 'none';
    
    // ON CRÉE LA BOUTIQUE UNE SEULE FOIS ICI
    renderShop(); 
    
    updateVisuals();
    
    setInterval(() => {
        if (gameState.independence < 100) {
            addBudget(gameState.autoIncome);
        }
    }, 1000);
}

// Fonction Click Principal
document.getElementById('main-btn').addEventListener('click', () => {
    addBudget(gameState.clickValue);
    createFloatingText();
});

function addBudget(amount) {
    gameState.budget += amount;
    updateUI();
}

// Achat d'un item
function buyItem(index) {
    const item = shopItems[index];
    
    // Vérification de sécurité : si c'est déjà acheté (pour les upgrades), on arrête
    if (item.bought) return;

    if (gameState.budget >= item.cost) {
        // Débit
        gameState.budget -= item.cost;
        
        // Application Effet
        if (item.type === 'upgrade') {
            gameState.clickValue += item.effect;
            // On marque l'objet comme acheté pour ne plus pouvoir le racheter
            item.bought = true; 
        } else {
            gameState.autoIncome += item.effect;
            // Augmentation du coût pour les bâtiments (inflation)
            item.cost = Math.floor(item.cost * 1.3);
            
            // Mettre à jour le texte du prix dans le bouton existant
            const priceTag = document.querySelector(`#item-${index} .cost`);
            if(priceTag) priceTag.innerText = item.cost + " €";
        }

        addIndependence(item.indepBonus);
        logEvent(`Achat : ${item.name}`);
        
        updateUI(); 
        // ON APPELLE LA NOUVELLE FONCTION LÉGÈRE
        updateShopUI(); 
    }
}

function addIndependence(amount) {
    let oldIndep = gameState.independence;
    gameState.independence += amount;
    
    // Plafond à 100%
    if (gameState.independence >= 100) {
        gameState.independence = 100;
        victory();
    }
    
    // Si on a franchi un palier entier (ex: passé de 10 à 15), on casse un peu l'écran
    if (Math.floor(gameState.independence / 5) > Math.floor(oldIndep / 5)) {
        createCrack();
    }

    updateVisuals();
}

// Mise à jour de l'interface
function updateUI() {
    document.getElementById('budget-display').innerText = Math.floor(gameState.budget) + " €";
    document.getElementById('independence-display').innerText = gameState.independence + " %";
    document.getElementById('aps-display').innerText = gameState.autoIncome;
    document.getElementById('click-value').innerText = gameState.clickValue;

    // Appel de la mise à jour légère de la boutique
    updateShopUI();
}

// Changement visuel du Lycée (Le cœur du sujet NIRD)
function checkVisualChanges() {
    const visual = document.getElementById('school-visual');
    const mainBtn = document.getElementById('main-btn');
    const statusTxt = document.getElementById('status-text');

    if (gameState.independence > 20) {
        statusTxt.innerText = "ÉTAT : PRISE DE CONSCIENCE";
    }
    
    if (gameState.independence > 50) {
        visual.classList.add('theme-nird');
        visual.classList.remove('theme-proprietaire');
        mainBtn.classList.add('nird-mode');
        mainBtn.querySelector('.label').innerText = "PARTAGER UN CODE";
        mainBtn.querySelector('.icon').innerText = "🐧";
        statusTxt.innerText = "ÉTAT : VILLAGE EN TRANSITION";
        statusTxt.style.color = "#222";
    }
}

// Affichage de la boutique
// Affiche la boutique (À APPELER UNE SEULE FOIS AU DÉBUT)
function renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = ""; 

    shopItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.id = `item-${index}`;
        div.className = 'shop-item';
        div.onclick = () => buyItem(index);
        
        div.innerHTML = `
            <h4>${item.name} <span class="cost">${item.cost} €</span></h4>
            <div class="desc">${item.desc}</div>
        `;
        container.appendChild(div);
    });
}

// Met à jour l'état des boutons (LÉGER ET RAPIDE)
function updateShopUI() {
    shopItems.forEach((item, index) => {
        const btn = document.getElementById(`item-${index}`);
        if (!btn) return;

        // 1. Gérer les items uniques achetés (Upgrades)
        if (item.type === 'upgrade' && item.bought) {
            btn.style.display = 'none'; // On le cache simplement
            return;
        }

        // 2. Gérer la couleur (Abordable ou non)
        if (gameState.budget >= item.cost) {
            btn.classList.add('affordable');
            btn.style.opacity = "1";
        } else {
            btn.classList.remove('affordable');
            btn.style.opacity = "0.5";
        }
    });
}

// Petit effet visuel au clic
function createFloatingText() {
    const btn = document.getElementById('main-btn');
    const rect = btn.getBoundingClientRect();
    
    const float = document.createElement('div');
    float.innerText = `+${gameState.clickValue}€`;
    float.style.position = 'absolute';
    float.style.color = '#fff';
    float.style.fontWeight = 'bold';
    float.style.left = (rect.left + rect.width / 2) + 'px';
    float.style.top = (rect.top) + 'px';
    float.style.pointerEvents = 'none';
    float.style.transition = 'top 1s, opacity 1s';
    
    document.body.appendChild(float);
    
    setTimeout(() => {
        float.style.top = (rect.top - 50) + 'px';
        float.style.opacity = 0;
    }, 50);

    setTimeout(() => float.remove(), 1000);
}

function logEvent(msg) {
    const list = document.getElementById('game-log');
    const li = document.createElement('li');
    li.innerText = "> " + msg;
    list.prepend(li);
}

function victory() {
    document.getElementById('win-modal').classList.remove('hidden');
    logEvent("VICTOIRE ! Le lycée est NIRD !");
}

// Nouvelle fonction pour gérer l'opacité et l'état
function updateVisuals() {
    // Calcul de l'opacité : 
    // À 0% indep -> Windows est à 1 (visible)
    // À 100% indep -> Windows est à 0 (invisible)
    const winLayer = document.getElementById('layer-windows');
    const opacity = 1 - (gameState.independence / 100);
    
    winLayer.style.opacity = opacity;

    // Mise à jour du texte d'état
    const statusTxt = document.getElementById('status-text');
    if (gameState.independence < 20) {
        statusTxt.innerText = "ÉTAT : PROPRIÉTAIRE (WINDOWS)";
        statusTxt.style.color = "red";
    } else if (gameState.independence < 80) {
        statusTxt.innerText = "ÉTAT : TRANSITION EN COURS...";
        statusTxt.style.color = "orange";
        // Petit effet glitch : on affiche le BSOD text
        document.querySelector('.bsod-text').style.display = 'block';
    } else {
        statusTxt.innerText = "ÉTAT : LIBRE & OPEN SOURCE 🐧";
        statusTxt.style.color = "#50fa7b"; // Vert NIRD
        document.querySelector('.bsod-text').style.display = 'none';
    }
}

// Fonction pour générer une fissure visuelle aléatoire
function createCrack() {
    const winLayer = document.getElementById('layer-windows');
    
    const crack = document.createElement('div');
    crack.classList.add('crack', 'crack-line');
    
    // Position aléatoire sur l'écran
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const rot = Math.random() * 360;
    const scale = 0.5 + Math.random(); // Taille variable

    crack.style.left = x + '%';
    crack.style.top = y + '%';
    crack.style.transform = `rotate(${rot}deg) scale(${scale})`;
    
    winLayer.appendChild(crack);

    // Optionnel : ajouter un bruit de verre brisé ici si tu as un fichier son
    // let audio = new Audio('glass_break.mp3'); audio.play();
}

/* --- FONCTION DE TRICHE (DÉMO) --- */
function instantWin() {
    // On force les stats au max
    gameState.independence = 100;
    gameState.budget += 100000; // Un petit bonus d'argent pour la forme

    // On met à jour l'affichage
    updateUI();
    
    // On met à jour le visuel (pour voir l'écran Linux apparaître)
    if (typeof updateVisuals === 'function') {
        updateVisuals(); 
    } else if (typeof checkVisualChanges === 'function') {
        checkVisualChanges();
    }

    // On déclenche la victoire
    // Si tu as utilisé ma fonction victory() précédente :
    if (typeof victory === 'function') {
        victory();
    } else {
        // Sinon on force l'affichage de la modale manuellement
        document.getElementById('win-modal').classList.remove('hidden');
    }
    
    // Petit log pour confirmer
    const list = document.getElementById('game-log');
    if(list) {
        const li = document.createElement('li');
        li.innerText = "> CHEAT ACTIVÉ : VICTOIRE !";
        li.style.color = "gold";
        list.prepend(li);
    }
}