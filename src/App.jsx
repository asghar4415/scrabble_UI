import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Board from './components/board';
import './App.css';

// Define the base URL for the backend API. Ensure it matches your backend setup.
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create a React context to hold the game state and actions.
const GameContext = createContext(null);

/**
 * Custom hook to access the GameContext.
 * Provides a convenient way to use game state and actions, ensuring the hook is used within a GameProvider.
 * @returns {object} The game context value.
 * @throws {Error} If used outside of a GameProvider.
 */
const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

/**
 * Provides the game state and actions to its children components via context.
 * Manages game initialization, player moves, board interactions, and communication with the backend API.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 */
const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('horizontal');
  const [placedTiles, setPlacedTiles] = useState([]);

  /**
   * Clears any active error or informational messages.
   */
  const clearNotifications = useCallback(() => {
    setError(null);
    setMessage('');
  }, []);

  /**
   * Fetches the initial game state from the backend API to start or restart a game.
   * Resets local component state related to turns and selections.
   */
  const initGame = useCallback(async () => {
    console.log("Initializing game...");
    setLoading(true);
    clearNotifications();
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
    setDirection('horizontal');
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`);
      const state = await response.json();
      if (!response.ok) {
        throw new Error(state.detail || `Failed to start game (HTTP ${response.status})`);
      }
      setGameState(state);
      setMessage(state.message || 'Game started! Your turn.');
      console.log("Game initialized:", state);
    } catch (err) {
      console.error("Init Game Error:", err);
      setError(err.message || 'Could not connect to server or start game.');
      setGameState({
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        scores: { human: 0, ai: 0 },
        current_player: 'human',
        player_rack: [],
        game_over: false,
        first_move: true,
        tiles_in_bag: 0
      });
    } finally {
      setLoading(false);
    }
  }, [clearNotifications]);

  /**
   * Resets the state related to the current turn's temporary tile placements.
   * Clears selected tiles and placed tiles on the board.
   */
  const resetTurnState = useCallback(() => {
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
  }, []);

  /**
   * Initiates a completely new game by calling the backend API.
   */
  const startNewGame = useCallback(async () => {
    await initGame();
  }, [initGame]);

   /**
    * Updates the local game state based on data received from the backend API.
    * Handles setting appropriate messages or errors from the response.
    * @param {object} newState - The new game state object received from the API.
    */
   const handleStateUpdate = useCallback((newState) => {
    setGameState(newState);
    if (newState.message?.toLowerCase().includes("invalid move")) {
        setError(newState.message);
        setMessage('');
    } else {
        setMessage(newState.message || '');
        setError(null);
    }

    console.log("Game state updated:", newState);

    if (newState.current_player === 'human' || newState.game_over) {
      resetTurnState();
    }
    if(newState.game_over && !newState.message?.toLowerCase().includes('game over')) {
        setMessage(prev => (prev ? prev + " || " : "") + `GAME OVER! Final Score -> You: ${newState.scores.human}, AI: ${newState.scores.ai}`);
    }
  }, [resetTurnState]);


  /**
   * Performs a client-side check to ensure the first move crosses the center square (H8).
   * @param {Array} currentPlacedTiles - Array of tiles placed in the current turn.
   * @param {string} currentDirection - The direction ('horizontal' or 'vertical') of the placement.
   * @returns {boolean} True if the first move rule is satisfied, false otherwise.
   */
  const checkFirstMoveCenter = useCallback((currentPlacedTiles, currentDirection) => {
    if (!gameState?.first_move || currentPlacedTiles.length === 0) return true;

    const center = 7;
    const touchesCenter = currentPlacedTiles.some(t => t.position.row === center && t.position.col === center);

    if (touchesCenter) return true;

    // Check if the line spans the center if the center itself isn't occupied
    const firstTilePos = currentPlacedTiles[0].position;
    if (currentDirection === 'horizontal') {
        const row = firstTilePos.row;
        if (row !== center) return false;
        const cols = currentPlacedTiles.map(t => t.position.col).sort((a, b) => a - b);
        return cols[0] <= center && cols[cols.length - 1] >= center;
    } else { // Vertical
        const col = firstTilePos.col;
        if (col !== center) return false;
        const rows = currentPlacedTiles.map(t => t.position.row).sort((a, b) => a - b);
        return rows[0] <= center && rows[rows.length - 1] >= center;
    }
  }, [gameState?.first_move]);


  /**
   * Determines the full word formed by the currently placed tiles and adjacent existing tiles on the board.
   * Finds the start position (row, col) of this full word.
   * @returns {object|null} An object { word, row, col, direction } for the API request, or null if placement is invalid.
   */
  const getWordInfoForAPI = useCallback(() => {
    if (!placedTiles || placedTiles.length === 0) return null;

    const axis = direction === 'horizontal' ? 'col' : 'row';
    const fixedAxis = direction === 'horizontal' ? 'row' : 'col';
    const sortedTiles = [...placedTiles].sort((a, b) => a.position[axis] - b.position[axis]);
    const firstTile = sortedTiles[0];
    const fixedValue = firstTile.position[fixedAxis];

    let currentPos = firstTile.position[axis];
    let startPos = currentPos;
    while (startPos > 0) {
        const checkR = direction === 'horizontal' ? fixedValue : startPos - 1;
        const checkC = direction === 'horizontal' ? startPos - 1 : fixedValue;
        if (gameState.board[checkR]?.[checkC]) {
            startPos--;
        } else {
            break;
        }
    }

    const lastTile = sortedTiles[sortedTiles.length - 1];
    let endPos = lastTile.position[axis];
     while (endPos < 14) {
        const checkR = direction === 'horizontal' ? fixedValue : endPos + 1;
        const checkC = direction === 'horizontal' ? endPos + 1 : fixedValue;
        if (gameState.board[checkR]?.[checkC]) {
            endPos++;
        } else {
            const nextPosIsPlaced = placedTiles.some(t => t.position[axis] === endPos + 1);
             if (nextPosIsPlaced) {
                  endPos++;
             } else {
                  break;
             }
        }
    }


    let word = '';
    const placedMap = new Map(placedTiles.map(t => [`${t.position.row},${t.position.col}`, t.letter]));
    for (let i = startPos; i <= endPos; i++) {
        const r = direction === 'horizontal' ? fixedValue : i;
        const c = direction === 'horizontal' ? i : fixedValue;
        const placedLetter = placedMap.get(`${r},${c}`);
        const boardLetter = gameState.board[r]?.[c];

        if (placedLetter) {
            word += placedLetter;
        } else if (boardLetter) {
            word += boardLetter;
        } else {
            console.error("Error: Gap detected in word construction!", {r, c, placedLetter, boardLetter});
            setError("Internal Error: Gap detected in word placement.");
            return null;
        }
    }

    const startRow = direction === 'horizontal' ? fixedValue : startPos;
    const startCol = direction === 'horizontal' ? startPos : fixedValue;

    console.log("Constructed for API:", { word, row: startRow, col: startCol, direction });
    return { word, row: startRow, col: startCol, direction };

  }, [placedTiles, direction, gameState?.board]);


  /**
   * Submits the player's current move (constructed from placed tiles) to the backend API.
   * Handles API response and updates the game state accordingly.
   */
  const makePlayerMove = useCallback(async () => {
    clearNotifications();
    if (placedTiles.length === 0) {
      setError("Place at least one tile to make a move.");
      return;
    }

    if (gameState?.first_move && !checkFirstMoveCenter(placedTiles, direction)) {
         setError("First move must cross the center square (H8).");
         return;
     }

    const wordInfo = getWordInfoForAPI();
    if (!wordInfo) {
        return;
    }

    setLoading(true);
    try {
      console.log("Sending move to backend:", wordInfo);
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordInfo),
      });

      const newState = await response.json();

      if (!response.ok) {
        throw new Error(newState.detail || `Move rejected by server (HTTP ${response.status})`);
      }

      handleStateUpdate(newState);

    } catch (err) {
      console.error("Make Move API Error:", err);
      setError(err.message || 'Failed to communicate move to server.');
    } finally {
      setLoading(false);
    }
  }, [placedTiles, gameState, direction, checkFirstMoveCenter, getWordInfoForAPI, handleStateUpdate, clearNotifications]);


  /**
   * Sends a request to the backend API for the current player to pass their turn.
   * Clears any temporarily placed tiles before sending the request.
   */
  const passTurn = useCallback(async () => {
    clearNotifications();
    if(placedTiles.length > 0) {
        if(!window.confirm("You have tiles placed on the board. Passing will clear them. Continue?")) {
            return;
        }
    }
    setLoading(true);
    resetTurnState();
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/pass`, { method: 'POST' });
      const newState = await response.json();

      if (!response.ok) {
        throw new Error(newState.detail || `Failed to pass turn (HTTP ${response.status})`);
      }

      handleStateUpdate(newState);

    } catch (err) {
      console.error("Pass Turn API Error:", err);
      setError(err.message || 'Failed to communicate pass to server.');
    } finally {
      setLoading(false);
    }
  }, [clearNotifications, handleStateUpdate, placedTiles.length, resetTurnState]);


  /**
   * Validates if placing a tile at the given (row, col) is valid based on existing placed tiles.
   * Checks for linearity (straight line) and contiguity (no gaps unless filled by permanent board tiles).
   * Determines the placement direction if this is the second tile being placed.
   * @param {number} row - The row index for the potential placement.
   * @param {number} col - The column index for the potential placement.
   * @returns {object} An object { valid: boolean, newDirection?: string } indicating validity and potential direction change.
   */
  const validatePlacement = useCallback((row, col) => {
      if (placedTiles.length === 0) return { valid: true, newDirection: direction };

      const firstTilePos = placedTiles[0].position;
      let currentDirection = direction;

      if (placedTiles.length === 1) {
          if (row === firstTilePos.row && col !== firstTilePos.col) {
              currentDirection = 'horizontal';
          } else if (col === firstTilePos.col && row !== firstTilePos.row) {
              currentDirection = 'vertical';
          } else if (row === firstTilePos.row && col === firstTilePos.col) {
              // Clicking the same cell as the only placed tile - technically invalid placement step
              return { valid: false };
          } else {
              setError("Tiles must be placed in a straight line (horizontally or vertically).");
              return { valid: false };
          }
      }

      const allTilesIncludingNew = [...placedTiles, { position: { row, col } }];
      const axis = currentDirection === 'horizontal' ? 'col' : 'row';
      const fixedAxis = currentDirection === 'horizontal' ? 'row' : 'col';
      const fixedValue = firstTilePos[fixedAxis];

      if (allTilesIncludingNew.some(t => t.position[fixedAxis] !== fixedValue)) {
           setError("Tiles must all be on the same row (horizontal) or column (vertical).");
           return { valid: false };
      }
      if (row !== fixedValue && currentDirection === 'horizontal') {
            setError("Tiles must be placed on the same row for a horizontal word.");
            return { valid: false };
       }
       if (col !== fixedValue && currentDirection === 'vertical') {
             setError("Tiles must be placed on the same column for a vertical word.");
             return { valid: false };
       }


      const positions = allTilesIncludingNew.map(t => t.position[axis]);
      positions.sort((a, b) => a - b);
      for (let i = 0; i < positions.length - 1; i++) {
          if (positions[i+1] - positions[i] > 1) {
              let gapFilledByBoard = true;
              for (let p = positions[i] + 1; p < positions[i+1]; p++) {
                  const rCheck = currentDirection === 'horizontal' ? fixedValue : p;
                  const cCheck = currentDirection === 'horizontal' ? p : fixedValue;
                  if (!gameState.board[rCheck]?.[cCheck]) {
                      gapFilledByBoard = false;
                      break;
                  }
              }
              if (!gapFilledByBoard) {
                   setError("Tiles must be placed adjacent to each other or existing tiles without gaps.");
                   return { valid: false };
              }
          }
      }

      return { valid: true, newDirection: currentDirection };
  }, [placedTiles, direction, gameState?.board, setError]);


  /**
   * Handles a click event on a board cell.
   * If a rack tile is selected, attempts to place it on the clicked cell after validation.
   * Shows error messages for invalid placements or conditions.
   * @param {number} row - The row index of the clicked cell.
   * @param {number} col - The column index of the clicked cell.
   */
  const placeTileOnBoard = useCallback((row, col) => {
    clearNotifications();
    if (!selectedTile) {
      setError("Select a tile from your rack first.");
      return;
    }
    if (gameState?.current_player !== 'human' || gameState?.game_over) {
        setError("Cannot place tiles now.");
        return;
    }

    if (gameState?.board[row][col] !== null) {
      setError("Cannot place tile on an already occupied square.");
      return;
    }
    if (placedTiles.some(t => t.position.row === row && t.position.col === col)) {
       setError("Square already contains a tile placed this turn.");
       return;
    }

    const placementValidation = validatePlacement(row, col);
    if (!placementValidation.valid) {
        return;
    }
    if (placementValidation.newDirection && placementValidation.newDirection !== direction) {
        setDirection(placementValidation.newDirection);
    }

    setPlacedTiles(prev => [...prev, {
      letter: selectedTile.letter,
      position: { row, col },
      rackIndex: selectedTile.index
    }]);

    setSelectedTile(null);

  }, [selectedTile, gameState, placedTiles, validatePlacement, direction, clearNotifications, setError]);


  /**
   * Handles a click event on a tile in the player's rack.
   * Selects the tile for placement, deselects it if already selected,
   * or recalls it from the board if it was placed in the current turn.
   * @param {object} tile - The tile object clicked, containing { letter, index, isPlaced }.
   */
  const handleTileClick = useCallback((tile) => {
    clearNotifications();
    if (gameState?.current_player !== 'human' || gameState?.game_over) return;

    const { index, isPlaced } = tile;

    if (isPlaced) {
      setPlacedTiles(prev => prev.filter(pt => pt.rackIndex !== index));
      setSelectedTile(null); // Ensure nothing selected after recall
    } else {
      if (selectedTile && selectedTile.index === index) {
        setSelectedTile(null);
      } else {
        setSelectedTile({ letter: tile.letter, index: tile.index });
      }
    }
  }, [selectedTile, gameState, clearNotifications, placedTiles.length]);


  /**
   * Clears all tiles that have been temporarily placed on the board during the current turn.
   * Resets the turn-specific state.
   */
  const clearCurrentPlacement = useCallback(() => {
    clearNotifications();
    resetTurnState();
  }, [clearNotifications, resetTurnState]);


  // Fetch the initial game state when the component mounts.
  useEffect(() => {
    initGame();
  }, [initGame]);


  // Gather all state and actions to provide through context.
  const value = {
    gameState,
    loading,
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

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};


