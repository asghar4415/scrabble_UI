import React from "react";
import PropTypes from "prop-types";
import "./boardstyles.css";

const LETTER_SCORES = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
  " ": 0,
};

const premiumSquares = {
  "0,0": "TW",
  "0,7": "TW",
  "0,14": "TW",
  "7,0": "TW",
  "7,14": "TW",
  "14,0": "TW",
  "14,7": "TW",
  "14,14": "TW",
  "1,1": "DW",
  "2,2": "DW",
  "3,3": "DW",
  "4,4": "DW",
  "1,13": "DW",
  "2,12": "DW",
  "3,11": "DW",
  "4,10": "DW",
  "13,1": "DW",
  "12,2": "DW",
  "11,3": "DW",
  "10,4": "DW",
  "10,10": "DW",
  "11,11": "DW",
  "12,12": "DW",
  "13,13": "DW",
  "7,7": "DW", // Center square
  "1,5": "TL",
  "1,9": "TL",
  "5,1": "TL",
  "5,5": "TL",
  "5,9": "TL",
  "5,13": "TL",
  "9,1": "TL",
  "9,5": "TL",
  "9,9": "TL",
  "9,13": "TL",
  "13,5": "TL",
  "13,9": "TL",
  "0,3": "DL",
  "0,11": "DL",
  "2,6": "DL",
  "2,8": "DL",
  "3,0": "DL",
  "3,7": "DL",
  "3,14": "DL",
  "6,2": "DL",
  "6,6": "DL",
  "6,8": "DL",
  "6,12": "DL",
  "7,3": "DL",
  "7,11": "DL",
  "8,2": "DL",
  "8,6": "DL",
  "8,8": "DL",
  "8,12": "DL",
  "11,0": "DL",
  "11,7": "DL",
  "11,14": "DL",
  "12,6": "DL",
  "12,8": "DL",
  "14,3": "DL",
  "14,11": "DL",
};

const BoardCell = React.memo(
  ({
    permanentLetter,
    placedLetter,
    row,
    col,
    onClick,
    isSelected,
    isAiThinking,
    currentPlayer, // "human" or "ai"
  }) => {
    const key = `${row},${col}`;
    const squareType = premiumSquares[key];
    const displayLetter = placedLetter || permanentLetter;
    const isPlacedThisTurn = !!placedLetter;

    // Clickable only if it's human's turn, not permanent, not placed this turn, and AI not thinking
    const canClick =
      currentPlayer === "human" &&
      !permanentLetter &&
      !isPlacedThisTurn &&
      !isAiThinking;

    let cellClass = `board-cell ${squareType || ""}`;
    if (isSelected && canClick) cellClass += " selected";
    if (isPlacedThisTurn) cellClass += " placed";
    if (permanentLetter) cellClass += " permanent";
    if (!canClick) cellClass += " interaction-disabled";

    const isCenter = row === 7 && col === 7;
    const typeLabel = squareType
      ? squareType === "TW"
        ? "Triple Word"
        : squareType === "DW"
        ? "Double Word"
        : squareType === "TL"
        ? "Triple Letter"
        : "Double Letter"
      : isCenter
      ? "Center Star"
      : "Standard Square";
    const contentLabel = displayLetter
      ? `contains tile ${displayLetter === " " ? "Blank" : displayLetter}`
      : "empty";
    const ariaLabel = `Board cell ${String.fromCharCode(65 + col)}${
      row + 1
    }, ${typeLabel}, ${contentLabel}. ${
      isSelected && canClick ? "Selected." : ""
    } ${isPlacedThisTurn ? "Tile placed this turn." : ""} ${
      !canClick ? "Interaction disabled." : ""
    }`;

    return (
      <div
        className={cellClass}
        onClick={canClick ? () => onClick({ row, col }) : undefined}
        data-testid={`cell-${row}-${col}`}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={isSelected && canClick}
        aria-disabled={!canClick}
      >
        {!displayLetter && squareType && (
          <span className="square-indicator" aria-hidden="true">
            {squareType}
          </span>
        )}
        {!displayLetter &&
          isCenter &&
          squareType !== "DW" && ( // DW has its own text, don't overlay star
            <span className="center-star" aria-hidden="true">
              ★
            </span>
          )}
        {displayLetter && (
          <div
            className={`cell-tile ${isPlacedThisTurn ? "temp-placed" : ""}`}
            aria-hidden="true"
          >
            <span className="tile-letter-main">
              {displayLetter === " " ? "★" : displayLetter}{" "}
              {/* Assuming blank is shown as ★ */}
            </span>
            {displayLetter !== " " &&
              LETTER_SCORES[displayLetter] !== undefined && (
                <span className="tile-score-sub">
                  {LETTER_SCORES[displayLetter]}
                </span>
              )}
          </div>
        )}
      </div>
    );
  }
);
BoardCell.propTypes = {
  permanentLetter: PropTypes.string,
  placedLetter: PropTypes.string,
  row: PropTypes.number.isRequired,
  col: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isAiThinking: PropTypes.bool.isRequired,
  currentPlayer: PropTypes.string,
};

