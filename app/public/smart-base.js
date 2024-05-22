import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

export default class SmartBase extends LitElement {
  static get properties() {
    return {
      uuid: { type: String, reflect: true },
      text: { type: String, reflect: true },
      hint: { type: String, reflect: true },
      type: { type: String, reflect: true },
      item: { type: String, reflect: true }, // uuid of active item
      items: { type: Array }, // uuids of all items
      active: { type: Boolean, reflect: true }, // whether the item is open/active
      debug: { type: Boolean, reflect: true },
      fixed: { type: Boolean, reflect: true }, // whether or not the item can be removed
    };
  }

  constructor() {
    super();
    this.uuid = this.uuid || crypto.randomUUID();
    this.text = '';
    this.hint = '';
    this.type = '';
    this.items = [];
    this.active = false;
    this.debug = false;
    this.fixed = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.load();
      this.save();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    localStorage.removeItem(this.uuid);
    this.dispatchEvent(new CustomEvent('remove', { detail: this.uuid }));
  }

  load() {
    const data = JSON.parse(localStorage.getItem(this.uuid));
    if (data) {
      for (const key in data) {
        this[key] = data[key];
      }
    }
    this.requestUpdate();
  }

  save() {
    const data = {};
    for (const key in this.constructor.properties) {
      data[key] = this[key];
    }
    localStorage.setItem(this.uuid, JSON.stringify(data));
    this.requestUpdate();
  }

  add() {
    this.items.push(crypto.randomUUID());
    this.save();
  }

  removeItem(item) {
    this.items = this.items.filter(uuid => uuid !== item);
    this.save();
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin: 1em 0;
      }
      details[open] summary {
        padding-bottom: 16px;
      }
      details {
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
        // background: #FFAAAA;
      }
      :host([active]) details {
        // background: #AAFFAA;
      }
      summary {
        font-weight: bold;
        cursor: pointer;
      }
    `;
  }

  textUpdate(event) {
    this.text = event.target.value;
    this.save();
  }

  addPreventSpaceToggle(event) {
    event.target.closest('summary').addEventListener('keydown', this.preventSpaceToggle);
  }

  removePreventSpaceToggle(event) {
    event.target.closest('summary').removeEventListener('keydown', this.preventSpaceToggle);
  }

  preventSpaceToggle(event) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  fire(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  toggle(event) {
    this.active = event.target.open;
    this.save();
    this.active && this.dispatchEvent(new CustomEvent('active', { detail: this.uuid }));
  }

  render() {
    return html`
      <details ?open=${this.active} @toggle=${this.toggle.bind(this)}>
        <summary @keyup=${this.preventSpaceToggle}>
          ${this.fixed ? this.text : html`<input
            type="text"
            .value=${this.text}
            placeholder=${this.hint}
            @input=${this.textUpdate.bind(this)}
          >`}
        </summary>
        ${this.fixed ? '' : html`<button @click=${this.remove}>Remove</button>`}
        ${this.renderContent()}
        ${this.type ? html`
          <button @click=${this.add}>Add ${this.type}</button>
          <div id="items">
            ${this.items.map(this.renderItem.bind(this))}
          </div>` : ''
        }
        <slot></slot>
      </details>
    `;
  }

  renderItem(uuid) {
    return html`<p>${uuid}</p>`; // Placeholder for child classes to override
  }

  renderContent() {
    return html``; // Placeholder for child classes to override
  }

}

customElements.define('smart-base', SmartBase);