// Board.jsx
import React from 'react';
import './boardstyles.css';

// Letter scores (should match backend)
const LETTER_SCORES = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1,
  'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
  'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1,
  'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
  'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4,
  'Z': 10, ' ': 0
};

// BoardCell component (now internal)
const BoardCell = ({ letter, row, col, onClick, isSelected, isPlaced }) => {
  const handleClick = () => {
    onClick({ row, col });
  };

  return (
    <div 
      className={`board-cell 
        ${isSelected ? 'selected' : ''} 
        ${isPlaced ? 'placed' : ''}
      `}
      onClick={handleClick}
    >
      {letter && (
        <div className="cell-tile">
          {letter}
          {letter !== ' ' && (
            <span className="tile-score">
              {LETTER_SCORES[letter] || 0}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// PlayerRack component (now internal)
const PlayerRack = ({ tiles = [], onTileClick, selectedTile, currentWord = [] }) => {
  const availableTiles = Array.isArray(tiles) ? 
    tiles.filter(tile => 
      !Array.isArray(currentWord) || 
      !currentWord.some(placed => placed.letter === tile)
    ) : 
    [];

  return (
    <div className="player-rack">
      {availableTiles.map((letter, index) => (
        <div
          key={`${letter}-${index}`}
          className={`tile ${selectedTile?.letter === letter ? 'selected' : ''}`}
          onClick={() => onTileClick({ letter, index })}
        >
          {letter}
          <span className="tile-score">
            {LETTER_SCORES[letter] || 0}
          </span>
        </div>
      ))}
    </div>
  );
};

// GameControls component (now internal)
const GameControls = ({
  direction,
  setDirection,
  onMakeMove,
  onNewGame,
  currentPlayer,
  gameOver,
  onClearWord
}) => {
  return (
    <div className="game-controls">
      <div className="direction-toggle">
        <button
          onClick={() => setDirection('horizontal')}
          className={direction === 'horizontal' ? 'active' : ''}
        >
          Horizontal
        </button>
        <button
          onClick={() => setDirection('vertical')}
          className={direction === 'vertical' ? 'active' : ''}
        >
          Vertical
        </button>
      </div>
      
      <div className="action-buttons">
        <button 
          onClick={onMakeMove}
          disabled={currentPlayer !== 'human' || gameOver}
        >
          Submit Move
        </button>
        <button onClick={onClearWord}>
          Clear
        </button>
        <button onClick={onNewGame}>
          New Game
        </button>
      </div>
      
      {gameOver && (
        <div className="game-over-message">
          Game Over! Final scores displayed above.
        </div>
      )}
    </div>
  );
};

// Scoreboard component (now internal)
const Scoreboard = ({ playerScore, aiScore, currentPlayer }) => {
  return (
    <div className="scoreboard">
      <div className={`score ${currentPlayer === 'human' ? 'active' : ''}`}>
        <span className="player-label">You:</span>
        <span className="score-value">{playerScore}</span>
      </div>
      <div className={`score ${currentPlayer === 'ai' ? 'active' : ''}`}>
        <span className="player-label">AI:</span>
        <span className="score-value">{aiScore}</span>
      </div>
    </div>
  );
};



// Main Board component
const Board = ({ 
  board, 
  onCellClick, 
  selectedCell, 
  placedTiles = [],
  tiles = [],
  onTileClick,
  selectedTile,
  currentWord = [],
  direction,
  setDirection,
  onMakeMove,
  onNewGame,
  currentPlayer,
  gameOver,
  onClearWord,
  playerScore,
  aiScore
}) => {
  // Create a merged board with placed tiles
  const renderBoard = board.map(row => [...row]);
  
  placedTiles.forEach(({ letter, position: { row, col } }) => {
    renderBoard[row][col] = letter;
  });

  return (
    <div className="board-container">
      <h1 className="scrabble-title">SCRABBLE</h1>
      <div className="title-divider"></div>
      
      <div className="game-main">
        <div className="board-section">
          <div className="scrabble-board">
            {renderBoard.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, colIndex) => (
                  <BoardCell
                    key={`${rowIndex}-${colIndex}`}
                    letter={cell}
                    row={rowIndex}
                    col={colIndex}
                    onClick={onCellClick}
                    isSelected={selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex}
                    isPlaced={placedTiles.some(t => 
                      t.position.row === rowIndex && t.position.col === colIndex
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        
        <div className="game-sidebar">
        <Scoreboard 
              playerScore={playerScore} 
              aiScore={aiScore} 
              currentPlayer={currentPlayer}
            />
          <div className="player-rack-section">
            <h3>Your Tiles</h3>
            
            <PlayerRack 
              tiles={tiles}
              onTileClick={onTileClick}
              selectedTile={selectedTile}
              currentWord={currentWord}
            />
          </div>
          
          <GameControls
            direction={direction}
            setDirection={setDirection}
            onMakeMove={onMakeMove}
            onNewGame={onNewGame}
            currentPlayer={currentPlayer}
            gameOver={gameOver}
            onClearWord={onClearWord}
          />
        </div>
      </div>
    </div>
  );
};

export default Board;