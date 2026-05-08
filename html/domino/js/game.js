
class Tile {
    constructor(v1, v2) {
        this.v1 = v1;
        this.v2 = v2;
    }
    get isDouble() {
        return this.v1 === this.v2;
    }
    get sum() {
        return this.v1 + this.v2;
    }
    toString() {
        return `[${this.v1}|${this.v2}]`;
    }
    hasValue(v) {
        return this.v1 === v || this.v2 === v;
    }
    getOtherValue(v) {
        return this.v1 === v ? this.v2 : this.v1;
    }
}

class DominoGame {
    constructor(config = {}) {
        this.numPlayers = config.numPlayers || 2;
        this.isTeamMode = config.isTeamMode || false; // 2vs2
        this.targetScore = config.targetScore || 101;
        this.players = [];
        this.pool = [];
        this.board = {
            center: null, // {tile, openValue}
            top: [],      // array of {tile, openValue}
            bottom: [],
            left: [],
            right: []
        };
        this.currentPlayerIndex = 0;
        this.turnCount = 0;
        this.consecutiveSkips = 0;

        this.initPlayers();
    }

    initPlayers() {
        this.players = [];
        for (let i = 0; i < this.numPlayers; i++) {
            this.players.push({
                id: i,
                hand: [],
                score: 0,
                isComputer: i !== 0,
                drawsThisTurn: 0,
                team: this.isTeamMode ? (i % 2) : i
            });
        }
    }

    startNewRound() {
        this.initPool();
        this.shufflePool();
        this.deal();
        this.board = {
            center: null,
            top: [],
            bottom: [],
            left: [],
            right: []
        };
        this.turnCount = 0;
        this.consecutiveSkips = 0;
        // The rules say "the system determines who plays first"
        this.currentPlayerIndex = Math.floor(Math.random() * this.numPlayers);
        return this.currentPlayerIndex;
    }

