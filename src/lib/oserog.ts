export type Player = 'black' | 'white';
export type Cell = Player | null;
export type Board = Cell[][];
export type MoveMode = 'normal' | 'blast' | 'erosion';

export interface Position {
	row: number;
	col: number;
}

export interface SpecialStock {
	blast: number;
	erosion: number;
}

export interface GameState {
	board: Board;
	currentPlayer: Player;
	specials: Record<Player, SpecialStock>;
	completedMoves: number;
	gameOver: boolean;
	winner: Player | 'draw' | null;
}

export interface TurnResolution {
	nextPlayer: Player;
	passed: Player | null;
	gameOver: boolean;
	winner: Player | 'draw' | null;
}

export interface MoveResult {
	state: GameState;
	passed: Player | null;
}

const BOARD_SIZE = 8;
const DIRECTIONS = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
] as const;

export function createEmptyBoard(): Board {
	return Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));
}

export function createInitialBoard(): Board {
	const board = createEmptyBoard();
	board[3][3] = 'white';
	board[3][4] = 'black';
	board[4][3] = 'black';
	board[4][4] = 'white';
	return board;
}

export function createInitialGameState(): GameState {
	return {
		board: createInitialBoard(),
		currentPlayer: 'black',
		specials: {
			black: { blast: 3, erosion: 3 },
			white: { blast: 3, erosion: 3 },
		},
		completedMoves: 0,
		gameOver: false,
		winner: null,
	};
}

export function opponent(player: Player): Player {
	return player === 'black' ? 'white' : 'black';
}

function isInside(row: number, col: number): boolean {
	return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function cloneBoard(board: Board): Board {
	return board.map((row) => [...row]);
}

export function getFlips(board: Board, row: number, col: number, player: Player): Position[] {
	if (!isInside(row, col) || board[row][col] !== null) return [];

	const enemy = opponent(player);
	const flips: Position[] = [];

	for (const [rowStep, colStep] of DIRECTIONS) {
		const line: Position[] = [];
		let nextRow = row + rowStep;
		let nextCol = col + colStep;

		while (isInside(nextRow, nextCol) && board[nextRow][nextCol] === enemy) {
			line.push({ row: nextRow, col: nextCol });
			nextRow += rowStep;
			nextCol += colStep;
		}

		if (
			line.length > 0 &&
			isInside(nextRow, nextCol) &&
			board[nextRow][nextCol] === player
		) {
			flips.push(...line);
		}
	}

	return flips;
}

export function getLegalMoves(board: Board, player: Player): Position[] {
	const moves: Position[] = [];

	for (let row = 0; row < BOARD_SIZE; row += 1) {
		for (let col = 0; col < BOARD_SIZE; col += 1) {
			if (getFlips(board, row, col, player).length > 0) {
				moves.push({ row, col });
			}
		}
	}

	return moves;
}

function assertLegalMove(board: Board, row: number, col: number, player: Player): Position[] {
	const flips = getFlips(board, row, col, player);
	if (flips.length === 0) {
		throw new Error('そのマスには置けません。');
	}
	return flips;
}

export function applyNormalMove(
	board: Board,
	row: number,
	col: number,
	player: Player,
): Board {
	const flips = assertLegalMove(board, row, col, player);
	const nextBoard = cloneBoard(board);
	nextBoard[row][col] = player;
	for (const position of flips) {
		nextBoard[position.row][position.col] = player;
	}
	return nextBoard;
}

export function applyBlastMove(
	board: Board,
	row: number,
	col: number,
	player: Player,
): Board {
	assertLegalMove(board, row, col, player);
	const nextBoard = cloneBoard(board);
	const enemy = opponent(player);

	for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
		for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
			if (rowOffset === 0 && colOffset === 0) continue;
			const targetRow = row + rowOffset;
			const targetCol = col + colOffset;
			if (isInside(targetRow, targetCol) && nextBoard[targetRow][targetCol] === enemy) {
				nextBoard[targetRow][targetCol] = null;
			}
		}
	}

	nextBoard[row][col] = player;
	return nextBoard;
}

