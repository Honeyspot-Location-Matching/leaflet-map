import { BaseElement, html } from './base-element';

export class LeafletPopup extends BaseElement {

  static get properties() {
    return {
    };
  }

  get style() {
    return html`
      <style>
        *, ::slotted(*) {
          color: black;
        }
        ::slotted(p) {
          margin: 6px!important;
          padding: 0!important;
        }
      </style>
    `;
  }

  get template() {
    return html`
      ${this.style}
      <slot></slot>
      `;
  }



 
}

window.customElements.define('leaflet-popup', LeafletPopup);