const PlayerRack = React.memo(
  ({
    tiles, // This is always human's rack tiles
    onTileClick,
    selectedTileIndex,
    isAiThinking,
    currentPlayer, // "human" or "ai"
  }) => {
    // Interaction allowed only if human's turn and AI not thinking
    const allowInteraction = currentPlayer === "human" && !isAiThinking;
    const displayTiles = Array.isArray(tiles) ? tiles : [];

    return (
      <div className="player-rack" role="toolbar" aria-label="Player tiles">
        {displayTiles.map(({ letter, index, isPlaced }) => {
          const isSelectedForInteraction =
            allowInteraction && selectedTileIndex === index;
          const isDisabledForInteraction = isPlaced || !allowInteraction; // Disabled if placed or not human's interactive turn
          const tileLabel = letter === " " ? "Blank" : letter;
          const score = LETTER_SCORES[letter];
          const ariaLabel = `Tile ${tileLabel}${
            score !== undefined ? ", value " + score : ""
          }. ${
            isPlaced ? "Placed." : isSelectedForInteraction ? "Selected." : ""
          } ${
            isDisabledForInteraction && !isPlaced ? "Interaction disabled." : ""
          }`;

          return (
            <button
              key={`rack-${index}-${letter}`}
              className={`tile ${isSelectedForInteraction ? "selected" : ""} ${
                isPlaced ? "placed-on-board" : ""
              } ${
                isDisabledForInteraction && !isPlaced
                  ? "interaction-disabled"
                  : ""
              }`}
              onClick={
                !isDisabledForInteraction
                  ? () => onTileClick({ letter, index, isPlaced })
                  : undefined
              }
              disabled={isDisabledForInteraction}
              aria-pressed={isSelectedForInteraction}
              aria-label={ariaLabel}
              aria-disabled={isDisabledForInteraction}
            >
              <span className="tile-letter-main" aria-hidden="true">
                {letter === " " ? "★" : letter}{" "}
                {/* Assuming blank is shown as ★ */}
              </span>
              {letter !== " " && score !== undefined && (
                <span className="tile-score-sub" aria-hidden="true">
                  {score}
                </span>
              )}
            </button>
          );
        })}
        {/* Show empty rack message only if it's human's turn and rack is empty */}
        {currentPlayer === "human" && displayTiles.length === 0 && (
          <span className="empty-rack-message">Your Rack is empty</span>
        )}
        {/* Removed AI vs AI spectator message */}
      </div>
    );
  }
);
PlayerRack.propTypes = {
  tiles: PropTypes.array,
  onTileClick: PropTypes.func.isRequired,
  selectedTileIndex: PropTypes.number,
  isAiThinking: PropTypes.bool.isRequired,
  currentPlayer: PropTypes.string,
};
PlayerRack.defaultProps = { tiles: [] };

const GameControls = ({
  currentPlayer, // "human" or "ai"
  isAiThinking,
  onNewGame,
  gameOver,
  canSubmit, // Derived in parent Board component
  // playerDisplayNames, // Not needed here anymore
  ...rest // Contains direction, setDirection, onMakeMove, etc.
}) => {
  // Human interactive turn if it's human's turn, game not over, and AI not thinking
  const isHumanInteractiveTurn =
    currentPlayer === "human" && !gameOver && !isAiThinking;

  // AI vs AI mode branch removed
  return (
    <div className="game-controls">
      {gameOver ? (
        <div className="game-over-controls">
          <h3>Game Over!</h3>
          <button onClick={onNewGame} className="control-button new-game-btn">
            Play Again?
          </button>
        </div>
      ) : (
        <>
          <div className="control-section direction-toggle">
            <button
              onClick={() => rest.setDirection("horizontal")}
              disabled={!isHumanInteractiveTurn}
              className={`direction-button ${
                rest.direction === "horizontal" ? "active" : ""
              }`}
            >
              Horizontal
            </button>
            <button
              onClick={() => rest.setDirection("vertical")}
              disabled={!isHumanInteractiveTurn}
              className={`direction-button ${
                rest.direction === "vertical" ? "active" : ""
              }`}
            >
              Vertical
            </button>
          </div>
          <div className="control-section action-buttons">
            <button
              onClick={rest.onMakeMove}
              disabled={!isHumanInteractiveTurn || !canSubmit}
              className="control-button submit-button"
            >
              Submit
            </button>
            <button
              onClick={rest.onClearPlacement}
              disabled={!isHumanInteractiveTurn || !canSubmit} // Clear only if tiles placed
              className="control-button clear-button"
            >
              Clear
            </button>
            <button
              onClick={rest.onPassTurn}
              disabled={!isHumanInteractiveTurn}
              className="control-button pass-button"
            >
              Pass
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm("Restart game? Current progress will be lost.")
                )
                  onNewGame();
              }}
              disabled={isAiThinking} // Can restart even if it's AI's turn, but not if AI is currently processing
              className="control-button new-game-btn secondary"
            >
              Restart
            </button>
          </div>
        </>
      )}
    </div>
  );
};
GameControls.propTypes = {
  currentPlayer: PropTypes.string,
  isAiThinking: PropTypes.bool.isRequired,
  onNewGame: PropTypes.func.isRequired,
  gameOver: PropTypes.bool.isRequired,
  canSubmit: PropTypes.bool.isRequired,
  // direction, setDirection etc. are in ...rest via PropTypes.object for rest if needed
  // For simplicity, assuming rest contains the functions and direction string.
};

