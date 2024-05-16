import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartRoom extends LitElement {
    static get properties() {
      return {
        name: { type: String },
        users: { type: Array },
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
      this.name = '';
      this.users = [];
    }
  
    addUser() {
      const user = document.createElement('smart-user');
      user.addEventListener('remove-user', (e) => this.removeUser(e.detail));
      this.users = [...this.users, user];
      this.requestUpdate();
    }
  
    removeUser(user) {
      this.users = this.users.filter(user => user !== user);
      this.requestUpdate();
    }
  
    render() {
      return html`
        <details class="room-details">
          <summary>${this.name}</summary>
          <button @click="${this.addUser}">Add User</button>
          <div class="users">
            ${this.users.map(user => html`${user}`)}
          </div>
        </details>
      `;
    }
  }
  
  customElements.define('smart-room', SmartRoom);