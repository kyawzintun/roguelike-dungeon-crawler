import React, { Component } from 'react';

import './App.css';
import Dungeon from './Dungeon.js';
import ScoreBoard from './ScoreBoard.js';
import _ from 'lodash'

import { Provider, connect } from 'react-redux'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import update from 'immutability-helper';
import thunk from 'redux-thunk';

const BATCH = 'BATCH_ACTIONS';
let actions = [];

// settings
const GRID_HEIGHT = 40;
const GRID_WIDTH = 50;
const MAX_ROOMS = 15;
const ROOMS_SIZE_RANGE = [7, 12];
const c = { GRID_HEIGHT, GRID_WIDTH, MAX_ROOMS, ROOMS_SIZE_RANGE};
const messages = [];

const initialState = {
  entities: [[]],
  dungeonLevel: 0,
  playerPosition: []
}

const playerInitialState = {
  health: 100,
  xp: 100,
  weapon: {
    name: 'Taser',
    damage: 10
  }
}

const uIInitialState = {
	messages
};

const createBoard = (state = initialState, { type, payload }) => {
  switch(type) {
    case 't.CHANGE_ENTITY': {
      const [x, y] = payload.coords;
      const entities = update(state.entities, {
        [y]: { [x] : {$set: payload.entity }}
      });
      return { ...state, entities };
    }
    case 't.CHANGE_PLAYER_POSITION': 
      return {...state, playerPosition: payload};
    case 't.CREATE_LEVEL': 
      return {
        ...state,
        playerPosition: payload.playerPosition,
        entities: payload.entities
      };
    case 't.SET_DUNGEON_LEVEL':
      return { ...state, dungeonLevel: payload};
    default:
      return state;
  }
}

const player = (state = playerInitialState, { type, payload } ) => {
  switch(type) {
    case 't.ADD_WEAPON':
      return { ...state , weapon: payload };
    case 't.ADD_XP':
      return { ...state, xp: state.xp + payload };
    case 't.MODIFY_HEALTH':
      return { ...state, health: payload };
    case 't.RESTART':
      return playerInitialState;
    default:
      return state;
  }
}

const ui = (state = uIInitialState, { type, payload }) => {
  switch (type) {
    case 't.NEW_MESSAGE':
      return { ...state, messages: [...state.messages, payload ]};
    case 't.RESTART':
      return uIInitialState;
    default:
      return state;
  }
}

function enableBatching(reducer) {
  return function batchingReducer(state, action) {
    switch (action.type) {
      case BATCH:
        return action.payload.reduce( reducer, state);
      default: 
        return reducer(state, action);
    }
  }
}

function addWeapon(payload) {
  return {
    type: 't.ADD_WEAPON',
    payload
  }
}

function addXP(payload) {
  return {
    type: 't.ADD_XP',
    payload
  }
}

function changeEntity(entity, coords) {
  return {
    type: 't.CHANGE_ENTITY',
    payload: { entity, coords }
  }
}

function changePlayerPosition(payload) {
  return {
    type: 't.CHANGE_PLAYER_POSITION',
    payload
  }
}

function createLevel(level) {
  return {
    type: 't.CREATE_LEVEL',
    payload: createEntities(createDungeon(), level)
  };
}

function modifyHealth(payload) {
  return {
    type: 't.MODIFY_HEALTH',
    payload
  }
}

function newMessage(payload) {
  return {
    type: 't.NEW_MESSAGE',
    payload
  }
}

function restart() {
  return {
    type: 't.RESTART'
  }
}

function toggleFogMode() {
  return {
    type: 't.TOGGLE_FOG_MODE'
  }
}

function setDungeonLevel(payload) {
  return {
    type: 't.SET_DUNGEON_LEVEL',
    payload
  }
}

function batchActions(actions) {
  return {type: BATCH, payload: actions};
}

