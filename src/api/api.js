const API_BASE_URL = 'http://127.0.0.1:8000';

export const startGame = async () => {
  const response = await fetch(`${API_BASE_URL}/api/game/start`);
  return await response.json();
};

export const makeMove = async (word, row, col, direction) => {
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
};

export const getGameState = async () => {
  const response = await fetch(`${API_BASE_URL}/api/game/state`);
  return await response.json();
};