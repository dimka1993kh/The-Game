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
    if ((this.right > actorObject.left) && (this.left < actorObject.right) && (this.bottom > actorObject.top) && (this.top < actorObject.bottom)) {
      if ((this.pos == actorObject.pos) && (this.size == actorObject.size)) {
        return false
      }

      return true;
    }
    else {
      return false;
    }
  }
};

class Level {
  constructor(gridArrayInArray = [], arrayOfActorClass) {
    this.grid = gridArrayInArray;
    this.actors = arrayOfActorClass;
    this.height = gridArrayInArray.length;
    this.status = null;
    this.finishDelay = 1;

  }
  get player() {
    if (typeof (this.actors) !== 'undefined') {
      let typePlayer = this.actors.find(function (el) {
        if (el.type === 'player') {
          return el;
        }
      });
      return typePlayer;
    }
  }
  get width() {
    if (this.grid.length === 0) {
      return 0;
    }
    let searchForTheMaxLengthOfTheArray = [];
    for (let item of this.grid) {
      searchForTheMaxLengthOfTheArray.push(item.length);
    }
    return Math.max.apply(null, searchForTheMaxLengthOfTheArray);
  }
  isFinished() {
    if ((this.status !== null) && (this.finishDelay < 0)) {
      return true;
    }
    else {
      return false;
    }
  }
  actorAt(actor) {
    if ((typeof (actor) == 'underfined') || (!(actor instanceof Actor))) {
      throw new Error`В метод actorAt может быть передан только объект класса Actor`;
    }
    if (this.actors !== undefined) {
      for (let item of this.actors) {
        if (actor.isIntersect(item)) {
          return item;
        }
      }
    }
    else {
      return undefined;
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
    let rightNewPosition = Math.floor(newPosition.x) + Math.ceil(newSize.x);
    let topNewPosition = Math.floor(newPosition.y);
    let bottomNewPosition = Math.floor(newPosition.y) + Math.ceil(newSize.y);

    if (this.grid[topNewPosition] !== undefined) {

      if (this.grid[topNewPosition][leftNewPosition] === 'wall') {
        if ((rightNewPosition > newPosition.x) && (leftNewPosition < newPosition.x + 1) && (bottomNewPosition > newPosition.y) && (topNewPosition < newPosition.y + 1)) {
          return 'wall';
        }
      }
      if (this.grid[topNewPosition][leftNewPosition] === 'lava') {
        if ((rightNewPosition > newPosition.x) && (leftNewPosition < newPosition.x + 1) && (bottomNewPosition > newPosition.y) && (topNewPosition < newPosition.y + 1)) {
          return 'lava';
        }
      }

    }
    if ((leftNewPosition < leftGrid) || (topNewPosition < topGrid) || (rightNewPosition > rightGrid)) {
      return `wall`;
    }

    if (bottomNewPosition > bottomGrid) {
      return `lava`;
    }
  }
  //}
  //}

  removeActor(actor) {
    if (this.actors !== undefined) {
      do {

        var index = this.actors.findIndex(function (item) {
          return ((item.pos === actor.pos) && (item.size === actor.size) && ((item.speed === actor.speed)));
        })
        if (index != -1) {
          this.actors.splice(index, 1)
        }
      }

      while (index >= 0)

    }
  }
  noMoreActors(stringType) {
    if (this.actors !== undefined) {
      let findObject = this.actors.find(function (el) {
        return el.type === stringType;
      });
      if (findObject !== undefined) {
        return false;
      }
      else {
        return true;
      }
    }
    else {
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
      let findCoin = this.actors.find(function (el) {
        return el.type === 'coin';
      });
      if (findCoin !== undefined) {
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
      for (let i in this.dictionary) {
        if (i === character) {
          return this.dictionary[i];
        }
      }
    }
  }

  obstacleFromSymbol(character) {
    let string;
    if (character === 'x') {
      string = 'wall';
    }
    else if (character === '!') {
      string = 'lava';
    }
    else {
      string = undefined;
    }
    return string;
  }
  createGrid(stringArray) {

    if (stringArray.length !== 0) {
      let newGrid = [];
      let newString = [];
      let widthString = [];
      stringArray.forEach(function (el) {
        widthString.push(el.length);
      });
      var maxWidth = Math.max(...widthString);

      newGrid.push(newString.slice());
      for (let i = 0; i < stringArray.length; i++) {
        for (let j = 0; j < maxWidth; j++) {
          let element = stringArray[i].split('')[j];

          if (element === 'x') {
            newGrid[i][j] = 'wall';
          }
          else if (element === '!') {
            newGrid[i][j] = 'lava';
          }
          else {
            newGrid[i][j] = undefined;
          }
          if ((j === maxWidth - 1) && (i !== stringArray.length - 1)) {
            newGrid.push(newString.slice())

          }
        }
      }
      stringArray = newGrid;

    }
    else {
      stringArray = [];
    }
    return stringArray;
  }

  createActors(stringArray) {
    let stringActors = [];
    if (stringArray.length !== 0) {
      for (let i = 0; i < stringArray.length; i++) {
        for (let j = 0; j < stringArray[i].split('').length; j++) {
          let constructorActors = this.actorFromSymbol(stringArray[i][j]);
          if (constructorActors !== undefined) {
            if ((constructorActors === Actor) || (constructorActors.prototype instanceof Actor)) {
              let newActor = new constructorActors(new Vector(j, i));

              stringActors.push(newActor)

            }

          }
        }
      }

    }
    else {
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
    if (playField.obstacleAt(newPosition, this.size) === undefined) {
      this.pos = newPosition;
    }
    else if (playField.obstacleAt(newPosition, this.size) === 'wall' || 'lava') {
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
  constructor(position) {
    super(position);
    this.pos = this.pos.plus(new Vector(0.2, 0.1))
    this.size = new Vector(0.6, 0.6);
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
    return this.pos.plus(this.getSpringVector());
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(position) {
    super(position);
    this.pos = this.pos.plus(new Vector(0, -0.5))
    this.size = new Vector(0.8, 1.5);
  }
  get type() {
    return 'player'
  }
}


/*[
  [
    '  v       ',
    '   v      ',
    'oo   oo  =',
    'xx   xx   ',
    '         =',
    '   xx     ',
    '@ o     o ',
    'x x    xxx',
    '          ',
    '!!!!!!!!!!'
  ],
  [
    'v        v',
    ' v      v ',
    '   oooo   ',
    '  xxxxxx  ',
    '          ',
    '   oooo   ',
    ' xxxxxxxx ',
    '          ',
    ' @ oooo   ',
    'xxxxxxxxxx'
  ]
];*/


const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|' : VerticalFireball
}

const parser = new LevelParser(actorDict);
let yyy = loadLevels()
  .then(result => runGame(JSON.parse(result), parser, DOMDisplay)
      .then(() => alert('ой, а ты победил((')))
  .catch(error => console.error('Ошибка при создании уровня'));
