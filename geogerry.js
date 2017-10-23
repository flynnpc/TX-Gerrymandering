//Initialize the map
var mymap = L.map('map').setView([31.15, -99.90], 6);

// Load the Pioneer Tiles
L.tileLayer('https://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey=1d8e4763ba4d434ca9c3ba43b3849775', {
  attribution: 'Pioneer Basemap by Thunderforest, a project by Gravitystorm Limited.'
}).addTo(mymap);
// control that shows state info on hover
var info = L.control();
// Create the info box that displays feature properties
info.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};
// Functtion that converts population numbers to notation with commas
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// method to update the window based on feature properties
info.update = function(props) {
  this._div.innerHTML = (props ?
    '<b>' + props.NAMELSAD + '</b><br />' + '<br />' + 'Total Population: ' + numberWithCommas(props.B02001e1) + '<br /><b>' +
    '<br />' + 'Demographics' + '</b><br />' +
    'White: ' + Math.round(props.B02001e2 / props.B02001e1 * 100) + '%<br />' +
    'Black: ' + Math.round(props.B02001e3 / props.B02001e1 * 100) + '%<br />' +
    'Native American: ' + Math.round(props.B02001e4 / props.B02001e1 * 100) + '%<br />' +
    'Asian: ' + Math.round(props.B02001e5 / props.B02001e1 * 100) + '%<br />' +
    'Native Hawaiian:' + Math.round(props.B02001e6 / props.B02001e1 * 100) + '%<br />' +
    'Other Race: ' + Math.round(props.B02001e7 / props.B02001e1 * 100) + '%<br />' +
    'Two or More Races: ' + Math.round(props.B02001e8 / props.B02001e1 * 100) + '%<br /><br />' +
    'Latino: ' + Math.round(props.B03002e12 / props.B02001e1 * 100) + '%<br />' +
    'Non-Latino: ' + Math.round(props.B03002e2 / props.B02001e1 * 100) + '%' :
    'Click on a congressional district <br /> to learn about its population');
};
info.addTo(mymap);
// Style for the congressional district polygon
var Gstyle = {
  color: "#FF4F19",
  opacity: 0.65,
  weight: .75,
  fillColor: "#FF4F19",
  fillOpacity: 0.1
};
// Creates the geoJSON variable in the global scope
var txdist;
// Instantiates a leaflet geoJSOn layer using the provided gejson district.js referenced in html
var txdist = L.geoJson(districts, {
  style: Gstyle,
  onEachFeature: districtInteract
}).addTo(mymap);
// Creates a variable in the global scope that will be used to check
// whether a stye has been preset
var lastClickedLayer;
// Function first checks if a district has already been selected and styled
// if not, it styles the provided layer and updates the info box with its associated demographic data
// The previous polygn is reset to the default style
function highlightFeature(e) {
  if (lastClickedLayer) {
    txdist.resetStyle(lastClickedLayer);
  }
  var layer = e.target;
  layer.setStyle({
    color: "#FF4F19",
    fillColor: "#FF4F19",
    fillOpacity: 0.4
  });
  info.update(layer.feature.properties);
  lastClickedLayer = layer;
}
// Function listens for click event and then executes the highlightFeature function
function districtInteract(feature, layer) {
  layer.on({
    click: highlightFeature
  });
}
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
// to create the marker. It clears the layergroup on each search to make sure there is only one marker
searchControl.on("results", function(data) {
  // Uses result location to first clear the global layergroup citizen of any previous markers
  // the coords of the search result are used to place a marker.
  citizen.clearLayers();
  citizen.addLayer(L.marker(data.results[0].latlng));
  mymap.panTo(data.results[0].latlng);
  // Extracts the lat/lng of the results and converts them into a turf point that checks to see
  // which polygon in the original geoJSON (districts) it is located and stores its name.
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
    // searches through the leaflet geoJSON layers for the one that shares the previously stored name
    // and changes the style of the matching leaflet geoJSON layer
    if (layer.feature.properties.NAMELSAD == districtName) {
      layer.setStyle({
        fillColor: 'blue',
        weight: 2,
        opacity: 0,
        color: 'white',
        fillOpacity: .2
      });
      // Updates the info box of the searched address' congressional district
      info.update(layer.feature.properties);
    }
  })
});
