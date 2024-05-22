import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-device.js";
import SmartBase from "./smart-base.js";

class SmartUser extends SmartBase {
  static get properties() {
    return {
      ...super.properties,
      teacher: { type: Boolean },
      device: { type: String }, // uuid of the last connected device
      bound: { type: Boolean }, // whether the user is bound to a device
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        details.connected {
          background: lightgreen;
        }
      `
    ];
  }

  constructor() {
    super();
    this.teacher = false;
    this.device = '';
    this.bound = false;
  }

  onDeviceConnect(event) {
    this.device = event.target.uuid;
    this.save();
  }

  remove() {
    this.dispatchEvent(new CustomEvent("remove", { detail: this.uuid }));
    super.remove();
  }

  write(message) {
    if (this.device) {
      this.shadowRoot.getElementById("device").write(message);
    }
  }

  handleMessage(event) {
    const message = event.detail;
    if (message.startsWith("id")) {
      this.device = message.split(":")[1];
      this.save();
      this.write(`n:${this.device}:${this.text}`)
    } else {
      // let the event bubble up
      this.dispatchEvent(new CustomEvent("message", {
        detail: message,
        bubbles: true,
        composed: true,
      }));
    }
  }

  renderContent() {
    return html`
      <label for="teacher">Teacher</label>
      <input id="teacher" type="checkbox" value="${this.teacher}" @input=${e => this.teacher = e.target.checked} />
      <p>${this.device}</p>
      <smart-device
        id="device"
        ?debug=${this.debug}
        uuid=${this.device}
        @message=${this.handleMessage.bind(this)}
        @connect=${this.onDeviceConnect.bind(this)}>
      </smart-device>
    `;
  }

}

customElements.define("smart-user", SmartUser);