const Scoreboard = React.memo(
  ({
    playerScore, // Direct prop
    aiScore, // Direct prop
    playerDisplayNames, // Static from parent Board
    currentPlayer, // "human" or "ai"
    tilesInBag,
    isAiThinking,
  }) => {
    const scores = { human: playerScore, ai: aiScore }; // Reconstruct for mapping if preferred
    const playerKeys = ["human", "ai"]; // Static keys

    if (
      playerScore === undefined ||
      aiScore === undefined ||
      !playerDisplayNames
    ) {
      // Check direct props
      return <div className="scoreboard-loading">Loading scores...</div>;
    }

    return (
      <div className="scoreboard">
        {playerKeys.map((pKey) => (
          <div
            key={pKey}
            className={`score-item ${
              currentPlayer === pKey ? "active-turn" : ""
            }`}
          >
            <span className="player-label">
              {playerDisplayNames[pKey] || pKey}:
            </span>
            <span className="score-value">{scores[pKey] || 0}</span>
            {currentPlayer === pKey && !isAiThinking && (
              <span className="turn-indicator">
                {pKey === "human"
                  ? "★ Your Turn"
                  : `☆ ${playerDisplayNames[pKey]}'s Turn`}
              </span>
            )}
          </div>
        ))}
        <div className="score-item tiles-remaining">
          <span className="player-label">Bag:</span>
          <span className="score-value">{tilesInBag ?? "?"}</span>
          <span className="player-label" style={{ marginLeft: "2px" }}>
            tiles
          </span>
        </div>
      </div>
    );
  }
);
Scoreboard.propTypes = {
  playerScore: PropTypes.number,
  aiScore: PropTypes.number,
  playerDisplayNames: PropTypes.object.isRequired,
  currentPlayer: PropTypes.string,
  tilesInBag: PropTypes.number,
  isAiThinking: PropTypes.bool.isRequired,
};

const ObjectiveDisplay = React.memo(
  ({
    humanObjective, // Direct prop for human's objective
    playerDisplayNames, // Static from parent Board
  }) => {
    if (!humanObjective || !playerDisplayNames) return null;

    // AI vs AI mode branch removed. Only show human's objective.
    const status = humanObjective.completed
      ? "✅ Completed!"
      : "⏳ In Progress";
    return (
      <div className="objective-display human-objective">
        <h4 className="objective-title">
          {playerDisplayNames.human}'s Objective:
        </h4>{" "}
        {/* Use static name */}
        <p className="objective-desc">{humanObjective.desc || "N/A"}</p>
        <p
          className={`objective-status ${
            humanObjective.completed ? "completed" : "in-progress"
          }`}
        >
          Status: {status}{" "}
          {humanObjective.bonus && `(+${humanObjective.bonus} pts)`}
        </p>
      </div>
    );
  }
);
ObjectiveDisplay.propTypes = {
  humanObjective: PropTypes.object,
  playerDisplayNames: PropTypes.object.isRequired,
};

