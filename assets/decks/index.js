(function initDeckManifest(global) {
  global.SLIDESHOW_DECKS = [
    {
      id: 'welcome',
      title: 'Welcome Slideshow',
      description: 'A neutral starter deck for the slideshow tool.',
      path: 'assets/decks/welcome.js'
    },
    {
      id: 'may3-holiness',
      title: 'Jesus Christ Helps Us Become Holy',
      description: 'May 3 lesson slides on holiness, the tabernacle, sacrifice, and willing offerings.',
      path: 'assets/decks/may3-holiness.js'
    },
    {
      id: 'june21',
      title: "The Battle Is the Lord's",
      description: 'June 21 lesson slides about David, Goliath, forgiveness, revelation, and Jesus Christ as Eternal King.',
      path: 'assets/decks/june21.js',
      default: true
    },
    {
      id: 'march1',
      title: 'Is Any Thing Too Hard for the Lord?',
      description: 'Slides from Genesis 17 and Genesis 22.',
      path: 'assets/decks/march1.js'
    }
  ];
})(window);
