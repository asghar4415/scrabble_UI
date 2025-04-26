import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../api/api';

// 1. Create the context
const GameContext = createContext(null);

// 2. Create the provider component
export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('horizontal');

  // Memoized callbacks
  const startNewGame = useCallback(async () => {
    try {
      setLoading(true);
      const state = await api.startGame();
      setGameState(state);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const makePlayerMove = useCallback(async () => {
    if (!selectedTile || !selectedCell) return;
    
    try {
      setLoading(true);
      const { letter } = selectedTile;
      const { row, col } = selectedCell;
      const state = await api.makeMove(letter, row, col, direction);
      setGameState(state);
      setSelectedTile(null);
      setSelectedCell(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTile, selectedCell, direction]);

  const fetchGameState = useCallback(async () => {
    try {
      const state = await api.getGameState();
      setGameState(state);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Initial game load
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Memoize the context value
  const contextValue = useMemo(() => ({
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
    fetchGameState
  }), [
    gameState,
    loading,
    error,
    selectedTile,
    selectedCell,
    direction,
    startNewGame,
    makePlayerMove,
    fetchGameState
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// 3. Create the custom hook
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};