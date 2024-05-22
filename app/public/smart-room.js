import { css, html } from "https://esm.sh/lit@3.1.2";
import "./smart-user.js";
import SmartBase from "./smart-base.js";

export class SmartRooms extends SmartBase {
    
    constructor() {
      super();
    }
  
    select(event) {
      this.item = event.detail;
      this.save();
    }
  
    renderItem(uuid) {
      return html`
        <smart-room
          uuid="${uuid}"
          ?debug=${this.debug}
          ?active=${this.item === uuid}
          @active=${this.select.bind(this)}
          type="user"
        ></smart-room>
      `;
    }
  
}

export class SmartRoom extends SmartBase {
  
  select(event) {
    this.item = event.detail;
    this.save();
  }
  
  renderItem(uuid) {
    return html`
      <smart-user
        uuid="${uuid}"
        ?debug=${this.debug}
        ?active=${this.item === uuid}
        @active=${this.select.bind(this)}
      ></smart-user>
    `;
  }

}

customElements.define('smart-room', SmartRoom);
customElements.define('smart-rooms', SmartRooms);