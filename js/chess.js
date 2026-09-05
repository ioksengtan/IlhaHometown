// 象棋 (Chinese Chess / Xiangqi)
// Board coordinates: row 0..9 (0 = black's back row, 9 = red's back row), col 0..8

const ROWS = 10;
const COLS = 9;
const MARGIN = 50;
const CELL = 60;

const PIECE_CHAR = {
	red: { general: '帥', advisor: '仕', elephant: '相', horse: '傌', rook: '俥', cannon: '炮', pawn: '兵' },
	black: { general: '將', advisor: '士', elephant: '象', horse: '馬', rook: '車', cannon: '砲', pawn: '卒' }
};

var canvas, ctx;
var board;
var currentTurn;
var selected;
var gameOver;

function OnLoad() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	canvas.addEventListener('mousedown', onCanvasClick, false);

	var dlg = document.getElementById('dialog');
	dlg.addEventListener('click', onDialogClick, false);

	resetGame();
}

function OnResize() { }

function resetGame() {
	board = createInitialBoard();
	currentTurn = 'red';
	selected = null;
	gameOver = false;
	document.getElementById('dialog').style.display = 'none';
	draw();
}

function createInitialBoard() {
	var b = [];
	for (var r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null));

	var backRow = ['rook', 'horse', 'elephant', 'advisor', 'general', 'advisor', 'elephant', 'horse', 'rook'];
	for (var c = 0; c < COLS; c++) {
		b[0][c] = { type: backRow[c], color: 'black' };
		b[9][c] = { type: backRow[c], color: 'red' };
	}
	b[2][1] = { type: 'cannon', color: 'black' };
	b[2][7] = { type: 'cannon', color: 'black' };
	b[7][1] = { type: 'cannon', color: 'red' };
	b[7][7] = { type: 'cannon', color: 'red' };
	for (var c2 = 0; c2 < COLS; c2 += 2) {
		b[3][c2] = { type: 'pawn', color: 'black' };
		b[6][c2] = { type: 'pawn', color: 'red' };
	}
	return b;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Input

function onCanvasClick(e) {
	if (gameOver) return;

	var rect = canvas.getBoundingClientRect();
	var scaleX = canvas.width / rect.width;
	var scaleY = canvas.height / rect.height;
	var x = (e.clientX - rect.left) * scaleX;
	var y = (e.clientY - rect.top) * scaleY;

	var col = Math.round((x - MARGIN) / CELL);
	var row = Math.round((y - MARGIN) / CELL);
	if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

	var cx = MARGIN + col * CELL, cy = MARGIN + row * CELL;
	if (Math.hypot(x - cx, y - cy) > CELL * 0.45) return;

	handleCellClick(row, col);
}

function onDialogClick() {
	resetGame();
}

function handleCellClick(row, col) {
	var piece = board[row][col];

	if (selected) {
		if (selected.r === row && selected.c === col) {
			selected = null;
			draw();
			return;
		}
		if (piece && piece.color === currentTurn) {
			selected = { r: row, c: col };
			draw();
			return;
		}
		if (isValidMove(selected.r, selected.c, row, col)) {
			movePiece(selected.r, selected.c, row, col);
		} else {
			selected = null;
			draw();
		}
		return;
	}

	if (piece && piece.color === currentTurn) {
		selected = { r: row, c: col };
		draw();
	}
}

function movePiece(r1, c1, r2, c2) {
	var captured = board[r2][c2];
	var moving = board[r1][c1];
	board[r2][c2] = moving;
	board[r1][c1] = null;
	selected = null;

	if (captured && captured.type === 'general') {
		gameOver = true;
		draw();
		var winner = currentTurn === 'red' ? '紅方' : '黑方';
		showDialog('<h2 style="text-align:center;margin-top:60px;">' + winner + ' 獲勝！</h2><p style="text-align:center;">點擊此處重新開始</p>');
		return;
	}

	currentTurn = currentTurn === 'red' ? 'black' : 'red';
	draw();
}

