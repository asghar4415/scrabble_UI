# Advanced Scrabble AI Game

Play an enhanced game of Scrabble against a challenging AI opponent! This project features a modern React-based frontend and a robust Python FastAPI backend, incorporating unique gameplay elements like power tiles and dynamic objectives.


## Features

*   **Classic Scrabble Gameplay:** Form words on a 15x15 grid, utilize premium squares (Double/Triple Letter & Word), and strategize your tile placements.
*   **Challenging AI Opponent:** Test your Scrabble skills against an AI powered by the Minimax algorithm with Alpha-Beta pruning and a custom heuristic evaluation function.
*   **Power Tiles:** Discover special tiles like "Double Turn" (D\*) that grant an immediate extra turn, adding a significant tactical layer.
*   **Dynamic Player Objectives:** Each player receives a secret objective at the start of the game (e.g., score over 30 points in a turn, use a specific letter, form a 7-letter word). Completing these grants bonus points.
*   **Interactive User Interface:**
    *   Intuitive board for tile selection and placement.
    *   Clear display of player racks, scores, remaining tiles in the bag, and active objectives.
    *   Direction selection (horizontal/vertical) for word placement.
*   **Real-time Game State:** Instant updates for scores, board changes, and turn indicators.
*   **Responsive Design:** Designed to be playable and visually appealing on various screen sizes.

## Tech Stack

*   **Frontend:**
    *   React (JavaScript ES6+)
    *   CSS3 (Custom styling for game elements)
    *   React Router (for page navigation)
*   **Backend:**
    *   Python 3.7+
    *   FastAPI (for building efficient RESTful APIs)
    *   Pydantic (for data validation and serialization)
    *   Uvicorn (ASGI server to run the FastAPI application)

## Getting Started

### Prerequisites

*   **Node.js and npm (or yarn):** Required for running the frontend React application.
*   **Python 3.7+ and pip:** Required for running the backend FastAPI server.
*   **`scrabble_words.txt` file:** A standard Scrabble dictionary text file (one word per line, uppercase, >= 2 letters). This file needs to be placed in the root directory of the **backend** project.

### Frontend Setup (This Repository - `scrabble_UI`)

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
    Open `src/App.jsx`. Ensure the `API_BASE_URL` constant points to your running backend server. For local development, it's typically:
    ```javascript
    const API_BASE_URL = "http://127.0.0.1:8000";
    ```
4.  **Start the development server:**
    ```bash
    npm start
    # or
    # yarn start
    ```
    The frontend application should now be accessible, usually at `http://localhost:5173`.

### Backend Setup

The backend Python FastAPI code is hosted in a separate repository.

➡️ **Visit the Backend Repository:** [https://github.com/asghar4415/scrabble_ai](https://github.com/asghar4415/scrabble_ai)

Please follow the detailed setup instructions provided in the `README.md` file of that backend repository. A typical setup involves:
1.  Cloning the backend repository.
2.  Creating and activating a Python virtual environment.
3.  Installing Python dependencies (e.g., `pip install -r requirements.txt` if provided, otherwise `pip install fastapi uvicorn pydantic`).
4.  Placing the `scrabble_words.txt` file in the correct location as specified by the backend's `utils.py` (usually the backend project root or a specified `backend/game_logic` subdirectory if paths were adjusted).
5.  Running the FastAPI server using Uvicorn (e.g., `uvicorn main:app --reload --host 0.0.0.0 --port 8000` from within the backend directory).

## How to Play

1.  Ensure both the frontend and backend servers are running correctly.
2.  Open the frontend URL (e.g., `http://localhost:5173`) in your web browser.
3.  Click the "Play vs AI" button on the welcome screen to start a new game.
4.  **Your Turn:**
    *   Your tiles will appear in "You's Tiles" rack.
    *   Your secret objective will be displayed.
    *   Click a tile from your rack to select it.
    *   Click an empty cell on the board to place the selected tile.
    *   If it's your second tile in a turn, the game will try to determine the direction (Horizontal/Vertical). You can also manually set the direction using the toggle buttons.
    *   All placed tiles in a turn must form a single continuous line.
5.  **Rules:**
    *   The first word played must cross the center star (★) square.
    *   Subsequent words must connect to at least one tile already on the board.
    *   Words can be formed horizontally (left-to-right) or vertically (top-to-bottom).
6.  **Actions:**
    *   Click "Submit" to finalize your word and score points.
    *   Click "Clear" to remove all tiles you've placed on the board during the current turn.
    *   Click "Pass" to skip your turn.
    *   Click "Restart" at any time to begin a new game.
7.  **Winning:** The game ends when the tile bag is empty and one player uses all their tiles, or after a set number of consecutive passes by both players. The player with the highest score wins!

## Demo Video

🎬 **Watch a demo of the game:** `https://drive.google.com/file/d/1mn9Su7WVVHtlReQgTjntg6f1dvViUZ_e/view?usp=sharing`



