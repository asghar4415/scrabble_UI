import React from 'react';
import BoardCell from './BoardCell';
import './boardstyle.css';

const Board = ({ board, onCellClick, selectedCell }) => {
  return (
    <div className="scrabble-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <BoardCell
              key={`${rowIndex}-${colIndex}`}
              letter={cell}
              row={rowIndex}
              col={colIndex}
              onClick={onCellClick}
              isSelected={selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;