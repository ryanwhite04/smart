import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartQuestion extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      text: { type: String },
      options: { type: Array },
      responses: { type: Object },
      opened: { type: Boolean },
      replies: { type: Number },
      revealResults: { type: Boolean },
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
      ul {
        list-style: none;
        padding: 0;
      }
      .option {
        display: flex;
        align-items: center;
      }
      .count {
        margin-left: 10px;
        font-weight: bold;
      }
    `;
  }

  constructor() {
    super();
    this.uuid = this.uuid || crypto.randomUUID();
    this.text = '';
    this.options = [];
    this.responses = {};
    this.opened = false;
    this.replies = 0;
    this.revealResults = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.load();
      this.addToLocalStorage();
    }
  }

  addToLocalStorage() {
    const questions = JSON.parse(localStorage.getItem('questions')) || [];
    if (!questions.includes(this.uuid)) {
      questions.push(this.uuid);
      localStorage.setItem('questions', JSON.stringify(questions));
    }
  }

  load() {
    const questionData = JSON.parse(localStorage.getItem(this.uuid));
    if (questionData) {
      this.text = questionData.text;
      this.options = questionData.options;
      this.responses = questionData.responses || {};
      this.opened = questionData.opened || false;
      this.replies = questionData.replies || 0;
      this.revealResults = questionData.revealResults || false;
    }
  }

  save() {
    const questionData = {
      uuid: this.uuid,
      text: this.text,
      options: this.options,
      responses: this.responses,
      opened: this.opened,
      replies: this.replies,
      revealResults: this.revealResults
    };
    localStorage.setItem(this.uuid, JSON.stringify(questionData));
  }

  addOption() {
    const option = window.prompt("Enter a new option");
    if (option) {
      this.options.push(option);
      this.save();
      this.requestUpdate();
    }
  }

  open() {
    this.opened = true;
    this.revealResults = false;
    this.responses = {};
    this.replies = 0;
    this.dispatchEvent(new CustomEvent("open"));
    this.save();
  }

  close() {
    this.opened = false;
    this.dispatchEvent(new CustomEvent("close", { detail: this }));
    this.save();
  }

  handleResponse(uuid, optionNumber, isTeacher) {
    this.responses[uuid] = optionNumber;
    this.replies = Object.keys(this.responses).length;
    if (isTeacher) {
      this.revealResults = true;
    }
    this.requestUpdate();
    this.save();
  }

  getResults() {
    const results = new Array(this.options.length).fill(0);
    if (this.responses) {
      for (const option of Object.values(this.responses)) {
        results[option]++;
      }
    }
    return results;
  }

  render() {
    const results = this.getResults();
    return html`
      <div>
        <p>${this.text}</p>
        <button @click="${this.addOption}">Add option</button>
        ${this.opened ? html`
          <p>Replies: ${this.replies}</p>
          <button @click="${this.close}">Close</button>
        ` : html`
          <button @click="${this.open}">Open</button>
        `}
        <p>Number of options: ${this.options.length}</p>
        ${this.options.map((option, index) => html`
        <div class="option">
          <label>${option}</label>
          ${this.revealResults ? html`<span class="count">(${results[index]})</span>` : ''}
        </div>
      `)}
      </div>
    `;
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }
}

customElements.define("smart-question", SmartQuestion);
