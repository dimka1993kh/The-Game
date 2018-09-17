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
  function createGrid(stringArray) {

    if (stringArray.length !== 0) {

    let newGrid = [[]];
    let widthString = [];
    let newString = [];

    stringArray.forEach( (string) => {

      widthString.push(string.length);
      });
    var maxWidth = Math.max(...widthString);

  

      for (let y = 0; y < stringArray.length; y++) {
        for (let x = 0; x < maxWidth; x++) {
            if ((x === maxWidth - 1) && (y !== stringArray.length - 1)) {
              newGrid.push(newString.slice());
          }
        newGrid[y][x] = obstacleFromSymbol(string[y]][x]);
        }
      }
    
    stringArray = newGrid;
    } else {
      stringArray = [];
    }
    return stringArray;
  }
    

    /*if (stringArray.length !== 0) {
      let newGrid = [];
      let newString = [];
      let widthString = [];
      stringArray.forEach( (string) => {
        widthString.push(string.length);
      });
      var maxWidth = Math.max(...widthString);

      newGrid.push(newString.slice());
      for (let y = 0; y < stringArray.length; y++) {
        for (let x = 0; x < maxWidth; x++) {
          let element = stringArray[y].split('')[x];

          if (element === 'x') {
            newGrid[y][x] = 'wall';
          } else if (element === '!') {
            newGrid[y][x] = 'lava';
          } else {
            newGrid[y][x] = undefined;
          }
          if ((x === maxWidth - 1) && (y !== stringArray.length - 1)) {
            newGrid.push(newString.slice())

          }
        }
      }
      stringArray = newGrid;

    } else {
      stringArray = [];
    }
    return stringArray;
  }*/


  let arr = ['xx!1',
             '2345',
              '!x!!']

console.log(createGrid(arr))