let stringArray = ['x!x!', 'cccc', 'rt4!'];

function obstacleFromSymbol(character) {
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
/*
function createGrid(stringArray) {

    if (stringArray.length !== 0) {

    let newGrid = [[]];
    let widthString = [];
    let newString = [];

    stringArray.forEach((string) => {

      widthString.push(string.length);
    });
    var maxWidth = Math.max(...widthString);

    for (let y = 0; y < stringArray.length; y++) {
      for (let x = 0; x < maxWidth; x++) {
        if ((x === maxWidth - 1) && (y !== stringArray.length - 1)) {
          newGrid.push(newString.slice());
        }
        newGrid[y][x] = this.obstacleFromSymbol(stringArray[y][x]);
      }
    }
    stringArray = newGrid;
  } else {
    stringArray = [];
  }
  return stringArray;
  }
  
   console.log(createGrid(stringArray))*/

function createGrid1(stringArray) {

    if (stringArray.length !== 0) {

    var stringArray1 = stringArray.map((string) => {
      return string = [...string];
    });

    var stringArray2 = stringArray1.map((string) => {
      string = string.map((cell) => {
        return cell = this.obstacleFromSymbol(cell)
      });
      return string;
    })
  } 
  return stringArray2;
  }
  
  console.log(createGrid1(stringArray))