/**
 * Renders the home page/welcome screen of the application.
 * Provides options to start different game modes.
 */
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen">
      <div className="scrabble-board-frame">
        <div className="welcome-content">
          <div className="scrabble-title">
            {['S','C','R','A','B','B','L','E'].map((letter, i) => (
              <span key={i} className={`tile-${i}`}>{letter}</span>
            ))}
          </div>
          <p className="tagline">The Classic Word Game</p>

          <div className="game-options">
            <button
              className="game-option-btn vs-ai"
              onClick={() => navigate('/vs-ai')}
              aria-label="Play against the AI"
            >
              <span className="tile-letter">P<span className="tile-value"></span></span>
              <div className="option-text">
                <h2>Play vs AI</h2>
                <p>Challenge our Scrabble AI opponent.</p>
              </div>
            </button>

            <button
              className="game-option-btn ai-vs-ai"
              onClick={() => navigate('/ai-vs-ai')}
              aria-label="Watch AI vs AI (Coming Soon)"
            >
              <span className="tile-letter">A<span className="tile-value"></span></span>
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
                    <li>Use DL, TL, DW, TW squares for bonus points!</li>
                    <li>Use ' ' blank tiles as any letter (worth 0 points).</li>
                </ol>
            </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the main game screen where the player interacts with the Scrabble board.
 * Fetches game state and actions from the GameContext and passes them to the Board component.
 */
