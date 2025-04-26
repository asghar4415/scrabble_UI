import React from 'react';
import './score_styles.css';

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

export default Scoreboard;