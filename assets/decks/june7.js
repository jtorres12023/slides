(function initJuneSevenDeck(global) {
  global.SLIDE_DECKS = global.SLIDE_DECKS || {};

  global.SLIDE_DECKS['june7'] = {
    id: 'june7',
    title: 'My Heart Rejoiceth in the Lord',
    backgroundImages: [
      'assets/image1.jpg'
    ],
    slidesHtml: `
      <div class="slide">
        <div class="slide-content">
          <h1>My Heart Rejoiceth in the Lord</h1>
          <p class="subtitle">Ruth; 1 Samuel 1-7</p>
          <div class="highlight-box" style="max-width: 980px; margin: 24px auto 0; text-align: center;">
            <p style="font-size: 1.9em; margin-bottom: 0;"><strong>God can guide, comfort, redeem, and speak to us during difficult times.</strong></p>
          </div>
        </div>
      </div>

      <div class="slide">
        <div class="slide-content" style="max-width: 1180px;">
          <h1>Ruth: Christ Can Turn Tragedy Into Triumph</h1>
          <p class="subtitle">Ruth 1:16-17; 2:11-12; 4:13-17</p>
          <video
            controls
            playsinline
            preload="metadata"
            style="display: block; width: 100%; max-height: calc(90vh - 230px); object-fit: contain; margin-top: 18px; border-radius: 12px; background: #000;"
          >
            <source src="ruth-and-naomi-eng-1080p.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div class="slide">
        <div class="slide-content" style="max-width: 1180px;">
          <h1>Hannah: God Hears Honest Prayer</h1>
          <p class="subtitle">1 Samuel 1:9-18; 2:1-2</p>
          <video
            controls
            playsinline
            preload="metadata"
            style="display: block; width: 100%; max-height: calc(90vh - 230px); object-fit: contain; margin-top: 18px; border-radius: 12px; background: #000;"
          >
            <source src="hannah-s-faith-eng-360p.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div class="slide">
        <div class="slide-content" style="max-width: 1180px;">
          <h1>Samuel: Speak; for Thy Servant Heareth</h1>
          <p class="subtitle">1 Samuel 3:1-10</p>
          <video
            controls
            playsinline
            preload="metadata"
            style="display: block; width: 100%; max-height: calc(90vh - 230px); object-fit: contain; margin-top: 18px; border-radius: 12px; background: #000;"
          >
            <source src="samuel-and-eli-eng-360p.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    `
  };
})(window);
