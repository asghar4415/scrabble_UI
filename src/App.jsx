import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Board from './components/board';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const GameContext = createContext();

// ======================
// Game Context Provider
// ======================
const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('horizontal');
  const [currentWord, setCurrentWord] = useState([]);
  const [placedTiles, setPlacedTiles] = useState([]);

  // ======================
  // Game Initialization
  // ======================
  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`);
      if (!response.ok) throw new Error('Failed to fetch game state');
      return await response.json();
    } catch (err) {
      throw new Error('Failed to start game');
    }
  };

  const initGame = useCallback(async () => {
    setLoading(true);
    try {
      const state = await fetchGameState();
      setGameState(state);
      resetBoardState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetBoardState = () => {
    setCurrentWord([]);
    setPlacedTiles([]);
    setSelectedTile(null);
    setSelectedCell(null);
    setError(null);
  };

  const startNewGame = useCallback(async () => {
    await initGame();
  }, [initGame]);

  // ======================
  // Game Move Handling
  // ======================
  const validateFirstMove = (word) => {
    if (!gameState?.first_move) return true;
    
    const center = 7;
    return placedTiles.some(({ position }) => {
      if (direction === 'horizontal') {
        return position.row === center && 
               position.col <= center && 
               center < position.col + word.length;
      } else {
        return position.col === center && 
               position.row <= center && 
               center < position.row + word.length;
      }
    });
  };

  const makePlayerMove = useCallback(async () => {
    if (currentWord.length === 0) {
      setError("Please place at least one tile");
      return;
    }
    
    setLoading(true);
    try {
      const word = currentWord.map(tile => tile.letter).join('');
      
      if (!validateFirstMove(word)) {
        throw new Error("First word must pass through center (H8)");
      }

      const { row, col } = currentWord[0].position;
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word,
          row: row,
          col: col,
          direction: direction
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Move failed:", errorData); // Debug log
        throw new Error(errorData.detail || 'Invalid move');
      }

      const newState = await response.json();
      setGameState(newState);
      resetBoardState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentWord, direction, gameState, placedTiles]);

  // ======================
  // Board Interaction
  // ======================
  const placeTileOnBoard = useCallback((row, col) => {
    if (!selectedTile) return;
    
    if (gameState?.board[row][col] !== null) {
      setError("Cannot place tile on occupied cell");
      return;
    }

    const isFirstTile = currentWord.length === 0;
    const isValidPlacement = isFirstTile || 
      (direction === 'horizontal' && row === currentWord[0].position.row) ||
      (direction === 'vertical' && col === currentWord[0].position.col);

    if (!isValidPlacement) {
      setError("Tiles must be placed in a straight line");
      return;
    }

    setCurrentWord(prev => [...prev, {
      letter: selectedTile.letter,
      position: { row, col }
    }]);
    setPlacedTiles(prev => [...prev, {
      letter: selectedTile.letter,
      position: { row, col }
    }]);
    setSelectedTile(null);
  }, [selectedTile, gameState, currentWord, direction]);

  const clearCurrentWord = useCallback(() => {
    setCurrentWord([]);
    setPlacedTiles([]);
    setError(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const value = {
    gameState,
    loading,
    error,
    setError,
    selectedTile,
    setSelectedTile,
    selectedCell,
    setSelectedCell,
    direction,
    setDirection,
    startNewGame,
    makePlayerMove,
    placeTileOnBoard,
    currentWord,
    placedTiles,
    clearCurrentWord
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

const useGame = () => useContext(GameContext);

// ======================
// Page Components
// ======================
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen">
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
          >
            <span className="tile-letter">P</span>
            <div className="option-text">
              <h2>Play vs AI</h2>
              <p>Challenge our advanced Scrabble AI</p>
            </div>
          </button>
          
          <button 
            className="game-option-btn ai-vs-ai"
            onClick={() => navigate('/ai-vs-ai')}
          >
            <span className="tile-letter">A</span>
            <div className="option-text">
              <h2>AI vs AI</h2>
              <p>Watch algorithmic masters compete</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const GamePage = () => {
  const {
    gameState,
    loading,
    error,
    setError,
    selectedTile,
    setSelectedTile,
    selectedCell,
    setSelectedCell,
    direction,
    setDirection,
    startNewGame,
    makePlayerMove,
    placeTileOnBoard,
    currentWord,
    placedTiles,
    clearCurrentWord
  } = useGame();

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
    setError(null);
  };

  const handleCellClick = (cell) => {
    if (selectedTile) {
      placeTileOnBoard(cell.row, cell.col);
    } else {
      setSelectedCell(cell);
    }
  };

  if (!gameState) return <div className="loading-screen">Loading game...</div>;

  return (
    <div className="game-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-message">
          {error}
          <button 
            className="dismiss-error" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      <Board 
        board={gameState.board} 
        onCellClick={handleCellClick}
        selectedCell={selectedCell}
        placedTiles={placedTiles}
        tiles={gameState.player_rack}
        onTileClick={handleTileClick}
        selectedTile={selectedTile}
        currentWord={currentWord}
        direction={direction}
        setDirection={setDirection}
        onMakeMove={makePlayerMove}
        onNewGame={startNewGame}
        currentPlayer={gameState.current_player}
        gameOver={gameState.game_over}
        onClearWord={clearCurrentWord}
        playerScore={gameState.scores.human}
        aiScore={gameState.scores.ai}
      />
    </div>
  );
};

const AIVsAIPage = () => {
  return (
    <div className="coming-soon">
      <h2>AI vs AI Mode</h2>
      <p>This feature is coming soon!</p>
    </div>
  );
};

// ======================
// Main App Component
// ======================
function App() {
  return (
    <Router>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vs-ai" element={<GamePage />} />
          <Route path="/ai-vs-ai" element={<AIVsAIPage />} />
        </Routes>
      </GameProvider>
    </Router>
  );
}

export default App;