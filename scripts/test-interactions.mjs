// Run the actual built client scripts against small DOM and audio test doubles.
// This verifies behavior without claiming a browser rendering/audio quality test.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { clientScript } from './lib/built-site.mjs';
async function script(slug) {
  return clientScript(`blog/${slug}/index.html`);
}

function el(dataset = {}, value = '') {
  return {
    dataset,
    value,
    style: {},
    textContent: '',
    attributes: {},
    events: {},
    addEventListener(k, fn) {
      this.events[k] = fn;
    },
    setAttribute(k, v) {
      this.attributes[k] = v;
    },
  };
}
const ids = Object.fromEntries(
  [
    'endpoint',
    'reasoning',
    'endpoint-value',
    'reasoning-value',
    'latency-total',
  ].map((k) => [`#${k}`, el()]),
);
ids['#endpoint'].value = '400';
ids['#reasoning'].value = '250';
const bars = { endpoint: el(), reasoning: el() };
vm.runInNewContext(await script('voice-ai-engineering'), {
  document: {
    querySelector(s) {
      return ids[s] ?? bars[s.match(/data-stage="(.*?)"/)?.[1]];
    },
  },
});
ids['#endpoint'].value = '1200';
ids['#endpoint'].events.input();
assert.equal(ids['#latency-total'].textContent, '1,800');
ids['#endpoint'].value = '100';
ids['#reasoning'].value = '100';
ids['#reasoning'].events.input();
assert.equal(ids['#latency-total'].textContent, '550');
assert.equal(bars.endpoint.style.flex, '100');
const buttons = ['major', 'minor', 'sus'].map((chord) => el({ chord }));
const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => el({ note }));
const status = el(),
  cadence = el(),
  oscillators = [],
  windowEvents = {};
let audioContexts = 0;
class AudioContext {
  constructor() {
    audioContexts++;
    this.currentTime = 10;
    this.destination = {};
  }
  async resume() {}
  close() {}
  createOscillator() {
    const o = {
      frequency: {},
      connect() {},
      disconnect() {},
      start(t) {
        this.startTime = t;
      },
      stop(t) {
        this.stopTime = t;
      },
    };
    oscillators.push(o);
    return o;
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      disconnect() {},
    };
  }
}
const document = {
  querySelector(s) {
    return s === '#cadence' ? cadence : status;
  },
  querySelectorAll(s) {
    return s === '[data-chord]' ? buttons : keys;
  },
};
vm.runInNewContext(await script('music-theory'), {
  document,
  AudioContext,
  window: {
    addEventListener(k, fn) {
      windowEvents[k] = fn;
    },
  },
});
assert.equal(audioContexts, 0, 'Audio must not autoplay');
await buttons[1].events.click();
assert.equal(oscillators.length, 3);
assert.ok(
  Math.abs(oscillators[1].frequency.value - 311.12698) < 0.01,
  'C minor must use E-flat',
);
assert.equal(buttons[1].attributes['aria-pressed'], 'true');
assert.equal(keys.find((k) => k.dataset.note === 'E').dataset.active, 'false');
await cadence.events.click();
assert.equal(oscillators.length, 10, 'Cadence plays four notes then three');
assert.equal(
  oscillators[7].startTime,
  11.3,
  'Resolution is scheduled after dominant',
);
assert.ok(status.textContent.includes('B rises to C'));
windowEvents.pagehide();
const failedStatus = el();
const failedButtons = ['major', 'minor', 'sus'].map((chord) => el({ chord }));
vm.runInNewContext(await script('music-theory'), {
  document: {
    querySelector(s) {
      return s === '#cadence' ? el() : failedStatus;
    },
    querySelectorAll(s) {
      return s === '[data-chord]' ? failedButtons : keys;
    },
  },
  window: { addEventListener() {} },
  AudioContext: class {
    constructor() {
      throw Error('unavailable');
    }
  },
});
await failedButtons[0].events.click();
assert.ok(failedStatus.textContent.includes('Audio is unavailable'));
console.log(
  'PASS: slider totals, chord frequencies, user-initiated audio, cadence timing, teardown, and unsupported-audio fallback.',
);

const home = await readFile(
  new URL('../dist/index.html', import.meta.url),
  'utf8',
);
const themeCode = home.match(
  /<script id="portfolio-theme">([\s\S]*?)<\/script>/,
)?.[1];
assert.ok(themeCode, 'Theme initialization must ship inline before page paint');
function themeFixture({ saved = null, dark = false, blocked = false } = {}) {
  const root = { dataset: {} },
    button = el(),
    meta = el(),
    events = {},
    windowEvents = {},
    mediaEvents = {};
  let stored = saved;
  const media = {
    matches: dark,
    addEventListener(k, fn) {
      mediaEvents[k] = fn;
    },
  };
  const document = {
    documentElement: root,
    getElementById() {
      return button;
    },
    querySelector() {
      return meta;
    },
    addEventListener(k, fn) {
      events[k] = fn;
    },
  };
  const localStorage = {
    getItem() {
      if (blocked) throw Error('blocked');
      return stored;
    },
    setItem(_key, v) {
      if (blocked) throw Error('blocked');
      stored = v;
    },
  };
  vm.runInNewContext(themeCode, {
    document,
    localStorage,
    window: {
      matchMedia() {
        return media;
      },
      addEventListener(k, fn) {
        windowEvents[k] = fn;
      },
    },
  });
  return {
    root,
    button,
    meta,
    events,
    windowEvents,
    media,
    mediaEvents,
    stored: () => stored,
  };
}
const theme = themeFixture({ dark: true });
assert.equal(
  theme.root.dataset.theme,
  'dark',
  'System preference applies before DOM ready',
);
theme.events.DOMContentLoaded();
assert.equal(theme.button.attributes['aria-pressed'], 'true');
theme.button.events.click();
assert.equal(theme.root.dataset.theme, 'light');
assert.equal(theme.stored(), 'light', 'Manual preference persists');
theme.mediaEvents.change();
assert.equal(
  theme.root.dataset.theme,
  'light',
  'System changes cannot override explicit choice',
);
assert.equal(
  themeFixture({ saved: 'light', dark: true }).root.dataset.theme,
  'light',
  'Saved choice survives navigation',
);
theme.windowEvents.storage({ key: 'portfolio-theme', newValue: 'dark' });
assert.equal(theme.root.dataset.theme, 'dark', 'Cross-tab preference sync');
const automatic = themeFixture({ saved: 'invalid' });
automatic.media.matches = true;
automatic.mediaEvents.change();
assert.equal(
  automatic.root.dataset.theme,
  'dark',
  'Follow system changes without a manual override',
);
const denied = themeFixture({ blocked: true });
denied.events.DOMContentLoaded();
denied.button.events.click();
assert.equal(
  denied.root.dataset.theme,
  'dark',
  'Toggle works when storage is unavailable',
);
assert.equal(denied.meta.attributes.content, '#171c19');
console.log(
  'PASS: first-paint theme, saved preference, OS changes, cross-tab sync, accessibility labels, and blocked-storage fallback.',
);
