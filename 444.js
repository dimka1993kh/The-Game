function getData(url) {
    return new Promise(function(resolve, reject){
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function() {
            if  (xhr.status === 200) {
                let json = JSON.parse(xhr.response);
                resolve(json.Search);
            }
            else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = function(error) {
            reject(error);
        };
        xhr.send();
    });
}

let search = 'batman';

getData(`https://www.google.ru/search?client=opera&q=${search}&sourceid=opera&ie=UTF-8&oe=UTF-8`)
.then(movies =>
        movies.forEach(movie =>
            addMovieToList(movie)))
            .catch(error => console.error(error));