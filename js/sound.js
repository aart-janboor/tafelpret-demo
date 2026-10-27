/* sound.js — vrolijke geluidjes via de Web Audio API.
   Geen audiobestanden nodig: alles wordt live gesynthetiseerd, dus het werkt
   offline en kost geen downloads. Respecteert State.soundOn (mute-knop). */

const Sound = (() => {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Eén toon met een zachte in/uit-fade zodat het niet "klikt".
  function tone(freq, dur, { type = 'sine', gain = 0.18, when = 0 } = {}) {
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function on() { return State.soundOn !== false; }
  function melody(notes, { type = 'triangle', gain = 0.18, step = 0.12, dur = 0.18 } = {}) {
    if (!on()) return;
    notes.forEach((f, i) => tone(f, dur, { type, gain, when: i * step }));
  }

  return {
    // Moet op een gebruikersgebaar worden aangeroepen om audio te "ontgrendelen".
    unlock() { ensure(); },

    tap()     { if (on()) tone(520, 0.07, { type: 'triangle', gain: 0.1 }); },
    correct() { melody([660, 880, 1175], { type: 'sine', step: 0.09, dur: 0.16 }); },
    wrong()   { if (on()) { tone(300, 0.16, { type: 'sawtooth', gain: 0.12 }); tone(200, 0.22, { type: 'sawtooth', gain: 0.12, when: 0.12 }); } },
    coin()    { if (on()) { tone(1050, 0.06, { type: 'square', gain: 0.1 }); tone(1500, 0.09, { type: 'square', gain: 0.1, when: 0.05 }); } },
    feed()    { melody([523, 784], { type: 'sine', step: 0.08, dur: 0.14, gain: 0.16 }); },
    purr()    { if (on()) tone(180, 0.25, { type: 'sine', gain: 0.08 }); },
    stars()   { melody([784, 988, 1319], { type: 'sine', step: 0.11, dur: 0.24 }); },
    fanfare() { melody([523, 659, 784, 1047, 1319], { type: 'triangle', step: 0.12, dur: 0.3, gain: 0.2 }); },
  };
})();
