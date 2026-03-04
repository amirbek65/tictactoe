import './Board.css';

export default function Board({ board, onCellClick, disabled, winLine = [], playerSymbol }) {
  const getSymbol = (cell) => {
    if (cell === 'X' || cell === true) return 'X';
    if (cell === 'O') return 'O';
    return null;
  };

  return (
    <div className="board">
      {(board || Array(9).fill(null)).map((cell, i) => {
        const symbol = getSymbol(cell);
        const isWin = winLine.includes(i);
        return (
          <button
            key={i}
            className={`cell ${symbol ? 'cell-filled' : ''} ${symbol === 'X' ? 'cell-x' : ''} ${symbol === 'O' ? 'cell-o' : ''} ${isWin ? 'cell-win' : ''}`}
            onClick={() => !symbol && !disabled && onCellClick(i)}
            disabled={!!symbol || disabled}
          >
            {symbol && (
              <span className="cell-symbol">
                {symbol === 'X' ? '✕' : '○'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