const GamePage = () => {
  const game = useGame();

  /**
   * Handles clicks on board cells, attempting to place a selected tile or selecting the cell.
   * @param {object} cell - The clicked cell object { row, col }.
   */
  const handleCellClick = useCallback((cell) => {
      game.clearNotifications();
      if (game.selectedTile) {
          game.placeTileOnBoard(cell.row, cell.col);
      } else {
          game.setSelectedCell(cell);
      }
  }, [game]);

  if (!game.gameState || game.loading) {
      return (
          <div className="loading-screen">
              {game.loading ? 'Processing...' : 'Connecting to game...'}
          </div>
      );
  }

  const availableRackTiles = game.gameState.player_rack.map((letter, index) => ({
    letter,
    index,
    isPlaced: game.placedTiles.some(t => t.rackIndex === index)
  }));

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
            selectedCell={game.selectedCell}
            selectedTile={game.selectedTile}
            placedTiles={game.placedTiles}
            direction={game.direction}
            onCellClick={handleCellClick}
            onTileClick={game.handleTileClick}
            setDirection={game.setDirection}
            onMakeMove={game.makePlayerMove}
            onClearPlacement={game.clearCurrentPlacement}
            onPassTurn={game.passTurn}
            onNewGame={game.startNewGame}
          />
        </div>
    </div>
  );
};

