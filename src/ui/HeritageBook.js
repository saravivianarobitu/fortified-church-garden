
import { CHAPTERS, CREDITS, SOURCES } from '../game/Heritage.js';

const GAME_CREATORS = [
  'Robitu Sara Viviana',
  'Spatacean Iulia-Elena'
];

export class HeritageBook {
  constructor() {
    document.querySelector('main').insertAdjacentHTML('beforebegin', `
      <section class="heritage-strip" aria-label="Village heritage">
        <div class="heritage-intro"><span class="eyebrow">DEALUL LIN · A FICTIONAL VILLAGE IN ROMANIA</span><p>Inspired by Viscri and the UNESCO World Heritage property <em>Villages with Fortified Churches in Transylvania</em>.</p></div>
        <div class="heritage-progress"><label for="heritage-meter">Village Heritage <strong id="heritage-value">0 / 100</strong></label><meter id="heritage-meter" min="0" max="100" value="0"></meter><small id="heritage-note"></small></div>
        <div class="heritage-links"><button id="open-heritage" class="compost">▤ Heritage Book</button><button id="open-about" class="book-link">Credits / About</button></div>
      </section>`);

    document.querySelector('#notifications').insertAdjacentHTML('beforebegin', `
      <section class="learning-note">
        <span class="eyebrow">FROM THE VILLAGE NOTEBOOK</span>
        <p id="learning-message" aria-live="polite">Healthy fields and a thriving community belong in the same story.</p>
        <button id="learning-more" class="book-link">Read the Heritage Book →</button>
      </section>`);

    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="heritage-book" aria-labelledby="book-title">
        <div class="book-top">
          <div>
            <span class="eyebrow">THE VILLAGE NOTEBOOK</span>
            <h2 id="book-title">A landscape worth caring for</h2>
          </div>
          <button id="close-book" class="book-link" aria-label="Close Heritage Book">Close ×</button>
        </div>
        <p class="book-context">Dealul Lin is fictional. Its setting is inspired by Viscri, Romania. These pages distinguish real heritage from our imagined garden.</p>
        <nav class="book-chapters" aria-label="Book chapters"></nav>
        <article id="book-page" aria-live="polite"></article>
        <div class="book-navigation">
          <button id="book-previous" class="book-link">← Previous</button>
          <span id="book-page-count"></span>
          <button id="book-next" class="book-link">Next →</button>
        </div>
      </dialog>`);

    this.dialog = document.querySelector('#heritage-book');
    document.querySelector('#heritage-meter').title = '+1 per harvested crop-family rotation; +4 for healthy year-end soil; +4 for a full annual meal. Capped at 100. Does not change victory conditions.';

    this.chapter = 0;
    this.lessonChapter = 'landscape';
    this.pages = [...CHAPTERS, { id: 'about', title: 'Credits / About' }];

    for (const [index, chapter] of this.pages.entries()) {
      const button = document.createElement('button');
      button.className = 'book-link';
      button.textContent = chapter.title;
      button.addEventListener('click', () => this.showPage(index));
      document.querySelector('.book-chapters').append(button);
    }

    document.querySelector('#open-heritage').addEventListener('click', () => this.open());
    document.querySelector('#open-about').addEventListener('click', () => this.open('about'));
    document.querySelector('#learning-more').addEventListener('click', () => this.open(this.lessonChapter));
    document.querySelector('#close-book').addEventListener('click', () => this.dialog.close());
    document.querySelector('#book-previous').addEventListener('click', () => this.showPage(this.chapter - 1));
    document.querySelector('#book-next').addEventListener('click', () => this.showPage(this.chapter + 1));
  }

  open(id) {
    this.showPage(id ? this.pages.findIndex(page => page.id === id) : this.chapter);
    if (!this.dialog.open) this.dialog.showModal();
  }

  showPage(index) {
    this.chapter = Math.max(0, Math.min(this.pages.length - 1, index));
    const page = this.pages[this.chapter];
    const article = document.querySelector('#book-page');

    if (page.id === 'about') {
      article.innerHTML = `
        <h3>Credits / About</h3>

        <section class="game-creators">
          <h4>People Who Made the Game</h4>
          <ul>
            ${GAME_CREATORS.map(name => `<li>${name}</li>`).join('')}
          </ul>
        </section>

        <p>This game is inspired by the UNESCO World Heritage property Villages with Fortified Churches in Transylvania.</p>

        <p>The agricultural simulation uses simplified mechanics for educational gameplay. It is not a historical reconstruction, a scientific model, or an official UNESCO product. No UNESCO endorsement is implied.</p>

        <dl class="credit-list">
          ${CREDITS.map(credit => `<dt>${credit.role}</dt><dd>${credit.text}</dd>`).join('')}
        </dl>

        <p class="book-source">
          <a href="${SOURCES.unesco.url}" target="_blank" rel="noopener noreferrer">Explore the official UNESCO property page ↗</a>
        </p>`;
    } else {
      article.innerHTML = `
        <span class="book-symbol" aria-hidden="true">${page.symbol}</span>
        <h3>${page.title}</h3>
        <p>${page.text}</p>
        <p class="book-connection"><strong>In our garden</strong><br>${page.connection}</p>
        <div class="book-source">Learn more: ${page.sources.map(key => `<a href="${SOURCES[key].url}" target="_blank" rel="noopener noreferrer">${SOURCES[key].label} ↗</a>`).join(' · ')}</div>`;
    }

    document.querySelectorAll('.book-chapters button').forEach((button, buttonIndex) => {
      if (buttonIndex === this.chapter) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    document.querySelector('#book-previous').disabled = this.chapter === 0;
    document.querySelector('#book-next').disabled = this.chapter === this.pages.length - 1;
    document.querySelector('#book-page-count').textContent = `${this.chapter + 1} / ${this.pages.length}`;
  }

  render(state) {
    document.querySelector('#heritage-meter').value = state.heritage;
    document.querySelector('#heritage-value').textContent = `${state.heritage} / 100`;
    document.querySelector('#heritage-note').textContent = state.heritageNote;

    const text = state.lesson?.text ?? 'Healthy fields and a thriving community belong in the same story.';
    const message = document.querySelector('#learning-message');

    if (message.textContent !== text) message.textContent = text;
    this.lessonChapter = state.lesson?.chapter ?? 'landscape';
  }

  reset() {
    this.dialog.close();
    this.chapter = 0;
    this.lessonChapter = 'landscape';
  }
}
