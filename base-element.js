import { Properties } from 'html-element-property-mixins';
import { PropertiesChangedCallback, PropertyChangedHandler, PropertiesChangedHandler } from 'html-element-property-mixins/src/addons';
import { html, render as litRender } from 'lit-html';

class  BaseElement extends PropertiesChangedCallback(PropertyChangedHandler(PropertiesChangedHandler(Properties(HTMLElement)))) {
  static get properties() {
    return {};
  }

  constructor() {
    super();
    this.constructor.__setDefaultPropertyValues.call(this);
    this.attachShadow({mode: 'open'});
  }
  
  get template () {
    return html``;
  }

  connectedCallback() {
    this.render();
  }
  
  propertiesChangedCallback(propNames, oldValues, newValues) {
    super.propertiesChangedCallback(propNames, oldValues, newValues);
    this.render();
  }

  render() {
    litRender(this.template, this.shadowRoot, {eventContext: this, scopeName: this.localName});
  }

  static __setDefaultPropertyValues() {
    for(var propName in this.constructor.properties) {
      const defaultValue = this.constructor.properties[propName].defaultValue;
      if(defaultValue !== undefined) this[propName] = defaultValue;
    }
  }

}

export {  BaseElement, html };