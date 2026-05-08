
const { Tile, DominoGame } = require('../js/game.js');

function testIntegration() {
    console.log("Starting integration test...");

    const game = new DominoGame({ numPlayers: 4 });
    game.startNewRound();

    console.log("Checking 4-player drawing rule...");
    if (game.canDraw(0)) throw new Error("4 players should not be able to draw");

    console.log("Checking scoring calculation...");
    // Force a scoring state
    game.board.center = { tile: new Tile(1, 1), openValue: 1 };
    game.board.top = [{ tile: new Tile(1, 2), openValue: 2 }];
    game.board.bottom = [{ tile: new Tile(1, 2), openValue: 2 }];
    game.board.left = [{ tile: new Tile(1, 1), openValue: 1 }];
    game.board.right = [{ tile: new Tile(1, 0), openValue: 0 }];

    // Ends: 2, 2, 1, 0 -> Sum = 5. Points = 1.
    const pts = game.checkScoring(0);
    if (pts !== 1) throw new Error("Expected 1 point for sum of 5");
    if (game.players[0].score !== 1) throw new Error("Score not updated");

    console.log("Checking round end penalty rounding...");
    game.players[1].hand = [new Tile(6, 6)]; // Sum = 12. Penalty should be floor(12/5) = 2.
    game.endRound(0);
    if (game.players[1].score !== -2) throw new Error("Expected penalty of 2, got " + game.players[1].score);

    console.log("Integration tests passed!");
}

testIntegration();
