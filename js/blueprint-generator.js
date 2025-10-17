/**
 * Blueprint Generator - Builds a 7-section conversation blueprint from chat history
 */
(function () {
  class BlueprintGenerator {
    constructor() {
      this.maxItemsPerSection = 3;
      this.sectionsOrder = [
        { key: 'identity', i18n: 'blueprint.sections.identity' },
        { key: 'habitat', i18n: 'blueprint.sections.habitat' },
        { key: 'diet', i18n: 'blueprint.sections.diet' },
        { key: 'skills', i18n: 'blueprint.sections.skills' },
        { key: 'challenges', i18n: 'blueprint.sections.challenges' },
        { key: 'message', i18n: 'blueprint.sections.message' },
        { key: 'future', i18n: 'blueprint.sections.future' }
      ];

      // Simple keyword maps for EN/ES
      this.keywords = {
        identity: [
          // EN
          'your name', 'name', 'who are you', 'who are u', 'who are', 'introduce', 'identity',
          // ES
          'cómo te llamas', 'como te llamas', 'nombre', 'quién eres', 'quien eres', 'te llamas'
        ],
        habitat: [
          // EN
          'where do you live', 'where are you', 'where in the arctic', 'where', 'live', 'home', 'location', 'habitat', 'territory', 'sea ice', 'ice floes', 'north', 'arctic',
          // ES
          'dónde vives', 'donde vives', 'vives', 'hogar', 'lugar', 'hábitat', 'habitat', 'territorio', 'ártico', 'artico', 'hielo'
        ],
        diet: [
          // EN
          'what do you eat', 'eat', 'food', 'diet', 'meal', 'hunt', 'hunting', 'prey', 'seal', 'seals', 'blubber', 'fish',
          // ES
          'qué comes', 'que comes', 'comes', 'comer', 'comida', 'dieta', 'cazar', 'caza', 'presa', 'presas', 'foca', 'focas'
        ],
        skills: [
          // EN
          'skills', 'special skills', 'survive', 'survival', 'adapt', 'adaptation', 'adaptations', 'ability', 'abilities', 'fur', 'swim', 'paws', 'claws', 'smell', 'run', 'fast', 'strong',
          // ES
          'habilidades', 'especiales', 'sobrevives', 'sobrevivir', 'adaptaciones', 'adaptación', 'adaptacion', 'capacidad', 'capacidades', 'pelaje', 'nadar', 'patas', 'garras', 'olfato', 'correr'
        ],
        challenges: [
          // EN
          'biggest problem', 'what problems', 'what challenges', 'problem', 'problems', 'challenge', 'challenges', 'difficult', 'concern', 'issue', 'trouble', 'hardest', 'struggle', 'melting', 'climate change', 'warming', 'ice is', 'sea ice',
          // ES
          'mayor problema', 'problema', 'problemas', 'desafío', 'desafios', 'desafío', 'desafíos', 'dificultad', 'preocupación', 'preocupaciones', 'calentamiento', 'cambio climático', 'cambio climatico', 'deshielo', 'hielo'
        ],
        message: [
          // EN
          'message to humans', 'what should humans know', 'what do you want humans', 'humans should', 'tell humans', 'message', 'humans', 'people should',
          // ES
          'mensaje a los humanos', 'mensaje para los humanos', 'humanos deben', 'qué quieres que los humanos', 'que quieres que los humanos', 'mensaje', 'humanos'
        ],
        future: [
          // EN
          'what do you hope', 'hope', 'dream', 'future', 'vision', 'wish', 'tomorrow', 'ahead',
          // ES
          'futuro', 'esperas', 'esperanza', 'sueñas', 'sueños', 'sueños', 'sueño', 'deseas', 'deseo', 'mañana'
        ]
      };

      this.lastSectionsSource = null; // stores un-translated sentences
      this.translationCache = new Map(); // key: JSON.stringify(sections)+lang
    }

    getCurrentLanguage() {
      try {
        return (localStorage.getItem('polar.lang') || document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      } catch (_) {
        return (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      }
    }

    async getLatestMessages() {
      const app = window.polarBearApp;
      if (app && app.chatManager && Array.isArray(app.chatManager.messages) && app.chatManager.messages.length > 0) {
        return app.chatManager.messages;
      }

      try {
        if (app && app.databaseManager) {
          const sessionId = app.databaseManager.getSessionId();
          const convos = await app.databaseManager.getConversationsBySession(sessionId);
          if (Array.isArray(convos) && convos.length > 0) {
            const latest = convos[convos.length - 1];
            return Array.isArray(latest.messages) ? latest.messages : [];
          }
        }
        } catch (_) {}

      return [];
    }

    splitIntoSentences(text) {
      const normalized = (text || '').replace(/\s+/g, ' ').trim();
      if (!normalized) return [];
      // Compatible sentence splitter without lookbehind
      const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
      return matches ? matches.map(s => s.trim()).filter(Boolean) : [normalized];
    }

    detectSectionForText(textLower) {
      for (const [section, terms] of Object.entries(this.keywords)) {
        for (const term of terms) {
          if (textLower.includes(term)) return section;
        }
      }
      return null;
    }

    buildSections(messages) {
      const sections = {
        identity: new Set(),
        habitat: new Set(),
        diet: new Set(),
        skills: new Set(),
        challenges: new Set(),
        message: new Set(),
        future: new Set()
      };
      const assistantMessages = messages.filter(m => (m && (m.role === 'assistant' || m.role === 'bot')));

      for (const msg of assistantMessages) {
        const sentences = this.splitIntoSentences(msg.content || '');
        for (const sentence of sentences) {
          const section = this.detectSectionForText(sentence.toLowerCase());
          if (section && sections[section]) {
            if (sections[section].size < this.maxItemsPerSection) {
              sections[section].add(sentence);
            }
          }
        }
      }

      // Convert sets to arrays for rendering
      const result = {};
      for (const key of Object.keys(sections)) {
        result[key] = Array.from(sections[key]);
      }
      return result;
    }

    async maybeTranslateSections(sections, targetLang) {
      const lang = (targetLang || this.getCurrentLanguage()).toLowerCase();
      if (!sections) return sections;

      // If no items, nothing to translate
      const totalCount = Object.values(sections).reduce((n, arr) => n + (arr ? arr.length : 0), 0);
      if (totalCount === 0) return sections;

      const cacheKey = JSON.stringify(sections) + '::' + lang;
      if (this.translationCache.has(cacheKey)) {
        return this.translationCache.get(cacheKey);
      }

      // Only English and Spanish supported
      if (lang !== 'en' && lang !== 'es') {
        return sections;
      }

      // Use AI translation if available; otherwise return original
      const cfg = this.getAIConfig();
      if (!cfg || !cfg.apiKey) {
        return sections; // offline/no key -> skip translating notes
      }

      try {
        const translated = await this.translateViaOpenRouter(sections, lang, cfg);
        if (translated && typeof translated === 'object') {
          this.translationCache.set(cacheKey, translated);
          return translated;
        }
      } catch (_) {}

      return sections;
    }

    getAIConfig() {
      try {
        const svc = window.polarBearApp && window.polarBearApp.aiService;
        if (!svc) return null;
        return { apiKey: svc.apiKey, baseURL: svc.baseURL, model: svc.model };
      } catch (_) { return null; }
    }

    async translateViaOpenRouter(sections, lang, cfg) {
      const targetName = lang === 'es' ? 'Spanish' : 'English';
      const payload = sections;
      const system = `You are a precise translation engine. Translate ONLY the string values in the provided JSON to ${targetName}. Keep emojis and punctuation. Preserve array lengths and keys. Return VALID JSON, no commentary.`;
      const user = JSON.stringify({ targetLang: targetName, sections: payload });

      const response = await fetch(`${cfg.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Polar Bear Chatbot'
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          max_tokens: 800,
          temperature: 0.2
        })
      });
      if (!response.ok) throw new Error('translation http error');
      const data = await response.json();
      const content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      // Try to locate JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonText);
      const out = parsed.sections || parsed; // support either shape

      // Validate structure: ensure same keys and arrays
      const result = {};
      for (const key of Object.keys(sections)) {
        const arr = Array.isArray(out[key]) ? out[key] : sections[key];
        result[key] = arr.map(x => String(x));
      }
      return result;
    }

    renderBlueprint(sections) {
      const container = document.getElementById('blueprintContainer');
      if (!container) return;

      const now = new Date();
      const timeString = now.toLocaleString();

      // Build HTML
      const hasAny = Object.values(sections).some(arr => Array.isArray(arr) && arr.length > 0);

      let html = '';
      html += '<div class="blueprint-header">';
      html += '<h2 data-i18n="blueprint.title">Conversation Blueprint</h2>';
      html += '<div class="blueprint-meta"><span data-i18n="blueprint.generatedAt">Generated at</span>: ' + this.escapeHtml(timeString) + '</div>';
      html += '<div style="margin-left:auto; display:flex; gap:8px;">';
      html += '<button type="button" class="blueprint-toggle" data-i18n="blueprint.collapse">Collapse</button>';
      html += '<button type="button" class="blueprint-close" data-i18n="blueprint.close">Close</button>';
      html += '</div>';
      html += '</div>';

      if (!hasAny) {
        html += '<div class="blueprint-empty" data-i18n="blueprint.noData">No conversation yet. Send a message first.</div>';
      } else {
        html += '<div class="blueprint-grid">';
        for (const section of this.sectionsOrder) {
          html += '<div class="blueprint-card">';
          html += '<h3 data-i18n="' + section.i18n + '">' + this.escapeHtml(section.key) + '</h3>';
          const items = sections[section.key] || [];
          if (items.length === 0) {
            html += '<p class="blueprint-none">—</p>';
          } else {
            html += '<ul class="blueprint-list">';
            for (const item of items) {
              html += '<li>' + this.escapeHtml(item) + '</li>';
            }
            html += '</ul>';
          }
          html += '</div>';
        }
        html += '</div>';
      }

      // Optional closing reflection
      html += '<p class="blueprint-reflection" data-i18n="blueprint.reflection">Here\'s what I learned about the polar bear today.</p>';

      container.innerHTML = html;
      container.style.display = 'block';

      // Wire close button
      const closeBtn = container.querySelector('.blueprint-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          container.style.display = 'none';
          container.innerHTML = '';
        });
      }

      const toggleBtn = container.querySelector('.blueprint-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const isCollapsed = container.classList.toggle('collapsed');
          // Update button label i18n key after DOM change
          toggleBtn.setAttribute('data-i18n', isCollapsed ? 'blueprint.expand' : 'blueprint.collapse');
          const lang = this.getCurrentLanguage();
          if (window.applyTranslations) window.applyTranslations(lang);
        });
      }

      // Re-apply translations for newly injected nodes
      const lang = this.getCurrentLanguage();
      if (window.applyTranslations) {
        window.applyTranslations(lang);
      }

      // Scroll into view for convenience
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    async handleGenerateClick() {
      const messages = await this.getLatestMessages();
      const sections = this.buildSections(messages);
      this.lastSectionsSource = sections;

      const container = document.getElementById('blueprintContainer');
      if (container) {
        container.style.display = 'block';
        container.innerHTML = '<div class="blueprint-header"><h2 data-i18n="blueprint.title">Conversation Blueprint</h2><div class="blueprint-meta" data-i18n="blueprint.translating">Translating notes...</div></div>';
        const lang1 = this.getCurrentLanguage();
        if (window.applyTranslations) window.applyTranslations(lang1);
      }

      const lang = this.getCurrentLanguage();
      const localized = await this.maybeTranslateSections(sections, lang);
      this.renderBlueprint(localized);
    }

    async reRenderForLanguage(lang) {
      if (!this.lastSectionsSource) return;
      const localized = await this.maybeTranslateSections(this.lastSectionsSource, lang);
      this.renderBlueprint(localized);
    }
  }

  function setupBlueprintButton() {
    const button = document.getElementById('blueprintButton');
    if (!button) return;

    const generator = new BlueprintGenerator();
    // Initialize aria-expanded state
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      const container = document.getElementById('blueprintContainer');
      if (container) {
        const isVisible = window.getComputedStyle(container).display !== 'none' && container.innerHTML.trim() !== '';
        if (isVisible) {
          container.style.display = 'none';
          container.innerHTML = '';
          button.setAttribute('aria-expanded', 'false');
          return;
        }
      }
      generator.handleGenerateClick();
      button.setAttribute('aria-expanded', 'true');
    });

    // On language toggle, re-render notes into the selected language if visible
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        setTimeout(async () => {
          const container = document.getElementById('blueprintContainer');
          if (!container) return;
          const isVisible = window.getComputedStyle(container).display !== 'none' && container.innerHTML.trim() !== '';
          if (!isVisible) return;
          const lang = generator.getCurrentLanguage();
          await generator.reRenderForLanguage(lang);
        }, 0);
      });
    }

    // Expose for debugging
    window.BlueprintGenerator = generator;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupBlueprintButton);
  } else {
    setupBlueprintButton();
  }
})();
