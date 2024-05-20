import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-device.js";

class SmartUser extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      text: { type: String },
      // teacher: { type: Boolean },
      device: { type: String }, // uuid of the last connected device
      bound: { type: Boolean }, // whether the user is bound to a device
      debug: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return css`
        :host {
          display: block;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 1em 0;
        }
        details[open] summary {
          padding-bottom: 16px;
        }
        .details {
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #FFAAAA;
        }
        details.connected {
          background: lightgreen;
        }
      `;
  }

  constructor() {
    super();
    this.uuid = '';
    this.text = '';
    // this.teacher = false;
    this.device = '';
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.load();
      this.save();
    }
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

  disconnectedCallback() {
    super.disconnectedCallback();
    localStorage.removeItem(this.uuid);
  }

  onDeviceConnect(event) {
    this.device = event.target.uuid;
    this.save();
  }

  remove() {
    this.dispatchEvent(new CustomEvent("remove", { detail: this.uuid }));
    super.remove();
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }

  get connected() {
    const device = this.renderRoot.getElementById("device");
    if (device) {
      return device.connected;
    }
    return false;
  }

  handleMessage(event) {
    const message = event.detail;
    if (message.startsWith("id")) {
      this.device = message.split(":")[1];
      this.save();
    } else {
      // let the event bubble up
      this.dispatchEvent(new CustomEvent("message", { detail: message }));
    }
  }

  render() {
    return html`
        <details>
          <summary>
            <input type="text" placeholder="Name" @input="${(e) => {
              this.text = e.target.value;
              this.save();
            }}" .value="${this.text}">
            <label>
              <input type="checkbox" @change="${(e) => {
                this.teacher = e.target.checked;
                this.saveData();
              }}" ?checked="${this.teacher}"> Teacher
            </label>
          </summary>
          <p>${this.device}</p>
          <button @click="${this.remove}">Remove</button>
          <smart-device id="device" ?debug=${this.debug} uuid=${this.device} @message=${this.handleMessage.bind(this)} @connect=${this.onDeviceConnect.bind(this)}></smart-device>
        </details>
      `;
  }

}

customElements.define("smart-user", SmartUser);
