/**
 * SpeechEngine — reconnaissance vocale pour changement d'ambiance automatique.
 *
 * API publique :
 *   engine.start()   → démarre l'écoute (retourne false si non supporté)
 *   engine.stop()    → arrête l'écoute
 *   engine.toggle()  → bascule actif/inactif
 *
 * Callbacks :
 *   onPageDetected(index)  — index de page détecté dans book.pages
 *   onTranscript(text)     — dernier fragment reconnu
 *   onStateChange(state)   — 'listening' | 'idle' | 'denied'
 */
class SpeechEngine {
  constructor({ pages, onPageDetected, onTranscript, onStateChange }) {
    this.pages          = pages;
    this.onPageDetected = onPageDetected;
    this.onTranscript   = onTranscript;
    this.onStateChange  = onStateChange;

    this.recognition  = null;
    this.active       = false;
    this.buffer       = '';
    this.lastChangedAt = 0;

    // Paramètres de détection
    this.COOLDOWN_MS  = 7000;   // délai minimal entre deux changements
    this.BUFFER_CHARS = 600;    // taille max du buffer roulant
    this.MIN_MATCHES  = 2;      // mots-clés minimum pour déclencher
  }

  get supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  start() {
    if (!this.supported || this.active) return false;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous      = true;
    this.recognition.interimResults  = false;
    this.recognition.lang            = 'fr-FR';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + ' ';
      }
      if (!text.trim()) return;

      this.buffer = (this.buffer + ' ' + text).slice(-this.BUFFER_CHARS).toLowerCase();
      this.onTranscript?.(text.trim());
      this._detect();
    };

    // Redémarre automatiquement si l'écoute s'interrompt
    this.recognition.onend = () => {
      if (this.active) {
        setTimeout(() => {
          try { this.recognition?.start(); } catch (_) {}
        }, 250);
      }
    };

    this.recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.active = false;
        this.recognition = null;
        this.onStateChange?.('denied');
      }
      // Les erreurs 'no-speech' et 'aborted' sont silencieuses — onend relance
    };

    this.active = true;
    this.onStateChange?.('listening');
    try {
      this.recognition.start();
      return true;
    } catch (_) {
      this.active = false;
      this.onStateChange?.('idle');
      return false;
    }
  }

  stop() {
    this.active = false;
    this.buffer = '';
    try { this.recognition?.abort(); } catch (_) {}
    this.recognition = null;
    this.onStateChange?.('idle');
  }

  toggle() {
    return this.active ? (this.stop(), false) : this.start();
  }

  _detect() {
    if (Date.now() - this.lastChangedAt < this.COOLDOWN_MS) return;

    let bestIdx   = -1;
    let bestScore = 0;

    this.pages.forEach((page, i) => {
      const kws = page.keywords;
      if (!kws?.length) return;

      const hits  = kws.filter(kw => this.buffer.includes(kw.toLowerCase())).length;
      if (hits < this.MIN_MATCHES) return;

      const score = hits / kws.length;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });

    if (bestIdx >= 0) {
      this.lastChangedAt = Date.now();
      this.buffer        = '';  // repart d'un buffer propre après détection
      this.onPageDetected?.(bestIdx);
    }
  }
}

window.SpeechEngine = SpeechEngine;
