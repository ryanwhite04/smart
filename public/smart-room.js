import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartRoom extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      name: { type: String },
      users: { type: Array },
      active: { type: Boolean },
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
    this.name = '';
    this.users = [];
    this.active = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.loadRoomData();
      this.addToLocalStorage();
    }
  }

  addToLocalStorage() {
    const rooms = JSON.parse(localStorage.getItem('rooms')) || [];
    if (!rooms.includes(this.uuid)) {
      rooms.push(this.uuid);
      localStorage.setItem('rooms', JSON.stringify(rooms));
    }
    this.saveRoomData();
  }

  loadRoomData() {
    const roomData = JSON.parse(localStorage.getItem(this.uuid));
    if (roomData) {
      this.name = roomData.name;
      this.users = roomData.users;
      this.active = roomData.active;
    }
  }

  saveRoomData() {
    const roomData = {
      uuid: this.uuid,
      name: this.name,
      users: this.users,
      active: this.active
    };
    localStorage.setItem(this.uuid, JSON.stringify(roomData));
  }

  addUser() {
    const user = document.createElement('smart-user');
    this.appendChild(user);
    this.users.push(user.uuid);
    this.saveRoomData();
    this.requestUpdate();
  }

  removeUser(userUUID) {
    this.users = this.users.filter(uuid => uuid !== userUUID);
    this.saveRoomData();
    this.requestUpdate();
  }
  

  render() {
    return html`
        <details class="room-details">
          <summary>${this.name}</summary>
          <button @click="${this.addUser}">Add User</button>
          <div class="users">
            ${this.users.map(userUUID => html`
              <smart-user
                uuid="${userUUID}"
                @remove-user="${() => this.removeUser(userUUID)}"
              ></smart-user>
            `)}
          </div>
        </details>
      `;
  }

  firstUpdated() {
    if (this.uuid) {
      this.loadRoomData();
    }
  }
}

customElements.define('smart-room', SmartRoom);
