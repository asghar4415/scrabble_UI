# Scrabble AI Game

Play a classic game of Scrabble against an advanced AI opponent! This project features a React-based frontend and a Python FastAPI backend.
<!-- 
![Scrabble Game Screenshot](<insert_your_game_screenshot_url_here_or_remove_if_none>) 
*(Optional: Add a screenshot of your game interface here. You can upload it to your GitHub repo and link it.)* -->

## Features

*   **Classic Scrabble Gameplay:** Form words, use premium squares, and strategize your tile placements.
*   **Challenging AI Opponent:** Test your Scrabble skills against an AI powered by a minimax algorithm with heuristic evaluation.
*   **Power Tiles:** Discover special tiles like "Double Turn" that add an extra layer of strategy.
*   **Player Objectives:** Complete secret objectives for bonus points.
*   **Interactive Board:** Easy-to-use interface for placing tiles and managing your rack.
*   **Real-time Score Updates:** Keep track of your score and the AI's score throughout the game.
*   **Responsive Design:** Playable on various screen sizes.

## Tech Stack

*   **Frontend:** React, JavaScript, CSS
    *   React Router for navigation.
*   **Backend:** Python, FastAPI
    *   Pydantic for data validation.
    *   Uvicorn for serving the application.

## Getting Started

### Prerequisites

*   Node.js and npm (or yarn) for the frontend.
*   Python 3.7+ and pip for the backend.
*   A `scrabble_words.txt` file (a standard Scrabble dictionary) in the backend's root directory or `src` directory.

### Frontend Setup (This Repository)

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/asghar4415/scrabble_UI.git
    cd scrabble_UI
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Configure API Base URL:**
    Open `src/App.jsx` (or the relevant file where `API_BASE_URL` is defined) and ensure it points to your running backend server. For local development, it's usually:
    ```javascript
    const API_BASE_URL = "http://127.0.0.1:8000"; 
    ```
4.  **Start the development server:**
    ```bash
    npm start
    # or
    # yarn start
    ```
    The application should now be running on `http://localhost:5173` (or another port if configured).

### Backend Setup

The backend code is hosted in a separate repository.

➡️ **Visit the Backend Repository:** [https://github.com/asghar4415/scrabble_ai]

Follow the setup instructions in the backend repository's README to get the server running. Typically, this involves:
1.  Cloning the backend repository.
2.  Creating a virtual environment.
3.  Installing Python dependencies from `requirements.txt` (if provided, otherwise install FastAPI and Uvicorn).
4.  Ensuring `scrabble_words.txt` is present.
5.  Running the FastAPI server (e.g., `uvicorn main:app --reload`).

## How to Play

1.  Once both the frontend and backend servers are running, open the frontend URL in your browser.
2.  Click "Play vs AI" to start a new game.
3.  Select tiles from your rack and place to the board cell.
4.  Choose the direction of your word (Horizontal or Vertical).
5.  The first word must cross the center star square. Subsequent words must connect to existing tiles.
6.  Click "Submit" to play your word.
7.  Use "Clear" to remove your current placement or "Pass" to skip your turn.
8.  Try to complete your secret objective for bonus points!
9.  The game ends when all tiles are played or after too many consecutive passes.

## Demo Video

🎬 **Watch a demo of the game:** []