const createDungeon = () => {
  const isValidRoomPlacement = (grid, {x, y, width = 1, height =1 }) => {
    if( y < 1 || y+height > grid.length-1 ) {
      return false;
    }
    if( x < 1 || x+width > grid[0].length-1 ) {
      return false;
    }
    
    for (let i = y - 1; i < y + height + 1; i++) {
			for (let j = x - 1; j < x + width + 1; j++) {
				if (grid[i][j].type === 'floor') {
					return false;
				}
			}
    }
    
    return true;
  }

  const placeCells = (grid, {x , y, width = 1, height = 1, id}, type='floor') => {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        grid[i][j] = {type, id};
      }
    }
    return grid;
  }

  const createRoomsFromSeed = (grid, {x, y, width, height}, range = c.ROOMS_SIZE_RANGE) => {
    const [min, max] = range;
    const roomValues = [];

    const north = { height: _.random(min, max), width: _.random(min, max)};
    north.x = _.random(x, x+width-1);
    north.y = y - north.height -1;
    north.doorx =_.random(north.x, (Math.min(north.x+north.width, x+width)) -1)
    north.doory = y-1;
    roomValues.push(north);

    const east = {height: _.random(min, max), width: _.random(min, max)};
    east.x = x+width+1;
    east.y = _.random(y, height + y - 1);
    east.doorx = east.x - 1;
    east.doory = _.random(east.y, (Math.min(east.y + east.height, y+height)) -1);
    roomValues.push(east);

    const south = { height: _.random(min, max), width: _.random(min, max)};
    south.x = _.random(x, width + x -1);
    south.y = y + height + 1;
    south.doorx = _.random(south.x, (Math.min(south.x + south.width, x + width)) - 1);
    south.doory = y +height;
    roomValues.push(south);

    const west = { height: _.random(min, max), width: _.random(min, max) };
    west.x = x - west.width -1;
    west.y = _.random(y, height + y -1);
    west.doorx = x - 1;
    west.doory = _.random(west.y, (Math.min(west.y + west.height, y + height)) -1);
    roomValues.push(west);

    const placeRooms = [];
    roomValues.forEach(room => {
      if(isValidRoomPlacement(grid, room)) {
        grid = placeCells(grid, room);
        grid = placeCells(grid, {x: room.doorx, y: room.doory}, 'door');
        placeRooms.push(room);
      }
    });
    return {grid, placeRooms};
  }

  let grid = [];
  for(let i =0; i < c.GRID_HEIGHT; i++) {
    grid.push([]);
    for(let j = 0; j < c.GRID_WIDTH; j++) {
      grid[i].push({type: 0, opacity: _.random(0.3, 0.8)});
    }
  }

  const [min, max] = c.ROOMS_SIZE_RANGE;
  const firstRoom = {
    x: _.random(1, c.GRID_WIDTH - max - 15),
    y: _.random(1, c.GRID_HEIGHT - max - 15),
    width: _.random(min, max),
    height: _.random(min, max), 
  };
  
  grid = placeCells(grid, firstRoom);

  const growMap = (grid, seedRooms, counter = 1, maxRooms = c.MAX_ROOMS) => {
    if( counter + seedRooms.length > maxRooms || !seedRooms.length ){
      return grid;
    }

    grid = createRoomsFromSeed(grid, seedRooms.pop());

    seedRooms.push(...grid.placeRooms);
    counter += grid.placeRooms.length;
    return growMap(grid.grid, seedRooms, counter);
  }

  return growMap(grid, [firstRoom]);
}

const createEntities = (gameMap, level = 1) => {
  const bosses = [];
  if(level === 4) {
    bosses.push({
      health: 400,
      level: 5,
      type: 'boss'
    });
  }
  const enemies = [];
  for(let i = 0; i < 7; i++) {
    enemies.push({
      health: level * 30 + 40,
      level: _.random(level, _.random(level - 1 ? level -1: level, level + 1)),
      type: 'enemy'
    })
  }
  const exits = [];
  if(level < 4){
    exits.push({
      type: 'exit'
    })
  }
  const potions = [];
  for(let i=0; i<5; i++) {
    potions.push({type: 'potion'});
  }
  const weaponTypes = [
    {name: 'Laser Pistol', damage: 15},
    {name: 'Laser Rifle', damage: 19},
    {name: 'Plasma Pistol', damage: 26},
    {name: 'Plasma Rifle', damage: 28},
    {name: 'Electric ChainSaw', damage: 31},
    {name: 'Railgun', damage: 33},
    {name: 'Dark Energy Canon', damage: 40},
    {name: 'B.F.G', damage: 43},
  ];
  const players = [
    {type: 'player'}
  ];
  const weapons = [];

  const qualifying = weaponTypes
                      .filter(weapon => weapon.damage < level * 10 + 10)
                      .filter(weapon => weapon.damage > level * 10 -10);

  for(let i=0; i< 3; i++) {
    const weapon = Object.assign({}, qualifying[_.random(0, qualifying.length-1)]);
    weapon.type = 'weapon';
    weapons.push(weapon);
  }

  let playerPosition = [];
  [potions, enemies, weapons, exits, players, bosses].forEach( entities => {
    while(entities.length) {
      const x = Math.floor(Math.random() * c.GRID_WIDTH);
      const y = Math.floor(Math.random() * c.GRID_HEIGHT);
      if(gameMap[y][x].type === 'floor') {
        if(entities[0].type === 'player') {
          playerPosition = [x, y];
        }
        gameMap[y][x] = entities.pop();
      }
    }
  });

  for(let i = 0; i< gameMap.length; i++) {
    for(let j = 0; j < gameMap[0].length; j++) {
      if(gameMap[i][j].type === 'door') {
        gameMap[i][j].type = 'floor';
      }
    }
  }

  return {entities: gameMap, playerPosition, weapons};

}

