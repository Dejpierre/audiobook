/**
 * AmbientEngine — moteur d'ambiance sonore procédural (Web Audio API).
 * Aucune dépendance externe, aucun fichier audio requis.
 *
 * API publique :
 *   engine.crossfadeTo(type, fadeSec)  — joue une ambiance avec fondu
 *   engine.stop(fadeSec)               — arrêt en fondu
 */
class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentLayer = null;
    this.ready = false;
    this._birdTimer = null;
  }

  /* ── Initialisation (doit être appelée depuis un geste utilisateur) ── */
  async init() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    this.masterGain.connect(this.ctx.destination);
    this.ready = true;
  }

  /* ── Générateurs de bruit ── */
  _noiseBuf(type, seconds = 4) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * seconds, sr);
    const d = buf.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = Math.max(-1, Math.min(1, (last + 0.02 * w) / 1.02 * 3.5));
        last = d[i] / 3.5;
      }
    }
    return buf;
  }

  _src(type, seconds) {
    const s = this.ctx.createBufferSource();
    s.buffer = this._noiseBuf(type, seconds);
    s.loop = true;
    return s;
  }

  _filter(node, type, freq, Q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = Q;
    node.connect(f); return f;
  }

  _g(node, val) {
    const g = this.ctx.createGain();
    g.gain.value = val;
    node.connect(g); return g;
  }

  _lfo(rate, depth, targetParam) {
    const osc = this.ctx.createOscillator();
    osc.frequency.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = depth;
    osc.connect(g); g.connect(targetParam);
    osc.start();
    return osc;
  }

  /* ── Construction des couches sonores ── */
  _buildLayer(type) {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.masterGain);
    const nodes = [out];

    const add = (chain) => chain.connect(out);

    switch (type) {

      case 'fire':
      case 'tavern': {
        // Grondement grave (bruit brun → passe-bas)
        const s1 = this._src('brown', 4);
        add(this._g(this._filter(s1, 'lowpass', 600), 0.4));
        s1.start(); nodes.push(s1);

        // Texture crépitement (rose → passe-bande)
        const s2 = this._src('pink', 3);
        add(this._g(this._filter(s2, 'bandpass', 1200, 0.8), 0.12));
        s2.start(); nodes.push(s2);

        // LFO de "respiration" du feu
        const lfoG = this.ctx.createGain();
        lfoG.gain.value = 0.38;
        this._src('brown', 4); // unused buffer, but keep lfo
        const lfo1 = this.ctx.createOscillator();
        lfo1.frequency.value = 0.3;
        const lg1 = this.ctx.createGain(); lg1.gain.value = 0.08;
        lfo1.connect(lg1); lg1.connect(out.gain);
        lfo1.start(); nodes.push(lfo1);

        if (type === 'tavern') {
          // Murmures (voix dans le spectre 300-600 Hz)
          const s3 = this._src('pink', 5);
          add(this._g(this._filter(s3, 'bandpass', 420, 0.5), 0.06));
          s3.start(); nodes.push(s3);
        }
        break;
      }

      case 'rain': {
        // Pluie principale
        const s1 = this._src('white', 3);
        add(this._g(this._filter(s1, 'bandpass', 1000, 0.9), 0.35));
        s1.start(); nodes.push(s1);

        // Fines gouttes (haute fréquence)
        const s2 = this._src('white', 2);
        add(this._g(this._filter(s2, 'highpass', 2500), 0.12));
        s2.start(); nodes.push(s2);

        // Fond sourd (sol mouillé)
        const s3 = this._src('brown', 4);
        add(this._g(this._filter(s3, 'lowpass', 180), 0.1));
        s3.start(); nodes.push(s3);
        break;
      }

      case 'forest': {
        // Vent (rose → passe-bas)
        const s1 = this._src('pink', 4);
        const g1 = this._g(this._filter(s1, 'lowpass', 700), 0.22);
        add(g1);
        s1.start(); nodes.push(s1);

        // LFO de vent
        const lfo = this._lfo(0.15, 0.09, g1.gain);
        nodes.push(lfo);

        // Bruissements de feuilles (haute fréquence légère)
        const s2 = this._src('white', 3);
        add(this._g(this._filter(s2, 'highpass', 3500), 0.04));
        s2.start(); nodes.push(s2);
        break;
      }

      case 'ocean': {
        const s1 = this._src('pink', 6);
        const g1 = this._g(this._filter(s1, 'lowpass', 1400), 0.45);
        add(g1);
        s1.start(); nodes.push(s1);

        // Rythme des vagues (LFO lent)
        const lfo = this._lfo(0.09, 0.22, g1.gain);
        nodes.push(lfo);

        // Embruns (blanc haute fréquence)
        const s2 = this._src('white', 3);
        add(this._g(this._filter(s2, 'highpass', 3200), 0.07));
        s2.start(); nodes.push(s2);
        break;
      }

      case 'cave': {
        // Bruit souterrain
        const s1 = this._src('brown', 5);
        add(this._g(this._filter(s1, 'lowpass', 180), 0.28));
        s1.start(); nodes.push(s1);

        // Drone fondamental (La 1 = 55 Hz)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine'; osc1.frequency.value = 55;
        add(this._g(osc1, 0.12));
        osc1.start(); nodes.push(osc1);

        // Harmonique légèrement désaccordée (55 × 1.5 ≈ 82.5 Hz)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = 82.5;
        add(this._g(osc2, 0.05));
        osc2.start(); nodes.push(osc2);
        break;
      }

      case 'mystery': {
        // Texture spectrale haute
        const s1 = this._src('pink', 3);
        add(this._g(this._filter(s1, 'bandpass', 1800, 3), 0.05));
        s1.start(); nodes.push(s1);

        // Drone triangulaire avec vibrato
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle'; osc.frequency.value = 80;
        const vib = this._lfo(4, 1.5, osc.frequency);
        nodes.push(vib);
        add(this._g(osc, 0.09));
        osc.start(); nodes.push(osc);

        // Note haute (harmonique étrange)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = 125;
        add(this._g(osc2, 0.04));
        osc2.start(); nodes.push(osc2);
        break;
      }

      case 'storm': {
        // Pluie battante
        const s1 = this._src('white', 3);
        const g1 = this._g(s1, 0.55);
        add(g1);
        s1.start(); nodes.push(s1);

        // Grondement de tonnerre (brun → passe-bas)
        const s2 = this._src('brown', 6);
        const g2 = this._g(this._filter(s2, 'lowpass', 220), 0.35);
        add(g2);
        s2.start(); nodes.push(s2);

        // Grondement intermittent (LFO très lent)
        const lfo = this._lfo(0.04, 0.14, g2.gain);
        nodes.push(lfo);
        break;
      }

      default:
        break;
    }

    return { out, nodes, type };
  }

  /* ── Oiseaux (forest uniquement) ── */
  _startBirds(outputNode) {
    const schedule = () => {
      if (!this.currentLayer || this.currentLayer.out !== outputNode) return;

      const chirp = (delay = 0) => {
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const baseF = 1800 + Math.random() * 2200;
        osc.frequency.setValueAtTime(baseF, t);
        osc.frequency.exponentialRampToValueAtTime(baseF * (1.1 + Math.random() * 0.3), t + 0.12);
        osc.frequency.exponentialRampToValueAtTime(baseF * 0.85, t + 0.28);
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.07, t + 0.06);
        env.gain.linearRampToValueAtTime(0, t + 0.32);
        osc.connect(env); env.connect(outputNode);
        osc.start(t); osc.stop(t + 0.35);
      };

      const burst = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < burst; i++) chirp(i * 0.22);

      this._birdTimer = setTimeout(schedule, 1200 + Math.random() * 3500);
    };
    this._birdTimer = setTimeout(schedule, 1500);
  }

  /* ── Lecture d'un fichier MP3 avec crossfade ── */
  async crossfadeToUrl(url, fadeSec = 2) {
    await this.init();
    if (this._birdTimer) { clearTimeout(this._birdTimer); this._birdTimer = null; }

    // Utilise un élément <audio> pour la lecture MP3 (compatibilité maximale)
    const audioEl = new Audio(url);
    audioEl.loop = true;
    audioEl.crossOrigin = 'anonymous';

    const src = this.ctx.createMediaElementSource(audioEl);
    const out  = this.ctx.createGain();
    out.gain.value = 0;
    src.connect(out);
    out.connect(this.masterGain);

    await audioEl.play();

    const newLayer = { out, nodes: [out], audioEl, type: url };
    const now = this.ctx.currentTime;

    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(1, now + fadeSec);

    if (this.currentLayer) {
      const old = this.currentLayer;
      old.out.gain.setValueAtTime(old.out.gain.value, now);
      old.out.gain.linearRampToValueAtTime(0, now + fadeSec);
      setTimeout(() => {
        old.audioEl?.pause();
        old.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
      }, (fadeSec + 0.3) * 1000);
    }

    this.currentLayer = newLayer;
  }

  /* ── API publique ── */
  async crossfadeTo(type, fadeSec = 2) {
    await this.init();

    if (this._birdTimer) { clearTimeout(this._birdTimer); this._birdTimer = null; }

    const newLayer = this._buildLayer(type);
    const now = this.ctx.currentTime;

    // Fade in
    newLayer.out.gain.setValueAtTime(0, now);
    newLayer.out.gain.linearRampToValueAtTime(1, now + fadeSec);

    // Fade out l'ancienne couche
    if (this.currentLayer) {
      const old = this.currentLayer;
      old.out.gain.setValueAtTime(old.out.gain.value, now);
      old.out.gain.linearRampToValueAtTime(0, now + fadeSec);
      setTimeout(() => {
        old.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
      }, (fadeSec + 0.3) * 1000);
    }

    this.currentLayer = newLayer;

    if (type === 'forest') this._startBirds(newLayer.out);
  }

  stop(fadeSec = 1.5) {
    if (this._birdTimer) { clearTimeout(this._birdTimer); this._birdTimer = null; }
    if (!this.currentLayer) return;
    const layer = this.currentLayer;
    const now = this.ctx.currentTime;
    layer.out.gain.setValueAtTime(layer.out.gain.value, now);
    layer.out.gain.linearRampToValueAtTime(0, now + fadeSec);
    setTimeout(() => {
      layer.audioEl?.pause();
      layer.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
    }, (fadeSec + 0.3) * 1000);
    this.currentLayer = null;
  }
}

window.ambientEngine = new AmbientEngine();
