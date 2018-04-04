var elected;
// Creates the geoJSON variable in the global scope
var txdist;
// Style for the congressional district polygon
var Gstyle = {
  color: "#FF4F19",
  opacity: 0.65,
  weight: .75,
  fillColor: "#FF4F19",
  fillOpacity: 0.1
};

//Initialize the map
var mymap = L.map('map').setView([31.15, -99.90], 6);
// Creates a variable in the global scope that will be used to check
// whether a stye has been preset
var lastClickedLayer;
var active;
// Load the Pioneer Tiles
L.tileLayer('https://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey=1d8e4763ba4d434ca9c3ba43b3849775', {
  attribution: 'Pioneer Basemap by Thunderforest, a project by Gravitystorm Limited.'
}).addTo(mymap);
// control that shows state info
var info = L.control();

// 1) Info boxes and demographic section-----------------------------------------
// MidInfo Demographic update function

function updateMidInfo(districtName) {
  var perWhite = (districtName.B02001e2 / districtName.B02001e1) * 100;
  var perBlack = (districtName.B02001e3 / districtName.B02001e1) * 100;
  var perNtvAmer = (districtName.B02001e4 / districtName.B02001e1) * 100;
  var perAsian = (districtName.B02001e5 / districtName.B02001e1) * 100;
  var perHawaii = (districtName.B02001e6 / districtName.B02001e1) * 100;
  var perOther = (districtName.B02001e7 / districtName.B02001e1) * 100;
  var perLatino = (districtName.B03002e12 / districtName.B02001e1) * 100;
  var perNonLatino = (districtName.B03002e2 / districtName.B02001e1) * 100;
  $('th').replaceWith("<th>" + districtName.NAMELSAD + "</th>");
  $('#pop').replaceWith("<td id='pop'>" + Number(districtName.B02001e1).toLocaleString() + "</td>");
  $('#white').replaceWith("<td id='white'>" + Math.round(perWhite) + "%</td>");
  $('#black').replaceWith("<td id='black'>" + Math.round(perBlack) + "%</td>");
  $('#natAmerican').replaceWith("<td id='natAmerican'>" + Math.round(perNtvAmer) + "%</td>");
  $('#asian').replaceWith("<td id='asian'>" + Math.round(perAsian) + "%</td>");
  $('#hawaiian').replaceWith("<td id='pop'>" + Math.round(perHawaii) + "%</td>");
  $('#other').replaceWith("<td id='pop'>" + Math.round(perOther) + "%</td>");
  $('#latino').replaceWith("<td id='pop'>" + Math.round(perLatino) + "%</td>");
  $('#nonLatino').replaceWith("<td id='pop'>" + Math.round(perNonLatino) + "%</td>");
}

// 2) Event listener and layer selection function  sections -------------------


function updateRightInfo(district2016) {
  var campaign = (elect2016[district2016]);
  $('#election2016 tr').remove();
  $('#election2016').append("<thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th>PCT.</th></tr></thead>");
  for (var candidate = 0; candidate < campaign.length; candidate++) {
    let name2016 = campaign[candidate].Name;
    let party2016 = campaign[candidate].Party;
    let votes2016 = Number(campaign[candidate]['Canvas Votes']).toLocaleString();
    let pct2016 = Math.round(campaign[candidate].Percent * 100);
    let tableResults = ('<tr><td>' + name2016 + '</td><td>' + party2016 +
      '</td><td>' + votes2016 + '</td><td>' + pct2016 + '%</td></tr>');
    $('#election2016').append(tableResults);
  }
}


var txdist = L.geoJson(districts, {
  style: Gstyle,
  onEachFeature: districtInteract
}).addTo(mymap);
// Function listens for click event & executes the highlightFeature function
function districtInteract(feature, layer) {
  layer.on({
    click: highlightFeature
  });
}
// Checks if a district has already been selected and styled
// if not, it styles the provided layer and updates the info box with its
// associated demographic data The previous polygn is reset to the default style
function highlightFeature(e) {
  var layer = e.target;
  if (lastClickedLayer) {
    txdist.resetStyle(lastClickedLayer);
  }
  layer.setStyle({
    color: "#FF4F19",
    fillColor: "#FF4F19",
    fillOpacity: 0.4
  });
  active = layer.feature.properties.NAMELSAD;
  updateMidInfo(layer.feature.properties);
  updateRightInfo(layer.feature.properties.NAMELSAD);
  lastClickedLayer = layer;
}

// 3) Search bar and geocoder section -----------------------------------------

// create the geocoding control and add it to the map
var searchControl = L.esri.Geocoding.geosearch({
  zoomToResult: false,
  useMapBounds: false,
  collapseAfterResult: false,
  expanded: true,
  placeholder: 'Search your address to find your district'
}).addTo(mymap);
// Creates layergroup to store searc results as a marker
var citizen = L.layerGroup().addTo(mymap);
// Listens for search results from the controller and returns the lat longtitude
// to create the marker. It clears the layergroup on each search to make sure
// there is only one marker
searchControl.on("results", function(data) {
  // Uses result location to first clear the global layergroup citizen of any
  // previous markers the coords of the search result are used to place a marker.
  citizen.clearLayers();
  citizen.addLayer(L.marker(data.results[0].latlng));
  mymap.panTo(data.results[0].latlng);
  // Extracts the lat/lng of the results and converts them into a turf point
  // that checks to see which polygon in the original geoJSON (districts)
  // it is located and stores its name.
  var latitude = data.results[0].latlng.lat;
  var longtitude = data.results[0].latlng.lng;
  var pt1 = turf.point([longtitude, latitude]);
  for (i = 0; i < districts.features.length; i++) {
    if (turf.inside(pt1, districts.features[i])) {
      var districtName = districts.features[i].properties.NAMELSAD
    }
  };
  // Resets the style before highlighting the next searched district
  txdist.eachLayer(function(layer) {
    if (layer) {
      txdist.resetStyle(layer);
    }
    // searches through the leaflet geoJSON layers for the one that shares
    // the previously stored name and changes the style of the matching leaflet
    // geoJSON layer
    if (layer.feature.properties.NAMELSAD == districtName) {
      layer.setStyle({
        fillColor: 'blue',
        weight: 2,
        opacity: 0,
        color: 'white',
        fillOpacity: .2
      });
    }
  })
});