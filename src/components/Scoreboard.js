import React from 'react';

function Scoreboard({ score, lives }) {
  return (
    <div className="scoreboard">
      <div className="score">Skor: {score}</div>
      <div className="lives">Canlar: {lives}</div>
    </div>
  );
}

export default Scoreboard; 