function showDialog(html) {
	var d = document.getElementById('dialog');
	d.innerHTML = html;
	d.style.display = 'block';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Rules

function piecesBetween(r1, c1, r2, c2) {
	var count = 0;
	if (r1 === r2) {
		var step = c2 > c1 ? 1 : -1;
		for (var c = c1 + step; c !== c2; c += step) if (board[r1][c]) count++;
	} else {
		var step2 = r2 > r1 ? 1 : -1;
		for (var r = r1 + step2; r !== r2; r += step2) if (board[r][c1]) count++;
	}
	return count;
}

function validRook(r1, c1, r2, c2) {
	if (r1 !== r2 && c1 !== c2) return false;
	return piecesBetween(r1, c1, r2, c2) === 0;
}

function validCannon(r1, c1, r2, c2) {
	if (r1 !== r2 && c1 !== c2) return false;
	var between = piecesBetween(r1, c1, r2, c2);
	var target = board[r2][c2];
	return target ? between === 1 : between === 0;
}

function validHorse(r1, c1, r2, c2) {
	var dr = r2 - r1, dc = c2 - c1;
	if (Math.abs(dr) === 2 && Math.abs(dc) === 1) return !board[r1 + dr / 2][c1];
	if (Math.abs(dr) === 1 && Math.abs(dc) === 2) return !board[r1][c1 + dc / 2];
	return false;
}

function validElephant(r1, c1, r2, c2, color) {
	var dr = r2 - r1, dc = c2 - c1;
	if (Math.abs(dr) !== 2 || Math.abs(dc) !== 2) return false;
	if (board[r1 + dr / 2][c1 + dc / 2]) return false;
	if (color === 'black' && r2 > 4) return false;
	if (color === 'red' && r2 < 5) return false;
	return true;
}

function validAdvisor(r1, c1, r2, c2, color) {
	var dr = r2 - r1, dc = c2 - c1;
	if (Math.abs(dr) !== 1 || Math.abs(dc) !== 1) return false;
	if (c2 < 3 || c2 > 5) return false;
	if (color === 'black' && (r2 < 0 || r2 > 2)) return false;
	if (color === 'red' && (r2 < 7 || r2 > 9)) return false;
	return true;
}

function validGeneral(r1, c1, r2, c2, color) {
	var dr = r2 - r1, dc = c2 - c1;
	if (Math.abs(dr) + Math.abs(dc) !== 1) return false;
	if (c2 < 3 || c2 > 5) return false;
	if (color === 'black' && (r2 < 0 || r2 > 2)) return false;
	if (color === 'red' && (r2 < 7 || r2 > 9)) return false;
	return true;
}

function validPawn(r1, c1, r2, c2, color) {
	var dr = r2 - r1, dc = c2 - c1;
	if (color === 'black') {
		if (r1 < 5) return dr === 1 && dc === 0;
		return (dr === 1 && dc === 0) || (dr === 0 && Math.abs(dc) === 1);
	} else {
		if (r1 > 4) return dr === -1 && dc === 0;
		return (dr === -1 && dc === 0) || (dr === 0 && Math.abs(dc) === 1);
	}
}

function generalsFacing() {
	var redGen = null, blackGen = null;
	for (var r = 0; r < ROWS; r++) {
		for (var c = 0; c < COLS; c++) {
			var p = board[r][c];
			if (p && p.type === 'general') {
				if (p.color === 'red') redGen = { r: r, c: c }; else blackGen = { r: r, c: c };
			}
		}
	}
	if (!redGen || !blackGen) return false;
	if (redGen.c !== blackGen.c) return false;
	return piecesBetween(redGen.r, redGen.c, blackGen.r, blackGen.c) === 0;
}

function isValidMove(r1, c1, r2, c2) {
	if (r1 === r2 && c1 === c2) return false;
	if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return false;
	var piece = board[r1][c1];
	if (!piece) return false;
	var target = board[r2][c2];
	if (target && target.color === piece.color) return false;

	var ok = false;
	switch (piece.type) {
		case 'rook': ok = validRook(r1, c1, r2, c2); break;
		case 'horse': ok = validHorse(r1, c1, r2, c2); break;
		case 'elephant': ok = validElephant(r1, c1, r2, c2, piece.color); break;
		case 'advisor': ok = validAdvisor(r1, c1, r2, c2, piece.color); break;
		case 'general': ok = validGeneral(r1, c1, r2, c2, piece.color); break;
		case 'cannon': ok = validCannon(r1, c1, r2, c2); break;
		case 'pawn': ok = validPawn(r1, c1, r2, c2, piece.color); break;
	}
	if (!ok) return false;

	// disallow moves that leave the two generals facing each other with a clear file
	var backup = board[r2][c2];
	board[r2][c2] = piece;
	board[r1][c1] = null;
	var illegal = generalsFacing();
	board[r1][c1] = piece;
	board[r2][c2] = backup;

	return !illegal;
}

function getLegalTargets(r, c) {
	var moves = [];
	for (var rr = 0; rr < ROWS; rr++) {
		for (var cc = 0; cc < COLS; cc++) {
			if (isValidMove(r, c, rr, cc)) moves.push({ r: rr, c: cc });
		}
	}
	return moves;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Rendering

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#f2d9a8';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = '#5a3b1e';
	ctx.lineWidth = 1.5;

	for (var r = 0; r < ROWS; r++) {
		ctx.beginPath();
		ctx.moveTo(MARGIN, MARGIN + r * CELL);
		ctx.lineTo(MARGIN + (COLS - 1) * CELL, MARGIN + r * CELL);
		ctx.stroke();
	}

	for (var c = 0; c < COLS; c++) {
		var x = MARGIN + c * CELL;
		if (c === 0 || c === COLS - 1) {
			ctx.beginPath();
			ctx.moveTo(x, MARGIN);
			ctx.lineTo(x, MARGIN + (ROWS - 1) * CELL);
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.moveTo(x, MARGIN);
			ctx.lineTo(x, MARGIN + 4 * CELL);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(x, MARGIN + 5 * CELL);
			ctx.lineTo(x, MARGIN + 9 * CELL);
			ctx.stroke();
		}
	}

	drawPalace(0);
	drawPalace(7);

	ctx.fillStyle = '#5a3b1e';
	ctx.font = '28px "KaiTi", "DFKai-SB", serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('楚 河', MARGIN + CELL * 1.5, MARGIN + 4.5 * CELL);
	ctx.fillText('漢 界', MARGIN + CELL * 6.5, MARGIN + 4.5 * CELL);

	for (var rr = 0; rr < ROWS; rr++) {
		for (var cc = 0; cc < COLS; cc++) {
			var p = board[rr][cc];
			if (p) drawPiece(rr, cc, p);
		}
	}

	if (selected) {
		var targets = getLegalTargets(selected.r, selected.c);
		ctx.fillStyle = 'rgba(0,150,0,0.55)';
		targets.forEach(function (t) {
			var tx = MARGIN + t.c * CELL, ty = MARGIN + t.r * CELL;
			ctx.beginPath();
			ctx.arc(tx, ty, 7, 0, Math.PI * 2);
			ctx.fill();
		});

		var sx = MARGIN + selected.c * CELL, sy = MARGIN + selected.r * CELL;
		ctx.strokeStyle = '#2a8f2a';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(sx, sy, CELL * 0.42, 0, Math.PI * 2);
		ctx.stroke();
	}

	ctx.fillStyle = '#333';
	ctx.font = '18px sans-serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText((currentTurn === 'red' ? '紅方' : '黑方') + ' 回合', 10, 8);
}

function drawPalace(startRow) {
	ctx.beginPath();
	ctx.moveTo(MARGIN + 3 * CELL, MARGIN + startRow * CELL);
	ctx.lineTo(MARGIN + 5 * CELL, MARGIN + (startRow + 2) * CELL);
	ctx.moveTo(MARGIN + 5 * CELL, MARGIN + startRow * CELL);
	ctx.lineTo(MARGIN + 3 * CELL, MARGIN + (startRow + 2) * CELL);
	ctx.stroke();
}

function drawPiece(r, c, p) {
	var x = MARGIN + c * CELL, y = MARGIN + r * CELL;
	ctx.beginPath();
	ctx.arc(x, y, CELL * 0.42, 0, Math.PI * 2);
	ctx.fillStyle = '#f0dfae';
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = p.color === 'red' ? '#b0272d' : '#222';
	ctx.stroke();
	ctx.fillStyle = p.color === 'red' ? '#b0272d' : '#222';
	ctx.font = 'bold 26px "KaiTi", "DFKai-SB", serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(PIECE_CHAR[p.color][p.type], x, y + 1);
}
