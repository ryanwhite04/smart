import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-user.js";

class SmartRoom extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      text: { type: String },
      users: { type: Array },
      active: { type: Boolean, reflect: true },
      debug: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return css`
        :host {
          display: block;
          margin: 1em 0;
        }
        .room-details {
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f1f8e9;
          margin: 0.5em 0;
        }
        summary {
          font-weight: bold;
          cursor: pointer;
        }
        .users {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        button {
          padding: 8px 16px;
          margin: 8px 0;
          border: none;
          border-radius: 4px;
          background-color: #4caf50;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover {
          background-color: #45a049;
        }
      `;
  }

  constructor() {
    super();
    this.uuid = this.uuid || crypto.randomUUID();
    this.text = '';
    this.users = [];
    this.active = false;
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

  addUser() {
    this.users.push(crypto.randomUUID());
    this.save();
  }

  removeUser(userUUID) {
    this.users = this.users.filter(uuid => uuid !== userUUID);
    this.save();
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }
  
  render() {
    return html`
        <details class="room-details">
          <summary>
            <input type="text" placeholder="Class Name" @input="${(e) => {
              this.text = e.target.value;
              this.save();
            }}" .value="${this.text}">
          </summary>
          <button @click="${this.addUser}">Add User</button>
          <div class="users">
            ${this.users.map(uuid => html`
              <smart-user
                uuid="${uuid}"
                ?debug=${this.debug}
                @remove-user="${() => this.removeUser(uuid)}"
              ></smart-user>
            `)}
          </div>
        </details>
      `;
  }

}

customElements.define('smart-room', SmartRoom);
