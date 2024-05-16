import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartUser extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      teacher: { type: Boolean },
      uuid: { type: String },
      connected: { type: Boolean },
      deviceId: { type: String },
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
      `;
  }

  constructor() {
    super();
    this.name = "";
    this.teacher = false;
    this.uuid = crypto.randomUUID();
    this.connected = false;
    this.deviceId = null;
    this.port = null;
    this.reader = null;
    this.writer = null;
  }

  async connectToDevice() {
    if (this.connected) {
      await this.disconnectFromDevice();
      return;
    }
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      this.connected = true;
      this.getDeviceId();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }

  async disconnectFromDevice() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader.releaseLock();
      this.reader = null;
    }
    if (this.writer) {
      await this.writer.close();
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.connected = false;
    this.deviceId = null;
  }

  async getDeviceId() {
    try {
      const command = new TextEncoder().encode("GET_ID\n");
      await this.writer.write(command);
      const { value } = await this.reader.read();
      this.deviceId = new TextDecoder().decode(value).trim();
    } catch (error) {
      console.error("Failed to get device ID:", error);
    }
  }

  render() {
    return html`
        <div>
          <input type="text" placeholder="Name" @input="${(e) =>
      this.name = e.target.value}" .value="${this.name}">
          <label>
            <input type="checkbox" @change="${(e) =>
      this.teacher = e.target.checked}" ?checked="${this.teacher}"> Teacher
          </label>
          <button @click="${this.connectToDevice}">${
      this.connected ? "Disconnect" : "Connect"
    }</button>
          <button @click="${this.remove}">Remove</button>
          <p>Device ID: ${this.deviceId || "Not Connected"}</p>
        </div>
      `;
  }

  remove() {
    this.dispatchEvent(new CustomEvent("remove-user", { detail: this }));
    this.remove();
  }
}
customElements.define("smart-user", SmartUser);
