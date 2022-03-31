let score = 0;
let round = 1;
let max_round = 10;
let index_used = [];
let time_loaded = new Date();

let minimap;
let street_view;
let infoWindow;

// coordonnées du street view, et de la minimap
let select_coord, guess_coord;

let color_inverted = true;
let mode = "world";

jQuery(document).ready(function () {
   $("#score").on("click", function () {
      if (confirm("Voulez-vous vraiment quitter la page pour voir la liste des score ?\nVotre progression ne sera pas sauvegardée...")) {
         window.location.href = "scoreboard.php";
      }
   });
});

// Set and configure streetview
function initialize() {
   $.ajax({
      url: "server.php",
      type: "post",
      data: {
         name: "get_location",
         mode: mode,
         used: JSON.stringify(index_used)
      },
      success: function (data) {
         let readable_data = JSON.parse(data);
         guess_coord = {
            lat: parseFloat(readable_data.lat),
            lng: parseFloat(readable_data.lng),
            formatted_address: readable_data.formatted_address,
            index: readable_data.index
         };

         console.log("Coordinates displayed: lat=" + guess_coord.lat + " lng=" + guess_coord.lng);

         // STREET VIEW
         street_view = new google.maps.StreetViewPanorama(document.getElementById("street-view"), {
            position: guess_coord,
            pov: {
               heading: 165,
               pitch: 0
            },
            zoom: 1,
            showRoadLabels: false,
            addressControl: false
         });

         // GUESSER
         minimap = new google.maps.Map(document.getElementById("map"), {
            zoom: 1 + 4 * (mode == "france"),
            center: {
               lat: 46.63,
               lng: 2.75
            },
            fullscreenControl: false,
            scrollwheel: true,
            streetViewControl: false,
            gestureHandling: "greedy",
            mapTypeControl: false
         });

         // Create the initial InfoWindow.
         infoWindow = new google.maps.InfoWindow({
            content: "Click the map to get Lat/Lng!",
            position: {
               lat: 0,
               lng: 0
            }
         });

         // Configure the click listener.
         minimap.addListener("click", (mapsMouseEvent) => {
            // Close the current InfoWindow.
            infoWindow.close();
            // Create a new InfoWindow.
            infoWindow = new google.maps.InfoWindow({
               position: mapsMouseEvent.latLng
            });
            infoWindow.setContent("<img src='point.png'>");
            infoWindow.open(minimap);

            select_coord = mapsMouseEvent.latLng.toJSON();
         });
      }
   });
}

// Reload game environment when a round is over
function reconfigure(changed_location = false) {
   // if the game ended
   if (round > max_round) {
      let pseudo = prompt("Vous avez remporté un score de " + score + " ! Bravo !\nEntrez votre pseudo :");
      while (pseudo != null && pseudo != "" && pseudo.length > 10)
         pseudo = prompt("Erreur ! Le pseudo doit avoir 10 caractères au maximum.\nEntrez votre pseudo :");

      if (pseudo == null || pseudo == "") return;

      $.ajax({
         url: "server.php",
         type: "post",
         data: {
            name: "game_end",
            score: score,
            time: new Date().getTime() - time_loaded.getTime(),
            pseudo: pseudo
         },
         success: function (data) {
            window.location.href = "scoreboard.php";
         }
      });

      document.getElementById("next").setAttribute("class", "hidden");
   } else {
      if (!changed_location) index_used[index_used.length] = guess_coord.index;
      document.getElementById("round").innerHTML = "Round: " + round + "/" + max_round;

      document.getElementById("guess").removeAttribute("class", "hidden");
      document.getElementById("next").setAttribute("class", "hidden");
      initialize();
   }
}

