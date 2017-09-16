import React, { Component } from 'react';
import './App.css';

class ScoreBoard extends Component {
  render() {
    let player = this.props.player;
    let board = this.props.board;
    return (
      <div className="panel scoreboard">
        <div className="score-item">
          <div className="icon cell potion"></div>
          <span className="score-label">Health: {player.health}</span>
        </div>
        <div className="score-item">
          <div className="icon cell enemy"></div>
          <span className="score-label">Zone: {board.dungeonLevel}</span>
        </div>
        <div className="score-item">
          <div className="icon cell weapon"></div>
          <span className="score-label">Weapon: {player.weapon.name} (DMG: {player.weapon.damage})</span>
        </div>
        <div className="score-item">
          <div className="icon cell player"></div>
          <span className="score-label">Level : {Math.floor(player.xp / 100)}</span>
        </div>
        <div className="score-item">
          <div className="icon triangle"></div>
          <span className="score-label">XP to level up: {100 - player.xp % 100}</span>
        </div>
      </div>
    );
  }
}

export default ScoreBoard;