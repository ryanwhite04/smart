import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-device.js";
import SmartBase from "./smart-base.js";

class SmartUser extends SmartBase {
  static get properties() {
    return {
      ...super.properties,
      teacher: { type: Boolean, reflect: true},
      device: { type: String }, // uuid of the last connected device
      bound: { type: Boolean }, // whether the user is bound to a device
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host([teacher]) {
          background: lightblue;
        }
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

  async write(message) {
    if (this.device) {
      await this.shadowRoot.getElementById("device").write(message);
    }
  }

  async read() {
    if (this.device) {
      return await this.shadowRoot.getElementById("device").read();
    }
  }

  get network() {
    // check local storage for "prefix" and "password"
    // if they don't exist, generate to uuids and save them
    // return the prefix and password in the form
    // { prefix, password }
    let prefix = localStorage.getItem("prefix");
    let password = localStorage.getItem("password");
    if (!prefix || !password) {
      prefix = crypto.randomUUID();
      password = crypto.randomUUID();
      localStorage.setItem("prefix", prefix);
      localStorage.setItem("password", password);
    }
    return { prefix, password };
  }

  async updateDevice() {
    const { prefix, password } = this.network;
    await this.write(`m:${prefix.split("-")[0]}:${password.split("-")[0]}`);
    // await this.read();
    await this.write(`n:${this.device}:${this.text}`);
    // await this.read();
  }

  handleMessage(event) {
    const message = event.detail;
    if (message.startsWith("id")) {
      this.device = message.split(":")[1];
      this.save();
      this.updateDevice();
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
      <input id="teacher" type="checkbox" value="${this.teacher}" @input=${e => {
        this.teacher = e.target.checked;
        this.save();
      }} />
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
