import assert from 'node:assert/strict';
import test from 'node:test';

import {
	applyBlastMove,
	applyErosionMove,
	applyNormalMove,
	countDiscs,
	createEmptyBoard,
	createInitialBoard,
	createInitialGameState,
	getLegalMoves,
	playMove,
	resolveTurn,
} from '../src/lib/oserog.ts';

function positionKeys(positions: Array<{ row: number; col: number }>) {
	return positions.map(({ row, col }) => `${row},${col}`).sort();
}

test('初期盤面は黒に4つの合法手がある', () => {
	assert.deepEqual(positionKeys(getLegalMoves(createInitialBoard(), 'black')), [
		'2,3',
		'3,2',
		'4,5',
		'5,4',
	]);
});

test('通常手は挟んだ石を反転する', () => {
	const board = applyNormalMove(createInitialBoard(), 2, 3, 'black');
	assert.equal(board[2][3], 'black');
	assert.equal(board[3][3], 'black');
	assert.deepEqual(countDiscs(board), { black: 4, white: 1, empty: 59 });
});

test('初期状態では爆破できず、再戦相当の初期stateは着手数0になる', () => {
	const state = createInitialGameState();
	assert.equal(state.completedMoves, 0);
	assert.throws(() => playMove(state, 2, 3, 'blast'), /9手目から/);
});

test('8手完了後は爆破でき、実際の着手だけが手数に加算される', () => {
	const state = { ...createInitialGameState(), completedMoves: 8 };
	const move = playMove(state, 2, 3, 'blast');
	assert.equal(move.state.completedMoves, 9);
	assert.equal(move.state.specials.black.blast, 2);
});

test('爆破手は周囲の敵石だけを消し、自石を残して通常反転を行わない', () => {
	const board = applyBlastMove(createInitialBoard(), 2, 3, 'black');
	assert.equal(board[2][3], 'black');
	assert.equal(board[3][3], null);
	assert.equal(board[3][4], 'black');
	assert.deepEqual(countDiscs(board), { black: 3, white: 1, empty: 60 });
});

test('侵食手は通常反転、周囲の自色化、各起点からの追加反転を一度だけ行う', () => {
	const board = createEmptyBoard();
	board[3][4] = 'white';
	board[3][5] = 'black';
	board[2][3] = 'white';
	board[1][3] = 'white';
	board[0][3] = 'black';

	const result = applyErosionMove(board, 3, 3, 'black');
	assert.equal(result[3][3], 'black');
	assert.equal(result[3][4], 'black');
	assert.equal(result[2][3], 'black');
	assert.equal(result[1][3], 'black');
	assert.deepEqual(countDiscs(result), { black: 6, white: 0, empty: 58 });
});

test('相手だけ置けない場合は自動パスし、両者置けない場合は終了する', () => {
	const passBoard = Array.from({ length: 8 }, () => Array(8).fill('black')) as ReturnType<
		typeof createEmptyBoard
	>;
	passBoard[0][0] = null;
	passBoard[0][1] = 'white';
	passBoard[0][3] = null;
	passBoard[0][4] = 'white';

	const passMove = playMove(
		{ ...createInitialGameState(), board: passBoard, completedMoves: 7 },
		0,
		0,
		'normal',
	);
	assert.equal(passMove.passed, 'white');
	assert.equal(passMove.state.completedMoves, 8);

	const endBoard = Array.from({ length: 8 }, () => Array(8).fill('black')) as ReturnType<
		typeof createEmptyBoard
	>;
	assert.deepEqual(resolveTurn(endBoard, 'black'), {
		nextPlayer: 'black',
		passed: 'white',
		gameOver: true,
		winner: 'black',
	});
});
