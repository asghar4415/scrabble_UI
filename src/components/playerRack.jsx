import React from 'react';
// import Tile from './Tile';
import './boardstyle.css';

const PlayerRack = ({ tiles, onTileClick, selectedTile }) => {
  return (
    <div className="player-rack">
      {/* {tiles.map((letter, index) => (
        <Tile
          key={index}
          letter={letter}
          onClick={() => onTileClick({ letter, index })}
          isSelected={selectedTile && selectedTile.index === index}
        />
      ))} */}
    </div>
  );
};

export default PlayerRack;