/**
 * SpeechEngine — reconnaissance vocale pour changement d'ambiance automatique.
 *
 * Deux modes de détection par page (priorité au premier disponible) :
 *   1. endTrigger  — mots de la dernière phrase : détection séquentielle,
 *                    avance toujours à la page suivante
 *   2. keywords    — scoring global sur toutes les pages (fallback)
 *
 * API publique :
 *   engine.start()              → démarre l'écoute
 *   engine.stop()               → arrête l'écoute
 *   engine.toggle()             → bascule actif/inactif
 *   engine.setCurrentPage(idx)  → synchronise la page courante
 *
 * Callbacks :
 *   onPageDetected(index)   — index cible dans book.pages
 *   onTranscript(text)      — dernier fragment reconnu
 *   onStateChange(state)    — 'listening' | 'idle' | 'denied'
 */
class SpeechEngine {
  constructor({ pages, onPageDetected, onTranscript, onStateChange }) {
    this.pages          = pages;
    this.onPageDetected = onPageDetected;
    this.onTranscript   = onTranscript;
    this.onStateChange  = onStateChange;

    this.recognition    = null;
    this.active         = false;
    this.buffer         = '';
    this.currentIdx     = 0;
    this.lastChangedAt  = 0;

    this.COOLDOWN_MS    = 5000;
    this.BUFFER_CHARS   = 500;
  }

  get supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  setCurrentPage(index) {
    this.currentIdx = index;
    this.buffer     = '';  // repart d'un buffer propre à chaque nouvelle page
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

    this.recognition.onend = () => {
      if (this.active) {
        setTimeout(() => { try { this.recognition?.start(); } catch (_) {} }, 250);
      }
    };

    this.recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.active = false;
        this.recognition = null;
        this.onStateChange?.('denied');
      }
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

    const page = this.pages[this.currentIdx];
    if (!page) return;

    // Mode 1 : endTrigger — surveille uniquement la fin de la page courante
    if (page.endTrigger?.length) {
      const hits = page.endTrigger.filter(w => this.buffer.includes(w.toLowerCase())).length;
      const needed = Math.min(2, page.endTrigger.length);
      if (hits >= needed) {
        const next = this.currentIdx + 1;
        if (next < this.pages.length) {
          this._trigger(next);
        }
      }
      return;
    }

    // Mode 2 : keywords — scoring global sur toutes les pages (fallback)
    let bestIdx = -1, bestScore = 0;
    this.pages.forEach((p, i) => {
      const kws = p.keywords;
      if (!kws?.length) return;
      const hits = kws.filter(kw => this.buffer.includes(kw.toLowerCase())).length;
      if (hits < 2) return;
      const score = hits / kws.length;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    if (bestIdx >= 0) this._trigger(bestIdx);
  }

  _trigger(index) {
    this.lastChangedAt = Date.now();
    this.buffer        = '';
    this.onPageDetected?.(index);
  }
}

window.SpeechEngine = SpeechEngine;
