const DominoGame = require('../js/logic.js');
const assert = require('assert');

function testInitialState() {
    console.log('Testing Initial State...');
    const game = new DominoGame(2);
    assert.strictEqual(game.players.length, 2);
    assert.strictEqual(game.players[0].hand.length, 7);
    assert.strictEqual(game.players[1].hand.length, 7);
    assert.strictEqual(game.boneyard.length, 28 - 14);
    console.log('Initial State Test Passed.');
}

function testStartWithDouble() {
    console.log('Testing Start With Double...');
    const game = new DominoGame(2);
    game.players[0].hand = [[6, 6], [1, 2]];

    // Try to play non-double
    const playedNonDouble = game.playTile(0, 1, 'center');
    assert.strictEqual(playedNonDouble, false);
    assert.strictEqual(game.board.center, null);

    // Play double
    const playedDouble = game.playTile(0, 0, 'center');
    assert.strictEqual(playedDouble, true);
    assert.deepStrictEqual(game.board.center, [6, 6]);
    console.log('Start With Double Test Passed.');
}

function test4WayExpansionAndScoring() {
    console.log('Testing 4-Way Expansion and Scoring...');
    const game = new DominoGame(2);
    // Give them multiple tiles so the round doesn't end
    game.players[0].hand = [[5, 5], [5, 5]];
    game.players[1].hand = [[5, 0], [5, 5]];

    game.playTile(0, 0, 'center');

    // Sum should be 5+5+5+5 = 20. Score should be 20/5 = 4.
    assert.strictEqual(game.players[0].score, 4);

    // Player 1 plays [5, 0] on top
    game.playTile(1, 0, 'top');

    // Open ends: top:0, bottom:5, left:5, right:5. Sum = 15. Score = 15/5 = 3.
    assert.strictEqual(game.players[1].score, 3);

    // Player 0 plays [5, 5] on bottom
    game.playTile(0, 0, 'bottom');
    // Open ends: top:0, bottom:5, left:5, right:5. Sum = 15. Score = 4 + 15/5 = 7.
    assert.strictEqual(game.players[0].score, 7);

    console.log('4-Way Expansion and Scoring Test Passed.');
}

function testEndRoundDeduction() {
    console.log('Testing End Round Deduction...');
    const game = new DominoGame(2);
    game.players[0].score = 10;
    game.players[1].score = 10;
    game.players[0].hand = [];
    game.players[1].hand = [[1, 2], [3, 4]]; // Sum = 10. Deduction = 10/5 = 2.

    game.endRound(0);
    assert.strictEqual(game.players[1].score, 8);
    console.log('End Round Deduction Test Passed.');
}

try {
    testInitialState();
    testStartWithDouble();
    test4WayExpansionAndScoring();
    testEndRoundDeduction();
    console.log('All tests passed!');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}
