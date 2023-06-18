//VARIABLE DECLARATIONS

const appBody = document.getElementById("appbody");
const moviesTab = document.getElementById("movies-tab");
const seriesTab = document.getElementById("series-tab");
const top30CardsDiv = document.getElementById("top30cards");
const popupContainer = document.querySelector('#popup-container');
const popupContent = document.getElementById("popup-content");
const closeBtn = document.querySelector('#close-btn');
const searchBar = document.getElementById("searchbar");
const paginationButtons = document.querySelectorAll('.pagination-button');
const logo = document.getElementById("navbar-logo");

let currentPageNum = 1;
let searchPageNum = 1;
let movieCurrPageNum = 1;
let seriesCurrPageNum = 1;
let searchTriggered = false;
let movieTabIsActive = true;

// EVENT LISTENERS ON PRELOADED HTML

moviesTab.addEventListener("click", () => {
  if (movieTabIsActive) {return} //bilo izcommentano, ako sta ne valja vrati komentar
  seriesTab.classList.remove("active");
  moviesTab.classList.add("active");
  movieTabIsActive = true;
  seriesCurrPageNum = currentPageNum;
  currentPageNum = movieCurrPageNum;
  // pageContentManager();
  if (searchTriggered) {
    searchManager();
   } else {pageContentManager()}
});

seriesTab.addEventListener("click", () => {
  if (movieTabIsActive === false) {return} //bilo izcommentano, ako sta ne valja vrati komentar
  moviesTab.classList.remove("active");
  seriesTab.classList.add("active");
  movieTabIsActive = false;
  movieCurrPageNum = currentPageNum;
  currentPageNum = seriesCurrPageNum;
  // pageContentManager();
  if (searchTriggered) {
    searchManager();
   } else {pageContentManager()}
});

closeBtn.addEventListener('click', function() {
  overlay.style.display = 'none';
  popupContent.innerHTML="";
});

paginationButtons.forEach(button => {
  button.addEventListener("click",() => {
    currentPageNum = button.dataset.page;
    if (searchTriggered) {
      searchManager();
     } else {pageContentManager()}
    });
});

searchBar.addEventListener("input", () => {
  searchActivator()
});

logo.addEventListener("click", () => {
  location.reload()
});

//API DECLARATIONS

const APIcredentials = {
  method: 'GET',
  headers: {
  accept: 'application/json',
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzYTBlNGJhMTBkYWM5MDAzYTk2MTc0NmI4NzQ2MDQxMiIsInN1YiI6IjY0ODM1YjcxZDJiMjA5MDBhZDNiYjFmZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZD-2o5D1s_iloB2ONYKFfKeGRuCxyGV8idfkpXXBud0'
    }
  };

///////////////////////////////////////////////////////////////////////
/////////////////////// API FETCH FUNCTIONS ///////////////////////////

async function fetchTop30(content) {
  let dataArray = [];
  let resultsArray = [];
  const moviesLowerURL = `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${pageToRequestLower()}`;
  const moviesUpperURL = `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${pageToRequestHigher()}`;
  const seriesLowerURL = `https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=${pageToRequestLower()}`;
  const seriesUpperURL = `https://api.themoviedb.org/3/tv/top_rated?language=en-US&page=${pageToRequestHigher()}`;
  let response;
  let response2;

  try {
    //2x API calls, one gets 20 results, two get 40. We need 30 per page so minimum 2 calls. the template literal variables have embedded function call which gets the correct API pages to call for each webapp page. THE MATH IS WEIRD AND UGLY, AND THUS THE CODE IMPLEMENTATION IS ALSO UGLY BY EXTENSION. IF MOVIES/SERIES PER PAGE REQUIREMENT CHANGED, I'D HAVE TO CHANGE SO MUCH CODE, WHICH IS BAD. WE NEED A SOLUTION THAT MAKES THE CODE/MATH STAY THE SAME REGARDLESS OF MOVIES/SERIES PER PAGE REQUIREMENTS.
    if (content === "movies") {
      response = await fetch(moviesLowerURL, APIcredentials);
      response2 = await fetch(moviesUpperURL, APIcredentials);
    } else if (content === "series") {
      response = await fetch(seriesLowerURL, APIcredentials);
      response2 = await fetch(seriesUpperURL, APIcredentials);
    }

    //two data objects from the 2 API calls both stored in one array
    const data = await response.json();
    const data2 = await response2.json();
    console.log("data1 is", data);
    console.log("data2 is", data2);
    dataArray.push(data);
    dataArray.push(data2);
    
    //then we iterate on this weird ass array of objects which inside have an array of objects which are the movie/series objects full of details, and we put all those results neatly into a nice 1-dimensional array
    for (object of dataArray) {
      for (result of object.results) {
        resultsArray.push(result)
      }
    }

    //removes the redundant movies/series from the array (since API gets 20 per page and we do 2 calls to get the 30 we need per page, and 10 is extra). the if/else statement is because of how the math for which API pages to request works - the redundant 10 is the first 10/last 10 for even/odd web app page numbers respectively. (WE NEED TO FIX THIS UGLY IMPLEMENTATION THOUGH)
    if (currentPageNum % 2 === 0) {
      resultsArray.splice(0,10);
    } else {
      resultsArray.splice(-10)
    }

      } catch (err) {
          console.error(err);}
  
  renderTop30(resultsArray, content);
}

