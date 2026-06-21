(function initWelcomeDeck(global) {
  global.SLIDE_DECKS = global.SLIDE_DECKS || {};

  global.SLIDE_DECKS.welcome = {
    id: 'welcome',
    title: 'Welcome Slideshow',
    backgroundImages: [
      'assets/image1.jpg'
    ],
    slidesHtml: `
      <div class="slide">
        <div class="slide-content">
          <h1>Welcome Slideshow</h1>
          <p class="subtitle">A reusable deck for presenting ideas clearly.</p>
        </div>
      </div>

      <div class="slide">
        <div class="slide-content">
          <h1>Build Any Deck</h1>
          <div class="highlight-box">
            <h3>What this tool supports</h3>
            <ul>
              <li>Multiple decks from one slideshow shell</li>
              <li>Keyboard, swipe, and direct slide navigation</li>
              <li>Deck-specific background images</li>
              <li>A built-in random picker for audience participation</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="slide">
        <div class="slide-content">
          <h1>Create Your Own</h1>
          <p>Copy <strong>assets/decks/deck-template.js</strong>, give it a new id, and add it to <strong>assets/decks/index.js</strong>.</p>
        </div>
      </div>
    `
  };
})(window);
