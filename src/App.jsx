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

const GameContext = createContext(null);
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};

const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true); // For the very first time a game mode page is loaded
  const [loading, setLoading] = useState(false); // For subsequent API calls within a game
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

  const resetHumanTurnState = useCallback(() => {
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
    // setDirection("horizontal"); // Keep direction or reset as per game design
  }, []);

  const handleApiResponse = useCallback(
    (apiResponseData, successMessagePrefix = "") => {
      if (!apiResponseData || typeof apiResponseData !== "object") {
        const errMsg = "Received invalid data from server.";
        setError(errMsg);
        setGameState(null);
        console.error(errMsg, apiResponseData);
        return false;
      }
      const defaults = {
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill(null)),
        scores: {},
        player_display_names: {},
        player_racks_display: {},
        player_objectives: {},
        current_player_key: "",
        current_player_display_name: "N/A",
        game_over: false,
        first_move: true,
        tiles_in_bag: 0,
        game_mode: "",
        message: "",
        player_keys: [], // Ensure player_keys has a default
      };
      const newState = { ...defaults, ...apiResponseData };
      setGameState(newState);

      let displayMessage = newState.message || "";
      if (
        successMessagePrefix &&
        !displayMessage.toLowerCase().includes("invalid move")
      ) {
        displayMessage = `${successMessagePrefix}${displayMessage}`;
      }
      if (newState.message?.toLowerCase().includes("invalid move")) {
        setError(displayMessage);
        setMessage("");
      } else {
        setMessage(displayMessage);
        setError(null);
      }

      if (
        (newState.game_mode === "human_vs_ai" &&
          newState.current_player_key === "human") ||
        newState.game_over
      ) {
        resetHumanTurnState();
      }
      if (
        newState.game_over &&
        !displayMessage.toLowerCase().includes("game over")
      ) {
        let finalScoreMsg = "GAME OVER! Scores: ";
        if (newState.player_display_names && newState.scores) {
          finalScoreMsg += Object.entries(newState.player_display_names)
            .map(([key, name]) => `${name}: ${newState.scores[key] || 0}`)
            .join(", ");
        }
        setMessage(
          (prev) => (prev ? prev + " || " : "") + finalScoreMsg.trim()
        );
      }
      return true;
    },
    [resetHumanTurnState]
  );

  const initGameMode = useCallback(
    async (mode, names = {}) => {
      console.log(`Initializing ${mode} game...`, names);
      setInitialLoading(true); // For initial page load of a game mode
      setIsAiThinking(false);
      clearNotifications();
      resetHumanTurnState();
      setGameState(null);
      let url = "";
      let options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };
      let successPrefix = "";

      if (mode === "human_vs_ai") {
        url = `${API_BASE_URL}/api/game/start/human_vs_ai`;
        successPrefix = "Human vs AI Game Started. ";
      } else if (mode === "ai_vs_ai") {
        url = `${API_BASE_URL}/api/game/start/ai_vs_ai`;
        options.body = JSON.stringify({
          ai1_name: names.ai1Name,
          ai2_name: names.ai2Name,
        });
        successPrefix = `AI Battle: ${names.ai1Name} vs ${names.ai2Name} Started. `;
      } else {
        setError("Invalid game mode selected.");
        setInitialLoading(false);
        return null;
      }

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: `HTTP error ${response.status}` }));
          throw new Error(errorData.detail || `Failed to start ${mode} game`);
        }
        const state = await response.json();
        handleApiResponse(state, successPrefix); // This will setGameState
        return state; // Return state for AIvsAI to start loop
      } catch (err) {
        console.error(`Init ${mode} Error:`, err);
        setError(err.message || `Could not start ${mode} game.`);
        setGameState(null); // Ensure gameState is null on error
        return null;
      } finally {
        setInitialLoading(false); // Initial loading done, regardless of success
      }
    },
    [clearNotifications, resetHumanTurnState, handleApiResponse]
  );

  // Define checkFirstMoveCenter (dependent on gameState)
  const checkFirstMoveCenter = useCallback(
    (currentPlacedTiles, currentDirection) => {
      if (
        !gameState ||
        !gameState.first_move ||
        !currentPlacedTiles ||
        currentPlacedTiles.length === 0
      )
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
        const col = firstTilePos.col;
        if (col !== center) return false;
        const rows = currentPlacedTiles
          .map((t) => t.position.row)
          .sort((a, b) => a - b);
        return rows[0] <= center && rows[rows.length - 1] >= center;
      }
    },
    [gameState]
  );

  const getWordInfoForAPI = useCallback(() => {
    if (
      !gameState ||
      !gameState.board ||
      !placedTiles ||
      placedTiles.length === 0
    )
      return null;
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
        setError("Error: Gap in word construction.");
        return null;
      }
    }
    return {
      word,
      row: direction === "horizontal" ? fixedValue : startPos,
      col: direction === "horizontal" ? startPos : fixedValue,
      direction,
    };
  }, [placedTiles, direction, gameState, setError]);

  const makeHumanPlayerMove = useCallback(async () => {
    if (
      isAiThinking ||
      !gameState ||
      gameState.game_mode !== "human_vs_ai" ||
      gameState.current_player_key !== "human"
    )
      return;
    clearNotifications();
    if (placedTiles.length === 0) {
      setError("Place at least one tile.");
      return;
    }
    if (gameState.first_move && !checkFirstMoveCenter(placedTiles, direction)) {
      setError("First move must cross center.");
      return;
    }
    const wordInfo = getWordInfoForAPI();
    if (!wordInfo) return;
    setIsAiThinking(true);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordInfo),
      });
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ detail: "Move rejected" }));
        throw new Error(errData.detail);
      }
      const newState = await response.json();
      handleApiResponse(newState);
    } catch (err) {
      setError(err.message);
      console.error("Human Move Error:", err);
    } finally {
      setIsAiThinking(false);
      setLoading(false);
    }
  }, [
    isAiThinking,
    gameState,
    placedTiles,
    getWordInfoForAPI,
    handleApiResponse,
    clearNotifications,
    direction,
    checkFirstMoveCenter,
  ]);

  const humanPassTurn = useCallback(async () => {
    if (
      isAiThinking ||
      !gameState ||
      gameState.game_mode !== "human_vs_ai" ||
      gameState.current_player_key !== "human"
    )
      return;
    clearNotifications();
    if (
      placedTiles.length > 0 &&
      !window.confirm("Clear placed tiles and pass?")
    )
      return;
    setIsAiThinking(true);
    setLoading(true);
    resetHumanTurnState();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/pass`, {
        method: "POST",
      });
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ detail: "Pass failed" }));
        throw new Error(errData.detail);
      }
      const newState = await response.json();
      handleApiResponse(newState);
    } catch (err) {
      setError(err.message);
      console.error("Human Pass Error:", err);
    } finally {
      setIsAiThinking(false);
      setLoading(false);
    }
  }, [
    isAiThinking,
    gameState,
    placedTiles,
    handleApiResponse,
    clearNotifications,
    resetHumanTurnState,
  ]);

  const triggerNextAiMove = useCallback(async () => {
    if (
      isAiThinking ||
      !gameState ||
      gameState.game_mode !== "ai_vs_ai" ||
      gameState.game_over
    )
      return null;
    setIsAiThinking(true);
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/game/ai_vs_ai/next_move`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errData = await response
          .json()
          .catch(() => ({ detail: "Next AI move failed" }));
        throw new Error(errData.detail);
      }
      const newState = await response.json();
      handleApiResponse(newState);
      return newState;
    } catch (err) {
      setError(err.message);
      console.error("Next AI Move Error:", err);
      return null;
    } finally {
      setIsAiThinking(false);
      setLoading(false);
    }
  }, [isAiThinking, gameState, handleApiResponse]);

  // Define validatePlacement (dependent on gameState, placedTiles, direction, setError)
  const validatePlacement = useCallback(
    (row, col) => {
      if (!gameState || !gameState.board)
        return { valid: false, message: "Board not ready." };
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
          return { valid: false, message: "Cannot place on same tile." };
        } else {
          setError("Tiles must be in a straight line.");
          return { valid: false, message: "Tiles must be in a straight line." };
        }
      }
      const allTilesIncludingNew = [...placedTiles, { position: { row, col } }];
      const axis = currentDirection === "horizontal" ? "col" : "row";
      const fixedAxis = currentDirection === "horizontal" ? "row" : "col";
      const fixedValue = firstTilePos[fixedAxis];
      if (
        allTilesIncludingNew.some((t) => t.position[fixedAxis] !== fixedValue)
      ) {
        setError("Tiles must be on the same line.");
        return { valid: false, message: "Tiles must be on the same line." };
      }
      const positions = allTilesIncludingNew.map((t) => t.position[axis]);
      positions.sort((a, b) => a - b);
      for (let i = 0; i < positions.length - 1; i++) {
        if (positions[i + 1] - positions[i] > 1) {
          let gapFilled = true;
          for (let p = positions[i] + 1; p < positions[i + 1]; p++) {
            const rCheck = currentDirection === "horizontal" ? fixedValue : p;
            const cCheck = currentDirection === "horizontal" ? p : fixedValue;
            if (!gameState.board[rCheck]?.[cCheck]) {
              gapFilled = false;
              break;
            }
          }
          if (!gapFilled) {
            setError("No gaps unless filled by existing tiles.");
            return { valid: false, message: "Gaps not allowed." };
          }
        }
      }
      return { valid: true, newDirection: currentDirection };
    },
    [placedTiles, direction, gameState, setError]
  );

  const placeTileOnBoard = useCallback(
    (row, col) => {
      if (
        isAiThinking ||
        !gameState ||
        gameState.game_mode !== "human_vs_ai" ||
        gameState.current_player_key !== "human" ||
        gameState.game_over
      )
        return;
      clearNotifications();
      if (!selectedTile) {
        setError("Select a tile from your rack first.");
        return;
      }
      if (gameState.board[row][col] !== null) {
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
      if (!placementValidation || !placementValidation.valid) {
        if (placementValidation && placementValidation.message && !error)
          setError(placementValidation.message);
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
      isAiThinking,
      gameState,
      selectedTile,
      placedTiles,
      direction,
      clearNotifications,
      setError,
      validatePlacement,
    ]
  );

  const handleTileClick = useCallback(
    (tile) => {
      if (
        isAiThinking ||
        !gameState ||
        gameState.game_mode !== "human_vs_ai" ||
        gameState.current_player_key !== "human" ||
        gameState.game_over
      )
        return;
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
      isAiThinking,
      gameState,
      selectedTile,
      clearNotifications,
      placedTiles.length,
    ]
  );

  const clearCurrentPlacement = useCallback(() => {
    if (
      isAiThinking ||
      !gameState ||
      gameState.game_mode !== "human_vs_ai" ||
      gameState.current_player_key !== "human"
    )
      return;
    clearNotifications();
    resetHumanTurnState();
  }, [isAiThinking, gameState, clearNotifications, resetHumanTurnState]);

  const value = {
    gameState,
    loading: initialLoading,
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
    initGameMode, // Use generic initGameMode
    triggerNextAiMove,
    makeHumanPlayerMove,
    humanPassTurn,
    placeTileOnBoard,
    handleTileClick,
    clearCurrentPlacement,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

const HomePage = () => {
  const navigate = useNavigate();
  // No need for useGame here if init is handled on navigation / page load
  return (
    <div className="welcome-screen">
      <div className="scrabble-board-frame">
        <div className="welcome-content">
          <div className="scrabble-title">
            {["S", "C", "R", "A", "B", "B", "L", "E"].map((l, i) => (
              <span key={i} className={`tile-${i}`}>
                {l}
              </span>
            ))}
          </div>
          <p className="tagline">The Classic Word Game</p>
          <div className="game-options">
            <button
              className="game-option-btn vs-ai"
              onClick={() => navigate("/vs-ai")}
              aria-label="Play against the AI"
            >
              <span className="tile-letter">
                P<span className="tile-value"></span>
              </span>
              <div className="option-text">
                <h2>Play vs AI</h2>
                <p>Challenge our Scrabble AI opponent.</p>
              </div>
            </button>
            <button
              className="game-option-btn ai-vs-ai"
              onClick={() => navigate("/ai-vs-ai")}
              aria-label="Watch AI vs AI"
            >
              <span className="tile-letter">
                A<span className="tile-value"></span>
              </span>
              <div className="option-text">
                <h2>AI vs AI</h2>
                <p>Watch the algorithms battle it out!</p>
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
              <li>Blanks (' ') are wildcards (0 points).</li>
              <li>
                Power Tiles (e.g., 'D' for Double Turn) have special effects!
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
  // This is for Human vs AI
  const game = useGame();
  useEffect(() => {
    if (!game.gameState || game.gameState.game_mode !== "human_vs_ai") {
      game.initGameMode("human_vs_ai"); // Use generic init
    }
  }, [game.initGameMode, game.gameState?.game_mode]);

  if (
    game.loading ||
    !game.gameState ||
    game.gameState.game_mode !== "human_vs_ai"
  ) {
    return (
      <div className="loading-screen">
        {game.loading ? "Initializing Human vs AI..." : "Loading..."}
      </div>
    );
  }
  const humanPlayerKey =
    game.gameState.player_keys?.find((key) => key === "human") || "human";
  const humanRack = game.gameState.player_racks_display?.[humanPlayerKey] || [];

  return (
    <div className="game-screen">
      <div className="game-container">
        {game.error && (
          <div className="error-message">
            {game.error}
            <button className="dismiss-error" onClick={game.clearNotifications}>
              ×
            </button>
          </div>
        )}
        {game.message && !game.error && (
          <div className="info-message">
            {game.message}
            <button className="dismiss-info" onClick={game.clearNotifications}>
              ×
            </button>
          </div>
        )}
        <Board
          {...game.gameState}
          tiles={humanRack.map((letter, index) => ({
            letter,
            index,
            isPlaced: game.placedTiles.some((t) => t.rackIndex === index),
          }))}
          isAiThinking={game.isAiThinking}
          selectedCell={game.selectedCell}
          selectedTile={game.selectedTile}
          placedTiles={game.placedTiles}
          direction={game.direction}
          onCellClick={game.placeTileOnBoard}
          onTileClick={game.handleTileClick}
          setDirection={game.setDirection}
          onMakeMove={game.makeHumanPlayerMove}
          onClearPlacement={game.clearCurrentPlacement}
          onPassTurn={game.humanPassTurn}
          onNewGame={() => game.initGameMode("human_vs_ai")} // Use generic init for new game
        />
      </div>
    </div>
  );
};

const AIVsAIPage = () => {
  const navigate = useNavigate();
  const game = useGame();
  const [ai1Name, setAi1Name] = useState("RoboScrabbler");
  const [ai2Name, setAi2Name] = useState("WordWizard");
  const [showNameModal, setShowNameModal] = useState(true);
  const [gameInProgress, setGameInProgress] = useState(false);
  const gameLoopTimeoutRef = React.useRef(null);

  const startGame = useCallback(async () => {
    setShowNameModal(false);
    setGameInProgress(true);
    const initialState = await game.initGameMode("ai_vs_ai", {
      ai1Name,
      ai2Name,
    }); // Use generic init
    if (initialState && !initialState.game_over) {
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
      gameLoopTimeoutRef.current = setTimeout(
        () => runAiGameLoop(initialState),
        1500
      );
    } else if (initialState && initialState.game_over) {
      setGameInProgress(false);
    }
  }, [game, ai1Name, ai2Name]);

  const runAiGameLoop = useCallback(
    async (currentStateFromApi) => {
      if (
        !gameInProgress ||
        !currentStateFromApi ||
        currentStateFromApi.game_over
      ) {
        setGameInProgress(false);
        if (gameLoopTimeoutRef.current)
          clearTimeout(gameLoopTimeoutRef.current);
        return;
      }
      const newState = await game.triggerNextAiMove();
      if (newState && !newState.game_over && gameInProgress) {
        const delay =
          newState.current_player_key === currentStateFromApi.current_player_key
            ? 700
            : 2000;
        if (gameLoopTimeoutRef.current)
          clearTimeout(gameLoopTimeoutRef.current);
        gameLoopTimeoutRef.current = setTimeout(
          () => runAiGameLoop(newState),
          delay
        );
      } else {
        setGameInProgress(false);
        if (newState && newState.game_over) console.log("AI Game Ended");
      }
    },
    [game, gameInProgress]
  );

  const handleRestartAiGame = useCallback(() => {
    if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    setGameInProgress(false);
    setShowNameModal(true);
  }, []);

  useEffect(() => {
    return () => {
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    };
  }, []);

  if (showNameModal) {
    /* ... (modal JSX as before) ... */
    return (
      <div className="ai-name-modal-backdrop">
        <div className="ai-name-modal-card">
          <h2>AI vs AI Battle!</h2>
          <div>
            <label htmlFor="ai1Name">AI Player 1 Name:</label>
            <input
              type="text"
              id="ai1Name"
              value={ai1Name}
              onChange={(e) => setAi1Name(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ai2Name">AI Player 2 Name:</label>
            <input
              type="text"
              id="ai2Name"
              value={ai2Name}
              onChange={(e) => setAi2Name(e.target.value)}
            />
          </div>
          <button onClick={startGame} className="control-button submit-button">
            Start Watching
          </button>
          <button
            onClick={() => navigate("/")}
            className="control-button secondary"
            style={{ marginTop: "10px" }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }
  if (
    game.loading ||
    !game.gameState ||
    game.gameState.game_mode !== "ai_vs_ai"
  ) {
    return (
      <div className="loading-screen">
        {game.loading || !game.gameState
          ? "Initializing AI Battle..."
          : "Configuring AI vs AI..."}
      </div>
    );
  }
  return (
    <div className="game-screen">
      <div className="game-container">
        {/* ... (error/message and buttons) ... */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            margin: "10px 0",
          }}
        >
          <button
            onClick={handleRestartAiGame}
            className="control-button new-game-btn secondary"
          >
            New AI Battle
          </button>
          <button
            onClick={() => {
              setGameInProgress(false);
              if (gameLoopTimeoutRef.current)
                clearTimeout(gameLoopTimeoutRef.current);
              navigate("/");
            }}
            className="control-button secondary"
          >
            Back to Menu
          </button>
        </div>
        {!game.gameState.game_over && gameInProgress && (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            Watching AI Battle... ({game.gameState.current_player_display_name}
            's turn)
          </p>
        )}
        {game.gameState.game_over && (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            Battle Concluded!
          </p>
        )}
        <Board
          {...game.gameState}
          tiles={[]}
          isAiThinking={game.isAiThinking}
          selectedCell={null}
          selectedTile={null}
          placedTiles={[]}
          direction="horizontal"
          onCellClick={() => {}}
          onTileClick={() => {}}
          setDirection={() => {}}
          onMakeMove={() => {}}
          onClearPlacement={() => {}}
          onPassTurn={() => {}}
          onNewGame={handleRestartAiGame}
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
            <Route path="/ai-vs-ai" element={<AIVsAIPage />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                  <h1>404</h1>
                  <p>Page Not Found</p>
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
