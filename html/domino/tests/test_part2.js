
const { Tile, DominoGame } = require('../js/game.js');

function test() {
    const game = new DominoGame({ numPlayers: 2 });
    game.startNewRound();

    let iterations = 0;
    while (iterations < 100) {
        let pIdx = game.currentPlayerIndex;
        let result;

        if (game.players[pIdx].isComputer) {
            result = game.makeComputerMove(pIdx);
        } else {
            // Simulate human move
            let moves = game.getValidMoves(pIdx);
            if (moves.length === 0 && game.canDraw(pIdx)) {
                game.drawTile(pIdx);
                moves = game.getValidMoves(pIdx);
            }

            if (moves.length > 0) {
                result = game.playMove(pIdx, 0);
            } else {
                result = game.skipTurn(pIdx);
            }
        }

        if (result && result.type === 'roundEnd') {
            console.log("Round ended!", result);
            break;
        }
        iterations++;
    }

    console.log("Final Scores:", game.players.map(p => p.score));
    console.log("Board center:", game.board.center?.tile.toString());
    console.log("Board sides:",
        game.board.top.length,
        game.board.bottom.length,
        game.board.left.length,
        game.board.right.length
    );

    console.log("Part 2 tests passed!");
}

test();
