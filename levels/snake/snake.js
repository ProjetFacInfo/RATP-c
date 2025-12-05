(function() {

    /* 1. ASSETS */
    const ASSETS = {
        apple: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 384 512' fill='%23f0f'%3E%3Cpath transform='translate(384, 0) scale(-1, 1)' d='M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-38.3-19.8-66.5-19.8C65.3 145.1 0 212.7 0 309.2c0 61.3 24.4 135.3 65.6 194.8 21.2 30.7 51 71.2 90.4 71.7 33.9.4 47.4-22.7 89.5-22.7 41.7 0 52.7 22.7 90 22.7 34.3-.4 60.8-33.5 83.2-66.4 23.7-34.7 33.7-69 34.2-70.5-1-1.2-65.9-25.3-67.8-90.1zM220.3 97.7c17.4-21.2 29.1-50.4 25.8-80.4-25 1.1-54.9 16.6-72.5 37.8-15.7 18.6-29.5 48.4-25.8 77.5 27.8 2.1 56-15 72.5-34.9z'/%3E%3C/svg%3E"
    };

    const appleImg = new Image();
    appleImg.src = ASSETS.apple;

    /* 2. VARIABLES */
    const canvas = document.getElementById('snake-canvas');
    // Vérification de sécurité (si on n'est pas sur la page du jeu)
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gridSize = 25;
    let snake = [], food = {}, direction = {x: 0, y: 0}, score = 0;
    let gameInterval;
    let mouthOpenness = 0, mouthDir = 1;
    const mouthSpeed = 0.15;
    const scoreElement = document.getElementById('snake-score');

    // Init
    function init() {
        document.addEventListener('keydown', handleInput);
        document.getElementById('close-btn').addEventListener('click', closeSnake);
    }

    /* 3. INPUTS */
    function handleInput(e) {
        if(e.repeat) return;
        const key = e.key;

        if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
            e.preventDefault();
        }

        switch(key) {
            case 'ArrowUp': if(direction.y === 0) direction = {x: 0, y: -1}; break;
            case 'ArrowDown': if(direction.y === 0) direction = {x: 0, y: 1}; break;
            case 'ArrowLeft': if(direction.x === 0) direction = {x: -1, y: 0}; break;
            case 'ArrowRight': if(direction.x === 0) direction = {x: 1, y: 0}; break;
        }
    }

    /* 4. LOGIQUE JEU */

    window.launchSnakeGame = function() {
        resetGame();
        gameInterval = setInterval(gameLoop, 140);
    }

	function returnToPrincipalGame(win) {
		if (win) {
			setTimeout(() => {
				window.location.href = "../medium/medium.html";
			}, 3000);
		} else {
			window.location.href = "../medium/medium.html";
		}
	}

    function closeSnake() {
        clearInterval(gameInterval);
		returnToPrincipalGame(false);
    }

    function resetGame() {
        const centerX = Math.floor((canvas.width / gridSize) / 2);
        const centerY = Math.floor((canvas.height / gridSize) / 2);
        snake = [{x: centerX, y: centerY}];
        direction = {x: 0, y: 0};
        score = 0;
        mouthOpenness = 0;
        scoreElement.innerText = score;
        placeFood();
        draw();
    }

    function gameLoop() {
        mouthOpenness += mouthDir * mouthSpeed;
        if (mouthOpenness > 1 || mouthOpenness < 0) mouthDir *= -1;

        if(direction.x === 0 && direction.y === 0) {
            draw(); return;
        }

        const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

        if (head.x < 0) head.x = (canvas.width / gridSize) - 1;
        if (head.x >= canvas.width / gridSize) head.x = 0;
        if (head.y < 0) head.y = (canvas.height / gridSize) - 1;
        if (head.y >= canvas.height / gridSize) head.y = 0;

        if (snake.some(s => s.x === head.x && s.y === head.y)) { gameOver(); return; }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            if (score === 400) {
                score = 404;
                scoreElement.innerText = score;
                trigger404Error();
                return;
            }
            score += 25;
            scoreElement.innerText = score;
            placeFood();
        } else {
            snake.pop();
        }
        draw();
    }

    function placeFood() {
        food = { x: Math.floor(Math.random() * (canvas.width / gridSize)), y: Math.floor(Math.random() * (canvas.height / gridSize)) };
        if (snake.some(s => s.x === food.x && s.y === food.y)) placeFood();
    }

    function gameOver() {
        ctx.shadowBlur = 0; ctx.fillStyle = "red"; ctx.font = "30px Courier New"; ctx.textAlign = "center";
        ctx.fillText("SYSTEM FAILURE", canvas.width/2, canvas.height/2);
        clearInterval(gameInterval);
        setTimeout(() => { resetGame(); gameInterval = setInterval(gameLoop, 140); }, 2000);
    }

    function trigger404Error() {
        clearInterval(gameInterval);
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0; ctx.fillStyle = "red"; ctx.font = "bold 40px Courier New"; ctx.textAlign = "center";
        ctx.fillText("ERROR 404", canvas.width/2, canvas.height/2 - 20);
        ctx.font = "20px Courier New"; ctx.fillStyle = "white";
        ctx.fillText("APPLE NOT FOUND", canvas.width/2, canvas.height/2 + 30);
        ctx.fillText("REDIRECTING...", canvas.width/2, canvas.height/2 + 60);

		returnToPrincipalGame(true);
    }

    /* 5. DESSIN */
    function drawRealAndroidHead(x, y, size, dirX, dirY) {
        const radius = size / 2;
        const centerX = x + radius;
        const centerY = y + radius;
        ctx.save(); ctx.translate(centerX, centerY);
        let rotation = 0; let scaleX = 1;
        if (dirX === -1) { scaleX = -1; rotation = 0; }
        else if (dirY === 1) { rotation = Math.PI / 2; }
        else if (dirY === -1) { rotation = -Math.PI / 2; }
        ctx.rotate(rotation); ctx.scale(scaleX, 1);
        const maxSeparation = radius / 2.5; const separation = mouthOpenness * maxSeparation;
        ctx.shadowBlur = 25; ctx.shadowColor = "#0f0"; ctx.fillStyle = "#0f0"; ctx.strokeStyle = "#0f0";
        // Haut
        ctx.save(); ctx.translate(0, -separation/2);
        ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, Math.PI*2); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-radius*0.4, -radius*0.9); ctx.lineTo(-radius*0.7, -radius*1.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(radius*0.4, -radius*0.9); ctx.lineTo(radius*0.7, -radius*1.4); ctx.stroke();
        ctx.shadowBlur = 5; ctx.shadowColor = "#fff"; ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(-radius/2.5, -radius/2, radius/5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(radius/2.5, -radius/2, radius/5, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Bas
        ctx.save(); ctx.translate(0, separation/2);
        ctx.shadowBlur = 25; ctx.shadowColor = "#0f0"; ctx.fillStyle = "#0f0";
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.restore();
    }

    function draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0f03'; ctx.lineWidth = 0.5; ctx.shadowBlur = 0;
        for(let i=0; i<canvas.width; i+=gridSize) {
            ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
        }
        ctx.shadowBlur = 30; ctx.shadowColor = "#f0f";
        if (appleImg.complete) ctx.drawImage(appleImg, food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        snake.forEach((segment, index) => {
            if (index === 0) {
                drawRealAndroidHead(segment.x * gridSize, segment.y * gridSize, gridSize, direction.x, direction.y);
            } else {
                const size = gridSize - 2; const x = segment.x * gridSize + 1; const y = segment.y * gridSize + 1;
                ctx.shadowBlur = 0; ctx.fillStyle = "#0a3a0a"; ctx.fillRect(x, y, size, size);
                ctx.shadowBlur = 15; ctx.shadowColor = "#0f0"; ctx.strokeStyle = "#0f0"; ctx.lineWidth = 2; ctx.strokeRect(x, y, size, size);
            }
        });
        ctx.shadowBlur = 0; ctx.textAlign = "start";
    }

    init();

})();
