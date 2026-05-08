class GameController {
    constructor() {
        this.game = new DominoGame(2);
        this.renderer = new Renderer();
        this.tileMeshes = [];
        this.handMeshes = [];

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
    }

    init() {
        this.renderHand();
        this.updateUI();

        window.addEventListener('click', (e) => this.onClick(e));
        this.checkTurn();
    }

    checkTurn() {
        if (this.game.players[this.game.currentPlayerIndex].isCPU) {
            setTimeout(() => this.cpuTurn(), 1000);
        }
    }

    renderHand() {
        // Clear previous hand meshes
        this.handMeshes.forEach(mesh => this.renderer.scene.remove(mesh));
        this.handMeshes = [];

        const playerHand = this.game.players[0].hand;
        playerHand.forEach((tile, index) => {
            const mesh = this.renderer.createDominoMesh(tile[0], tile[1]);
            // Position hand at the bottom of the screen
            mesh.position.set((index - (playerHand.length - 1) / 2) * 1.2, 0.2, 4);
            mesh.userData = { tileIndex: index, playerIndex: 0 };
            this.renderer.scene.add(mesh);
            this.handMeshes.push(mesh);

            // Basic click interaction (simplified for now)
            // In a real implementation, we'd use Raycaster
        });
    }

    updateUI() {
        document.getElementById('score-0').textContent = this.game.players[0].score;
        document.getElementById('score-1').textContent = this.game.players[1].score;
        document.getElementById('status').textContent = this.game.currentPlayerIndex === 0 ? "Your Turn" : "CPU's Turn";
    }

    cpuTurn() {
        const playerIndex = this.game.currentPlayerIndex;
        const cpu = this.game.players[playerIndex];
        let played = false;

        // Try all tiles on all branches
        for (let i = 0; i < cpu.hand.length; i++) {
            const branches = ['top', 'bottom', 'left', 'right'];
            if (!this.game.board.center) {
                const tile = cpu.hand[i];
                if (this.game.playTile(playerIndex, i, 'center')) {
                    played = true;
                    this.visualizeMove(playerIndex, tile, 'center');
                    break;
                }
            } else {
                for (const branch of branches) {
                    const tile = cpu.hand[i];
                    if (this.game.playTile(playerIndex, i, branch)) {
                        played = true;
                        this.visualizeMove(playerIndex, tile, branch);
                        break;
                    }
                }
            }
            if (played) break;
        }

        if (!played) {
            // Try to draw
            if (this.game.boneyard.length > 0) {
                this.game.drawTile(playerIndex);
                if (playerIndex === 0) this.renderHand();
                setTimeout(() => this.cpuTurn(), 500);
            } else {
                this.game.currentPlayerIndex = (this.game.currentPlayerIndex + 1) % this.game.playerCount;
                this.updateUI();
                this.checkTurn();
            }
        } else {
            this.updateUI();
            if (playerIndex === 0) this.renderHand();
            this.checkTurn();
        }
    }

    onClick(event) {
        if (this.game.currentPlayerIndex !== 0) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        const intersects = this.raycaster.intersectObjects(this.handMeshes, true);

        if (intersects.length > 0) {
            let clickedMesh = intersects[0].object;
            while (clickedMesh.parent && clickedMesh.userData.tileIndex === undefined) {
                clickedMesh = clickedMesh.parent;
            }

            const tileIndex = clickedMesh.userData.tileIndex;
            if (tileIndex === undefined) return;

            const tile = this.game.players[0].hand[tileIndex];

            // Try all branches
            const branches = ['top', 'bottom', 'left', 'right'];
            let played = false;
            if (!this.game.board.center) {
                if (this.game.playTile(0, tileIndex, 'center')) {
                    played = true;
                    this.visualizeMove(0, tile, 'center');
                }
            } else {
                for (const branch of branches) {
                    if (this.game.playTile(0, tileIndex, branch)) {
                        played = true;
                        this.visualizeMove(0, tile, branch);
                        break;
                    }
                }
            }

            if (played) {
                this.renderHand();
                this.updateUI();
                this.checkTurn();
            }
        }
    }

    visualizeMove(playerIndex, tile, branch) {
        const mesh = this.renderer.createDominoMesh(tile[0], tile[1]);
        let targetPos = new THREE.Vector3(0, 0.1, 0);
        let targetRot = new THREE.Vector3(0, 0, 0);

        if (branch === 'center') {
            targetPos.set(0, 0.1, 0);
        } else {
            const branchArray = this.game.board[branch];
            const offset = branchArray.length;
            if (branch === 'top') { targetPos.set(0, 0.1, -offset * 2.1); }
            else if (branch === 'bottom') { targetPos.set(0, 0.1, offset * 2.1); }
            else if (branch === 'left') { targetPos.set(-offset * 2.1, 0.1, 0); targetRot.set(0, Math.PI / 2, 0); }
            else if (branch === 'right') { targetPos.set(offset * 2.1, 0.1, 0); targetRot.set(0, Math.PI / 2, 0); }
        }

        // Start from off-screen or player position
        mesh.position.set(playerIndex === 0 ? 0 : 0, 5, playerIndex === 0 ? 5 : -5);
        this.renderer.scene.add(mesh);
        this.renderer.animateTile(mesh, targetPos, targetRot);
        this.tileMeshes.push(mesh);
    }
}

// Start game on load
window.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
});
