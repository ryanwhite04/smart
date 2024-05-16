import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartQuestion extends LitElement {
  static get properties() {
    return {
      length: { type: Number },
      opened: { type: Boolean },
      responses: { type: Object },
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
    this.length = 0;
    this.opened = false;
    this.responses = {};
    this.replies = 0;
    this.revealResults = false;
  }

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

  open() {
    this.opened = true;
    this.revealResults = false;
    this.responses = {};
    this.replies = 0;
    this.dispatchEvent(new CustomEvent("open"));
  }

  close() {
    this.opened = false;
    this.dispatchEvent(new CustomEvent("close", { detail: this }));
  }

  handleResponse(uuid, optionNumber, isTeacher) {
    this.responses[uuid] = optionNumber;
    this.replies = Object.keys(this.responses).length;
    if (isTeacher) {
      this.revealResults = true;
    }
    this.requestUpdate();
  }

  getResults() {
    const results = new Array(this.length).fill(0);
    for (const option of Object.values(this.responses)) {
      results[option]++;
    }
    return results;
  }

  render() {
    const results = this.getResults();
    return html`
      <slot name="question"></slot>
      <button @click="${this.addOption}">Add option</button>
      <slot name="option"></slot>
      ${
      this.opened
        ? html`
        <p>Replies: ${this.replies}</p>
        ${
          this.revealResults
            ? html`
          ${
              Array.from(this.children).filter((child) =>
                child.slot === "option"
              ).map((option, index) =>
                html`
            <div class="option">
              <label>${option.textContent}</label>
              <span class="count">(${results[index]})</span>
            </div>
          `
              )
            }
        `
            : ""
        }
        <button @click="${this.close}">Close</button>
      `
        : html`
        <button @click="${this.open}">Open</button>
      `
    }
      <p>Number of options: ${this.length}</p>
    `;
  }
}

customElements.define("smart-question", SmartQuestion);
