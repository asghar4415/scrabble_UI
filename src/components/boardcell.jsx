import React from 'react';
import './boardstyle.css';

const BoardCell = ({ letter, row, col, onClick, isSelected }) => {
  const handleClick = () => {
    onClick({ row, col });
  };

  return (
    <div 
      className={`board-cell ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="cell-content">
        {letter}
      </div>
    </div>
  );
};

export default BoardCell;