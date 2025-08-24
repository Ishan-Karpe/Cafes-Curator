const apiKey = "AIzaSyBzBLn0rQ9TYFaCv3tkE5EKB9t5yD-dxHo"; // Replace with your Google Places API key
const useProxy = true; // Set to true if you want to use a CORS proxy
const proxyUrl = "https://cors-anywhere.herokuapp.com/"; // CORS proxy

// useLocation() is a builtin function that takes your device's latitude and longitude coords to have your location ready.
function getLocation() {
  const cache = JSON.parse(localStorage.getItem("cachedLocation") || "{}");
  const now = Date.now();

  // if cached and is less than 10 mins old, makes it faster.
  if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
    useLocation(cache.lat, cache.lng);
  } else {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem(
          //save location and timestamp in localStorage for the future.
          "cachedLocation",
          JSON.stringify({ lat, lng, timestamp: now }),
        );
        useLocation(lat, lng);
      },
      () => alert("Location access denied or unavaliable"),
    );
  }
}
// the endpoint will reference the places API with location and API key to find nearby cafes and fetch their URLs.
async function useLocation(lat, lng) {
  const endpoint = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=cafe&key=${apiKey}`;
  const url = useProxy ? proxyUrl + endpoint : endpoint;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results) {
      //if there are results that data is inserted into displayCards()
      displayCards(data.results);
    } else {
      alert("No cafes found.");
    }
  } catch (e) {
    console.error("Error fetching Places API:", e);
    alert("Error fetching cafes.");
  }
}

function displayCards(cafes) {
  const container = document.querySelector(".cards");
  container.innerHTML = "";

  cafes.forEach((cafe, i) => {
    //for each cafe found, create a new div, add a swipe-wrapper class, and ajust display order to have new cards appear under old ones.
    const wrapper = document.createElement("div");
    wrapper.className = "swipe-wrapper";
    wrapper.style.zIndex = cafes.length - i;
    const card = document.createElement("div");
    card.className = "location-card";

    const imgUrl = cafe.photos?.[0]?.photo_reference //save the URL of the photo
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${cafe.photos[0].photo_reference}&key=${apiKey}`
      : "https://via.placeholder.com/250x150?text=No+Image";

    const cafeData = {
      name: cafe.name || "Unknown Cafe",
      place_id: cafe.place_id || "Address not available",
      rating: cafe.rating || "N/A",
      photo: imgUrl || "No photos found",
    }; //grab cafe data to save later.

    card.innerHTML = `
                <img src="${imgUrl}" alt="${cafe.name}" />
                <h3>${cafe.name}</h3>
                <p>⭐️ Rating: ${cafe.rating || "N/A"}</p>
                <p><small>Swipe right to save 💖</small></p>
                `;

    wrapper.appendChild(card);
    container.appendChild(wrapper);

    const hammertime = new Hammer(wrapper);
    hammertime.on("swipeleft", () => {
      wrapper.style.transform = "translateX(-150%) rotate(-15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });
    hammertime.on("swiperight", () => {
      saveCafe(JSON.stringify(cafeData));
      wrapper.style.transform = "translateX(150%) rotate(15deg)";
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 100);
    });
  });
}
// add a line to store the string as a object and save the cave to saved array.
// localStorage saves cafes to the browser. It automatically caches (saves) specific interactions from your site to your browser that you choose to save without needing a database.
function saveCafe(cafeJson) {
  const cafe = JSON.parse(cafeJson);
  let saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");
  // find() sees if the place_id is in the array
  // if a cafe isn't saved, push it to the array and save it to localStorage, alert user.
  if (!saved.find((c) => c.place_id === cafe.place_id)) {
    saved.push(cafe);
    localStorage.setItem("savedCafes", JSON.stringify(saved));
    alert(`Saved: ${cafe.name}`);
  } else {
    //prevents duplicate cafes from being saved.
    alert(`${cafe.name} is already saved.`);
  }
}

//checks what cafes are saved by pulling saved info from localStorage and use DOM manipulation to create HTML elements like each cafe's image, name, and rating of the spot when prompted.
// inserts cafes info into <div> onto the page.
function showSaved() {
  const container = document.querySelector(".cards");
  container.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");
  if (saved.length === 0) {
    container.innerHTML = "<p>No saved cafes.</p>";
    return;
  }

  // For each cafe in the saved array, make a card div, add location-card, update content with innerHTML

  saved.forEach((cafe) => {
    const card = document.createElement("div");
    card.className = "location-card";
    card.innerHTML = `
              <img src="${cafe.photo}" alt="${cafe.name}" />
              <h3>${cafe.name}</h3>
              <p>⭐️ Rating: ${cafe.rating}</p>
                `;
    container.appendChild(card); //add the cafe card that was just generated to container.
  });
}
