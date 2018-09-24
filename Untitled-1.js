'use strict'

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  };

  plus(objectClassVector) {
    if (!(objectClassVector instanceof Vector)) {
      throw new Error`Можно прибавлять к вектору только вектор типа Vector`;
    }
    let plusVector = new Vector();
    plusVector.x = this.x + objectClassVector.x;
    plusVector.y = this.y + objectClassVector.y;
    return plusVector;
  };

  times(factor) {
    let timesVector = new Vector();
    timesVector.x = factor * this.x;
    timesVector.y = factor * this.y;
    return timesVector;
  };

};
class Actor {
  constructor(positionActor = new Vector(0, 0), sizeActor = new Vector(1, 1), speedActor = new Vector(0, 0)) {
    if ((!(positionActor instanceof Vector)) || (!(sizeActor instanceof Vector)) || (!(speedActor instanceof Vector))) {
      throw new Error`В класс Actor можно передавать только объекты класса Vector`;
    }

    this.pos = positionActor;
    this.size = sizeActor;
    this.speed = speedActor;
  }
  get type() {
    return 'actor';
  }
  get left() {
    return this.pos.x;;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }

  act() {

  }

  isIntersect(actorObject) {
    if ((!(actorObject instanceof Actor)) || (typeof (actorObject) === 'undefined')) {
      throw new Error`Можно проверить на пересечение только движущийся объект класса Actor`;
    }
  if ((this.right > actorObject.left) && (this.left < actorObject.right) && (this.bottom > actorObject.top) && (this.top < actorObject.bottom) && (this !== actorObject) /*&& (this.pos !== actorObject.pos) && (this.size !== actorObject.size)*/) {
      return true;
    } else {
      return false;
    }
  }
};

class Level {
  constructor(grid = [], arrayOfActorClass) {
    this.grid = grid;
    this.actors = arrayOfActorClass;
    this.height = grid.length;
    this.status = null;
    this.finishDelay = 1;

  }
  get player() {
    if (typeof (this.actors) !== 'undefined') {
      let typePlayer = this.actors.find( (actor) => {
        if (actor.type === 'player') {
          return actor;
        }
      });
      return typePlayer;
    }
  }
  get width() {
    if (this.grid.length === 0) {
      return 0;
    }
    let gridRowsLength = [];
    this.grid.forEach((string) => {
      gridRowsLength.push(string.length);
    })
    return Math.max(...gridRowsLength);
  }
  isFinished() {
    if ((this.status !== null) && (this.finishDelay < 0)) {
      return true;
    } else {
      return false;
    }
  }
  actorAt(searchActor) {
    if ((typeof (searchActor) == 'underfined') || (!(searchActor instanceof Actor))) {
      throw new Error`В метод actorAt может быть передан только объект класса Actor`;
    }
     if (this.actors !== undefined) {

      let crossActor = this.actors.find((actor) => {
          return searchActor.isIntersect(actor);
      });
      if (crossActor !== undefined) {
        return crossActor;
      } else {
        return undefined;
      }
    }
  }
  obstacleAt(newPosition, newSize) {
    if ((!(newPosition instanceof Vector)) || (!(newSize instanceof Vector))) {
      throw new Error`В метод obstacleAt может быть передан только объект класса Vector`
    }
    let leftGrid = 0;
    let rightGrid = this.width;
    let topGrid = 0;
    let bottomGrid = this.height;

    let leftNewPosition = Math.floor(newPosition.x);
    let rightNewPosition = newPosition.x + newSize.x;
    let topNewPosition = Math.floor(newPosition.y);
    let bottomNewPosition = newPosition.y + newSize.y;
    

    if ((leftNewPosition >= 0) && (rightNewPosition < rightGrid) && (topNewPosition >= 0) && (bottomNewPosition < bottomGrid)) { 
      let cell;

      for (let y = topNewPosition; y < bottomNewPosition; y++) {
        for (let x = leftNewPosition; x < rightNewPosition; x++) {
          let newCell = this.grid[y][x]; 
          if (newCell !== undefined) {
            cell = newCell;
          } 
        } 
      }
      return cell;
    } else if ((leftNewPosition < leftGrid) || (topNewPosition < topGrid) || (rightNewPosition > rightGrid)) {
      return 'wall';
    } else if (bottomNewPosition > bottomGrid) {
      return `lava`;
    } 
  }

