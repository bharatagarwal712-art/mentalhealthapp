const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
  url: "http://localhost:8080/",
  runScripts: "dangerously",
  resources: "usable",
  beforeParse(window) {
    window.crypto = {
      subtle: {
        importKey: async () => ({}),
        deriveKey: async () => ({}),
        encrypt: async () => new Uint8Array(),
        decrypt: async () => new Uint8Array()
      },
      getRandomValues: (arr) => arr
    };
    
    let storage = {};
    window.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => storage[k] = v,
      removeItem: (k) => delete storage[k],
      clear: () => storage = {}
    };
    
    window.document.startViewTransition = (cb) => {
      console.log('startViewTransition called');
      cb();
    };
  }
});

dom.window.console.log = (...args) => console.log('BROWSER LOG:', ...args);
dom.window.console.error = (...args) => console.log('BROWSER ERROR:', ...args);

dom.window.addEventListener('load', () => {
  console.log('Window loaded.');
  try {
    const obBtn = dom.window.document.querySelector('#onboarding .ob-step.active button.ob-btn');
    if (obBtn) {
      console.log('Clicking continue button...', obBtn.outerHTML);
      obBtn.click();
      const active = dom.window.document.querySelector('#onboarding .ob-step.active');
      console.log('Clicked. Active step:', active ? active.dataset.step : 'none');
    } else {
      console.log('Could not find continue button');
    }
  } catch (err) {
    console.log('ERROR DURING CLICK:', err.message);
  }
});
