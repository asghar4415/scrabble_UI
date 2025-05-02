import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Board from './components/board';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const GameContext = createContext();

const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('horizontal');
  const [currentWord, setCurrentWord] = useState([]);
  const [placedTiles, setPlacedTiles] = useState([]);

  const startGame = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`);
      const data = await response.json();
      return data;
    } catch (err) {
      throw new Error('Failed to start game');
    }
  };

  const makeMove = async (word, row, col, direction) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, row, col, direction }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to make move');
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const getGameState = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/state`);
      return await response.json();
    } catch (err) {
      throw new Error('Failed to get game state');
    }
  };

  const initGame = useCallback(async () => {
    setLoading(true);
    try {
      const state = await startGame();
      setGameState(state);
      setCurrentWord([]);
      setPlacedTiles([]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startNewGame = useCallback(async () => {
    await initGame();
  }, [initGame]);

  const placeTileOnBoard = useCallback((row, col) => {
    if (!selectedTile) return;
    
    const newTile = {
      letter: selectedTile.letter,
      position: { row, col }
    };
    
    setCurrentWord(prev => [...prev, newTile]);
    setPlacedTiles(prev => [...prev, newTile]);
    setSelectedTile(null);
  }, [selectedTile]);

  const clearCurrentWord = useCallback(() => {
    setCurrentWord([]);
    setPlacedTiles([]);
  }, []);

  const makePlayerMove = useCallback(async () => {
    if (currentWord.length === 0) return;
    
    setLoading(true);
    try {
      const { row, col } = currentWord[0].position;
      const word = currentWord.map(tile => tile.letter).join('');
      
      const state = await makeMove(word, row, col, direction);
      setGameState(state);
      setCurrentWord([]);
      setPlacedTiles([]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentWord, direction]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const value = {
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
      {error && <div className="error-message">{error}</div>}
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