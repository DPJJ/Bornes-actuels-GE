// Données des départements du Grand Est
const departments = {
  "08": "Ardennes",
  "10": "Aube",
  "51": "Marne",
  "52": "Haute-Marne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "57": "Moselle",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "88": "Vosges"
};

// Données des sites
const sites = [
  {
    name: "STEMO EPINAL",
    lat: 48.1828,
    lon: 6.4447,
    description: "Service Territorial Éducatif de Milieu Ouvert à Épinal",
    address: "3 allées des Noisetiers",
    bornes: "2 bornes simples EVBox (PDL: 5006 940 147 1011)",
    dept: "88"
  },
  // ... (ajoutez tous les autres sites comme dans votre code original)
];

// Variables globales
let map;
let selectedSites = [];
let distanceLine;
let measureActive = true;
let siteIcon;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
  initMap();
  initSidebar();
  initMeasureTool();
  loadGeoJSON();
  initLegend();
  updateStatistics();
});

// Initialisation de la carte
function initMap() {
  map = L.map('map').setView([48.8566, 4.3522], 7);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  siteIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  addSiteMarkers();
}

// Ajout des marqueurs pour les sites
function addSiteMarkers() {
  sites.forEach(site => {
    const marker = L.marker([site.lat, site.lon], { icon: siteIcon })
      .bindPopup(`
        <div class="popup-title">${site.name}</div>
        <div class="popup-content">${site.description}</div>
        <div class="popup-content"><strong>Adresse : </strong>${site.address}</div>
        <div class="popup-content bornes-info"><strong>Bornes : </strong>${site.bornes}</div>
        <div class="popup-content"><strong>Département : </strong>${departments[site.dept]} (${site.dept})</div>
      `)
      .addTo(map);
    
    marker.on('click', () => handleMarkerClick(site, marker));
  });
}

// Gestion du clic sur un marqueur
function handleMarkerClick(site, marker) {
  if (!measureActive) return;

  if (selectedSites.length < 2) {
    selectedSites.push(site);
    marker.setIcon(L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconSize: [30, 45],
      iconAnchor: [15, 45],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      shadowSize: [41, 41]
    }));

    if (selectedSites.length === 2) {
      updateDistanceInfo();
    }
  }
}

// Initialisation du panneau latéral
function initSidebar() {
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('visible');
  });

  document.getElementById('sidebar-close').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('visible');
  });

  document.querySelectorAll('.accordion-title').forEach(title => {
    title.addEventListener('click', function() {
      const content = this.nextElementSibling;
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    });
  });
}

// Outil de mesure
function initMeasureTool() {
  const measureControl = L.control({ position: 'topright' });
  
  measureControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control measure-control');
    div.innerHTML = '<button id="toggle-measure" class="control-button">Réinitialiser la mesure</button>';
    return div;
  };
  
  measureControl.addTo(map);

  document.getElementById('toggle-measure').addEventListener('click', toggleMeasure);
}

function toggleMeasure() {
  if (selectedSites.length > 0) {
    resetMeasure();
    document.getElementById('toggle-measure').textContent = "Activer la mesure";
    measureActive = false;
  } else {
    measureActive = !measureActive;
    document.getElementById('toggle-measure').textContent = measureActive ? "Réinitialiser la mesure" : "Activer la mesure";
    document.getElementById('distance-info').style.display = measureActive ? 'block' : 'none';
  }
}

function resetMeasure() {
  selectedSites.forEach(site => {
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const markerLatLng = layer.getLatLng();
        if (markerLatLng.lat === site.lat && markerLatLng.lng === site.lon) {
          layer.setIcon(siteIcon);
        }
      }
    });
  });
  
  selectedSites = [];
  
  if (distanceLine) {
    map.removeLayer(distanceLine);
  }
  
  document.getElementById('distance-value').textContent = "Cliquez sur deux bornes pour mesurer";
  document.getElementById('selected-sites').innerHTML = "";
}

function updateDistanceInfo() {
  const point1 = L.latLng(selectedSites[0].lat, selectedSites[0].lon);
  const point2 = L.latLng(selectedSites[1].lat, selectedSites[1].lon);

  if (distanceLine) {
    map.removeLayer(distanceLine);
  }
  
  distanceLine = L.polyline([point1, point2], {
    color: 'red',
    weight: 3,
    opacity: 0.7,
    dashArray: '5,10'
  }).addTo(map);

  const distance = (map.distance(point1, point2) / 1000).toFixed(2);
  
  document.getElementById('distance-value').textContent = `Distance: ${distance} km`;
  document.getElementById('selected-sites').innerHTML = `
    <div class="popup-content"><strong>De : </strong>${selectedSites[0].name}</div>
    <div class="popup-content"><strong>À : </strong>${selectedSites[1].name}</div>`;
}

// Chargement du GeoJSON
function loadGeoJSON() {
  fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions/grand-est/region-grand-est.geojson')
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: '#FF4500',
          weight: 3,
          opacity: 0.8,
          fillColor: '#FF4500',
          fillOpacity: 0.05,
          dashArray: '10, 10'
        }
      }).addTo(map);
    })
    .catch(error => console.error('Erreur GeoJSON:', error));
}

// Légende
function initLegend() {
  const legend = L.control({ position: 'bottomright' });
  
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <div class="control-title">Légende</div>
      <div class="legend-item"><i style="background: url(https://cdnjs.cloudflare
