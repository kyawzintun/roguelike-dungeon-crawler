import React, { Component } from 'react';
import './App.css';

class Dungeon extends Component {
  render() {
    let { entities, playerPosition } = this.props;
    const [playerX, playerY] = playerPosition;
    entities.map((row, i) => row.map((cell, j) => {
      cell.distanceFromPlayer = (Math.abs(playerY - i)) + (Math.abs(playerX - j));
      // if(cell.distanceFromPlayer > 10) cell.opacity = 0;
      return cell;
    }));
    const cells = entities.map((element, index) => {
      return (
        <div className="row" key={Date.now() + index} >
          {
            element.map((cell, i) => {
              return (
                <div className=
                      {(cell.type) ? 'cell ' + cell.type : 'cell'}
                     style={{opacity: cell.opacity}}
                     key={i} >
                     {cell.id}
                </div>
              )
            })
          }
        </div>
      )
    });
    return (
      <div className='flex-container'>
        {cells}
      </div>
    );
  }
}

export default Dungeon;