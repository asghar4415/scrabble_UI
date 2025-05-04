import React from 'react';
import PropTypes from 'prop-types';
import './boardstyles.css';

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
    '1,13': 'DW', '2,12': 'DW', '3,11': 'DW', '4,10': 'DW',
    '13,1': 'DW', '12,2': 'DW', '11,3': 'DW', '10,4': 'DW',
    '10,10': 'DW', '11,11': 'DW', '12,12': 'DW', '13,13': 'DW',
    '7,7': 'DW',
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

/**
 * Represents a single cell on the Scrabble board.
 * Displays permanent tiles, temporarily placed tiles, premium square indicators,
 * and handles click events. It's memoized for performance.
 */
const BoardCell = React.memo(({ permanentLetter, placedLetter, row, col, onClick, isSelected }) => {
  const key = `${row},${col}`;
  const squareType = premiumSquares[key];
  const displayLetter = placedLetter || permanentLetter;
  const isPlacedThisTurn = !!placedLetter;

  let cellClass = `board-cell ${squareType || ''}`;
  if (isSelected) cellClass += ' selected';
  if (isPlacedThisTurn) cellClass += ' placed';
  if (permanentLetter) cellClass += ' permanent';

  const isCenter = row === 7 && col === 7;

  const typeLabel = squareType ? (squareType === 'TW' ? 'Triple Word' : squareType === 'DW' ? 'Double Word' : squareType === 'TL' ? 'Triple Letter' : 'Double Letter') : (isCenter ? 'Center Star' : 'Standard Square');
  const contentLabel = displayLetter ? `contains tile ${displayLetter === ' ' ? 'Blank' : displayLetter}` : 'empty';
  const ariaLabel = `Board cell ${String.fromCharCode(65 + col)}${row + 1}, ${typeLabel}, ${contentLabel}. ${isSelected ? 'Selected.' : ''} ${isPlacedThisTurn ? 'Tile placed this turn.' : ''}`;

  return (
    <div
      className={cellClass}
      onClick={() => onClick({ row, col })}
      data-testid={`cell-${row}-${col}`}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isSelected}
    >
      {!displayLetter && squareType && (
        <span className="square-indicator" aria-hidden="true">{squareType}</span>
      )}
      {!displayLetter && isCenter && squareType !== 'DW' && (
          <span className="center-star" aria-hidden="true">★</span>
      )}
      {displayLetter && (
        <div className={`cell-tile ${isPlacedThisTurn ? 'temp-placed' : ''}`} aria-hidden="true">
          <span className="tile-letter-main">
            {displayLetter === ' ' ? '★' : displayLetter}
          </span>
          {displayLetter !== ' ' && LETTER_SCORES[displayLetter] !== undefined && (
            <span className="tile-score-sub">
              {LETTER_SCORES[displayLetter]}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

BoardCell.propTypes = {
  permanentLetter: PropTypes.string,
  placedLetter: PropTypes.string,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
};

/**
 * Displays the player's tile rack.
 * Handles tile selection, deselection, and indicates tiles placed on the board.
 * It's memoized for performance.
 */
const PlayerRack = React.memo(({ tiles, onTileClick, selectedTileIndex }) => {
  return (
    <div className="player-rack" role="toolbar" aria-label="Your tiles">
      {tiles.map(({ letter, index, isPlaced }) => {
        const isSelected = selectedTileIndex === index;
        const tileLabel = letter === ' ' ? 'Blank' : letter;
        const score = LETTER_SCORES[letter];
        const ariaLabel = `Tile ${tileLabel}, value ${score}. ${isPlaced ? 'Placed on board.' : isSelected ? 'Selected. Click to deselect or recall.' : 'Click to select.'}`;

        return (
          <button
            key={`rack-${index}`}
            className={`tile ${isSelected ? 'selected' : ''} ${isPlaced ? 'placed-on-board' : ''}`}
            onClick={() => onTileClick({ letter, index, isPlaced })}
            disabled={isPlaced}
            data-testid={`tile-${index}`}
            aria-pressed={isSelected}
            aria-label={ariaLabel}
          >
            <span className="tile-letter-main" aria-hidden="true">
              {letter === ' ' ? '★' : letter}
            </span>
            {letter !== ' ' && score !== undefined && (
              <span className="tile-score-sub" aria-hidden="true">
                {score}
              </span>
            )}
          </button>
        );
      })}
       {tiles.length === 0 && <span className="empty-rack-message">Rack is empty</span>}
    </div>
  );
});

PlayerRack.propTypes = {
  tiles: PropTypes.arrayOf(PropTypes.shape({
      letter: PropTypes.string.isRequired,
      index: PropTypes.number.isRequired,
      isPlaced: PropTypes.bool.isRequired,
  })).isRequired,
  onTileClick: PropTypes.func.isRequired,
  selectedTileIndex: PropTypes.number
};

/**
 * Provides game action controls like submitting words, clearing placements,
 * passing turns, changing direction, and starting a new game.
 * Buttons are enabled/disabled based on game state.
 */
const GameControls = ({
  direction,
  setDirection,
  onMakeMove,
  onClearPlacement,
  onPassTurn,
  onNewGame,
  currentPlayer,
  gameOver,
  canSubmit,
}) => {

  const isPlayerTurn = currentPlayer === 'human' && !gameOver;

  return (
    <div className="game-controls">
      {gameOver ? (
        <div className="game-over-controls">
          <h3>Game Over!</h3>
          <button
            onClick={onNewGame}
            className="control-button new-game-btn"
            data-testid="new-game-btn"
          >
            Play Again?
          </button>
        </div>
      ) : (
        <>
          <div className="control-section direction-toggle" role="radiogroup" aria-label="Word placement direction">
            <button
              onClick={() => setDirection('horizontal')}
              className={`direction-button ${direction === 'horizontal' ? 'active' : ''}`}
              disabled={!isPlayerTurn}
              data-testid="horizontal-btn"
              role="radio"
              aria-checked={direction === 'horizontal'}
            >
              Horizontal
            </button>
            <button
              onClick={() => setDirection('vertical')}
              className={`direction-button ${direction === 'vertical' ? 'active' : ''}`}
              disabled={!isPlayerTurn}
              data-testid="vertical-btn"
              role="radio"
              aria-checked={direction === 'vertical'}
            >
              Vertical
            </button>
          </div>

          <div className="control-section action-buttons">
            <button
              onClick={onMakeMove}
              disabled={!isPlayerTurn || !canSubmit}
              className="control-button submit-button"
              data-testid="submit-move-btn"
              aria-label="Submit placed tiles as a word"
            >
            Submit Word
            </button>
            <button
              onClick={onClearPlacement}
              disabled={!isPlayerTurn || !canSubmit}
              className="control-button clear-button"
              data-testid="clear-btn"
              aria-label="Recall all tiles placed this turn"
            >
              Clear Tiles
            </button>
             <button
              onClick={onPassTurn}
              disabled={!isPlayerTurn}
              className="control-button pass-button"
              data-testid="pass-btn"
              aria-label="Pass your turn"
            >
              Pass Turn
            </button>
             <button
              onClick={() => { if (window.confirm('Are you sure you want to restart the game?')) onNewGame(); }}
              className="control-button new-game-btn secondary"
              data-testid="restart-btn"
              aria-label="Restart the current game"
            >
              Restart Game
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
  onClearPlacement: PropTypes.func.isRequired,
  onPassTurn: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
  currentPlayer: PropTypes.string.isRequired,
  gameOver: PropTypes.bool.isRequired,
  canSubmit: PropTypes.bool.isRequired,
};

/**
 * Displays the current scores for the player and AI,
 * indicates whose turn it is, and shows the number of tiles left in the bag.
 * It's memoized for performance.
 */
const Scoreboard = React.memo(({ playerScore, aiScore, currentPlayer, tilesInBag }) => {
  return (
    <div className="scoreboard" aria-live="polite" aria-atomic="true">
      <div className={`score-item player-score ${currentPlayer === 'human' ? 'active-turn' : ''}`}>
        <span className="player-label">You:</span>
        <span className="score-value" data-testid="player-score">
          {playerScore}
        </span>
        {currentPlayer === 'human' && (
          <span className="turn-indicator" aria-label="Your turn"> ★ Your Turn</span>
        )}
      </div>
      <div className={`score-item ai-score ${currentPlayer === 'ai' ? 'active-turn' : ''}`}>
        <span className="player-label">AI:</span>
        <span className="score-value" data-testid="ai-score">
          {aiScore}
        </span>
         {currentPlayer === 'ai' && (
          <span className="turn-indicator" aria-label="AI's turn"> ☆ AI's Turn</span>
        )}
      </div>
       <div className="score-item tiles-remaining">
           <span className="player-label">Bag:</span>
           <span className="score-value" data-testid="tiles-left">
               {tilesInBag === undefined || tilesInBag === null ? '?' : tilesInBag}
           </span>
           <span className="player-label" style={{marginLeft: '2px'}}>tiles</span>
       </div>
    </div>
  );
});

Scoreboard.propTypes = {
  playerScore: PropTypes.number.isRequired,
  aiScore: PropTypes.number.isRequired,
  currentPlayer: PropTypes.string.isRequired,
  tilesInBag: PropTypes.number,
};

/**
 * The main component that lays out the Scrabble game interface.
 * It renders the board grid, scoreboard, player rack, and game controls,
 * orchestrating the interactions between them based on props received from the GameProvider.
 */
const Board = ({
  board,
  tiles,
  playerScore,
  aiScore,
  currentPlayer,
  gameOver,
  tilesInBag,
  firstMove,
  selectedCell,
  selectedTile,
  placedTiles,
  direction,
  onCellClick,
  onTileClick,
  setDirection,
  onMakeMove,
  onClearPlacement,
  onPassTurn,
  onNewGame,
}) => {

  const placedTilesMap = new Map(placedTiles.map(t => [`${t.position.row},${t.position.col}`, t.letter]));

  return (
    <div className="board-container">
      <div className="game-layout">

        <div className="board-area">
           <div className="scrabble-board" role="grid" aria-label={`Scrabble board, ${currentPlayer}'s turn`}>
            {Array.from({ length: 15 }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="board-row" role="row">
                {Array.from({ length: 15 }).map((__, colIndex) => {
                  const permanentLetter = board[rowIndex]?.[colIndex] || null;
                  const placedLetter = placedTilesMap.get(`${rowIndex},${colIndex}`) || null;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

                  return (
                    <BoardCell
                      key={`cell-${rowIndex}-${colIndex}`}
                      permanentLetter={permanentLetter}
                      placedLetter={placedLetter}
                      row={rowIndex}
                      col={colIndex}
                      onClick={onCellClick}
                      isSelected={isSelected}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-area">
          <Scoreboard
            playerScore={playerScore}
            aiScore={aiScore}
            currentPlayer={currentPlayer}
            tilesInBag={tilesInBag}
          />

          <div className="player-rack-section">
            <h3 className="rack-title">Your Tiles</h3>
            <PlayerRack
              tiles={tiles}
              onTileClick={onTileClick}
              selectedTileIndex={selectedTile?.index ?? null}
            />
          </div>

          <GameControls
            direction={direction}
            setDirection={setDirection}
            onMakeMove={onMakeMove}
            onClearPlacement={onClearPlacement}
            onPassTurn={onPassTurn}
            onNewGame={onNewGame}
            currentPlayer={currentPlayer}
            gameOver={gameOver}
            canSubmit={placedTiles.length > 0}
          />

           {firstMove && !gameOver && currentPlayer === 'human' && (
               <div className="first-move-indicator" aria-live="polite">
                   First move must cross the center ★ square.
               </div>
           )}
             {!gameOver && (
                 <div className="turn-announcement" aria-live="polite">
                     {currentPlayer === 'human' ? "Your Turn" : "AI is Thinking..."}
                 </div>
             )}

        </div>
      </div>
    </div>
  );
};

Board.propTypes = {
  board: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  tiles: PropTypes.arrayOf(PropTypes.shape({
      letter: PropTypes.string.isRequired,
      index: PropTypes.number.isRequired,
      isPlaced: PropTypes.bool.isRequired,
  })).isRequired,
  playerScore: PropTypes.number.isRequired,
  aiScore: PropTypes.number.isRequired,
  currentPlayer: PropTypes.oneOf(['human', 'ai']).isRequired,
  gameOver: PropTypes.bool.isRequired,
  tilesInBag: PropTypes.number,
  firstMove: PropTypes.bool.isRequired,
  selectedCell: PropTypes.shape({ row: PropTypes.number, col: PropTypes.number }),
  selectedTile: PropTypes.shape({ letter: PropTypes.string, index: PropTypes.number }),
  placedTiles: PropTypes.arrayOf(PropTypes.shape({
      letter: PropTypes.string.isRequired,
      position: PropTypes.shape({
          row: PropTypes.number.isRequired,
          col: PropTypes.number.isRequired,
      }).isRequired,
      rackIndex: PropTypes.number.isRequired,
  })).isRequired,
  direction: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
  onCellClick: PropTypes.func.isRequired,
  onTileClick: PropTypes.func.isRequired,
  setDirection: PropTypes.func.isRequired,
  onMakeMove: PropTypes.func.isRequired,
  onClearPlacement: PropTypes.func.isRequired,
  onPassTurn: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
};

export default Board;