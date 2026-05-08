
const { Tile, DominoGame } = require('../js/game.js');

function test() {
    const game = new DominoGame({ numPlayers: 2 });
    game.startNewRound();

    console.log("Player 0 hand:", game.players[0].hand.map(t => t.toString()));
    console.log("Player 1 hand:", game.players[1].hand.map(t => t.toString()));
    console.log("Pool size:", game.pool.length);

    if (game.players[0].hand.length !== 7 || game.players[1].hand.length !== 7) {
        throw new Error("Wrong hand size");
    }
    if (game.pool.length !== 28 - 14) {
        throw new Error("Wrong pool size");
    }

    console.log("First player index:", game.currentPlayerIndex);
    const validMoves = game.getValidMoves(game.currentPlayerIndex);
    console.log("Valid moves for first player:", validMoves.length);

    if (validMoves.length > 0) {
        const move = validMoves[0];
        if (!move.tile.isDouble) {
            throw new Error("First move must be a double");
        }
    } else {
        console.log("No double in hand, trying to draw...");
        if (game.canDraw(game.currentPlayerIndex)) {
            const tile = game.drawTile(game.currentPlayerIndex);
            console.log("Drew:", tile.toString());
            if (game.canDraw(game.currentPlayerIndex)) {
                throw new Error("Should only be able to draw once on first turn");
            }
        }
    }

    console.log("Part 1 tests passed!");
}

test();
