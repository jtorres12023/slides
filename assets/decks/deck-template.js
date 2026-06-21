(function initTemplateDeck(global) {
  global.SLIDE_DECKS = global.SLIDE_DECKS || {};

  global.SLIDE_DECKS['replace-this-id'] = {
    id: 'replace-this-id',
    title: 'Replace This Deck Title',
    backgroundImages: [
      'assets/image1.jpg'
    ],
    slidesHtml: `
      <div class="slide" data-slide="1">
        <div class="slide-content">
          <h1>Deck Title</h1>
          <p class="subtitle">One-line summary</p>
        </div>
      </div>

      <div class="slide" data-slide="2">
        <div class="slide-content">
          <h1>Agenda</h1>
          <ul>
            <li>Topic 1</li>
            <li>Topic 2</li>
            <li>Topic 3</li>
          </ul>
        </div>
      </div>
    `
  };
})(window);