const Board = ({
  board,
  tiles, // Human's rack from GameProvider
  playerScore, // gameState.scores.human
  aiScore, // gameState.scores.ai
  currentPlayer, // gameState.current_player ("human" or "ai")
  gameOver,
  tilesInBag,
  firstMove,
  humanObjective, // gameState.human_objective
  isAiThinking,
  selectedCell,
  selectedTile,
  placedTiles, // Tiles human is currently placing
  direction,
  onCellClick,
  onTileClick,
  setDirection,
  onMakeMove,
  onClearPlacement,
  onPassTurn,
  onNewGame,
}) => {
  const placedTilesMap = new Map(
    (placedTiles || []).map((t) => [
      `${t.position.row},${t.position.col}`,
      t.letter,
    ])
  );
  const playerDisplayNames = { human: "You", ai: "AI" }; // Static display names

  // Check for essential props to prevent rendering errors during initial load
  if (
    board === undefined ||
    playerScore === undefined ||
    aiScore === undefined ||
    humanObjective === undefined
  ) {
    return <div className="board-loading-state">Preparing board...</div>;
  }

  return (
    <div className="board-container">
      {isAiThinking && (
        <div className="ai-thinking-modal-backdrop">
          <div className="ai-thinking-modal-card">
            <p>
              {playerDisplayNames[currentPlayer] || currentPlayer} is
              thinking...
            </p>
            <span>Please wait</span> <div className="spinner"></div>
          </div>
        </div>
      )}
      <div className={`game-layout ${isAiThinking ? "blurred" : ""}`}>
        <div className="board-area">
          <div className="scrabble-board">
            {Array.from({ length: 15 }).map((_, rowIndex) =>
              Array.from({ length: 15 }).map((__, colIndex) => (
                <BoardCell
                  key={`cell-${rowIndex}-${colIndex}`}
                  permanentLetter={board[rowIndex]?.[colIndex] || null}
                  placedLetter={
                    placedTilesMap.get(`${rowIndex},${colIndex}`) || null
                  }
                  row={rowIndex}
                  col={colIndex}
                  onClick={onCellClick}
                  isSelected={
                    selectedCell?.row === rowIndex &&
                    selectedCell?.col === colIndex
                  }
                  isAiThinking={isAiThinking}
                  currentPlayer={currentPlayer} // Simplified: "human" or "ai"
                />
              ))
            )}
          </div>
        </div>
        <div className="sidebar-area">
          <Scoreboard
            playerScore={playerScore}
            aiScore={aiScore}
            playerDisplayNames={playerDisplayNames} // Pass static names
            currentPlayer={currentPlayer}
            tilesInBag={tilesInBag}
            isAiThinking={isAiThinking}
          />
          <ObjectiveDisplay
            humanObjective={humanObjective} // Pass human's objective
            playerDisplayNames={playerDisplayNames} // Pass static names
          />

          <div className="player-rack-section">
            <h3 className="rack-title">
              {/* Simplified title based on whose turn it is */}
              {currentPlayer === "human"
                ? `${playerDisplayNames.human}'s Tiles`
                : `${playerDisplayNames.ai}'s Turn`}
            </h3>
            <PlayerRack
              tiles={tiles} // This is always the human player's rack
              onTileClick={onTileClick}
              selectedTileIndex={selectedTile?.index ?? null}
              isAiThinking={isAiThinking}
              currentPlayer={currentPlayer}
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
            canSubmit={
              currentPlayer === "human" && placedTiles && placedTiles.length > 0
            } // Simplified condition
            isAiThinking={isAiThinking}
            // playerDisplayNames not needed by GameControls itself
          />
          {/* Show first move indicator only if human's turn, first move, not game over, and AI not thinking */}
          {currentPlayer === "human" &&
            firstMove &&
            !gameOver &&
            !isAiThinking && (
              <div className="first-move-indicator">
                First move must cross center ★
              </div>
            )}
          {/* Show "Your Turn" announcement only if human's turn, not game over, and AI not thinking */}
          {currentPlayer === "human" && !gameOver && !isAiThinking && (
            <div className="turn-announcement"> Your Turn </div>
          )}
          {/* AI vs AI spectator messages removed */}
        </div>
      </div>
    </div>
  );
};

Board.propTypes = {
  board: PropTypes.array,
  tiles: PropTypes.array, // Human's rack from GameProvider
  playerScore: PropTypes.number,
  aiScore: PropTypes.number,
  currentPlayer: PropTypes.string, // "human" or "ai"
  gameOver: PropTypes.bool,
  tilesInBag: PropTypes.number,
  firstMove: PropTypes.bool,
  humanObjective: PropTypes.object, // Human's objective
  isAiThinking: PropTypes.bool.isRequired,
  selectedCell: PropTypes.object,
  selectedTile: PropTypes.object,
  placedTiles: PropTypes.array,
  direction: PropTypes.string,
  onCellClick: PropTypes.func.isRequired,
  onTileClick: PropTypes.func.isRequired,
  setDirection: PropTypes.func.isRequired,
  onMakeMove: PropTypes.func.isRequired,
  onClearPlacement: PropTypes.func.isRequired,
  onPassTurn: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
};
Board.defaultProps = {
  board: Array(15)
    .fill(null)
    .map(() => Array(15).fill(null)),
  tiles: [],
  playerScore: 0,
  aiScore: 0,
  humanObjective: null, // Or provide a default structure: { desc: '', completed: false, bonus: 0 }
  placedTiles: [],
  // Default for other props if necessary, e.g. currentPlayer: "human"
};

export default Board;