    initPool() {
        this.pool = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                this.pool.push(new Tile(i, j));
            }
        }
    }

    shufflePool() {
        for (let i = this.pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pool[i], this.pool[j]] = [this.pool[j], this.pool[i]];
        }
    }

    deal() {
        this.players.forEach(p => {
            p.hand = this.pool.splice(0, 7);
            p.drawsThisTurn = 0;
        });
    }

    getHand(playerIndex) {
        return this.players[playerIndex].hand;
    }

    getValidMoves(playerIndex) {
        const player = this.players[playerIndex];
        const moves = [];

        if (this.turnCount === 0) {
            // First move must be a double
            player.hand.forEach((tile, index) => {
                if (tile.isDouble) {
                    moves.push({ tile, index, side: 'center' });
                }
            });
            return moves;
        }

        const openValues = this.getOpenValues();
        player.hand.forEach((tile, index) => {
            for (const side in openValues) {
                if (tile.hasValue(openValues[side])) {
                    moves.push({ tile, index, side });
                }
            }
        });

        return moves;
    }

    getOpenValues() {
        if (!this.board.center) return {};

        const open = {};
        const centerVal = this.board.center.tile.v1;

        open.top = this.board.top.length > 0 ? this.board.top[this.board.top.length - 1].openValue : centerVal;
        open.bottom = this.board.bottom.length > 0 ? this.board.bottom[this.board.bottom.length - 1].openValue : centerVal;
        open.left = this.board.left.length > 0 ? this.board.left[this.board.left.length - 1].openValue : centerVal;
        open.right = this.board.right.length > 0 ? this.board.right[this.board.right.length - 1].openValue : centerVal;

        return open;
    }

    canDraw(playerIndex) {
        const player = this.players[playerIndex];
        if (this.numPlayers === 4) return false;
        if (this.pool.length === 0) return false;

        if (this.turnCount === 0) {
            return player.drawsThisTurn < 1;
        } else {
            return player.drawsThisTurn < 2;
        }
    }

    drawTile(playerIndex) {
        if (!this.canDraw(playerIndex)) return null;

        const player = this.players[playerIndex];
        const tile = this.pool.pop();
        player.hand.push(tile);
        player.drawsThisTurn++;
        return tile;
    }

    playMove(playerIndex, moveIndex) {
        const moves = this.getValidMoves(playerIndex);
        const move = moves[moveIndex];
        if (!move) return null;

        const player = this.players[playerIndex];
        const { tile, index, side } = move;

        // Remove from hand
        player.hand.splice(index, 1);

        if (side === 'center') {
            this.board.center = { tile, openValue: tile.v1 };
        } else {
            const openValues = this.getOpenValues();
            const connectVal = openValues[side];
            const newVal = tile.getOtherValue(connectVal);
            this.board[side].push({ tile, openValue: newVal });
        }

        this.turnCount++;
        this.consecutiveSkips = 0;
        player.drawsThisTurn = 0;

        const points = this.checkScoring(playerIndex);

        if (player.hand.length === 0) {
            this.endRound(playerIndex);
            return { type: 'roundEnd', winner: playerIndex, points };
        }

        this.nextTurn();
        return { type: 'move', player: playerIndex, tile, side, points };
    }

    skipTurn(playerIndex) {
        this.players[playerIndex].drawsThisTurn = 0;
        this.consecutiveSkips++;

        if (this.consecutiveSkips >= this.numPlayers) {
            // Blocked game
            this.endRoundBlocked();
            return { type: 'roundEnd', blocked: true };
        }

        this.nextTurn();
        return { type: 'skip', player: playerIndex };
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.numPlayers;
    }

    makeComputerMove(playerIndex) {
        const player = this.players[playerIndex];
        if (!player.isComputer) return null;

        let moves = this.getValidMoves(playerIndex);

        while (moves.length === 0 && this.canDraw(playerIndex)) {
            this.drawTile(playerIndex);
            moves = this.getValidMoves(playerIndex);
        }

        if (moves.length > 0) {
            // AI: prefer starting a new side if not all 4 sides are started
            let emptySideMoves = moves.filter(m => m.side !== 'center' && this.board[m.side].length === 0);
            if (emptySideMoves.length > 0) {
                const move = emptySideMoves[0];
                const realIndex = moves.indexOf(move);
                return this.playMove(playerIndex, realIndex);
            }

            return this.playMove(playerIndex, 0);
        } else {
            return this.skipTurn(playerIndex);
        }
    }

    checkScoring(playerIndex) {
        // Scoring starts after all 4 directions have at least one tile
        if (this.board.top.length > 0 && this.board.bottom.length > 0 &&
            this.board.left.length > 0 && this.board.right.length > 0) {

            const openValues = this.getOpenValues();
            const sum = openValues.top + openValues.bottom + openValues.left + openValues.right;

            if (sum % 5 === 0 && sum > 0) {
                const points = sum / 5;
                if (this.isTeamMode) {
                    // In team mode, scores are shared?
                    this.addTeamScore(this.players[playerIndex].team, points);
                } else {
                    this.players[playerIndex].score += points;
                }
                return points;
            }
        }
        return 0;
    }

    addTeamScore(teamId, points) {
        this.players.forEach(p => {
            if (p.team === teamId) p.score += points;
        });
    }

    endRound(winnerIndex) {
        const winner = this.players[winnerIndex];

        this.players.forEach((p, i) => {
            // In team mode, don't penalize partner
            if (this.isTeamMode && p.team === winner.team) return;
            if (i === winnerIndex) return;

            const handSum = p.hand.reduce((acc, t) => acc + t.sum, 0);
            const penalty = Math.floor(handSum / 5);
            p.score -= penalty;
        });
    }

    endRoundBlocked() {
        // Find player with lowest hand sum
        let sums = this.players.map(p => p.hand.reduce((acc, t) => acc + t.sum, 0));
        let minSum = Math.min(...sums);
        let winners = this.players.map((p, i) => i).filter(i => sums[i] === minSum);

        this.players.forEach((p, i) => {
            if (winners.includes(i)) return;
            // If team mode, check if any winner is on this team
            if (this.isTeamMode && winners.some(wIdx => this.players[wIdx].team === p.team)) return;

            const penalty = Math.floor(sums[i] / 5);
            p.score -= penalty;
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Tile, DominoGame };
}