const playerInput = (vector) => {
  return (dispatch, getState) => {
    let state = getState().createBoard;
    let player = getState().player;
    const [ x, y ] = state.playerPosition;
    const [ vectorX, vectorY ] = vector;
    const newPosition = [ vectorX + x, vectorY + y];
    const newPlayer = state.entities[y][x];
    const destination = state.entities[y + vectorY][x + vectorX];

    actions = [];
    if(destination.type && destination.type !== 'enemy' && destination.type !== 'boss') {
      actions.push(
        changeEntity({type: 'floor' }, [x, y]),
        changeEntity(newPlayer, newPosition),
        changePlayerPosition(newPosition)
      );
    }

    switch(destination.type) {
      case 'boss':
      case 'enemy': {
        const playerLevel = Math.floor(player.xp / 100);
        const enemyDamageTaken = Math.floor(player.weapon.damage * _.random(1, 1.3) * playerLevel);
        destination.health -= enemyDamageTaken;

        if(destination.health > 0) {
          const playerDamageTaken = Math.floor(_.random(4,7) * destination.level);
          actions.push(
            changeEntity(destination, newPosition),
            modifyHealth(player.health - playerDamageTaken),
            newMessage(`FIGHT! You hurt the enemy with attack of [${enemyDamageTaken}].	The enemy hits back with an attack of [${playerDamageTaken}].  Enemy has [${destination.health}] health remaining.`)
          );

          if(player.health - playerDamageTaken <= 0) {
            actions.push(
              restart(),
              createLevel(1), 
              setDungeonLevel(1)
            );
            dispatch(modifyHealth(0));
            setTimeout(() => dispatch(setDungeonLevel('death')), 250);
            setTimeout(() => dispatch(newMessage('You Died')), 1000);
            setTimeout(() => dispatch(newMessage('Everything goes dark...')), 2000);
            setTimeout(() => dispatch(newMessage('You resolve to try harder next time')), 4000);
            setTimeout(() => dispatch(newMessage('The grid resets itself....')), 6000);
            setTimeout(() => dispatch(batchActions(actions)), 8000);
            return;
          }
        }

        if(destination.health <= 0) {
          if(destination.type === 'boss') {
            actions.push(
              addXP(10),
              changeEntity({type: 'floor'}, [x,y]),
              changeEntity(newPlayer, newPosition),
              changePlayerPosition(newPosition),
              newMessage(`VICTORY! Your attack of [${enemyDamageTaken}] is too powerful for the enemy, who dissolves before your very eyes.`)
            );
            setTimeout(() => dispatch(setDungeonLevel('victory')), 250);
            setTimeout(() => dispatch(newMessage(`YOU DEFATED THE BOSS!`)),1000);
            setTimeout(() => dispatch(newMessage(`The BOSS emits an almighty scream`)),2000);
            setTimeout(() => dispatch(newMessage(`You bask momentarily in your glory`)),4000);
            setTimeout(() => dispatch(newMessage(`The grid resets itself....`)),6000);
            setTimeout(() => dispatch(batchActions([
              restart(), createLevel(1), setDungeonLevel(1)
            ])),8000);
          } else {
            actions.push(
              addXP(10),
              changeEntity({type: 'floor'}, [x, y]),
              changeEntity(newPlayer, newPosition),
              changePlayerPosition(newPosition),
              newMessage(`VICTORY! Your attack of [${enemyDamageTaken}] is too powerful for the enemy, who dissolves before your very eyes.`)
            );
            setTimeout(() => dispatch(newMessage(`You gain 10XP and feel yourself growing stronger..`)), 2500);
            if((player.xp + 10) % 100 === 0) {
              setTimeout(() => dispatch(newMessage('LEVEL UP!'), 5000));
            }
          }
        }
        break;
      }
      case 'exit':
        setTimeout(() => dispatch(batchActions([
          setDungeonLevel(state.dungeonLevel + 1),
          createLevel(state.dungeonLevel + 1)
        ])), 3000);
        actions.push(
          newMessage(`The cells start to shift... you transit to zone ${state.dungeonLevel + 1}`)
        );
        setTimeout(() => dispatch(setDungeonLevel(`transit-${state.dungeonLevel + 1}`)), 250);
        break;
      case 'potion':
        actions.push(
          modifyHealth(player.health + 30),
          newMessage(`You drink a potion for [30] health`)
        );
        break;
      case 'weapon':
        actions.push(
          addWeapon(destination),
          newMessage(`You pick up a ${destination.name}`)
        );
        break;
      default:
        break;
    }
    dispatch(batchActions(actions));
  }
}

