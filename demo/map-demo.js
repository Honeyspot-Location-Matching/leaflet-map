import { BaseElement, html } from '../base-element';
import {geo_installateurs} from './installateurs.js';
import '../leaflet-map';
import {geoJSON} from 'leaflet/dist/leaflet-src.esm.js';

export class MapDemo extends BaseElement {

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
      <p>${p.company_name}</p>
      <p>${p.street}</p>
      <p>${p.zip} ${p.city}</p>
      <p>${p.region}</p>
      <p>Tel: ${p.Phone}</p>
      <p>URL ${p.web}</p>
      <p>FTE: ${p.employees}</p>
      <p>Trefwoorden: ${(p.unique_words || 0)}/14</p>
      <p>${p.company_name}</p>
      ${lijst.map((w) => {
        if (p[w]===''){
          return `<p style="color:red">${w}</p>`;
        } else {
          return `<p style="color:green">${w}</p>`;
        }
      }).join(' ')}
      <button data-duns="${p.duns}">Verzorginsgebied</button>
    `;
  }

  _handleMapLoaded() {
    if(this.mapEl) this.addInitialData();
  }

  addInitialData() {
    this.mapEl.addGeoJsonToMap(geo_installateurs);
  }
  _handleMarkerButtonClick(evt) { 
    const buttonEl = evt.detail.el;

    if(this.locationPolygon) this.mapEl.removeLayer(this.locationPolygon);
    if(this.activeProvinceLayer) this.mapEl.removeLayer(this.activeProvinceLayer);

    this.locationPolygon = this.mapEl.addLayer(geoJSON(geo_installateurs,{style: {
      fillColor: 'blue',
      weight: 0.5,
      opacity: 0.4,
      color: '#323232',
      fillOpacity: 0.4
    }, filter: (layer) => {
      return layer.properties.duns === parseInt(buttonEl.dataset['duns'])
    }}));
  }
  _provinceSelect(evt) {
    if(this.activeProvinceLayer) this.mapEl.removeLayer(this.activeProvinceLayer);
    if(this.locationPolygon) this.mapEl.removeLayer(this.locationPolygon);

    this.activeProvinceLayer = this.mapEl.addLayer(
      geoJSON(geo_installateurs,{style: {
        fillColor: 'blue',
        weight: 0.5,
        opacity: 0.4,
        color: '#323232',
        fillOpacity: 0.4
      }, filter: (layer) => {
        if(evt.target.value === '') return true;
        return layer.properties.region === evt.target.value
      }})
    )

  }

  

}

window.customElements.define('map-demo', MapDemo);