async function fetchMovieDetails(ID) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${ID}?language=en-US`, APIcredentials);
    const data = await response.json();
    console.log("movie details data je", data);
    return data;
  } catch(err) {
    console.error(err)
  }
}

async function fetchSeriesDetails(ID) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${ID}?language=en-US`, APIcredentials);
    const data = await response.json();
    console.log("series details data je", data);
    return data;
  } catch(err) {
    console.error(err)
  }
}

async function fetchMovieSearch(textvalue) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(textvalue)}&include_adult=false&page=${currentPageNum}`, APIcredentials);
    const data = await response.json();
    console.log("MOVIES SEARCH details are", data);
    return data
  } catch(err) {
    console.error(err)
  }
}

async function fetchSeriesSearch(textvalue) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(textvalue)}&include_adult=false&page=${currentPageNum}`, APIcredentials);
    const data = await response.json();
    console.log("SERIES SEARCH details are", data);
    return data
  } catch(err) {
    console.error(err)
  }
}

///////////////////////////////////////////////////////////////////////
////////////////////////FUNCTION DECLARATIONS /////////////////////////

function pageToRequestLower() {
  if (currentPageNum % 2 === 0) {
    return y = ((3*currentPageNum) - 2) / 2
  } else {
    return y = ((3*currentPageNum) - 1) / 2
  }
}

function pageToRequestHigher() {
  if (currentPageNum % 2 === 0) {
    return y = (3*currentPageNum) / 2
  } else {
    return y = ((3*currentPageNum) + 1) / 2
  }
}

function searchActivator() {
console.log("searchTriggered je", searchTriggered, "; currpagenum je", currentPageNum, " ;moviecurrpagenum je", movieCurrPageNum);

  /*if (searchBar.value.length === 3 && searchTriggered === false) {
      if (movieTabIsActive) {movieCurrPageNum = currentPageNum} else {seriesCurrPageNum = currentPageNum};
      currentPageNum = 1;
      console.log("switch to search done");
    } 
  if ((searchBar.value.length === 2 && searchTriggered === true) || (searchBar.value.length === 0 && searchTriggered === true)) {
      if (movieTabIsActive) {currentPageNum = movieCurrPageNum} else {currentPageNum = seriesCurrPageNum};
      console.log("switch back from search done");
    }*/

  if (searchBar.value.length >= 3) {
    if (searchTriggered === false) {
      if (movieTabIsActive) {movieCurrPageNum = currentPageNum} else {seriesCurrPageNum = currentPageNum};
      currentPageNum = 1;
      console.log("switch to search done");
    }
    searchTriggered = true;   
    currentPageNum = 1;
    searchManager();
    
  } else {
    if (searchTriggered === true) {
      if (movieTabIsActive) {currentPageNum = movieCurrPageNum} else {currentPageNum = seriesCurrPageNum};
      console.log("switch back from search done");
    }
    searchTriggered = false;
    pageContentManager() //ovo popravi da ne mora tamo pozivati i tamo provjeravat isSearch. eliminisi isSearch. stavi myb da poziva searchactivator. myb vidi nesto mozel bolje nez.
  }
}

function searchManager() {
  paginationButtons.forEach(button => {
    button.classList.remove('active');
  });
  const activatedButton = document.querySelector(`.pagination-button[data-page="${currentPageNum}"]`);
  activatedButton.classList.add('active');

  if (movieTabIsActive) {
    console.log("movie searchTitles triggered from event listener");
    searchTitles(searchBar.value, "movies");
  } else if (movieTabIsActive === false) {
    console.log("series searchTitles triggered from event listener");
    searchTitles(searchBar.value, "series");
  }
}

