import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartQuestion extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      text: { type: String },
      options: { type: Array },
      responses: { type: Object },
      hidden: { type: Boolean },
      active: { type: Boolean, reflect: true },
      debug: { type: Boolean },
      correct: { type: Number },
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
      :host[active] {
        background: lightblue;
      }
      details[open] summary {
        padding-bottom: 16px;
      }
      .option {
        align-items: center;
        min-width: 100px;
        margin: 8px 0;
      }
      .count {
        margin-left: 10px;
        font-weight: bold;
      }
      .correct input {
        background: lightgreen;
      }
    `;
  }

  constructor() {
    super();
    this.uuid = this.uuid || crypto.randomUUID();
    this.text = '';
    this.correct = null;
    this.options = [];
    this.responses = {};
    this.active = false;
    this.hidden = true;
    this.debug = false;
  }

  // the total number of replies so far
  get replies() {
    return this.responses ? Object.values(this.responses).length : 0; 
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

  addOption() {
    const text = prompt("Enter option");
    if (text) {
      this.options.push(text);
      this.save();
    }
  }

  open() {
    this.correct = null;
    this.active = true;
    this.hidden = true;
    this.dispatchEvent(new CustomEvent("open"));
    this.save();
  }

  close(option) {
    this.correct = option;
    this.active = false;
    this.hidden = false;
    this.dispatchEvent(new CustomEvent("close", { detail: this }));
    this.save();
  }

  submit(response) {
    const {
      option,
      user,
    } = response;
    if (user.teacher) {
      this.close(option);
    } else {
      this.responses[user.uuid] = option;
    }
    this.save();
  }

  get results() {
    return this.options.map((option, index) => {
      return Object.values(this.responses).filter((response) => response === index).length;
    });
  }

  clear() {
    this.responses = {};
    this.correct = null;
    this.active = false;
    this.hidden = true;
    this.save();
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }

  toggle() {

  }

  updateOption(index, value) {
    this.options[index] = value;
    this.save();
  }

  removeOption(index) {
    this.options.splice(index, 1);
    this.save();
  }

  renderOption(option, index) {
    const correct = this.correct === index;
    const classes = ["option", correct ? "correct" : ""].join(" ");
    const count = this.results[index];
    return html`
      <li class=${classes}>
        ${this.hidden ? '' : html`<span class="count">(${count})</span>`}
        <input type="text" value="${option}" @input=${e => this.updateOption(index, e.target.value)} />
        <button @click=${() => this.close(index)}>Select</button>
        <button @click=${() => this.removeOption(index)}>Remove</button>
      </li>
    `;
  }

  render() {
    return html`
      <details @toggle=${this.toggle}>
        <summary>${this.text}</summary>
        <button @click="${this.clear}">Clear responses</button>
        <button @click="${this.addOption}">Add option</button>
        ${this.active ? html`
          <p>Replies: ${this.replies}</p>
        ` : html`
          <button @click="${this.open}">Open</button>
        `}
        ${this.debug ? html`<p>Number of options: ${this.options.length}</p>` : ''}
        <ol>${this.options.map(this.renderOption.bind(this))}</ol>
      </details>
    `;
  }
}

customElements.define("smart-question", SmartQuestion);
