export class Notifications {
  constructor(element) { this.element = element; }
  show(message) {
    const entry = document.createElement('p');
    entry.textContent = `✦  ${message}`;
    this.element.prepend(entry);
    while (this.element.children.length > 3) this.element.lastElementChild.remove();
  }
}