  removeActor(removeActor) {
    if (this.actors !== undefined) {
      var index = this.actors.findIndex( (actor) => {
        return ((removeActor.pos === actor.pos) && (removeActor.size === actor.size) && ((removeActor.speed === actor.speed)));
      });
      if (index != -1) {
        this.actors.splice(index, 1)
      }
    }
  }
  noMoreActors(stringType) {
    if (this.actors !== undefined) {
      let findObject = this.actors.find( (actor) => {
        return actor.type === stringType;
      });
      if (findObject !== undefined) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
  playerTouched(typeObject, movingObject) {
    if ((typeObject === 'lava') || (typeObject === 'fireball')) {
      this.status = 'lost';
    }
    if (this.actors !== undefined) {

      if ((typeObject === 'coin') && (movingObject.type === 'coin')) {
        this.removeActor(movingObject);
      }
      let findCoin = this.actors.find( (actor) => {
        return actor.type === 'coin';
      });
      if (findCoin === undefined) {
        this.status = 'won';
      }
    }

  }
};


class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(character) {
    if (this.dictionary !== undefined) {
      for (let element in this.dictionary) {
        if (element === character) {
         return this.dictionary[element];
        }
      }
    }
  }

  obstacleFromSymbol(character) {
    let string;
    if (character === 'x') {
      string = 'wall';
    } else if (character === '!') {
      string = 'lava';
    } else {
      string = undefined;
    }
    return string;
  }
  createGrid(stringArray) {

    if (stringArray.length !== 0) {
      return stringArray.map((string) => {
        string = [...string].map((cell) => {
          return this.obstacleFromSymbol(cell);
        });
        return string;
      });
    } else {
      return [];
    }
    }                        

  createActors(stringArray) {
    let stringActors = [];
    if (stringArray.length !== 0) {
      stringArray.forEach((row, y) =>{
        [...row].forEach((cell, x) => {
          let constructorActors = this.actorFromSymbol(cell);
          if (constructorActors !== undefined) {
            if ((constructorActors === Actor) || (constructorActors.prototype instanceof Actor)) {
            let newActor = new constructorActors(new Vector(x, y));
            stringActors.push(newActor)
            }
          }
        });
      });
    } else {
      return stringArray = [];
    }
    return stringArray = stringActors;
  }
  parse(stringArray) {
    return new Level(this.createGrid(stringArray), this.createActors(stringArray))
  }
}

class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, speed);
    this.speed = speed;
    this.size = new Vector(1, 1);
  }
  get type() {
    return 'fireball'
  }
  getNextPosition(time = 1) {
    return new Vector((this.pos.x + this.speed.x * time) , this.pos.y + this.speed.y * time);
  }
  handleObstacle() {
    return this.speed = this.speed.times(-1);
  }
  act(time, playField) {
    let newPosition = this.getNextPosition(time);
    let obtacle = playField.obstacleAt(newPosition, this.size);
    if (obtacle === undefined) {
      this.pos = newPosition;
    } else {
      this.handleObstacle();
    }

  }
}

class HorizontalFireball extends Fireball {
  constructor(position) {
    super(position)
    this.speed = new Vector(2, 0);
  }
}
class VerticalFireball extends Fireball {
  constructor(position) {
    super(position)
    this.speed = new Vector(0, 2);
  }
}
class FireRain extends Fireball {
  constructor(position) {
    super(position)
    this.speed = new Vector(0, 3);
    this.position = position;
  }
  handleObstacle() {
    return this.pos = this.position;
  }
}

class Coin extends Actor {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0.6, 0.6));
    this.pos = position.plus(new Vector(0.2, 0.1));
    this.startPos = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }

  get type() {
    return 'coin';
  }
  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist)
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(position) {
    super(position);
    this.pos = this.pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
  }
  get type() {
    return 'player'
  }
}

const parser = new LevelParser();
let plan = [
  'x  x',
  '!!!!'
];

const grid = parser.createGrid(plan);