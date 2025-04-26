import React, { useState } from 'react';
import { GameProvider } from './contexts/gameContext';
import GamePage from './pages/GamePage';
// import AIVsAIPage from './pages/AIVsAIPage/AIVsAIPage'; 
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState(null);

  const renderContent = () => {
    switch (gameMode) {
      case 'vsAI':
        return (
          <GameProvider>
            <GamePage />
          </GameProvider>
        );
      case 'AIVsAI':
        return (
          // <GameProvider>
          //   <AIVsAIPage />
          // </GameProvider>
          <>
          </>
        );
      default:
        return (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Welcome to Scrabble UI</h1>
              <p>The ultimate word-building challenge</p>
              
              <div className="game-options">
                <button 
                  className="game-option-btn vs-ai"
                  onClick={() => setGameMode('vsAI')}
                >
                  <h2>Play vs AI</h2>
                  <p>Test your skills against our intelligent opponent</p>
                </button>
                
                <button 
                  className="game-option-btn ai-vs-ai"
                  onClick={() => setGameMode('AIVsAI')}
                >
                  <h2>AI vs AI</h2>
                  <p>Watch two AI opponents battle it out</p>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {renderContent()}
    </div>
  );
}

export default App;