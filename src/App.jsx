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
import Board from "./components/board";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";
// const API_BASE_URL = 'https://scrabble-backend-dzn8.onrender.com';

const GameContext = createContext(null);

export const useGame = () => {
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
        player_rack: stateData.player_rack || [],
        game_over: stateData.game_over || false,
        first_move:
          stateData.first_move === undefined ? true : stateData.first_move,
        tiles_in_bag: stateData.tiles_in_bag || 0,
        human_objective: stateData.human_objective || null,
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
      setGameState(newState);
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

  /** Constructs the word segment placed by the player for API request. */
  const getPlayerSegmentForAPI = useCallback(() => {
    if (!placedTiles || placedTiles.length === 0) return null;

    const sortedTiles = [...placedTiles].sort((a, b) => {
      return direction === "horizontal"
        ? a.position.col - b.position.col
        : a.position.row - b.position.row;
    });

    const wordSegment = sortedTiles.map((t) => t.letter).join("");
    const startRow = sortedTiles[0].position.row;
    const startCol = sortedTiles[0].position.col;

    return {
      word: wordSegment,
      row: startRow,
      col: startCol,
      direction,
    };
  }, [placedTiles, direction]);

  /** Sends the player's move to the backend. */
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

    const moveData = getPlayerSegmentForAPI();
    if (!moveData) {
      setError("Could not construct move data from placed tiles.");
      return;
    }

    setIsAiThinking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moveData),
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(newState.detail || "Move rejected by server.");
      }
      handleStateUpdate(newState);
    } catch (err) {
      setError(err.message || "Failed to make move.");
    } finally {
      setIsAiThinking(false);
    }
  }, [
    placedTiles,
    gameState?.first_move,
    direction,
    checkFirstMoveCenter,
    getPlayerSegmentForAPI,
    handleStateUpdate,
    clearNotifications,
    setError,
    isAiThinking,
  ]);

  /** Sends a 'pass' action to the backend. */
  const passTurn = useCallback(async () => {
    if (isAiThinking) return;
    clearNotifications();

    if (
      placedTiles.length > 0 &&
      !window.confirm(
        "You have tiles placed on the board. Passing will clear them. Continue?"
      )
    ) {
      return;
    }

    setIsAiThinking(true);
    resetTurnState();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/pass`, {
        method: "POST",
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(newState.detail || "Failed to pass turn.");
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

  /** Validates if the selected tile can be placed at the given cell. */
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
              "All tiles in a turn must be in the same row for horizontal placement."
            );
            return false;
          }
          const cols = [...placedTiles.map((p) => p.position.col), col].sort(
            (a, b) => a - b
          );
          for (let i = 0; i < cols.length - 1; i++) {
            if (cols[i + 1] - cols[i] > 1) {
              let gapFilledByBoard = false;
              for (let c = cols[i] + 1; c < cols[i + 1]; c++) {
                if (gameState.board[row][c]) {
                  gapFilledByBoard = true;
                  break;
                }
              }
              if (!gapFilledByBoard) {
                setError(
                  "Tiles must form a continuous line with existing tiles or themselves (no gaps)."
                );
                return false;
              }
            }
          }
        } else {
          if (col !== firstPlaced.col) {
            setError(
              "All tiles in a turn must be in the same column for vertical placement."
            );
            return false;
          }
          const rows = [...placedTiles.map((p) => p.position.row), row].sort(
            (a, b) => a - b
          );
          for (let i = 0; i < rows.length - 1; i++) {
            if (rows[i + 1] - rows[i] > 1) {
              let gapFilledByBoard = false;
              for (let r = rows[i] + 1; r < rows[i + 1]; r++) {
                if (gameState.board[r][col]) {
                  gapFilledByBoard = true;
                  break;
                }
              }
              if (!gapFilledByBoard) {
                setError(
                  "Tiles must form a continuous line with existing tiles or themselves (no gaps)."
                );
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

  /** Places the selected tile onto the board if valid. */
  const placeTileOnBoard = useCallback(
    (row, col) => {
      if (isAiThinking || !selectedTile) return;
      clearNotifications();

      if (!validatePlacement(row, col)) {
        setSelectedTile(null);
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

      if (placedTiles.length === 1) {
        const firstTile = placedTiles[0];
        if (newPlacedTile.position.row === firstTile.position.row) {
          setDirection("horizontal");
        } else if (newPlacedTile.position.col === firstTile.position.col) {
          setDirection("vertical");
        }
      }
    },
    [
      selectedTile,
      validatePlacement,
      clearNotifications,
      isAiThinking,
      placedTiles,
      setDirection,
    ]
  );

  /** Handles clicks on tiles in the player's rack. */
  const handleTileClick = useCallback(
    (tile) => {
      if (isAiThinking) return;
      clearNotifications();

      if (selectedTile && selectedTile.index === tile.index) {
        setSelectedTile(null);
      } else if (tile.isPlaced) {
        setPlacedTiles((prev) =>
          prev.filter((pt) => pt.rackIndex !== tile.index)
        );
        setSelectedTile(null);
        if (placedTiles.length === 1) {
          // Optionally reset direction
        }
      } else {
        setSelectedTile({ letter: tile.letter, index: tile.index });
        setSelectedCell(null);
      }
    },
    [selectedTile, placedTiles, clearNotifications, isAiThinking]
  );

  /** Clears all tiles placed on the board during the current turn. */
  const clearCurrentPlacement = useCallback(() => {
    if (isAiThinking) return;
    resetTurnState();
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

/**
 * Component for the application's home/welcome screen.
 */
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
                <h2>You vs AI</h2> <p>Challenge our Advanced Scrabble AI.</p>
              </div>
            </button>
          </div>
          <div className="scrabble-rules">
            <h3>Quick Rules</h3>
            <ol>
              <li>First word must cross the center ★ square.</li>
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

/**
 * Component that renders the main game screen.
 */
const GamePage = () => {
  const game = useGame();

  /** Wrapper for handling board cell clicks. */
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
    [game]
  );

  /** Wrapper for handling rack tile clicks. */
  const handleTileClickWrapper = useCallback(
    (tile) => {
      if (!game.isAiThinking) game.handleTileClick(tile);
    },
    [game]
  );

  /** Wrapper for setting placement direction. */
  const setDirectionWrapper = useCallback(
    (dir) => {
      if (!game.isAiThinking) game.setDirection(dir);
    },
    [game]
  );

  /** Wrapper for clearing current placement. */
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
          tiles={availableRackTiles}
          playerScore={game.gameState.scores.human}
          aiScore={game.gameState.scores.ai}
          currentPlayer={game.gameState.current_player}
          gameOver={game.gameState.game_over}
          tilesInBag={game.gameState.tiles_in_bag}
          firstMove={game.gameState.first_move}
          humanObjective={game.gameState.human_objective}
          isAiThinking={game.isAiThinking}
          selectedCell={game.selectedCell}
          selectedTile={game.selectedTile}
          placedTiles={game.placedTiles}
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

/**
 * Root component of the application.
 */
function App() {
  return (
    <Router>
      <GameProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vs-ai" element={<GamePage />} />
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
