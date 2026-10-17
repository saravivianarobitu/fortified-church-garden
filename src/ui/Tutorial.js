export class Tutorial {
  constructor() {
    document.querySelector('.garden-caption').insertAdjacentHTML('beforeend', '<button id="open-guide" class="book-link">How to play</button>');
    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="garden-guide" aria-labelledby="guide-title">
        <span class="eyebrow">WELCOME TO DEALUL LIN</span><div class="guide-flower" aria-hidden="true">❧</div>
        <h2 id="guide-title">A little garden.<br>A future to grow.</h2>
        <p>Feed ten neighbors for five years, and leave the soil healthy.</p>
        <ol class="guide-steps">
          <li><strong>Spring · Plant</strong><span>Select a plot, then choose a crop. Beans and clover help your next rotation.</span></li>
          <li><strong>Summer · Care</strong><span>Check moisture. Water freely; use your limited compost wisely.</span></li>
          <li><strong>Autumn · Gather</strong><span>Harvest each mature plot. End winter with 10 food for the village meal.</span></li>
        </ol>
        <p class="guide-goal">Finish Year 5 with food left and at least 60% average fertility.</p>
        <button id="close-guide" class="advance">Let’s plant something →</button>
        <small>You can reopen this guide below the garden.</small>
      </dialog>`);
    this.dialog = document.querySelector('#garden-guide');
    document.querySelector('#open-guide').addEventListener('click', () => this.dialog.showModal());
    document.querySelector('#close-guide').addEventListener('click', () => this.dialog.close());
    this.dialog.addEventListener('close', () => {
      try { localStorage.setItem('garden-guide-seen', 'yes'); } catch {}
    });
    let seen = false;
    try { seen = localStorage.getItem('garden-guide-seen') === 'yes'; } catch {}
    if (!seen) this.dialog.showModal();
  }
}
