import React from 'react';
import { useGame } from '../contexts/gameContext';
import Board from '../components/board';
import PlayerRack from '../components/playerRack';
import Scoreboard from '../components/scoreboard';
import GameControls from '../components/gamecontrols';
import GameLog from '../components/gameLog';
import './styles.css';  

const GamePage = () => {
  const {
    gameState,
    loading,
    error,
    selectedTile,
    setSelectedTile,
    selectedCell,
    setSelectedCell,
    direction,
    setDirection,
    startNewGame,
    makePlayerMove
  } = useGame();

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
  };

  const handleCellClick = (cell) => {
    setSelectedCell(cell);
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>Scrabble Game</h1>
        <Scoreboard 
          playerScore={gameState.scores.human} 
          aiScore={gameState.scores.ai} 
          currentPlayer={gameState.current_player}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="game-container">
        <div className="game-board-container">
          <Board 
            board={gameState.board} 
            onCellClick={handleCellClick}
            selectedCell={selectedCell}
          />
        </div>
        
        <div className="game-sidebar">
          <GameLog message={gameState.message} />
          
          <div className="player-section">
            <h3>Your Tiles</h3>
            <PlayerRack 
              tiles={gameState.player_rack} 
              onTileClick={handleTileClick}
              selectedTile={selectedTile}
            />
          </div>
          
          <GameControls
            direction={direction}
            setDirection={setDirection}
            onMakeMove={makePlayerMove}
            onNewGame={startNewGame}
            currentPlayer={gameState.current_player}
            gameOver={gameState.game_over}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;