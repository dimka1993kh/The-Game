/*'use strict'


function loadLevels() {
  return new Promise((done, fail) => {
    const xhr = new XMLHttpRequest();
    let url = './levels.json';
    if (location.hostname !== 'localhost') {
      url = 'http://neto-api.herokuapp.com/js/diplom/levels.json';
    }
    xhr.open('GET', url);
    xhr.addEventListener('error', e => fail(xhr));
    xhr.addEventListener('load', e => {
      if (xhr.status !== 200) {
        fail(xhr);
      }
      done(xhr.responseText);
    });
    xhr.send();
  });
}

const scale = 30;
const maxStep = 0.05;
const wobbleSpeed = 8, wobbleDist = 0.07;
const playerXSpeed = 7;
const gravity = 30;
const jumpSpeed = 17;

function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

class DOMDisplay {
  constructor(parent, level) {
    this.wrap = parent.appendChild(elt("div", "game"));
    this.wrap.setAttribute('autofocus', true)
    this.level = level;

    this.actorMap = new Map();
    this.wrap.appendChild(this.drawBackground());
    this.actorLayer = this.wrap.appendChild(this.drawActors());
    this.drawFrame();
  }

  drawBackground() {
    var table = elt("table", "background");
    table.style.width = this.level.width * scale + "px";
    this.level.grid.forEach(function(row) {
      var rowElt = table.appendChild(elt("tr"));
      rowElt.style.height = scale + "px";
      row.forEach(function(type) {
        rowElt.appendChild(elt("td", type));
      });
    });
    return table;
  }

  drawActor(actor) {
    return elt('div', `actor ${actor.type}`);
  }

  updateActor(actor, rect) {
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  }

  drawActors() {
    var wrap = elt('div');
    this.level.actors.forEach(actor => {
      const rect = wrap.appendChild(this.drawActor(actor));
      this.actorMap.set(actor, rect);
    });
    return wrap;
  }

  updateActors() {
    for (const [actor, rect] of this.actorMap) {
      if (this.level.actors.includes(actor)) {
        this.updateActor(actor, rect);
      } else {
        this.actorMap.delete(actor);
        rect.parentElement.removeChild(rect);
      }
    }
  }

  drawFrame() {
    this.updateActors();

    this.wrap.className = "game " + (this.level.status || "");
    this.scrollPlayerIntoView();
  }

  scrollPlayerIntoView() {
    var width = this.wrap.clientWidth;
    var height = this.wrap.clientHeight;
    var margin = width / 3;

    // The viewport
    var left = this.wrap.scrollLeft, right = left + width;
    var top = this.wrap.scrollTop, bottom = top + height;

    var player = this.level.player;
    if (!player) {
      return;
    }
    var center = player.pos.plus(player.size.times(0.5))
                   .times(scale);

    if (center.x < left + margin)
      this.wrap.scrollLeft = center.x - margin;
    else if (center.x > right - margin)
      this.wrap.scrollLeft = center.x + margin - width;
    if (center.y < top + margin)
      this.wrap.scrollTop = center.y - margin;
    else if (center.y > bottom - margin)
      this.wrap.scrollTop = center.y + margin - height;
  }

  clear() {
    this.wrap.parentNode.removeChild(this.wrap);
  }
}

var arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop) {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  initGameObjects();
  return new Promise(done => {
    var arrows = trackKeys(arrowCodes);
    var display = new Display(document.body, level);
    runAnimation(step => {
      level.act(step, arrows);
      display.drawFrame(step);
      if (level.isFinished()) {
        display.clear();
        done(level.status);
        return false;
      }
    });
  });
}

function initGameObjects() {
  if (initGameObjects.isInit) {
    return;
  }

  initGameObjects.isInit = true;

  Level.prototype.act = function(step, keys) {
    if (this.status !== null) {
      this.finishDelay -= step;
    }

    while (step > 0) {
      var thisStep = Math.min(step, maxStep);
      this.actors.forEach(actor => {
        actor.act(thisStep, this, keys);
      });

      if (this.status === 'lost') {
        this.player.pos.y += thisStep;
        this.player.size.y -= thisStep;
      }

      step -= thisStep;
    }
  };

  Player.prototype.handleObstacle = function (obstacle) {
    if (this.wontJump) {
      this.speed.y = -jumpSpeed;
    } else {
      this.speed.y = 0;
    }
  };

  Player.prototype.move = function (motion, level) {
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) {
      level.playerTouched(obstacle);
      this.handleObstacle(obstacle);
    } else {
      this.pos = newPos;
    }
  };

  Player.prototype.moveX = function (step, level, keys) {
    this.speed.x = 0;
    if (keys.left) this.speed.x -= playerXSpeed;
    if (keys.right) this.speed.x += playerXSpeed;

    var motion = new Vector(this.speed.x, 0).times(step);
    this.move(motion, level);
  };

  Player.prototype.moveY = function (step, level, keys) {
    this.speed.y += step * gravity;
    this.wontJump = keys.up && this.speed.y > 0;

    var motion = new Vector(0, this.speed.y).times(step);
    this.move(motion, level);
  };

  Player.prototype.act = function (step, level, keys) {
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);

    var otherActor = level.actorAt(this);
    if (otherActor) {
      level.playerTouched(otherActor.type, otherActor);
    }
  };
}

function runGame(plans, Parser, Display) {
  return new Promise(done => {
    function startLevel(n) {
      runLevel(Parser.parse(plans[n]), Display)
        .then(status => {
          if (status == "lost") {
            startLevel(n);
          } else if (n < plans.length - 1) {
            startLevel(n + 1);
          } else {
            done();
          }
        });
    }
    startLevel(0);
  });
}

function rand(max = 10, min = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


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
];




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
*/

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
        return false;
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
      this.actors.find(function(element){
          return element.isIntersect(actor);
      });        
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
    let rightNewPosition = Math.floor(newPosition.x + newSize.x);
    let topNewPosition = Math.floor(newPosition.y);
    let bottomNewPosition = Math.floor(newPosition.y + newSize.y);

    /*if (this.grid[bottomNewPosition] !== undefined) {

      if (((this.grid[bottomNewPosition][leftNewPosition]) || (this.grid[bottomNewPosition][rightNewPosition])) === 'wall') {
        if ((rightNewPosition > newPosition.x) && (leftNewPosition < newPosition.x + 1) && (bottomNewPosition > newPosition.y) && (topNewPosition < newPosition.y + 1)) {
          return 'wall';
        }
      }
      if (((this.grid[bottomNewPosition][leftNewPosition]) || (this.grid[bottomNewPosition][rightNewPosition])) === 'lava') {
        if ((rightNewPosition > newPosition.x) && (leftNewPosition < newPosition.x + 1) && (bottomNewPosition > newPosition.y) && (topNewPosition < newPosition.y + 1)) {
          return 'lava';
        }
      }

    }*/

    if ((leftNewPosition < leftGrid) || (topNewPosition < topGrid) || (rightNewPosition >= rightGrid)) {
      return `wall`;
    }

    if (bottomNewPosition >= bottomGrid) {
      return `lava`;
    }
    if (((this.grid[bottomNewPosition -1][leftNewPosition] || this.grid[bottomNewPosition-1][rightNewPosition])) !== undefined) {
        if (((this.grid[bottomNewPosition -1][leftNewPosition] || this.grid[bottomNewPosition-1][rightNewPosition])) === 'wall') {
            console.log(this.grid[bottomNewPosition][leftNewPosition], this.grid[bottomNewPosition][rightNewPosition]) ;
          } 
        }
        if (((this.grid[bottomNewPosition -1][leftNewPosition] || this.grid[bottomNewPosition-1][rightNewPosition])) !== undefined) {
          if (((this.grid[bottomNewPosition -1][leftNewPosition] || this.grid[bottomNewPosition-1][rightNewPosition])) === 'lava') {
              return 'lava';
            } 
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
  


  
  let mushroom = new Actor;


  const player = new Player(new Vector(2-1, 1));

const level = new Level(undefined, [ player, mushroom ]);

      const actor = level.actorAt(player);