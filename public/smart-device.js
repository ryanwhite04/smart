import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartDevice extends LitElement {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
  
    static get properties() {
      return {
        connected: { type: Boolean },
        messages: { type: Array },
      };
    }
  
    static get styles() {
      return css`
        :host {
          display: block;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
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
        this.read();
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
      if (!this.writer || !this.connected) {
        console.error(
          "Serial port is not connected or writer is not initialized.",
        );
        return;
      }
      try {
        const encodedData = this.encoder.encode(data + "\n"); // Add newline to ensure data is received as intended
        await this.writer.write(encodedData);
      } catch (error) {
        console.error("Failed to write data:", error);
      }
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
              this.requestUpdate();
            }
            buffer = buffer.slice(newlineIndex + 1);
          }
        }
      } catch (error) {
        console.error("Read error:", error);
      }
    }
  
    async send() {
      const input = this.shadowRoot.getElementById("message");
      const response = await this.write(input.value);
      console.log(response);
      input.value = "";
    }
  
    render() {
      return html`
        <button @click="${this.connect}">${
        this.connected ? "Disconnect" : "Connect"
      }</button>${this.connected ? html`
          <input type="text" id="message" placeholder="Enter message to send">
          <button type="submit" @click="${this.send}">Send</button>
        ` : ""}
        <pre>${this.messages[0]}</div>
      `;
    }
  }
  
  customElements.define("smart-device", SmartDevice);