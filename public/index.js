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

class SmartQuestion extends LitElement {
  static get properties() {
    return {
      length: { type: Number },
      opened: { type: Boolean },
    };
  }

  static get styles() {
    // remove option radio bullet
    return css`
      :host {
          display: block;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
      }
      ul {
          list-style: none;
          padding: 0;
      }
      `;
  }

  constructor() {
    super();
    this.length = 0;
  }

  // get the options from the light DOM
  // and update the number of options
  updated() {
    const slot = this.shadowRoot.querySelector("slot[name=option]");
    const options = slot.assignedNodes();
    this.length = options.length;
  }

  addOption() {
    const option = window.prompt("Enter a new option");
    if (option) {
      const p = document.createElement("p");
      p.textContent = option;
      p.setAttribute("slot", "option");
      this.appendChild(p);
    }
  }

  // fire an event to show that
  // the question is open for accepting answers
  open() {
    this.opened = true;
    this.dispatchEvent(new CustomEvent("open"));
  }

  close() {
    this.opened = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  count(option, user) {

  }

  get options() {
    return Array.from(this.querySelectorAll("slot[name=option]"))
      .map(option => ({
        text: option.textContent,
        count: 0,
        correct: option.hasAttribute("correct")
      }))
  }

  get json() {
    console.log("get json");
    return {
      test_id: crypto.randomUUID(),
      class_id: crypto.randomUUID(),
      date_taken: new Date().toISOString(),
      name: this.querySelector("slot[name=question]").textContent,
      students: Array.from(document.querySelectorAll("smart-user")).map(user => ({
        id: user.uuid,
        name: user.name,
      })),
      questions: Array.from(question.querySelectorAll("smart-question")).map(question => ({
        id: crypto.randomUUID(),
        text: this.querySelector("slot[name=question]").textContent,
        answers: this.options.map(option => ({
          id: crypto.randomUUID(),
          text: option.text,
          is_correct: option.correct,
          respondees: Array.from(document.querySelectorAll("smart-user")).map(user => user.uuid),
        })),
      })),
    }
  }

  render() {
    return html`
      <slot name="question"></slot>
      <button @click="${this.addOption}">Add option</button>
      <slot name="option"></slot>
      ${this.opened ?
        html`<button @click="${this.close}">Close</button>` :
        html`<button @click="${this.open}">Open</button>`
      }
      <p>Number of options: ${this.length}</p>
      `;
  }
}

customElements.define("smart-question", SmartQuestion);

class SmartUser extends LitElement {
  static get properties() {
    return {
      address: { type: String },
      answer: { type: Number },
      name: { type: String },
      connected: { type: Boolean },
      teacher: { type: Boolean },
      uuid: { type: String },
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
    `;
  }

  constructor() {
    super();
    this.answer = "";
    this.uuid = crypto.randomUUID();
  }

  change(event) {
    this.answer = event.target.value;
  }

  render() {
    // includes textbox for name of student
    // includes checkbox for if teacher
    return html`
      <input type="text" placeholder="Name" @input="${(e) => this.name = e.target.value}">
      <p>${this.address}</p>
      <input type="checkbox" @change="${(e) => this.teacher = e.target.checked}">Teacher
      <smart-device></smart-device>
    `;
  }
}
customElements.define("smart-user", SmartUser);

const device = document.getElementById("device");

document.getElementById("add-device").addEventListener(
  "click",
  add("smart-device"),
);

function addQuestionCallbacks(question) {
  question.addEventListener("open", (e) => {
    const length = e.target.length;
    device.write("open " + length);
  });
  question.addEventListener("close", (e) => {
    console.log("question closed");
    submitQuestion(questions);
    device.write("close");
  });
}

[...document.getElementsByTagName("smart-question")].forEach(addQuestionCallbacks)

function add(component) {
  const element = document.createElement(component);
  if (component === "smart-question") {
    addQuestionCallbacks(element);
  }
  return (event) => {
    console.log(event);
    event.target.parentElement.appendChild(element);
  };
}

// {
//   "test_id": "e95f45a6051b11ef94bca3ea6fc56428",
//   "class_id": "4affd421e12842ca9580f015b98d245c",
//   "date_taken": "time format",   
//   "name": "Test Test",
//   "students": 
//   [
//       { "id": "419cd5da051c11ef8e623f120d9bf867", "name": "first", "surname": "student1" },
//       { "id": "76733876051c11ef93a5f7fe92aa02cb", "name": "second", "surname": "student2" }
//   ],
//   "questions": 
//   [
//       {
//           "id": "8dd4c5fc051c11efa61ea700b81e1c3e", 
//           "text": "What is the capital of Western Australia?",
//           "answers":
//           [
//               {
//                   "id": "cba5cab6051c11efbe961b8b293ea149",
//                   "text": "Perth",
//                   "is_correct": true,
//                   "respondees": [ "419cd5da051c11ef8e623f120d9bf867" ]
//               },
//               {
//                   "id": "d6fcddfa051c11efa83ac7c4280e63ff",
//                   "text": "Brisbane",
//                   "is_correct": false,
//                   "respondees": [ "76733876051c11ef93a5f7fe92aa02cb" ]
//               },
//               {
//                   "id": "ded2dd7c051c11efa86c0720f38020bb",
//                   "text": "Canberra",
//                   "is_correct": false,
//                   "respondees": [  ]
//               }
//           ]
//       }
//   ]
// }

function submitQuestion(question) {
  console.log("submit question");
  const body = question.json;
  console.log(body);
  fetch("http://localhost:5001/post", {
    method: "POST",
    body: JSON.stringify(body),
    mode: "no-cors"
  })
}