import { css, html } from "https://esm.sh/lit@3.1.2";
import SmartBase from "./smart-base.js";

class SmartQuestion extends SmartBase {
  static get properties() {
    return {
      ...super.properties,
      options: { type: Array },
      responses: { type: Object },
      hidden: { type: Boolean },
      correct: { type: Number },
      openned: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
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
      `
    ];
  }

  constructor() {
    super();
    this.correct = null;
    this.options = [];
    this.responses = {};
    this.hidden = true;
    this.openned = false;
  }

  // the total number of replies so far
  get replies() {
    return this.responses ? Object.values(this.responses).length : 0; 
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
    this.openned = true;
    this.hidden = true;
    console.log("smart-question opened", this.options.length);
    this.fire("open", this.options.length);
    this.requestUpdate();
  }

  close(option) {
    this.correct = option;
    this.openned = false;
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
    this.openned = false;
    this.hidden = true;

    this.save();
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
        ${this.hidden ? '' : html`<span class="count">(${count}/${this.replies})</span>`}
        <input type="text" value="${option}" @input=${e => this.updateOption(index, e.target.value)} />
        <button @click=${() => this.close(index)}>Select</button>
        <button @click=${() => this.removeOption(index)}>Remove</button>
      </li>
    `;
  }

  renderContent() {
    return html`
      <button @click="${this.clear}">Clear responses</button>
      <button @click="${this.addOption}">Add option</button>
      ${this.openned ? html`
        <p>Replies: ${this.replies}</p>
      ` : html`
        <button @click="${this.open}">Open</button>
      `}
      ${this.debug ? html`<p>Number of options: ${this.options.length}</p>` : ''}
      <ol>${this.options.map(this.renderOption.bind(this))}</ol>
    `;
  }
}

customElements.define("smart-question", SmartQuestion);