async function searchTitles(textvalue, moviesOrSeries) {
  console.log("textvalue in searchTitles is", textvalue, "content is", moviesOrSeries);
  let searchData;
  let resultsArray = [];

  if (moviesOrSeries === "movies") {
    console.log("AAAA")
    searchData = await fetchMovieSearch(textvalue);
  } else if (moviesOrSeries === "series") {
    console.log("BBBB")
    searchData = await fetchSeriesSearch(textvalue);
  }
  
  //console.log("searchData je", searchData);

  for (result of searchData.results) {
    resultsArray.push(result)
  }
  
  renderTop30(resultsArray, moviesOrSeries);
}

async function openCardDetails(i,moviesOrSeries, resultsArray) {
  overlay.style.display = 'flex';
  let image;
  let title;
  let overview;

  if (moviesOrSeries === "movies") {
    const productionID = resultsArray[i].id;
    const movieDetails = await fetchMovieDetails(productionID);
    console.log("moviedetails je", movieDetails);
    image = movieDetails.poster_path;
    title = movieDetails.title;
    overview = movieDetails.overview;
  }
  else if (moviesOrSeries === "series") {
    const productionID = resultsArray[i].id;
    const seriesDetails = await fetchSeriesDetails(productionID);
    console.log("seriesdetails je", seriesDetails);
    image = seriesDetails.poster_path;
    title = seriesDetails.name;
    overview = seriesDetails.overview;
  }

  popupContent.innerHTML = `
  <div class="row">
      <div class="col-md-4">
        <img src="https://image.tmdb.org/t/p/w500${image}" class="bd-placeholder-img img-fluid rounded" alt="Image">
      </div>
      <div class="col-md-8">
        <div class="d-flex flex-column h-100">
          <div class="align-self-start">
            <h5 class="card-title">${title}</h5>
          </div>
          <div class="mt-auto">
            <p class="card-text">${overview}</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function pageContentManager() {
  // removes "active" class from all buttons in preparation for giving the class to only the active page button (DUMB IMPLEMENTATION, make it target the actual one)
	paginationButtons.forEach(button => {
  		button.classList.remove('active');
	});
  
  // second, add class "active" to clicked button. i MYB RAZRADI DA LJEPSE QUERYJA OVO
  const activatedButton = document.querySelector(`.pagination-button[data-page="${currentPageNum}"]`);
  activatedButton.classList.add('active');
	
  if (movieTabIsActive) {
    //movieCurrPageNum = currentPageNum;
    fetchTop30("movies");
  } else {
    //seriesCurrPageNum = currentPageNum;
    fetchTop30("series")};
}

function renderTop30(resultsArray, content) {
  console.log("render triggered");
  top30CardsDiv.innerHTML = "";

  if (searchTriggered && resultsArray.length === 0) {
    top30CardsDiv.innerHTML = `
    <h5 class="card-title">No results found.</h5>
    `
  } 
  else {
    for (let i = 0; i<resultsArray.length; i++) {
        let name;
        name = (content === "movies") ? name = resultsArray[i].title : name = resultsArray[i].name ;
        let image = resultsArray[i].poster_path;
        let rating = resultsArray[i].vote_average;
        top30CardsDiv.innerHTML += `
          <div class="card shadow-sm"  id="${i}">
              <img src="https://image.tmdb.org/t/p/w500${image}" class="bd-placeholder-img card-img-top pt-2" role="button" alt="Movie Image">
              <div class="card-body">
                  <h5 class="card-title" role="button">${name}</h5>
                  <p class="card-text">Rating: ${rating}</p>
              </div>
          </div>
        `     
    }
  //adding event listener to each movie/series card, that when clicked, opens details page
    for (let i=0; i<resultsArray.length; i++) {
      const productionCard = document.getElementById(`${i}`);
      productionCard.addEventListener("click", () => {openCardDetails(i,content, resultsArray)})
    }
  }

  //scrolls to top of page after rendering
  window.scrollTo({
    top: 0,
    behavior: 'smooth' //
  });
  //console.log('movies highest req page:',moviesHighestRequestedPage,'movieslastaddedpage:',moviesLastAddedPage, 'active page num:', currentPageNum)
}

///////////////////////////////////////////////////////////////////////
///////////////////////////////// INITIALIZE //////////////////////////////////////
pageContentManager(1);
  