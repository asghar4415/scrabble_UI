import React from 'react';
import './boardstyle.css';

const GameControls = ({ 
  direction, 
  setDirection, 
  onMakeMove, 
  onNewGame,
  currentPlayer,
  gameOver
}) => {
  return (
    <div className="game-controls">
      <div className="direction-control">
        <label>
          <input
            type="radio"
            checked={direction === 'horizontal'}
            onChange={() => setDirection('horizontal')}
          />
          Horizontal
        </label>
        <label>
          <input
            type="radio"
            checked={direction === 'vertical'}
            onChange={() => setDirection('vertical')}
          />
          Vertical
        </label>
      </div>
      
      <button 
        onClick={onMakeMove}
        disabled={currentPlayer !== 'human' || gameOver}
      >
        Place Word
      </button>
      
      <button onClick={onNewGame}>
        New Game
      </button>
      
      {gameOver && (
        <div className="game-over-message">
          Game Over! Start a new game to play again.
        </div>
      )}
    </div>
  );
};

export default GameControls;