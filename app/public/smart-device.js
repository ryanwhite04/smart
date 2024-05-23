import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartDevice extends LitElement {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
  
    static get properties() {
      return {
        uuid: { type: String },
        connected: { type: Boolean, reflect: true },
        messages: { type: Array },
        debug: { type: Boolean, reflect: true },
        loading: { type: Boolean, reflect: true },
      };
    }
  
    static get styles() {
      return css`
        .material-symbols-outlined {
          font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24
        }
        button {
          padding: 8px 16px;
          font-size: 16px;
          cursor: pointer;
        }
      `;
    }
  
    constructor() {
      super();
      this.uuid = this.uuid || 0;
      this.connected = false;
      this.messages = [];
      this.port = null;
      this.reader = null;
      this.writer = null;
    }
  
    async connect() {
      if (this.connected) {
        await this.disconnect();
        return;
      }
      try {
        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: 115200 });
        this.reader = this.port.readable.getReader();
        this.writer = this.port.writable.getWriter();
        this.connected = true;
        await this.write("id");
        await this.read();
      } catch (error) {
        console.error("Connection failed:", error);
      }
    }
  
    async disconnect() {
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
    }
  
    async write(data) {
      this.loading = true;
      if (!this.writer || !this.connected) {
        console.error(
          "Serial port is not connected or writer is not initialized.",
        );
        return;
      }
      try {
        const encodedData = this.encoder.encode(data + "\n"); // Add newline to ensure data is received as intended
        await this.writer.write(encodedData);
        // add a short delay to allow the device to process the data
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Failed to write data:", error);
      }
      this.loading = false;
    }
  
    async read() {
      let buffer = "";
      try {
        while (this.connected) {
          const { value, done } = await this.reader.read();
          if (done) {
            // Handle any remaining buffer before breaking
            if (buffer.length > 0) {
              this.messages = [
                ...this.messages,
                this.decoder.decode(buffer, { stream: false }),
              ];
              buffer = "";
              this.requestUpdate();
            }
            this.reader.releaseLock();
            break;
          }
          const text = this.decoder.decode(value, { stream: true });
          // Accumulate decoded text into buffer, waiting for newline
          buffer += text;
  
          // If buffer contains newline, process as complete message(s)
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const message = buffer.slice(0, newlineIndex).trim(); // Trim to remove newline character
            if (message) {
              this.messages = [message, ...this.messages];
              // create a new Custom Event for the message
              this.handleMessage(message);
            }
            buffer = buffer.slice(newlineIndex + 1);
          }
        }
      } catch (error) {
        console.error("Read error:", error);
      }
    }

    handleMessage(message) {
      this.dispatchEvent(new CustomEvent("message", {
        detail: message,
        bubbles: true,
      }));
    }
  
    async send() {
      const input = this.shadowRoot.getElementById("message");
      await this.write(input.value);
      input.value = "";
    }

    renderMessage(message) {
      return html`
        <li><pre>${message}</pre></li>
      `;
    }

    renderLinkButton(connected) {
      const click = connected ? this.disconnect : this.connect;
      const icon = connected ? "link_off" : "link";
      return html`
        <button @click="${click}">
          <span class="material-symbols-outlined">${icon}</span>
        </button>
      `;
    }

    renderDebugInputs(connected) {
      return connected ? html`
        <input type="color" id="color" value="#000000">
        <input type="text" id="message" placeholder="Enter message to send">
        <button type="submit" @click="${this.send}">Send</button>
      ` : "";
    }
  
    render() {
      return html`
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        ${this.renderLinkButton(this.connected)}
        ${this.loading ? html`<span>Connecting...</span>` : ""}
        ${this.debug ? html`
          <div>${this.uuid}</div>
          ${this.renderDebugInputs(this.connected)}
          <ul id="messages">
            ${this.messages.map(message => this.renderMessage(message))}
          </ul>` : ""}
      `;
    }
  }
  
  customElements.define("smart-device", SmartDevice); 