/**
 * Renders a placeholder page for the "AI vs AI" game mode.
 * Indicates that the feature is under construction.
 */
const AIVsAIPage = () => {
   const navigate = useNavigate();
  return (
    <div className="coming-soon">
      <div className="scrabble-board-frame">
          <div className="welcome-content">
            <h2>AI vs AI Mode</h2>
            <p>This feature is currently under construction.</p>
            <p>Imagine two tireless intellects locked in lexical combat!</p>
            <button onClick={() => navigate('/')} className="control-button new-game-btn" style={{marginTop: '20px'}}>
                Go Back Home
            </button>
          </div>
       </div>
    </div>
  );
};

/**
 * The main application component.
 * Sets up the router and wraps the application routes with the GameProvider.
 */
function App() {
  return (
    <Router>
      <GameProvider>
         <div className="app">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/vs-ai" element={<GamePage />} />
              <Route path="/ai-vs-ai" element={<AIVsAIPage />} />
              <Route path="*" element={
                  <div style={{ textAlign: 'center', marginTop: '50px' }}>
                      <h1>404 - Page Not Found</h1>
                      <p>Sorry, the page you are looking for does not exist.</p>
                  </div>
              } />
            </Routes>
         </div>
      </GameProvider>
    </Router>
  );
}

export default App;