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
  // Blank and Power Tiles have no inherent score value displayed
  " ": 0,
  // 'D': 0 // No score shown for the Double Turn tile display 'D'
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
  "7,7": "DW",
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
    gameMode,
    currentPlayerKey,
  }) => {
    const key = `${row},${col}`;
    const squareType = premiumSquares[key];
    const displayLetter = placedLetter || permanentLetter;
    const isPlacedThisTurn = !!placedLetter;
    const canClick =
      gameMode === "human_vs_ai" &&
      currentPlayerKey === "human" &&
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
        {!displayLetter && isCenter && squareType !== "DW" && (
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
              {" "}
              {displayLetter === " " ? "★" : displayLetter}{" "}
            </span>
            {displayLetter !== " " &&
              LETTER_SCORES[displayLetter] !== undefined && (
                <span className="tile-score-sub">
                  {" "}
                  {LETTER_SCORES[displayLetter]}{" "}
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
  gameMode: PropTypes.string,
  currentPlayerKey: PropTypes.string,
};

const PlayerRack = React.memo(
  ({
    tiles,
    onTileClick,
    selectedTileIndex,
    isAiThinking,
    gameMode,
    currentPlayerKey,
  }) => {
    const allowInteraction =
      gameMode === "human_vs_ai" &&
      currentPlayerKey === "human" &&
      !isAiThinking;
    const displayTiles = Array.isArray(tiles) ? tiles : [];

    return (
      <div className="player-rack" role="toolbar" aria-label="Player tiles">
        {displayTiles.map(({ letter, index, isPlaced }) => {
          const isSelectedForInteraction =
            allowInteraction && selectedTileIndex === index;
          const isDisabledForInteraction = isPlaced || !allowInteraction;
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
                {letter === " " ? "★" : letter}
              </span>
              {letter !== " " && score !== undefined && (
                <span className="tile-score-sub" aria-hidden="true">
                  {score}
                </span>
              )}
            </button>
          );
        })}
        {gameMode === "human_vs_ai" && displayTiles.length === 0 && (
          <span className="empty-rack-message">Your Rack is empty</span>
        )}
        {gameMode === "ai_vs_ai" && (
          <span className="empty-rack-message">Observing AI Players</span>
        )}
      </div>
    );
  }
);
PlayerRack.propTypes = {
  tiles: PropTypes.array, // Now can be null/undefined initially
  onTileClick: PropTypes.func.isRequired,
  selectedTileIndex: PropTypes.number,
  isAiThinking: PropTypes.bool.isRequired,
  gameMode: PropTypes.string,
  currentPlayerKey: PropTypes.string,
};
PlayerRack.defaultProps = { tiles: [] };

const GameControls = ({
  gameMode,
  currentPlayerKey,
  isAiThinking,
  onNewGame,
  gameOver,
  canSubmit,
  playerDisplayNames,
  ...rest
}) => {
  const isHumanInteractiveTurn =
    gameMode === "human_vs_ai" &&
    currentPlayerKey === "human" &&
    !gameOver &&
    !isAiThinking;

  if (gameMode === "ai_vs_ai") {
    return (
      <div className="game-controls ai-vs-ai-controls">
        {gameOver ? (
          <div className="game-over-controls">
            <h3>Battle Concluded!</h3>
            <button onClick={onNewGame} className="control-button new-game-btn">
              Watch Another?
            </button>
          </div>
        ) : (
          <p>
            {" "}
            {isAiThinking
              ? `${
                  rest.playerDisplayNames?.[currentPlayerKey] || "AI"
                } Thinking...`
              : "Watching AI Players..."}{" "}
          </p>
        )}
      </div>
    );
  }
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
              disabled={!isHumanInteractiveTurn || !canSubmit}
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
                if (window.confirm("Restart?")) onNewGame();
              }}
              disabled={isAiThinking}
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
  playerDisplayNames: PropTypes.object, // Make optional or provide default
  direction: PropTypes.string, // from ...rest
  setDirection: PropTypes.func, // from ...rest
  onMakeMove: PropTypes.func, // from ...rest
  onClearPlacement: PropTypes.func, // from ...rest
  onPassTurn: PropTypes.func, // from ...rest
  gameMode: PropTypes.string, // Can be undefined initially
  currentPlayerKey: PropTypes.string, // Can be undefined initially
  isAiThinking: PropTypes.bool.isRequired,
  onNewGame: PropTypes.func.isRequired,
  gameOver: PropTypes.bool.isRequired,
  canSubmit: PropTypes.bool.isRequired,
  // direction, setDirection etc. are in ...rest
};
GameControls.defaultProps = { playerDisplayNames: {} };

const Scoreboard = React.memo(
  ({
    scores,
    playerDisplayNames,
    currentPlayerKey,
    tilesInBag,
    gameMode,
    isAiThinking,
  }) => {
    const playerKeys = playerDisplayNames
      ? Object.keys(playerDisplayNames)
      : [];
    if (!scores || !playerDisplayNames)
      return <div className="scoreboard-loading">Loading scores...</div>;

    return (
      <div className="scoreboard">
        {playerKeys.map((pKey) => (
          <div
            key={pKey}
            className={`score-item ${
              currentPlayerKey === pKey ? "active-turn" : ""
            }`}
          >
            <span className="player-label">
              {playerDisplayNames[pKey] || pKey}:
            </span>
            <span className="score-value">{scores[pKey] || 0}</span>
            {/* Show turn indicator only if not AI thinking (modal handles it) and it's current player */}
            {currentPlayerKey === pKey && !isAiThinking && (
              <span className="turn-indicator">
                {gameMode === "human_vs_ai" && pKey === "human"
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
  scores: PropTypes.object, // Can be undefined initially
  playerDisplayNames: PropTypes.object, // Can be undefined initially
  currentPlayerKey: PropTypes.string, // Can be undefined initially
  tilesInBag: PropTypes.number,
  gameMode: PropTypes.string, // Can be undefined initially
  isAiThinking: PropTypes.bool.isRequired,
};

const ObjectiveDisplay = React.memo(
  ({ objectives, gameMode, playerDisplayNames, currentPlayerKey }) => {
    if (!objectives || !playerDisplayNames || !gameMode) return null;

    if (gameMode === "human_vs_ai") {
      const humanObjective = objectives["human"];
      if (!humanObjective) return null;
      const status = humanObjective.completed
        ? "✅ Completed!"
        : "⏳ In Progress";
      return (
        <div className="objective-display human-objective">
          <h4 className="objective-title">Your Objective:</h4>
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
    } else if (gameMode === "ai_vs_ai") {
      return (
        <div className="ai-objectives-container">
          {Object.keys(playerDisplayNames).map((pKey) => {
            // Iterate using keys from playerDisplayNames
            const objective = objectives[pKey];
            const displayName = playerDisplayNames[pKey];
            if (!objective)
              return (
                <div key={pKey} className="objective-display ai-objective-item">
                  <h5 className="objective-title">
                    {displayName}: No objective.
                  </h5>
                </div>
              );
            const status = objective.completed ? "✅" : "⏳";
            const isCurrent = currentPlayerKey === pKey;
            return (
              <div
                key={displayName}
                className={`objective-display ai-objective-item ${
                  isCurrent ? "current-ai-objective" : ""
                }`}
              >
                <h5 className="objective-title">
                  {displayName}'s Objective: {status}
                </h5>
                <p className="objective-desc small">
                  {objective.desc} ({objective.bonus} pts)
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }
);
ObjectiveDisplay.propTypes = {
  objectives: PropTypes.object, // Can be undefined initially
  gameMode: PropTypes.string, // Can be undefined initially
  playerDisplayNames: PropTypes.object, // Can be undefined initially
  currentPlayerKey: PropTypes.string, // Can be undefined initially
};

const Board = ({
  board,
  tiles,
  scores,
  playerDisplayNames,
  currentPlayerKey,
  gameMode,
  gameOver,
  tilesInBag,
  firstMove,
  playerObjectives,
  isAiThinking,
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
  const placedTilesMap = new Map(
    (placedTiles || []).map((t) => [
      `${t.position.row},${t.position.col}`,
      t.letter,
    ])
  );
  const humanPlayerKey = gameMode === "human_vs_ai" ? "human" : null;

  if (!board || !scores || !playerDisplayNames || !playerObjectives) {
    return <div className="board-loading-state">Preparing board...</div>; // Or some other placeholder
  }

  return (
    <div className="board-container">
      {isAiThinking && (
        <div className="ai-thinking-modal-backdrop">
          <div className="ai-thinking-modal-card">
            <p>
              AI ({playerDisplayNames?.[currentPlayerKey] || currentPlayerKey})
              is thinking...
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
                  gameMode={gameMode}
                  currentPlayerKey={currentPlayerKey}
                />
              ))
            )}
          </div>
        </div>
        <div className="sidebar-area">
          <Scoreboard
            scores={scores}
            playerDisplayNames={playerDisplayNames}
            currentPlayerKey={currentPlayerKey}
            tilesInBag={tilesInBag}
            gameMode={gameMode}
            isAiThinking={isAiThinking}
          />
          <ObjectiveDisplay
            objectives={playerObjectives}
            gameMode={gameMode}
            playerDisplayNames={playerDisplayNames}
            currentPlayerKey={currentPlayerKey}
          />

          <div className="player-rack-section">
            <h3 className="rack-title">
              {gameMode === "human_vs_ai" && humanPlayerKey
                ? `${playerDisplayNames[humanPlayerKey] || "Your"} Tiles`
                : gameMode === "ai_vs_ai"
                ? `${
                    playerDisplayNames[currentPlayerKey] || currentPlayerKey
                  }'s Turn (Spectating)`
                : "Tiles"}
            </h3>
            <PlayerRack
              tiles={tiles}
              onTileClick={onTileClick}
              selectedTileIndex={selectedTile?.index ?? null}
              isAiThinking={isAiThinking}
              gameMode={gameMode}
              currentPlayerKey={currentPlayerKey}
            />
          </div>

          <GameControls
            direction={direction}
            setDirection={setDirection}
            onMakeMove={onMakeMove}
            onClearPlacement={onClearPlacement}
            onPassTurn={onPassTurn}
            onNewGame={onNewGame}
            currentPlayerKey={currentPlayerKey}
            gameOver={gameOver}
            canSubmit={
              gameMode === "human_vs_ai" &&
              placedTiles &&
              placedTiles.length > 0
            }
            isAiThinking={isAiThinking}
            gameMode={gameMode}
            playerDisplayNames={playerDisplayNames}
          />
          {gameMode === "human_vs_ai" &&
            firstMove &&
            !gameOver &&
            currentPlayerKey === humanPlayerKey &&
            !isAiThinking && (
              <div className="first-move-indicator">
                {" "}
                First move must cross center ★{" "}
              </div>
            )}
          {gameMode === "human_vs_ai" &&
            !gameOver &&
            !isAiThinking &&
            currentPlayerKey === humanPlayerKey && (
              <div className="turn-announcement"> Your Turn </div>
            )}
        </div>
      </div>
    </div>
  );
};

Board.propTypes = {
  board: PropTypes.array,
  scores: PropTypes.object,
  playerDisplayNames: PropTypes.object,
  currentPlayerKey: PropTypes.string,
  gameMode: PropTypes.string,
  gameOver: PropTypes.bool,
  tilesInBag: PropTypes.number,
  firstMove: PropTypes.bool,
  playerObjectives: PropTypes.object,
  isAiThinking: PropTypes.bool.isRequired,
  tiles: PropTypes.array,
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
    .map(() => Array(15).fill(null)), // Ensure board has a default
  scores: {},
  playerDisplayNames: {},
  playerObjectives: {},
  tiles: [],
  placedTiles: [],
};

export default Board;
