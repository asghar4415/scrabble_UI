import React from 'react';
import './gamelog_styles.css';

const GameLog = ({ message }) => {
  return (
    <div className="game-log">
      <h3>Game Log</h3>
      <div className="log-messages">
        {message && <div className="log-entry">{message}</div>}
      </div>
    </div>
  );
};

export default GameLog;