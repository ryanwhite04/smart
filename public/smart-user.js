import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartUser extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      name: { type: String },
      teacher: { type: Boolean },
      deviceId: { type: String },
      connected: { type: Boolean }
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
    this.uuid = '';
    this.name = '';
    this.teacher = false;
    this.deviceId = null;
    this.connected = false;
    this.port = null;
    this.reader = null;
    this.writer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.loadUserData();
      this.addToLocalStorage();
    }
  }

  addToLocalStorage() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.includes(this.uuid)) {
      users.push(this.uuid);
      localStorage.setItem('users', JSON.stringify(users));
    }
    this.saveData();
  }

  saveData() {
    const userData = {
      uuid: this.uuid,
      name: this.name,
      teacher: this.teacher,
      deviceId: this.deviceId
    };
    localStorage.setItem(this.uuid, JSON.stringify(userData));
  }

  loadUserData() {
    const userData = JSON.parse(localStorage.getItem(this.uuid));
    if (userData) {
      this.name = userData.name;
      this.teacher = userData.teacher;
      this.deviceId = userData.deviceId;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    localStorage.removeItem(this.uuid);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const updatedUsers = users.filter(uuid => uuid !== this.uuid);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }

  render() {
    return html`
        <div>
          <input type="text" placeholder="Name" @input="${(e) => {
            this.name = e.target.value;
            this.saveData();
          }}" .value="${this.name}">
          <label>
            <input type="checkbox" @change="${(e) => {
              this.teacher = e.target.checked;
              this.saveData();
            }}" ?checked="${this.teacher}"> Teacher
          </label>
          <button @click="${this.remove}">Remove</button>
          <p>Device ID: ${this.deviceId || "Not Connected"}</p>
        </div>
      `;
  }

  remove() {
    this.dispatchEvent(new CustomEvent("remove-user", { detail: this.uuid }));
    this.remove();
  }

  firstUpdated() {
    if (this.uuid) {
      this.loadUserData();
    }
  }
}

customElements.define("smart-user", SmartUser);