function getFlipsFromDisc(board: Board, row: number, col: number, player: Player): Position[] {
	if (board[row][col] !== player) return [];

	const enemy = opponent(player);
	const flips: Position[] = [];
	for (const [rowStep, colStep] of DIRECTIONS) {
		const line: Position[] = [];
		let nextRow = row + rowStep;
		let nextCol = col + colStep;

		while (isInside(nextRow, nextCol) && board[nextRow][nextCol] === enemy) {
			line.push({ row: nextRow, col: nextCol });
			nextRow += rowStep;
			nextCol += colStep;
		}

		if (
			line.length > 0 &&
			isInside(nextRow, nextCol) &&
			board[nextRow][nextCol] === player
		) {
			flips.push(...line);
		}
	}
	return flips;
}

export function applyErosionMove(
	board: Board,
	row: number,
	col: number,
	player: Player,
): Board {
	let nextBoard = applyNormalMove(board, row, col, player);
	const affected: Position[] = [];

	for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
		for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
			if (rowOffset === 0 && colOffset === 0) continue;
			const targetRow = row + rowOffset;
			const targetCol = col + colOffset;
			if (isInside(targetRow, targetCol) && nextBoard[targetRow][targetCol] !== null) {
				affected.push({ row: targetRow, col: targetCol });
			}
		}
	}

	nextBoard = cloneBoard(nextBoard);
	for (const position of affected) {
		nextBoard[position.row][position.col] = player;
	}

	// 周囲の石をすべて自色化した同一盤面から、追加反転を一度だけ集計する。
	// 反転の途中結果を次の判定に使わないことで、効果の二重適用を防ぐ。
	const erosionSnapshot = cloneBoard(nextBoard);
	const extraFlips = new Set<string>();
	for (const position of affected) {
		for (const flip of getFlipsFromDisc(erosionSnapshot, position.row, position.col, player)) {
			extraFlips.add(`${flip.row},${flip.col}`);
		}
	}

	for (const key of extraFlips) {
		const [flipRow, flipCol] = key.split(',').map(Number);
		nextBoard[flipRow][flipCol] = player;
	}

	return nextBoard;
}

export function countDiscs(board: Board): { black: number; white: number; empty: number } {
	let black = 0;
	let white = 0;
	for (const row of board) {
		for (const cell of row) {
			if (cell === 'black') black += 1;
			if (cell === 'white') white += 1;
		}
	}
	return { black, white, empty: BOARD_SIZE * BOARD_SIZE - black - white };
}

function determineWinner(board: Board): Player | 'draw' {
	const score = countDiscs(board);
	if (score.black === score.white) return 'draw';
	return score.black > score.white ? 'black' : 'white';
}

export function resolveTurn(board: Board, playerWhoMoved: Player): TurnResolution {
	const nextPlayer = opponent(playerWhoMoved);
	if (getLegalMoves(board, nextPlayer).length > 0) {
		return { nextPlayer, passed: null, gameOver: false, winner: null };
	}

	if (getLegalMoves(board, playerWhoMoved).length > 0) {
		return {
			nextPlayer: playerWhoMoved,
			passed: nextPlayer,
			gameOver: false,
			winner: null,
		};
	}

	return {
		nextPlayer: playerWhoMoved,
		passed: nextPlayer,
		gameOver: true,
		winner: determineWinner(board),
	};
}

export function playMove(
	state: GameState,
	row: number,
	col: number,
	mode: MoveMode,
): MoveResult {
	if (state.gameOver) throw new Error('対局は終了しています。');
	const player = state.currentPlayer;
	if (mode === 'blast' && state.completedMoves < 8) {
		throw new Error(`爆破は9手目から使用できます。あと${8 - state.completedMoves}手です。`);
	}

	if (mode !== 'normal' && state.specials[player][mode] <= 0) {
		throw new Error('その特殊手は残っていません。');
	}

	let board: Board;
	if (mode === 'blast') {
		board = applyBlastMove(state.board, row, col, player);
	} else if (mode === 'erosion') {
		board = applyErosionMove(state.board, row, col, player);
	} else {
		board = applyNormalMove(state.board, row, col, player);
	}

	const specials = {
		black: { ...state.specials.black },
		white: { ...state.specials.white },
	};
	if (mode !== 'normal') specials[player][mode] -= 1;

	const resolution = resolveTurn(board, player);
	return {
		state: {
			board,
			currentPlayer: resolution.nextPlayer,
			specials,
			completedMoves: state.completedMoves + 1,
			gameOver: resolution.gameOver,
			winner: resolution.winner,
		},
		passed: resolution.passed,
	};
}