// Check if guess is correct and then execute reconfiguring function
function guess() {
   if (select_coord == undefined) {
      alert("Vous devez choisir un endroit !");
      return;
   }

   infoWindow.close();

   let street_view_coord = {
      lat: street_view.position.lat(),
      lng: street_view.position.lng()
   };
   let distance = getDistance(street_view_coord.lat, street_view_coord.lng, select_coord.lat, select_coord.lng);

   let polyline = new google.maps.Polyline({
      path: [street_view_coord, select_coord],
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
   });
   polyline.setMap(minimap);

   // decode \u characters
   let text_label = guess_coord.formatted_address.replace(/\\u([0-9a-f]{4})/g, function (whole, group1) {
      return String.fromCharCode(parseInt(group1, 16));
   });

   let marker = new google.maps.Marker({
      position: guess_coord,
      label: {
         text: text_label,
         fontSize: "13px",
         fontWeight: "bold",
         color: "black"
      }
   });
   marker.setMap(minimap);

   if (Math.abs(street_view_coord.lat - guess_coord.lat) > 0.02 || Math.abs(street_view_coord.lng - guess_coord.lng) > 0.02) {
      marker = new google.maps.Marker({
         position: street_view_coord,
         icon: "point.png"
      });
      marker.setMap(minimap);
   }

   marker = new google.maps.Marker({
      position: select_coord,
      icon: "point.png"
   });
   marker.setMap(minimap);

   infoWindow = new google.maps.InfoWindow({
      position: {
         lat: (select_coord.lat + street_view_coord.lat) / 2,
         lng: (select_coord.lng + street_view_coord.lng) / 2
      }
   });

   infoWindow.setContent(Math.round(distance).toString() + "km");
   infoWindow.open(minimap);

   let previous_score = score;
   $.ajax({
      url: "server.php",
      type: "post",
      data: {
         name: "get_score",
         distance: distance,
         mode: mode
      },
      success: function (data) {
         score += Number(data);
         document.getElementById("guess").setAttribute("class", "hidden");
         document.getElementById("score").innerHTML = "Score: " + score;

         let msg;
         if (score - previous_score <= 1) msg = "Dommage ! +1 Score";
         else if (score - previous_score == 10) msg = "Bravo ! +10 score !";
         else msg = "+" + String(score - previous_score) + " score !";

         popup(msg);
      }
   });

   round++;
   document.getElementById("next").removeAttribute("class", "hidden");
}

function toggleFilter() {
   let street = document.getElementById("street-view");
   let button = document.getElementById("filter");
   if (color_inverted) {
      street.setAttribute("style", "filter: invert(0);");
      button.setAttribute("style", "background-color: blue; width: min-content;");
      color_inverted = false;
   } else {
      street.setAttribute("style", "filter: invert(1);");
      button.setAttribute("style", "background-color: red; width: min-content;");
      color_inverted = true;
   }
}

function toggleLocationPreference() {
   if (confirm("Voulez-vous vraiment changer de mode de localisation ?\nVotre progression ne sera pas sauvegardée...")) {
      let button = document.getElementById("loc_pref");
      index_used = [];
      round = 1;
      score = 0;
      if (button.innerHTML == "World") {
         mode = "france";
         button.setAttribute("style", "background-color: brown; width: min-content;");
         button.innerHTML = "France";
      } else {
         mode = "world";
         button.setAttribute("style", "background-color: green; width: min-content;");
         button.innerHTML = "World";
      }
      document.getElementById("score").innerHTML = "Score: " + score;
      reconfigure(true);
      time_loaded = new Date();
   }
}

function getDistance(lat1, lon1, lat2, lon2) {
   if (lat1 == lat2 && lon1 == lon2) {
      return 0;
   } else {
      var radlat1 = (Math.PI * lat1) / 180;
      var radlat2 = (Math.PI * lat2) / 180;
      var theta = lon1 - lon2;
      var radtheta = (Math.PI * theta) / 180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
         dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      dist = dist * 1.609344;
      return dist;
   }
}

function popup(text) {
   const p = document.createElement("div");
   p.innerHTML = text;
   p.className = "popup";
   p.id = popup_reset("popup-temporary");
   document.getElementsByTagName("body")[0].appendChild(p);
   setTimeout(function () {
      popup_fire(
         p.id,
         10,
         Array.from(
            {
               length: 100
            },
            (_, i) => i * 0.01
         ).reverse()
      );
   }, 2000);
}

function popup_reset(id) {
   if (document.getElementById(id) != null) {
      return popup_reset(id + "-altenative");
   } else {
      return id;
   }
}

function popup_fire(id, dt, X) {
   if (document.getElementById(id) != null) {
      if (X.length) {
         const p = document.getElementById(id);
         p.style.opacity = X.shift();
         setTimeout(function () {
            popup_fire(id, dt, X);
         }, dt);
      } else {
         document.getElementById(id).remove();
      }
   }
}
