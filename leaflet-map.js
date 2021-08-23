import { BaseElement, html } from './base-element';
import {map as createMap , tileLayer, polygon, geoJSON, featureGroup, marker, control} from 'leaflet/dist/leaflet-src.esm.js';
import {leafletCss} from './leaflet-style.css.js';
import './leaflet-popup';

export class LeafletMap extends BaseElement {

  static get properties() {
    return {
      map: {
        observe: true

      },
      baseMap: {
        observe: true
      }
    };
  }

  get style() {
    return html`
      <style>
        ${leafletCss}
        #map-container {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
    `;
  }

  get template() {
    return html`
      ${this.style}
      <div id="map-container"></div>
      `;
  }


  addGeoJsonToMap(geoJsonData) {
    this.polygons = geoJSON(geoJsonData, {style: {
      fillColor: 'blue',
      weight: 0.5,
      opacity: 0.4,
      color: '#323232',
      fillOpacity: 0.4
    }});

    this.polygons.eachLayer((layer) => { layer.bindPopup( this._createPopupContent(layer.feature.properties) ); });
    this.map.fitBounds(this.polygons.getBounds());
    this.markerlaag = featureGroup().addTo(this.map);
    
    this.polygons.eachLayer((layer) => { marker([layer.feature.properties['lat'],layer.feature.properties['lon'] ]).bindPopup(this._createPopupContent(layer.feature.properties)).addTo(this.markerlaag) });
  }

  addLayer(layer) {
    layer.addTo(this.map);
    this.map.fitBounds(layer.getBounds());
    this.map.closePopup();
    return layer;
  }

  removeLayer(layer) {
    if(layer) this.map.removeLayer(layer);
  }

  _handlePopupClick(evt) {
    if(evt.target.nodeName && evt.target.nodeName.toLowerCase().includes('button')) {
      this.dispatchEvent(new CustomEvent('marker-button-click', {detail: {el: evt.target}}));
    }
  }
  _createPopupContent(p){
    const popupEl = document.createElement('leaflet-popup');
    popupEl.addEventListener('click', (evt) => {this._handlePopupClick(evt)});
    popupEl.innerHTML = this.popupContentCreator(p);
    return popupEl;

  }

  connectedCallback() {
    super.connectedCallback();
    const mapContainerEl = this.shadowRoot.getElementById('map-container');
    this.map = createMap(mapContainerEl).setView(this.mapSettings.center, this.mapSettings.zoom);


    var straatkaart = new tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 4, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
    var grijzekaart = new tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {minZoom: 4, maxZoom: 20,  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'});
    this.map.addLayer(straatkaart)
    this.map.addLayer(grijzekaart)
    var baseMaps = {"Straatkaart":straatkaart, "Grijze kaart":grijzekaart};

    this.legenda = control.layers(baseMaps,[],{position:"bottomright"}).addTo(this.map);
    this.dispatchEvent(new CustomEvent('map-loaded'));
  }

}

window.customElements.define('leaflet-map', LeafletMap);