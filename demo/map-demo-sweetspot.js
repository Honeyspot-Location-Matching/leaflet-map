import { BaseElement, html } from '../base-element';
import {geo} from './top25.js';
import '../leaflet-map';
import {geoJSON} from 'leaflet/dist/leaflet-src.esm.js';

export class MapDemoSweetspot extends BaseElement {

  static get properties() {
    return {
      map: {
        observe: true
      },
      baseMap: {
        observe: true
      },
      points: {
        observe: true
      },
      polygons: {
        observe: true,
        changedHandler: "_handlePolygonsChanged"
      }
    };
  }

  get style() {
    return html`
      <style>
        main {
          width: 900px;
          height: 900px;
          display: block;          
        } 
        leaflet-map {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.mapEl = this.shadowRoot.querySelector('leaflet-map');    
    this.addInitialData();
  }

  get template() {
    return html`
      ${this.style}
      <main>
        <leaflet-map 
          @marker-button-click="${this._handleMarkerButtonClick}" 
          @map-loaded="${this._handleMapLoaded}" 
          .popupContentCreator=${this.popupContentCreator}
          .mapSettings="${
            {
              center: [52.505, -0.09], 
              zoom: 13,
              basemaps: [
                {
                  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  minZoom: 4,
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                  name: "Straatkaart"
                },
                {
                  url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                  minZoom: 4,
                  maxZoom: 20,
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>',
                  name: "Grijze kaart"
                }
              ]
              
            }
            }"
        ></leaflet-map>

        <select @change="${this._provinceSelect}">
          <option value='Groningen'>Groningen</option>
          <option value='Friesland'>Friesland</option>
          <option value='Drenthe'>Drenthe</option>
          <option value='Overijssel'>Overijssel</option>
          <option value='Flevoland'>Flevoland</option>
          <option value='Gelderland'>Gelderland</option>
          <option value='Utrecht'>Utrecht</option>
          <option value='Noord-Holland'>Noord-Holland</option>
          <option value='Zuid-Holland'>Zuid-Holland</option>
          <option value='Zeeland'>Zeeland</option>
          <option value='Noord-Brabant'>Noord-Brabant</option>
          <option value='Limburg'>Limburg</option>
          <option value=''>Nederland</option>
        </select>
      </main>
      `;
  }

  popupContentCreator(p) {
    var lijst = ['Duurzaam', 'Warmtepompen', 'Koelen', 'Ventilatie', 'WTW (warmte-terug-win)', 'WTW', 'warmte-terug-win', 'Zonnepanelen', 'Zonne-energie', 'Zonneboilers', 'Consumenten', 'Energieadvies', 'Besparen', 'Vloerverwarming']

    return `
      <p>Positie: ${p.Positie}</p>
      <p>Wijkcode: ${p.wk_code}</p>
      <p>Wijknaam: ${p.wk_naam}</p>
      <p>Gemeentenaam: ${p.gm_naam}</p>
      <p>Aantal huishoudens: ${p.aantal_hh}</p>
      <p>Aantal binnen doelgroep ${p.aantal_doelgroep}</p>
      <p>Percentage: ${p.Percentage}%</p>
      
      <button data-id="${p.wk_code}">Verzorginsgebied</button>
    `;
  }

  _handleMapLoaded() {
    if(this.mapEl) this.addInitialData();
  }

  addInitialData() {
    this.mapEl.addGeoJsonToMap(geo);
  }
  _handleMarkerButtonClick(evt) { 
    const buttonEl = evt.detail.el;

    if(this.locationPolygon) this.mapEl.removeLayer(this.locationPolygon);

    

    this.locationPolygon = this.mapEl.addLayer(geoJSON(geo,{style: {
      fillColor: 'blue',
      weight: 0.5,
      opacity: 0.4,
      color: '#323232',
      fillOpacity: 0.4
    }, filter: (layer) => {
      console.log(layer.properties,buttonEl.dataset['id'] )
      return layer.properties.wk_code === buttonEl.dataset['id']
    }}));
  }
  

}

window.customElements.define('map-demo-sweetspot', MapDemoSweetspot);