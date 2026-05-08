
const { Tile, DominoGame } = require('../js/game.js');

function testScoring() {
    console.log("Testing scoring...");
    const game = new DominoGame({ numPlayers: 2 });

    // Manual setup for scoring test
    game.board.center = { tile: new Tile(5, 5), openValue: 5 };
    game.board.top = [{ tile: new Tile(5, 5), openValue: 5 }];
    game.board.bottom = [{ tile: new Tile(5, 5), openValue: 5 }];
    game.board.left = [{ tile: new Tile(5, 5), openValue: 5 }];
    game.board.right = [{ tile: new Tile(5, 0), openValue: 0 }];

    // Ends: 5, 5, 5, 0 -> Sum = 15
    const points = game.checkScoring(0);
    console.log("Points awarded for 5+5+5+0:", points);
    if (points !== 3) throw new Error("Expected 3 points");

    console.log("Testing round end penalty...");
    game.players[1].hand = [new Tile(5, 6)]; // Sum = 11
    game.players[0].score = 10;
    game.players[1].score = 10;

    game.endRound(0);
    console.log("Player 1 score after 11 points penalty:", game.players[1].score);
    if (game.players[1].score !== 8) throw new Error("Expected 10 - floor(11/5) = 8");

    console.log("Scoring tests passed!");
}

testScoring();
