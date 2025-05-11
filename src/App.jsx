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

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null); // Initialize gameState to null
  const [loading, setLoading] = useState(true); // For initial game load
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
    setIsAiThinking(false); // Important: Reset AI thinking on new game
    clearNotifications();
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
    setDirection("horizontal");
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`);
      const state = await response.json();
      if (!response.ok) {
        throw new Error(
          state.detail || `Failed to start game (HTTP ${response.status})`
        );
      }
      setGameState({
        board:
          state.board ||
          Array(15)
            .fill(null)
            .map(() => Array(15).fill(null)),
        scores: state.scores || { human: 0, ai: 0 },
        current_player: state.current_player || "human",
        player_rack: state.player_rack || [],
        game_over: state.game_over || false,
        first_move: state.first_move === undefined ? true : state.first_move,
        tiles_in_bag: state.tiles_in_bag || 0,
        human_objective: state.human_objective || null,
      });
      setMessage(state.message || "Game started! Your turn.");
      console.log("Game initialized:", state);
    } catch (err) {
      console.error("Init Game Error:", err);
      setError(err.message || "Could not connect to server or start game.");
      setGameState(null); // Set to null on error
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
      setGameState(newState); // newState should contain all necessary fields like player_rack
      if (newState.message?.toLowerCase().includes("invalid move")) {
        setError(newState.message);
        setMessage("");
      } else {
        setMessage(newState.message || "");
        setError(null);
      }
      console.log("Game state updated:", newState);
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
      const touchesCenter = currentPlacedTiles.some(
        (t) => t.position.row === center && t.position.col === center
      );
      if (touchesCenter) return true;
      const firstTilePos = currentPlacedTiles[0].position;
      if (currentDirection === "horizontal") {
        const row = firstTilePos.row;
        if (row !== center) return false;
        const cols = currentPlacedTiles
          .map((t) => t.position.col)
          .sort((a, b) => a - b);
        return cols[0] <= center && cols[cols.length - 1] >= center;
      } else {
        // Vertical
        const col = firstTilePos.col;
        if (col !== center) return false;
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
      const checkR = direction === "horizontal" ? fixedValue : startPos - 1;
      const checkC = direction === "horizontal" ? startPos - 1 : fixedValue;
      if (gameState.board[checkR]?.[checkC]) {
        startPos--;
      } else {
        break;
      }
    }
    const lastTile = sortedTiles[sortedTiles.length - 1];
    let endPos = lastTile.position[axis];
    while (endPos < 14) {
      const checkR = direction === "horizontal" ? fixedValue : endPos + 1;
      const checkC = direction === "horizontal" ? endPos + 1 : fixedValue;
      if (gameState.board[checkR]?.[checkC]) {
        endPos++;
      } else {
        const nextPosIsPlaced = placedTiles.some(
          (t) => t.position[axis] === endPos + 1
        );
        if (nextPosIsPlaced) {
          endPos++;
        } else {
          break;
        }
      }
    }
    let word = "";
    const placedMap = new Map(
      placedTiles.map((t) => [`${t.position.row},${t.position.col}`, t.letter])
    );
    for (let i = startPos; i <= endPos; i++) {
      const r = direction === "horizontal" ? fixedValue : i;
      const c = direction === "horizontal" ? i : fixedValue;
      const placedLetter = placedMap.get(`${r},${c}`);
      const boardLetter = gameState.board[r]?.[c];
      if (placedLetter) {
        word += placedLetter;
      } else if (boardLetter) {
        word += boardLetter;
      } else {
        console.error("Error: Gap detected in word construction!", {
          r,
          c,
          placedLetter,
          boardLetter,
        });
        setError("Internal Error: Gap detected in word placement.");
        return null;
      }
    }
    const startRow = direction === "horizontal" ? fixedValue : startPos;
    const startCol = direction === "horizontal" ? startPos : fixedValue;
    console.log("Constructed for API:", {
      word,
      row: startRow,
      col: startCol,
      direction,
    });
    return { word, row: startRow, col: startCol, direction };
  }, [placedTiles, direction, gameState?.board, setError]); // Added setError dependency
  const makePlayerMove = useCallback(async () => {
    if (isAiThinking) return; // Prevent move if AI is already processing
    clearNotifications();
    if (placedTiles.length === 0) {
      setError("Place at least one tile to make a move.");
      return;
    }
    if (
      gameState?.first_move &&
      !checkFirstMoveCenter(placedTiles, direction)
    ) {
      setError("First move must cross the center square (H8).");
      return;
    }
    const wordInfo = getWordInfoForAPI();
    if (!wordInfo) {
      return;
    }

    setIsAiThinking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordInfo),
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(
          newState.detail || `Move rejected by server (HTTP ${response.status})`
        );
      }
      handleStateUpdate(newState);
    } catch (err) {
      console.error("Make Move API Error:", err);
      setError(err.message || "Failed to communicate move to server.");
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
    if (isAiThinking) return; // Prevent pass if AI is already processing
    clearNotifications();
    if (placedTiles.length > 0) {
      if (
        !window.confirm(
          "You have tiles placed on the board. Passing will clear them. Continue?"
        )
      ) {
        return;
      }
    }
    setIsAiThinking(true);
    resetTurnState();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/pass`, {
        method: "POST",
      });
      const newState = await response.json();
      if (!response.ok) {
        throw new Error(
          newState.detail || `Failed to pass turn (HTTP ${response.status})`
        );
      }
      handleStateUpdate(newState);
    } catch (err) {
      console.error("Pass Turn API Error:", err);
      setError(err.message || "Failed to communicate pass to server.");
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
      if (placedTiles.length === 0)
        return { valid: true, newDirection: direction };
      const firstTilePos = placedTiles[0].position;
      let currentDirection = direction;
      if (placedTiles.length === 1) {
        if (row === firstTilePos.row && col !== firstTilePos.col) {
          currentDirection = "horizontal";
        } else if (col === firstTilePos.col && row !== firstTilePos.row) {
          currentDirection = "vertical";
        } else if (row === firstTilePos.row && col === firstTilePos.col) {
          return { valid: false };
        } else {
          setError(
            "Tiles must be placed in a straight line (horizontally or vertically)."
          );
          return { valid: false };
        }
      }
      const allTilesIncludingNew = [...placedTiles, { position: { row, col } }];
      const axis = currentDirection === "horizontal" ? "col" : "row";
      const fixedAxis = currentDirection === "horizontal" ? "row" : "col";
      const fixedValue = firstTilePos[fixedAxis];
      if (
        allTilesIncludingNew.some((t) => t.position[fixedAxis] !== fixedValue)
      ) {
        setError(
          "Tiles must all be on the same row (horizontal) or column (vertical)."
        );
        return { valid: false };
      }
      if (row !== fixedValue && currentDirection === "horizontal") {
        setError("Tiles must be placed on the same row for a horizontal word.");
        return { valid: false };
      }
      if (col !== fixedValue && currentDirection === "vertical") {
        setError(
          "Tiles must be placed on the same column for a vertical word."
        );
        return { valid: false };
      }
      const positions = allTilesIncludingNew.map((t) => t.position[axis]);
      positions.sort((a, b) => a - b);
      for (let i = 0; i < positions.length - 1; i++) {
        if (positions[i + 1] - positions[i] > 1) {
          let gapFilledByBoard = true;
          for (let p = positions[i] + 1; p < positions[i + 1]; p++) {
            const rCheck = currentDirection === "horizontal" ? fixedValue : p;
            const cCheck = currentDirection === "horizontal" ? p : fixedValue;
            if (!gameState.board[rCheck]?.[cCheck]) {
              gapFilledByBoard = false;
              break;
            }
          }
          if (!gapFilledByBoard) {
            setError(
              "Tiles must be placed adjacent to each other or existing tiles without gaps."
            );
            return { valid: false };
          }
        }
      }
      return { valid: true, newDirection: currentDirection };
    },
    [placedTiles, direction, gameState?.board, setError]
  );
  const placeTileOnBoard = useCallback(
    (row, col) => {
      if (
        isAiThinking ||
        gameState?.current_player !== "human" ||
        gameState?.game_over
      ) {
        // Check isAiThinking here
        setError("Cannot place tiles now.");
        return;
      }
      clearNotifications();
      if (!selectedTile) {
        setError("Select a tile from your rack first.");
        return;
      }
      // Removed redundant gameState checks as they are covered by isAiThinking or higher-level component logic
      if (gameState?.board[row][col] !== null) {
        setError("Cannot place tile on an already occupied square.");
        return;
      }
      if (
        placedTiles.some(
          (t) => t.position.row === row && t.position.col === col
        )
      ) {
        setError("Square already contains a tile placed this turn.");
        return;
      }
      const placementValidation = validatePlacement(row, col);
      if (!placementValidation.valid) {
        return;
      }
      if (
        placementValidation.newDirection &&
        placementValidation.newDirection !== direction
      ) {
        setDirection(placementValidation.newDirection);
      }
      setPlacedTiles((prev) => [
        ...prev,
        {
          letter: selectedTile.letter,
          position: { row, col },
          rackIndex: selectedTile.index,
        },
      ]);
      setSelectedTile(null);
    },
    [
      selectedTile,
      gameState,
      placedTiles,
      validatePlacement,
      direction,
      clearNotifications,
      setError,
      isAiThinking,
    ] // Added isAiThinking
  );

  const handleTileClick = useCallback(
    (tile) => {
      if (
        isAiThinking ||
        gameState?.current_player !== "human" ||
        gameState?.game_over
      )
        return; // Check isAiThinking here
      clearNotifications();
      const { index, isPlaced } = tile;
      if (isPlaced) {
        setPlacedTiles((prev) => prev.filter((pt) => pt.rackIndex !== index));
        setSelectedTile(null);
      } else {
        if (selectedTile && selectedTile.index === index) {
          setSelectedTile(null);
        } else {
          setSelectedTile({ letter: tile.letter, index: tile.index });
        }
      }
    },
    [
      selectedTile,
      gameState,
      clearNotifications,
      placedTiles.length,
      isAiThinking,
    ] // Added isAiThinking
  );

  const clearCurrentPlacement = useCallback(() => {
    if (isAiThinking) return; // Check isAiThinking
    clearNotifications();
    resetTurnState();
  }, [clearNotifications, resetTurnState, isAiThinking]); // Added isAiThinking

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
                {" "}
                <h2>Play vs AI</h2> <p>Challenge our Advanced Scrabble AI.</p>{" "}
              </div>
            </button>
            <button
              className="game-option-btn ai-vs-ai"
              onClick={() => navigate("/ai-vs-ai")}
              aria-label="Watch AI vs AI (Coming Soon)"
            >
              <span className="tile-letter">A</span>
              <div className="option-text">
                {" "}
                <h2>AI vs AI</h2> <p>Watch the algorithms battle it out!</p>{" "}
              </div>
            </button>
          </div>
          <div className="scrabble-rules">
            <h3>Quick Rules</h3>
            <ol>
              <li>Form words left-to-right or top-to-bottom.</li>
              <li>First word must cross the center ★ square.</li>
              <li>Connect subsequent words to existing tiles.</li>
              <li>Use premium squares (DL, TL, DW, TW) for bonus points!</li>
              <li>
                Blanks (' ') are wildcards (0 points). Power Tiles ('D') have
                special effects!
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
      // isAiThinking check is now inside placeTileOnBoard
      game.clearNotifications();
      if (game.selectedTile) {
        game.placeTileOnBoard(cell.row, cell.col);
      } else {
        game.setSelectedCell(cell);
      }
    },
    [game] // game includes placeTileOnBoard which has isAiThinking check
  );

  const handleTileClickWrapper = useCallback(
    (tile) => {
      // isAiThinking check is inside game.handleTileClick
      game.handleTileClick(tile);
    },
    [game]
  );

  const setDirectionWrapper = useCallback(
    (dir) => {
      if (game.isAiThinking) return;
      game.setDirection(dir);
    },
    [game]
  );

  if (game.loading || !game.gameState) {
    // Show loading screen if initial load or error
    return (
      <div className="loading-screen">
        {game.loading
          ? "Connecting to game..."
          : "Failed to load game. Please Refresh."}
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
            {" "}
            {game.error}{" "}
            <button
              className="dismiss-error"
              onClick={game.clearNotifications}
              aria-label="Dismiss error"
            >
              ×
            </button>{" "}
          </div>
        )}
        {game.message && !game.error && (
          <div className="info-message">
            {" "}
            {game.message}{" "}
            <button
              className="dismiss-info"
              onClick={game.clearNotifications}
              aria-label="Dismiss message"
            >
              ×
            </button>{" "}
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
          onTileClick={handleTileClickWrapper} // Use wrapper
          setDirection={setDirectionWrapper} // Use wrapper
          onMakeMove={game.makePlayerMove}
          onClearPlacement={game.clearCurrentPlacement} // Wrapper for this too
          onPassTurn={game.passTurn}
          onNewGame={game.startNewGame}
        />
      </div>
    </div>
  );
};

const AIVsAIPage = () => {
  const navigate = useNavigate();
  return (
    <div className="coming-soon">
      <div className="scrabble-board-frame">
        <div className="welcome-content">
          <h2>AI vs AI Mode</h2>
          <p>This feature is currently under construction.</p>
          <p>Imagine two tireless intellects locked in lexical combat!</p>
          <button
            onClick={() => navigate("/")}
            className="control-button new-game-btn"
            style={{ marginTop: "20px" }}
          >
            {" "}
            Go Back Home{" "}
          </button>
        </div>
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
            <Route path="/ai-vs-ai" element={<AIVsAIPage />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                  {" "}
                  <h1>404 - Page Not Found</h1>{" "}
                  <p>Sorry, the page you are looking for does not exist.</p>{" "}
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
