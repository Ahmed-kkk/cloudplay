class DominoGame {
    constructor(playerCount = 2, targetScore = 101) {
        this.playerCount = playerCount;
        this.targetScore = targetScore;
        this.players = [];
        this.boneyard = [];
        this.board = {
            center: null,
            top: [],
            bottom: [],
            left: [],
            right: []
        };
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
        this.init();
    }

    init() {
        this.generateTiles();
        this.shuffleTiles();
        this.initPlayers();
        this.dealTiles();
    }

    generateTiles() {
        this.allTiles = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                this.allTiles.push([i, j]);
            }
        }
    }

    shuffleTiles() {
        this.boneyard = [...this.allTiles];
        for (let i = this.boneyard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.boneyard[i], this.boneyard[j]] = [this.boneyard[j], this.boneyard[i]];
        }
    }

    initPlayers() {
        this.players = [];
        for (let i = 0; i < this.playerCount; i++) {
            this.players.push({
                id: i,
                hand: [],
                score: 0,
                isCPU: i > 0 // For now, player 0 is human, others are CPU
            });
        }
    }

    dealTiles() {
        const tilesPerPlayer = 7;
        for (let i = 0; i < this.playerCount; i++) {
            this.players[i].hand = this.boneyard.splice(0, tilesPerPlayer);
        }
    }

    getOpenEnds() {
        const ends = [];
        if (!this.board.center) return ends;

        // If only center exists
        if (this.board.top.length === 0 && this.board.bottom.length === 0 &&
            this.board.left.length === 0 && this.board.right.length === 0) {
            // A double in the center has its value counted on all 4 sides if it's the spinner
            // But usually, the first double is the only one that expands 4 ways.
            // The rules say "The match MUST start with a 'Double' tile in the center."
            // "Continuously calculate the sum of the numbers on the 4 open ends of the board."
            const val = this.board.center[0];
            return [val, val, val, val];
        }

        // Top branch
        if (this.board.top.length > 0) {
            const last = this.board.top[this.board.top.length - 1];
            ends.push(last[1]);
        } else {
            ends.push(this.board.center[0]);
        }

        // Bottom branch
        if (this.board.bottom.length > 0) {
            const last = this.board.bottom[this.board.bottom.length - 1];
            ends.push(last[1]);
        } else {
            ends.push(this.board.center[0]);
        }

        // Left branch
        if (this.board.left.length > 0) {
            const last = this.board.left[this.board.left.length - 1];
            ends.push(last[1]);
        } else {
            ends.push(this.board.center[0]);
        }

        // Right branch
        if (this.board.right.length > 0) {
            const last = this.board.right[this.board.right.length - 1];
            ends.push(last[1]);
        } else {
            ends.push(this.board.center[0]);
        }

        return ends;
    }

    canPlay(playerIndex) {
        const player = this.players[playerIndex];
        if (!this.board.center) {
            return player.hand.some(tile => tile[0] === tile[1]);
        }
        const openEnds = this.getOpenEnds();
        return player.hand.some(tile => {
            return openEnds.some(end => tile[0] === end || tile[1] === end);
        });
    }

    playTile(playerIndex, tileIndex, branch) {
        const player = this.players[playerIndex];
        const tile = player.hand[tileIndex];

        if (!this.board.center) {
            if (tile[0] !== tile[1]) return false; // Must start with a double
            this.board.center = tile;
            player.hand.splice(tileIndex, 1);
            this.afterMove(playerIndex);
            return true;
        }

        // Logic for placing on branches
        let openValue;
        let branchArray;
        if (branch === 'top') { branchArray = this.board.top; openValue = branchArray.length > 0 ? branchArray[branchArray.length - 1][1] : this.board.center[0]; }
        else if (branch === 'bottom') { branchArray = this.board.bottom; openValue = branchArray.length > 0 ? branchArray[branchArray.length - 1][1] : this.board.center[0]; }
        else if (branch === 'left') { branchArray = this.board.left; openValue = branchArray.length > 0 ? branchArray[branchArray.length - 1][1] : this.board.center[0]; }
        else if (branch === 'right') { branchArray = this.board.right; openValue = branchArray.length > 0 ? branchArray[branchArray.length - 1][1] : this.board.center[0]; }
        else return false;

        let playedTile = [...tile];
        if (playedTile[0] === openValue) {
            // Correct orientation
        } else if (playedTile[1] === openValue) {
            playedTile.reverse();
        } else {
            return false; // Doesn't match
        }

        branchArray.push(playedTile);
        player.hand.splice(tileIndex, 1);
        this.afterMove(playerIndex);
        return true;
    }

    afterMove(playerIndex) {
        this.calculateScoring(playerIndex);
        if (this.players[playerIndex].hand.length === 0) {
            this.endRound(playerIndex);
        } else {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount;
        }
    }

    calculateScoring(playerIndex) {
        const openEnds = this.getOpenEnds();
        const sum = openEnds.reduce((a, b) => a + b, 0);
        if (sum > 0 && sum % 5 === 0) {
            this.players[playerIndex].score += sum / 5;
        }
    }

    endRound(winnerIndex) {
        // End-of-Round Deduction: If a player has tiles left, sum their values, round DOWN to the nearest multiple of 5, divide by 5, and SUBTRACT from their total score.
        this.players.forEach(player => {
            if (player.hand.length > 0) {
                const handSum = player.hand.reduce((acc, tile) => acc + tile[0] + tile[1], 0);
                const deduction = Math.floor(handSum / 5);
                player.score -= deduction;
            }
        });
        this.isGameOver = this.players.some(p => p.score >= this.targetScore);
        if (!this.isGameOver) {
            // Potentially start next round, but for now just mark round ended
        }
    }

    drawTile(playerIndex) {
        if (this.boneyard.length > 0) {
            const tile = this.boneyard.pop();
            this.players[playerIndex].hand.push(tile);
            return tile;
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DominoGame;
}
