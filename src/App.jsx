// --- START OF FILE App.jsx ---

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Board from "./components/board"; // Ensure this path is correct
import "./App.css";

// const API_BASE_URL = 'https://scrabble-backend-dzn8.onrender.com';
const API_BASE_URL = "http://127.0.0.1:8000"; // For local development

const GameContext = createContext(null);

export const useGame = () => {
  // Added export for potential use in Board if needed, though direct props are better
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState("horizontal");
  const [placedTiles, setPlacedTiles] = useState([]);

  const clearNotifications = useCallback(() => {
    setError(null);
    setMessage("");
  }, []);

  const initGame = useCallback(async () => {
    console.log("Initializing game...");
    setLoading(true);
    setIsAiThinking(false);
    clearNotifications();
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
    setDirection("horizontal");
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`);
      const stateData = await response.json();
      if (!response.ok) {
        throw new Error(
          stateData.detail || `Failed to start game (HTTP ${response.status})`
        );
      }
      setGameState({
        board:
          stateData.board ||
          Array(15)
            .fill(null)
            .map(() => Array(15).fill(null)),
        scores: stateData.scores || { human: 0, ai: 0 },
        current_player: stateData.current_player || "human",
        player_rack: stateData.player_rack || [], // This is human's rack from backend
        game_over: stateData.game_over || false,
        first_move:
          stateData.first_move === undefined ? true : stateData.first_move,
        tiles_in_bag: stateData.tiles_in_bag || 0,
        human_objective: stateData.human_objective || null, // This is human's objective
      });
      setMessage(stateData.message || "Game started! Your turn.");
    } catch (err) {
      console.error("Init Game Error:", err);
      setError(err.message || "Could not connect to server or start game.");
      setGameState(null);
    } finally {
      setLoading(false);
    }
  }, [clearNotifications]);

  const resetTurnState = useCallback(() => {
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
  }, []);

  const startNewGame = useCallback(async () => {
    await initGame();
  }, [initGame]);

  const handleStateUpdate = useCallback(
    (newState) => {
      setGameState(newState); // newState from backend already has player_rack and human_objective for human
      if (newState.message?.toLowerCase().includes("invalid move")) {
        setError(newState.message);
        setMessage("");
      } else {
        setMessage(newState.message || "");
        setError(null);
      }
      if (newState.current_player === "human" || newState.game_over) {
        resetTurnState();
      }
      if (
        newState.game_over &&
        !newState.message?.toLowerCase().includes("game over")
      ) {
        setMessage(
          (prev) =>
            (prev ? prev + " || " : "") +
            `GAME OVER! Final Score -> You: ${newState.scores.human}, AI: ${newState.scores.ai}`
        );
      }
    },
    [resetTurnState]
  );

  const checkFirstMoveCenter = useCallback(
    (currentPlacedTiles, currentDirection) => {
      if (!gameState?.first_move || currentPlacedTiles.length === 0)
        return true;
      const center = 7;
      if (
        currentPlacedTiles.some(
          (t) => t.position.row === center && t.position.col === center
        )
      )
        return true;
      const firstTilePos = currentPlacedTiles[0].position;
      if (currentDirection === "horizontal") {
        if (firstTilePos.row !== center) return false;
        const cols = currentPlacedTiles
          .map((t) => t.position.col)
          .sort((a, b) => a - b);
        return cols[0] <= center && cols[cols.length - 1] >= center;
      } else {
        if (firstTilePos.col !== center) return false;
        const rows = currentPlacedTiles
          .map((t) => t.position.row)
          .sort((a, b) => a - b);
        return rows[0] <= center && rows[rows.length - 1] >= center;
      }
    },
    [gameState?.first_move]
  );

  const getWordInfoForAPI = useCallback(() => {
    if (!placedTiles || placedTiles.length === 0) return null;
    const axis = direction === "horizontal" ? "col" : "row";
    const fixedAxis = direction === "horizontal" ? "row" : "col";
    const sortedTiles = [...placedTiles].sort(
      (a, b) => a.position[axis] - b.position[axis]
    );
    const firstTile = sortedTiles[0];
    const fixedValue = firstTile.position[fixedAxis];
    let startPos = firstTile.position[axis];
    while (startPos > 0) {
      const r = direction === "horizontal" ? fixedValue : startPos - 1;
      const c = direction === "horizontal" ? startPos - 1 : fixedValue;
      if (gameState.board[r]?.[c]) startPos--;
      else break;
    }
    let endPos = sortedTiles[sortedTiles.length - 1].position[axis];
    while (endPos < 14) {
      const r = direction === "horizontal" ? fixedValue : endPos + 1;
      const c = direction === "horizontal" ? endPos + 1 : fixedValue;
      if (
        gameState.board[r]?.[c] ||
        placedTiles.some((t) => t.position[axis] === endPos + 1)
      )
        endPos++;
      else break;
    }
    let word = "";
    const placedMap = new Map(
      placedTiles.map((t) => [`${t.position.row},${t.position.col}`, t.letter])
    );
    for (let i = startPos; i <= endPos; i++) {
      const r = direction === "horizontal" ? fixedValue : i;
      const c = direction === "horizontal" ? i : fixedValue;
      const pL = placedMap.get(`${r},${c}`);
      const bL = gameState.board[r]?.[c];
      if (pL) word += pL;
      else if (bL) word += bL;
      else {
        setError("Gap in word.");
        return null;
      }
    }
    return {
      word,
      row: direction === "horizontal" ? fixedValue : startPos,
      col: direction === "horizontal" ? startPos : fixedValue,
      direction,
    };
  }, [placedTiles, direction, gameState?.board, setError]);

  const makePlayerMove = useCallback(async () => {
    if (isAiThinking) return;
    clearNotifications();
    if (placedTiles.length === 0) {
      setError("Place at least one tile.");
      return;
    }
    if (
      gameState?.first_move &&
      !checkFirstMoveCenter(placedTiles, direction)
    ) {
      setError("First move must cross center.");
      return;
    }
    const wordInfo = getWordInfoForAPI();
    if (!wordInfo) return;
    setIsAiThinking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordInfo),
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(newState.detail || "Move rejected.");
      }
      handleStateUpdate(newState);
    } catch (err) {
      setError(err.message || "Failed to make move.");
    } finally {
      setIsAiThinking(false);
    }
  }, [
    placedTiles,
    gameState,
    direction,
    checkFirstMoveCenter,
    getWordInfoForAPI,
    handleStateUpdate,
    clearNotifications,
    setError,
    isAiThinking,
  ]);

  const passTurn = useCallback(async () => {
    if (isAiThinking) return;
    clearNotifications();
    if (
      placedTiles.length > 0 &&
      !window.confirm("Tiles on board will be cleared. Pass?")
    )
      return;
    setIsAiThinking(true);
    resetTurnState();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/pass`, {
        method: "POST",
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(newState.detail || "Failed to pass.");
      }
      handleStateUpdate(newState);
    } catch (err) {
      setError(err.message || "Failed to pass turn.");
    } finally {
      setIsAiThinking(false);
    }
  }, [
    clearNotifications,
    handleStateUpdate,
    placedTiles.length,
    resetTurnState,
    setError,
    isAiThinking,
  ]);

  const validatePlacement = useCallback(
    (row, col) => {
      if (!gameState || !selectedTile) return false;
      if (
        gameState.board[row][col] ||
        placedTiles.some(
          (p) => p.position.row === row && p.position.col === col
        )
      ) {
        setError("Cell is already occupied.");
        return false;
      }
      if (placedTiles.length > 0) {
        const firstPlaced = placedTiles[0].position;
        if (direction === "horizontal") {
          if (row !== firstPlaced.row) {
            setError(
              "All tiles must be in the same row for horizontal placement."
            );
            return false;
          }
          const cols = [...placedTiles.map((p) => p.position.col), col].sort(
            (a, b) => a - b
          );
          for (let i = 0; i < cols.length - 1; i++) {
            if (cols[i + 1] - cols[i] > 1) {
              // Check for gaps
              let gapExists = false;
              for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
                if (!gameState.board[row][c]) {
                  // If gap isn't filled by existing board tile
                  gapExists = true;
                  break;
                }
              }
              if (gapExists) {
                setError("Tiles must form a continuous line (no gaps).");
                return false;
              }
            }
          }
        } else {
          // Vertical
          if (col !== firstPlaced.col) {
            setError(
              "All tiles must be in the same column for vertical placement."
            );
            return false;
          }
          const rows = [...placedTiles.map((p) => p.position.row), row].sort(
            (a, b) => a - b
          );
          for (let i = 0; i < rows.length - 1; i++) {
            if (rows[i + 1] - rows[i] > 1) {
              // Check for gaps
              let gapExists = false;
              for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
                if (!gameState.board[r][col]) {
                  // If gap isn't filled by existing board tile
                  gapExists = true;
                  break;
                }
              }
              if (gapExists) {
                setError("Tiles must form a continuous line (no gaps).");
                return false;
              }
            }
          }
        }
      }
      return true;
    },
    [gameState, selectedTile, placedTiles, direction, setError]
  );

  const placeTileOnBoard = useCallback(
    (row, col) => {
      if (isAiThinking || !selectedTile) return;
      clearNotifications();

      if (!validatePlacement(row, col)) {
        setSelectedTile(null); // Deselect tile if placement is invalid
        return;
      }

      const newPlacedTile = {
        letter: selectedTile.letter,
        rackIndex: selectedTile.index,
        position: { row, col },
      };
      setPlacedTiles((prev) => [...prev, newPlacedTile]);
      setSelectedTile(null);
      setSelectedCell(null);

      if (placedTiles.length === 0 && selectedTile) {
        // First tile being placed in a turn
        // No need to set direction here explicitly, it's handled by user or default
      }
    },
    [
      selectedTile,
      validatePlacement,
      clearNotifications,
      isAiThinking,
      placedTiles.length,
    ]
  );

  const handleTileClick = useCallback(
    (tile) => {
      if (isAiThinking) return;
      clearNotifications();
      if (selectedTile && selectedTile.index === tile.index) {
        setSelectedTile(null); // Deselect if clicking the same tile
      } else if (tile.isPlaced) {
        // Recall tile from board
        const tileToRecall = placedTiles.find(
          (pt) => pt.rackIndex === tile.index
        );
        if (tileToRecall) {
          setPlacedTiles((prev) =>
            prev.filter((pt) => pt.rackIndex !== tile.index)
          );
          // If recalling the only tile, direction can be reset or kept as is.
          // If recalling one of multiple tiles, direction should be maintained based on remaining.
          if (placedTiles.length === 1) {
            // Optionally reset direction or maintain; current keeps it.
          }
        }
        setSelectedTile(null); // Ensure no tile is selected after recalling
      } else {
        setSelectedTile({ letter: tile.letter, index: tile.index });
        setSelectedCell(null); // Deselect cell when a new tile is picked
      }
    },
    [selectedTile, placedTiles, clearNotifications, isAiThinking]
  );

  const clearCurrentPlacement = useCallback(() => {
    if (isAiThinking) return;
    resetTurnState();
    // Optionally, reset direction to default if desired
    // setDirection("horizontal");
  }, [resetTurnState, isAiThinking]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const value = {
    gameState,
    loading,
    isAiThinking,
    error,
    message,
    selectedTile,
    selectedCell,
    direction,
    placedTiles,
    setError,
    setMessage,
    clearNotifications,
    setSelectedTile,
    setSelectedCell,
    setDirection,
    startNewGame,
    makePlayerMove,
    placeTileOnBoard,
    handleTileClick,
    clearCurrentPlacement,
    passTurn,
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="welcome-screen">
      <div className="scrabble-board-frame">
        <div className="welcome-content">
          <div className="scrabble-title">
            {["S", "C", "R", "A", "B", "B", "L", "E"].map((letter, i) => (
              <span key={i}>{letter}</span>
            ))}
          </div>
          <p className="tagline">The Classic Word Game - Advanced AI</p>
          <div className="game-options">
            <button
              className="game-option-btn vs-ai"
              onClick={() => navigate("/vs-ai")}
              aria-label="Play against the AI"
            >
              <span className="tile-letter">P</span>
              <div className="option-text">
                <h2>Play vs AI</h2> <p>Challenge our Advanced Scrabble AI.</p>
              </div>
            </button>
            {/* AI vs AI button removed */}
          </div>
          <div className="scrabble-rules">
            <h3>Quick Rules</h3>
            <ol>
              <li>Form words left-to-right or top-to-bottom.</li>
              <li>First word must cross the center ★ square.</li>
              <li>Connect subsequent words to existing tiles.</li>
              <li>Use premium squares (DL, TL, DW, TW) for bonus points!</li>
              <li>
                Blanks (' ') are wildcards (0 points). Power Tiles (e.g., 'D'
                for Double Turn) have special effects!
              </li>
              <li>Complete your secret objective for bonus points!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamePage = () => {
  const game = useGame();

  const handleCellClick = useCallback(
    (cell) => {
      if (game.isAiThinking) return;
      game.clearNotifications();
      if (game.selectedTile) {
        game.placeTileOnBoard(cell.row, cell.col);
      } else {
        game.setSelectedCell(cell);
      }
    },
    [game] // game object itself is a dependency
  );

  const handleTileClickWrapper = useCallback(
    (tile) => {
      if (!game.isAiThinking) game.handleTileClick(tile);
    },
    [game]
  );

  const setDirectionWrapper = useCallback(
    (dir) => {
      if (!game.isAiThinking) game.setDirection(dir);
    },
    [game]
  );

  const clearCurrentPlacementWrapper = useCallback(() => {
    if (!game.isAiThinking) game.clearCurrentPlacement();
  }, [game]);

  if (game.loading || !game.gameState) {
    return (
      <div className="loading-screen">
        {game.loading
          ? "Connecting to game..."
          : "Failed to load. Please Refresh."}
      </div>
    );
  }

  // gameState.player_rack is always the human player's rack
  const availableRackTiles = game.gameState.player_rack
    ? game.gameState.player_rack.map((letter, index) => ({
        letter,
        index,
        isPlaced: game.placedTiles.some((t) => t.rackIndex === index),
      }))
    : [];

  return (
    <div className="game-screen">
      <div className="game-container">
        {game.error && (
          <div className="error-message">
            {game.error}
            <button
              className="dismiss-error"
              onClick={game.clearNotifications}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
        {game.message && !game.error && (
          <div className="info-message">
            {game.message}
            <button
              className="dismiss-info"
              onClick={game.clearNotifications}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
        <Board
          board={game.gameState.board}
          tiles={availableRackTiles} // Human's rack tiles
          playerScore={game.gameState.scores.human}
          aiScore={game.gameState.scores.ai}
          currentPlayer={game.gameState.current_player}
          gameOver={game.gameState.game_over}
          tilesInBag={game.gameState.tiles_in_bag}
          firstMove={game.gameState.first_move}
          humanObjective={game.gameState.human_objective} // Human's objective
          isAiThinking={game.isAiThinking}
          selectedCell={game.selectedCell}
          selectedTile={game.selectedTile}
          placedTiles={game.placedTiles} // Tiles human is currently placing
          direction={game.direction}
          onCellClick={handleCellClick}
          onTileClick={handleTileClickWrapper}
          setDirection={setDirectionWrapper}
          onMakeMove={game.makePlayerMove}
          onClearPlacement={clearCurrentPlacementWrapper}
          onPassTurn={game.passTurn}
          onNewGame={game.startNewGame}
        />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <GameProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vs-ai" element={<GamePage />} />
            {/* Route for /ai-vs-ai removed */}
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                  <h1>404 - Page Not Found</h1>
                  <p>Sorry, the page you are looking for does not exist.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </GameProvider>
    </Router>
  );
}
export default App;
// --- END OF FILE App.jsx ---
