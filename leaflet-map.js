import { BaseElement, html } from './base-element';
import { map as createMap, tileLayer, polygon, geoJSON, featureGroup, marker, control, Icon, circleMarker } from 'leaflet/dist/leaflet-src.esm.js';
import { leafletCss } from './leaflet-style.css.js';
import './leaflet-popup';

export class LeafletMap extends BaseElement {

  static get properties() {
    return {
      map: {
        observe: true

      },
      baseMap: {
        observe: true
      },
      layers: {
        observe: true,
        defaultValue: {}
      },
      markers: {
        observe: true,
        defaultValue: {}
      },
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


  addGeoJsonToMap(data, options, addToMap = true) {
    let geoJsonData = [];
    if (options.type === 'locations') {
      geoJsonData = geoJSON(data, {
        style: {
          fillColor: options.fillColor || '#3DAE2B',
          weight: 1,
          opacity: 1,
          color: options.color || '#3DAE2B',
          fillOpacity: 0.5
        },
        pointToLayer: function (point, latlng) {
          return marker(latlng, {
            icon: new Icon({
              iconUrl: options.iconUrl || '/images/flag.svg',
              iconSize: options.iconSize || [20, 21],
              iconAnchor: options.iconAnchor || [5, 21]
            })
          })
        }
      }).addTo(this.map)
    } else {
      geoJsonData = geoJSON(data, {
        style: {
          fillColor: options.fillColor || '#3DAE2B',
          weight: 1,
          opacity: 1,
          color: options.color || '#3DAE2B',
          fillOpacity: 0.5
        }
      })
    }

    this.layers[options.layerId] = { items: [] };
    this.markers[options.layerId] = { items: [] };

    geoJsonData.eachLayer(
      (layer) => {

        if (layer.feature.properties.color) {
          layer.setStyle({ fillColor: layer.feature.properties.color, color: '#bababa' });
          layer.feature.properties['_bufferColor'] = layer.feature.properties.color;
        }
        if (options.type === 'locations') {
          layer.on('click', (evt) => this._handleMarkerClick(evt, layer, !addToMap, options, layer));

        } else {
          layer.on('click', (evt) => this._handlePolygonClick(evt, !addToMap));
        }
        let mapLayer = {};
        if (addToMap && !options.defaultHidden) mapLayer = layer.addTo(this.map);
        if (layer.feature.properties.unselectable) {
          mapLayer.interactive = false;
          mapLayer.bringToBack();
        }
        this.layers[options.layerId].addToMap = addToMap;
        this.layers[options.layerId].items.push(layer)
        if (options.type !== 'locations' && (layer.feature.properties['latitude'] && layer.feature.properties['longitude'])) {

          // Note: This is latLng, geoJson is lonLat. Rather confusing.
          const layerMarker = marker(
            [parseFloat(layer.feature.properties['latitude']), parseFloat(layer.feature.properties['longitude'])],
            {
              title: layer.feature.properties['title'], icon: new Icon({
                iconUrl: options.iconUrl || '/images/flag.svg',
                iconSize: options.iconSize || [20, 21],
                iconAnchor: options.iconAnchor || [5, 21]
              })
            }
          );

          layerMarker.on('click', (evt) => this._handleMarkerClick(evt, layerMarker, !addToMap, options, layer));
          layerMarker.properties = layer.feature.properties;

          if (!options.defaultHidden) {
            layerMarker.addTo(this.map);
          }
          this.markers[options.layerId].items.push(layerMarker);

        }

        layer.properties = layer.feature.properties;
      });

    return geoJsonData;
  }


  fitMapBoundsToLayer(layerName, maxZoom = 14) {
    this.map.fitBounds(this.layers[layerName].items.map(item => item._latlng || item._latlngs), { maxZoom: maxZoom })
  }

  hideLayerById(id) {
    if (this.clickmark) this.map.removeLayer(this.clickmark);
    this.layers[id].items.forEach(layer => {
      this.map.removeLayer(layer);
    })
    if (this.markers[id] && this.markers[id].items) {
      this.markers[id].items.forEach(layer => {
        this.map.removeLayer(layer);
      })
    }

  }

  addLayerById(id) {
    if (this.markers[id] && this.markers[id].items) {
      this.markers[id].items.forEach(layer => {
        this.map.addLayer(layer);
      })
      if (this.layers[id].addToMap) {
        this.layers[id].items.forEach(layer => {
          this.map.addLayer(layer);
        })
      }
    } else {
      this.layers[id].items.forEach(layer => {
        this.map.addLayer(layer);
      })
    }
  }

  _handlePolygonClick(evt) {
    const properties = { ...evt.target.properties, ...evt.target.feature.properties };
    if (properties.unselectable) return;
    this.dispatchEvent(new CustomEvent('marker-clicked', { detail: { properties: properties } }));
    this._deselectPolygon();
    this.selectedPolygon = evt.target;
    if (this.selectedPolygon.setStyle) this.selectedPolygon.setStyle({ fillColor: '#0000FF' });
  }

  _handleMarkerClick(evt, marker, removeFromMap = false, options, layer) {
    this.dispatchEvent(new CustomEvent('marker-clicked', { detail: { properties: evt.target.properties } }));
    this._deselectPolygon(removeFromMap);
    if (this.clickmark) this.map.removeLayer(this.clickmark);


    if (!layer) {
      if (!marker || !marker._latlng) return;
      let markerCoordinates = [
        marker._latlng.lng,
        marker._latlng.lat
      ]
      this.clickmark = circleMarker([parseFloat(markerCoordinates[1]), parseFloat(markerCoordinates[0])], {
        radius: 10,
        color: "rgba(255, 219, 162, 1)",
        fillColor: "rgba(255, 219, 162, 1)",
        fillOpacity: 1
      }
      ).addTo(this.map);
    } else {
      this.selectedPolygon = layer;
      this.selectedPolygon.addToMap = removeFromMap;
      if (this.selectedPolygon.setStyle) this.selectedPolygon.setStyle({ fillColor: '#0000FF' });
      this.selectedPolygon.addTo(this.map);
    }
  }

  setPolygonColorByKeyPerc(key, colorArr) {
    Object.values(this.layers).forEach(layer => {
      layer.items.forEach(item => {
        let index = 0;
        const properties = { ...item.properties, ...item.feature.properties };
        const value = properties[key];
        if(value > 5 &&  value <= 10) {index = 1} 
        if(value > 10 && value <= 20) {index = 2} 
        if(value > 20 && value <= 35) {index = 3} 
        if(value > 25 && value <= 50) {index = 4} 
        if(value > 50) {index = 5} 
        item.setStyle({fillColor: colorArr[index]})
      })
    })
  }

  resetPolygonColors() {
    Object.values(this.layers).forEach(layer => {
      layer.items.forEach(item => {
        item.setStyle({ fillColor: item.properties.color ? item.properties.color : item.defaultOptions.style.fillColor });
      })
    })

  }

  _deselectPolygon(removeFromMap = false) {
    if (this.clickmark) this.map.removeLayer(this.clickmark);
    if (!this.selectedPolygon || (this.selectedPolygon.properties && this.selectedPolygon.properties.layerType === 'locations')) return this.selectedPolygon = null;
    if (removeFromMap || this.selectedPolygon.addToMap) {
      this.map.removeLayer(this.selectedPolygon);
    } else {
      this.selectedPolygon.setStyle({ fillColor: this.selectedPolygon.properties.color ? this.selectedPolygon.properties.color : this.selectedPolygon.defaultOptions.style.fillColor });
    }
    this.selectedPolygon = null;
  }

  addLayer(layer) {
    layer.addTo(this.map);
    this.map.fitBounds(layer.getBounds());
    this.map.closePopup();
    return layer;
  }

  removeLayer(layer) {
    if (layer) this.map.removeLayer(layer);
  }

  removeAllLayers() {
    this.map.eachLayer((layer) => {
      if (!!layer.toGeoJSON) {

        this.map.removeLayer(layer);
      }
    });

  }

  switchToBasemap(url, options = {}) {
    if (this.basemap) this.map.removeLayer(this.basemap)
    this.basemap = new tileLayer(url, options);
    this.map.addLayer(this.basemap)
  }

  connectedCallback() {
    super.connectedCallback();
    const mapContainerEl = this.shadowRoot.getElementById('map-container');
    this.map = createMap(mapContainerEl)

    this.map.on('layeradd', (evt) => {
      this.map._onResize();
    })
    this.map.setView(this.mapSettings.center, this.mapSettings.zoom);


    this.switchToBasemap(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      { minZoom: 4, maxZoom: 20, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>' }
    )

    this.dispatchEvent(new CustomEvent('map-loaded'));
  }

}

window.customElements.define('leaflet-map', LeafletMap);
