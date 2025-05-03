import React from 'react';
import PropTypes from 'prop-types';
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

const premiumSquares = {
  '0,0': 'TW', '0,7': 'TW', '0,14': 'TW',
  '7,0': 'TW', '7,14': 'TW', '14,0': 'TW',
  '14,7': 'TW', '14,14': 'TW',
  '1,1': 'DW', '2,2': 'DW', '3,3': 'DW', '4,4': 'DW',
  '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',
  '1,5': 'TL', '1,9': 'TL', '5,1': 'TL', '5,5': 'TL',
  '5,9': 'TL', '5,13': 'TL', '9,1': 'TL', '9,5': 'TL',
  '9,9': 'TL', '9,13': 'TL', '13,5': 'TL', '13,9': 'TL',
  '0,3': 'DL', '0,11': 'DL', '2,6': 'DL', '2,8': 'DL',
  '3,0': 'DL', '3,7': 'DL', '3,14': 'DL', '6,2': 'DL',
  '6,6': 'DL', '6,8': 'DL', '6,12': 'DL', '7,3': 'DL',
  '7,11': 'DL', '8,2': 'DL', '8,6': 'DL', '8,8': 'DL',
  '8,12': 'DL', '11,0': 'DL', '11,7': 'DL', '11,14': 'DL',
  '12,6': 'DL', '12,8': 'DL', '14,3': 'DL', '14,11': 'DL'
};

// BoardCell component
const BoardCell = ({ letter, row, col, onClick, isSelected, isPlaced }) => {
  const handleClick = () => {
    onClick({ row, col });
  };
  const squareType = premiumSquares[`${row},${col}`];

  return (
    <div 
      className={`board-cell ${squareType || ''} 
        ${isSelected ? 'selected' : ''} 
        ${isPlaced ? 'placed' : ''}`}
      onClick={handleClick}
      data-testid={`cell-${row}-${col}`}
    >
      {!letter && squareType && (
        <div className="square-indicator">{squareType}</div>
      )}
      {letter && (
        <div className="cell-tile">
          {letter === ' ' ? '★' : letter}
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

BoardCell.propTypes = {
  letter: PropTypes.string,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isPlaced: PropTypes.bool
};

// PlayerRack component
const PlayerRack = ({ tiles, onTileClick, selectedTile }) => {
  return (
    <div className="player-rack">
      {tiles.map((letter, index) => (
        <div
          key={index}
          className={`tile ${selectedTile?.index === index ? 'selected' : ''}`}
          onClick={() => onTileClick({ letter, index })}
          data-testid={`tile-${index}`}
        >
          {letter === ' ' ? '★' : letter}
          {letter !== ' ' && (
            <span className="tile-score">
              {LETTER_SCORES[letter] || 0}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

PlayerRack.propTypes = {
  tiles: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTileClick: PropTypes.func.isRequired,
  selectedTile: PropTypes.object
};

// GameControls component
const GameControls = ({
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
  return (
    <div className="game-controls">
      {gameOver ? (
        <div className="game-over-message">
          <h3>Game Over!</h3>
          <p>
            Final Score: You {playerScore} - {aiScore} AI
          </p>
          <button 
            onClick={onNewGame} 
            className="new-game-btn"
            data-testid="new-game-btn"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="direction-toggle">
            <button
              onClick={() => setDirection('horizontal')}
              className={direction === 'horizontal' ? 'active' : ''}
              data-testid="horizontal-btn"
            >
              Horizontal
            </button>
            <button
              onClick={() => setDirection('vertical')}
              className={direction === 'vertical' ? 'active' : ''}
              data-testid="vertical-btn"
            >
              Vertical
            </button>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={onMakeMove}
              disabled={currentPlayer !== 'human'}
              data-testid="submit-move-btn"
            >
              Submit Move
            </button>
            <button 
              onClick={onClearWord}
              data-testid="clear-btn"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
};

GameControls.propTypes = {
  direction: PropTypes.string.isRequired,
  setDirection: PropTypes.func.isRequired,
  onMakeMove: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
  currentPlayer: PropTypes.string.isRequired,
  gameOver: PropTypes.bool.isRequired,
  onClearWord: PropTypes.func.isRequired,
  playerScore: PropTypes.number.isRequired,
  aiScore: PropTypes.number.isRequired
};

// Scoreboard component
const Scoreboard = ({ playerScore, aiScore, currentPlayer }) => {
  return (
    <div className="scoreboard">
      <div className={`score ${currentPlayer === 'human' ? 'active' : ''}`}>
        <span className="player-label">Your Score:</span>
        <span className="score-value" data-testid="player-score">
          {playerScore}
        </span>
        {currentPlayer === 'human' && (
          <span className="turn-indicator">← Your Turn</span>
        )}
      </div>
      <div className={`score ${currentPlayer === 'ai' ? 'active' : ''}`}>
        <span className="player-label">AI Score:</span>
        <span className="score-value" data-testid="ai-score">
          {aiScore}
        </span>
        {currentPlayer === 'ai' && (
          <span className="turn-indicator">← AI's Turn</span>
        )}
      </div>
    </div>
  );
};

Scoreboard.propTypes = {
  playerScore: PropTypes.number.isRequired,
  aiScore: PropTypes.number.isRequired,
  currentPlayer: PropTypes.string.isRequired
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
              <div key={`row-${rowIndex}`} className="board-row">
                {row.map((cell, colIndex) => (
                  <BoardCell
                    key={`cell-${rowIndex}-${colIndex}`}
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
            playerScore={playerScore}
            aiScore={aiScore}
          />
        </div>
      </div>
    </div>
  );
};

Board.propTypes = {
  board: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  onCellClick: PropTypes.func.isRequired,
  selectedCell: PropTypes.object,
  placedTiles: PropTypes.array,
  tiles: PropTypes.array,
  onTileClick: PropTypes.func.isRequired,
  selectedTile: PropTypes.object,
  currentWord: PropTypes.array,
  direction: PropTypes.string.isRequired,
  setDirection: PropTypes.func.isRequired,
  onMakeMove: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
  currentPlayer: PropTypes.string.isRequired,
  gameOver: PropTypes.bool.isRequired,
  onClearWord: PropTypes.func.isRequired,
  playerScore: PropTypes.number.isRequired,
  aiScore: PropTypes.number.isRequired
};

export default Board;