const openingMessages = () => {
	return (dispatch) => {
		dispatch(newMessage(`Welcome to The Grid...`));
		setTimeout(() => {
			dispatch(newMessage(`You find yourself in a world filled with strange cells`));
		}, 3000);
		setTimeout(() => {
			dispatch(newMessage(`'Hmm... there must be a way out of here..'`));
		}, 6000);
	};
}

class Game_ extends Component {
  keydown = (e) => {
    switch (e.keyCode) {
      case 38:
      case 87:
        this.props.playerInput([0, -1]);
        break;
      case 39:
      case 68:
        this.props.playerInput([1, 0]);
        break;
      case 40:
      case 83:
        this.props.playerInput([0, 1]);
        break;
      case 37:
      case 65:
        this.props.playerInput([-1, 0]);
        break;
      default:
        return;
    }
  }

  componentWillMount() {
    this.props.createLevel();
		this.props.setDungeonLevel(1);
  }

  componentDidMount() {
    window.addEventListener('keydown', _.throttle(this.keydown, 100));
    this.props.triggerOpeningMessages();
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', _.throttle(this.keydown, 100));
  }

  render() {
    let { entities, playerPosition } = this.props.createBoard;
    return (
        <div className="game-map">
          <Dungeon entities={entities} playerPosition={playerPosition}/>
        </div>
    );
  }
}

const mapStateToGameProps = ({ createBoard, player }) => {
	return { createBoard, player };
};

const mapDispatchToGameProps = (dispatch) => {
	return {
		playerInput: (vector) => dispatch(playerInput(vector)),
		createLevel: () => dispatch(createLevel()),
    setDungeonLevel: (level) => dispatch(setDungeonLevel(level)),
    triggerOpeningMessages: () => dispatch(openingMessages())
	};
};

const Game = connect(mapStateToGameProps, mapDispatchToGameProps)(Game_);

const Messages_ = ({messages}) => {
  return (
    <div className="panel messages">
      <ul>
        {
          messages.slice(-3).map((msg, i) => {
            return <li key={i}>{msg}</li>;
          })
        }
      </ul>
    </div>
  )
}

const mapStateToMessagesProps = ({ ui }) => {
	return {messages: ui.messages};
};

const Messages = connect(mapStateToMessagesProps)(Messages_);

const App_ = (props) => {
  return (
    <div className="container">
      <header>
        <h2 className="app-heading">React Roguelike</h2>
        <small>Kill the boss in dungeon 4</small>
      </header>
      <section>
        <Game />
        <div className="sidebar">
          <ScoreBoard player={props.player} board={props.createBoard} />
          <Messages/>
        </div>
      </section>
    </div>
  );
}

const mapStateToAppProps = ({ createBoard, player }) => {
	return { createBoard, player };
};
const App = connect(mapStateToAppProps)(App_);

const reducers = combineReducers({ createBoard, player, ui });
const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);

class Wrapper extends Component {
  render() {
    return (
      <Provider store={createStoreWithMiddleware(enableBatching(reducers))}>
        <App/>
      </Provider>
    );
  }
}

export default Wrapper;