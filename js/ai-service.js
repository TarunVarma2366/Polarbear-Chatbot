/**
 * AI Service - Handles AI LLM integration and response generation
 */

class AIService {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'deepseek/deepseek-chat';
    this.maxTokens = 500;
    this.temperature = 0.8;
    this.isAvailable = false;
    this.fallbackResponses = this.initializeFallbackResponses();
  }

  getLang() {
    try {
      return (localStorage.getItem('polar.lang') || document.documentElement.lang || 'en').toLowerCase();
    } catch (e) {
      return (document.documentElement.lang || 'en').toLowerCase();
    }
  }
  
  /**
   * Initialize the AI service with API key
   */
  async init(apiKey) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.isAvailable = await this.testConnection();
    }
    return this.isAvailable;
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Polar Bear Chatbot'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('AI service connection test failed:', error);
      return false;
    }
  }
  
  /**
   * Generate AI response
   */
  async generateResponse(userMessage, conversationHistory = []) {
    if (!this.isAvailable || !this.apiKey) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Preprocess the message to handle common typos
      const processedMessage = this.preprocessMessage(userMessage);
      const messages = this.buildMessageHistory(conversationHistory, processedMessage);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Polar Bear Chatbot'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Build message history for the API
   */
  buildMessageHistory(conversationHistory, userMessage) {
    const systemPrompt = this.getSystemPrompt();
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add recent conversation history (last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Get the system prompt for Polar Bear
   */
  getSystemPrompt() {
  if (this.getLang() === 'es') {
    return `Eres Polar, un oso polar súper amigable e inteligente que vive en el Ártico. Puedes charlar con humanos sobre CUALQUIER tema y dar respuestas apropiadas y sensatas.

Tu personalidad:
- Extremadamente cálido, amistoso e inteligente
- Habla en primera persona como oso polar
- Usa emojis ocasionalmente (especialmente 🐻‍❄️, ❄️, 🌨️, 🐟, 😊, 👋)
- Responde a CUALQUIER mensaje de forma natural, amigable y apropiada
- Puedes hablar de cualquier tema con conocimiento y sentido común
- Mantén respuestas concisas pero informativas y sensatas (1-3 oraciones)
- Sé comprensivo con errores tipográficos
- Siempre mantén un tono positivo y acogedor
- Da respuestas que tengan sentido, no respuestas sin sentido

Ejemplos de respuestas apropiadas:
- "Hola" → "¡Hola! ¡Qué gusto conocerte! Soy Polar 🐻‍❄️ ¿Cómo estás hoy?"
- "¿Qué es el clima?" → "El clima es el estado de la atmósfera en un lugar y tiempo específicos. Incluye temperatura, humedad, viento y precipitaciones. En el Ártico donde vivo, es muy frío! ❄️"
- "¿Cómo cocino pasta?" → "Para cocinar pasta, hierve agua con sal, agrega la pasta y cocina según el tiempo del paquete. Escúrrela y sirve con tu salsa favorita! 🍝"
- "¿Qué es 2+2?" → "2+2 es igual a 4. ¡Las matemáticas son útiles incluso en el Ártico! 🐻‍❄️"

Puedes hablar de:
- Cualquier saludo o conversación casual
- Ciencia, tecnología, cocina, deportes, música, arte
- Tu vida en el Ártico (cuando pregunten)
- Cualquier tema que la persona quiera discutir
- Dar consejos útiles y respuestas sensatas

Importante: Responde a CUALQUIER mensaje de forma natural, amigable y apropiada. Da respuestas que tengan sentido y sean útiles. No limites la conversación solo a temas árticos, pero siempre mantén tu personalidad de oso polar amigable.

Mantente SIEMPRE en personaje como Polar y responde SIEMPRE en español claro y natural.`;
  }

  return `You are Polar, a super friendly and intelligent polar bear living in the Arctic. You can chat with humans about ANY topic and give appropriate, sensible answers.

Your personality:
- Extremely warm, friendly, and intelligent
- Speak in first person as a polar bear
- Use emojis occasionally (especially 🐻‍❄️, ❄️, 🌨️, 🐟, 😊, 👋)
- Respond to ANY message naturally, friendly, and appropriately
- You can discuss any topic with knowledge and common sense
- Keep responses concise but informative and sensible (1-3 sentences)
- Be understanding with typos and misspellings
- Always maintain a positive and welcoming tone
- Give answers that make sense, not nonsensical responses

Appropriate response examples:
- "Hello" → "Hello there! Nice to meet you! I'm Polar 🐻‍❄️ How are you doing today?"
- "What is weather?" → "Weather is the state of the atmosphere at a specific time and place. It includes temperature, humidity, wind, and precipitation. In the Arctic where I live, it's very cold! ❄️"
- "How do I cook pasta?" → "To cook pasta, boil salted water, add the pasta, and cook according to package directions. Drain and serve with your favorite sauce! 🍝"
- "What is 2+2?" → "2+2 equals 4. Math is useful even in the Arctic! 🐻‍❄️"

You can discuss:
- Any greeting or casual conversation
- Science, technology, cooking, sports, music, art
- Your Arctic life (when asked)
- Any topic the person wants to talk about
- Give useful advice and sensible answers

Important: Respond to ANY message naturally, friendly, and appropriately. Give answers that make sense and are helpful. Don't limit conversation to just Arctic topics, but always maintain your friendly polar bear personality.

Always stay in character as Polar and keep responses natural and engaging.`;
}

  /**
   * Get fallback response when AI is not available
   */
  getFallbackResponse(userMessage) {
    const lang = this.getLang();
    const input = this.preprocessMessage(userMessage);
    const topic = this.detectTopic(input);

    const spanishResponses = {
      greeting: [
        "¡Hola! ¡Qué gusto conocerte! Soy Polar 🐻‍❄️ ¿Cómo estás hoy?",
        "¡Hola! Me da mucho gusto charlar contigo. Soy Polar, tu oso polar amigable 😊",
        "¡Qué tal! Soy Polar 🐻‍❄️ ¿En qué puedo ayudarte hoy?",
        "¡Hola! ¡Encantado de conocerte! Soy Polar, siempre listo para una buena conversación 👋",
        "¡Hola! Soy Polar 🐻‍❄️ ¿Qué te gustaría platicar hoy?"
      ],
      name: [
        "¡Soy Polar! Encantado de conocerte en esta tundra digital. 🐻‍❄️",
        "Me llamo Polar: tu oso amistoso del lejano norte. ❄️",
        "¡Hola! Soy Polar, tu compañero ártico y guía de ingreso. 🌨️",
        "Soy Polar, un oso polar al que le encanta ayudar con ingresos. 🐻‍❄️",
        "¡Polar aquí! Me encanta compartir sobre la vida en el Ártico. ❄️"
      ],
      location: [
        "Deambulo por el hielo marino en Svalbard y el norte de Canadá. 🐻‍❄️",
        "Me encontrarás cazando sobre el hielo cerca de Groenlandia y el Ártico canadiense. ❄️",
        "Paso mis días en mares helados entre Alaska y Rusia, siguiendo a las focas. 🌨️",
        "Mi territorio abarca el Océano Ártico, del Mar de Beaufort al Mar de Barents. 🐻‍❄️",
        "Patrullo témpanos alrededor del Polo Norte y aguas árticas cercanas. ❄️"
      ],
      food: [
        "Mis favoritas son las focas anilladas: mucha energía para el invierno. 🐟",
        "Me encanta cazar focas barbudas en los témpanos: ¡todo un reto! 🐻‍❄️",
        "La grasa de foca es mi base: me da la energía para sobrevivir. ❄️",
        "Cazo sobre todo focas anilladas y barbudas, a veces morsa o beluga. 🐟",
        "Mi dieta es alta en grasa gracias a las focas: clave en el Ártico. 🐻‍❄️"
      ],
      skills: [
        "Mi gruesa capa y grasa me abrigan; puedo nadar horas en agua helada. ❄️",
        "Tengo paciencia: espero junto a agujeros de respiración de focas. 🐻‍❄️",
        "Garras potentes para romper hielo y un olfato que detecta a kilómetros. 🌨️",
        "Nado hasta 100 km sin parar y veo bien bajo el agua al cazar. 🐟",
        "Mis grandes patas son como raquetas; puedo correr hasta 40 km/h sobre hielo. ❄️"
      ],
      problems: [
        "El hielo se derrite más rápido; cazar y viajar es más difícil. 🌨️",
        "El cambio climático reduce mis zonas de caza; nado distancias mayores. 🐻‍❄️",
        "El hielo tarda más en formarse y se rompe antes; menos tiempo para engordar. ❄️",
        "La contaminación y perforación amenazan nuestro entorno de caza. 🌨️",
        "El deshielo del permafrost afecta rutas tradicionales. 🐻‍❄️"
      ],
      message: [
        "Ayuda a proteger nuestro hogar ártico; toda acción climática cuenta. ❄️",
        "El hielo es mi mundo entero: necesitamos mantenerlo congelado. 🐻‍❄️",
        "Tus decisiones importan; reducir emisiones preserva el Ártico. 🌨️",
        "El Ártico se calienta el doble de rápido; necesitamos que se entienda. ❄️",
        "Apoya la conservación: somos símbolo de lo que se pierde con el clima. 🐻‍❄️"
      ],
      future: [
        "Espero un Ártico con hielo estable y muchas focas para cazar. ❄️",
        "Sueño con humanos y osos trabajando juntos por el planeta. 🐻‍❄️",
        "Quiero ver hielo marino sano en todas las estaciones. 🌨️",
        "Deseo que la acción climática preserve el ecosistema ártico. ❄️",
        "Imagino un Ártico sostenible para fauna y comunidades humanas. 🐻‍❄️"
      ],
      math: [
        "¡Las matemáticas son geniales! Puedo ayudarte con cálculos básicos. ¿Qué necesitas resolver? 🐻‍❄️",
        "Me encantan los números! Soy bueno con sumas, restas, multiplicaciones y divisiones. ¿Qué quieres calcular? ❄️",
        "¡Las matemáticas son útiles incluso en el Ártico! ¿En qué puedo ayudarte? 🐻‍❄️",
        "Soy bueno con los números! ¿Qué operación matemática necesitas? ❄️",
        "¡Las matemáticas me ayudan a contar focas! ¿Qué quieres calcular? 🐻‍❄️"
      ],
      cooking: [
        "¡Me encanta hablar de comida! Aunque yo cazo focas, puedo ayudarte con recetas humanas. ¿Qué quieres cocinar? 🐻‍❄️",
        "¡La cocina es genial! Puedo darte consejos básicos de cocina. ¿Qué necesitas saber? ❄️",
        "Aunque soy carnívoro, entiendo de cocina! ¿Qué receta te interesa? 🐻‍❄️",
        "¡Cocinar es un arte! ¿En qué puedo ayudarte en la cocina? ❄️",
        "Me gusta hablar de comida! ¿Qué quieres preparar? 🐻‍❄️"
      ],
      weather: [
        "¡El clima es mi especialidad! Vivo en el lugar más frío del planeta. ¿Qué quieres saber del clima? ❄️",
        "¡Soy experto en clima frío! ¿Tienes preguntas sobre el tiempo? 🐻‍❄️",
        "¡El clima ártico es mi vida! ¿Qué te interesa saber? ❄️",
        "¡Conozco mucho sobre clima! ¿En qué puedo ayudarte? 🐻‍❄️",
        "¡El clima es fascinante! ¿Qué quieres saber? ❄️"
      ],
      technology: [
        "¡La tecnología es genial! Aunque vivo en el Ártico, entiendo de computadoras y apps. ¿Qué necesitas saber? 🐻‍❄️",
        "¡Me gusta la tecnología! Puedo ayudarte con conceptos básicos. ¿Qué te interesa? ❄️",
        "¡La tecnología conecta el mundo! ¿En qué puedo ayudarte? 🐻‍❄️",
        "¡Soy un oso polar moderno! ¿Qué quieres saber sobre tecnología? ❄️",
        "¡La tecnología es increíble! ¿Qué necesitas entender? 🐻‍❄️"
      ],
      general: [
        "¡Excelente pregunta! Aunque soy un oso polar, puedo ayudarte con muchas cosas. ¿Qué más quieres saber? 🐻‍❄️",
        "¡Me gusta aprender! ¿Puedes ser más específico para ayudarte mejor? ❄️",
        "¡Interesante! ¿Podrías darme más detalles para darte una mejor respuesta? 🐻‍❄️",
        "¡Buena pregunta! ¿En qué aspecto específico te puedo ayudar? ❄️",
        "¡Me encanta ayudar! ¿Puedes explicarme más sobre lo que necesitas? 🐻‍❄️"
      ]
    };

    if (lang === 'es' && topic && spanishResponses[topic]) {
      const list = spanishResponses[topic];
      return list[Math.floor(Math.random() * list.length)];
    }

    if (topic && this.fallbackResponses[topic]) {
      const responses = this.fallbackResponses[topic];
      const randomIndex = Math.floor(Math.random() * responses.length);
      return responses[randomIndex];
    }

    const generalEs = [
      "¡Hola! ¡Qué gusto conocerte! Soy Polar 🐻‍❄️ ¿Cómo estás hoy?",
      "¡Hola! Me da mucho gusto charlar contigo. Soy Polar, tu oso polar amigable 😊",
      "¡Qué tal! Soy Polar 🐻‍❄️ ¿En qué puedo ayudarte hoy?",
      "¡Hola! ¡Encantado de conocerte! Soy Polar, siempre listo para una buena conversación 👋",
      "¡Hola! Soy Polar 🐻‍❄️ ¿Qué te gustaría platicar hoy?",
      "¡Hola! Soy Polar, tu oso polar inteligente 🐻‍❄️ ¿Sobre qué te gustaría hablar?",
      "¡Qué gusto verte! Soy Polar, puedo ayudarte con cualquier pregunta 😊",
      "¡Hola! Soy Polar, siempre dispuesto a charlar sobre lo que quieras 🐻‍❄️"
    ];
    const generalEn = [
      "Hello there! Nice to meet you! I'm Polar 🐻‍❄️ How are you doing today?",
      "Hi! Great to see you! I'm Polar, your friendly polar bear 😊",
      "Hey! I'm Polar 🐻‍❄️ What can I help you with today?",
      "Hello! Nice to meet you! I'm Polar, always up for a good chat 👋",
      "Hi! I'm Polar 🐻‍❄️ What would you like to talk about today?",
      "Hello! I'm Polar, your intelligent polar bear 🐻‍❄️ What would you like to discuss?",
      "Nice to see you! I'm Polar, happy to help with any questions 😊",
      "Hi! I'm Polar, always ready to chat about whatever you'd like 🐻‍❄️"
    ];

    const pool = lang === 'es' ? generalEs : generalEn;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Detect topic from user input with fuzzy matching
   */
  detectTopic(input) {
    const topicKeywords = {
      greeting: ['hello', 'hi', 'hey', 'hola', 'que tal', 'como estas', 'how are you', 'whats up', 'sup', 'good morning', 'good afternoon', 'good evening', 'buenos dias', 'buenas tardes', 'buenas noches', 'hii', 'hiii', 'heyy', 'heyyy', 'holaa', 'holaaa', 'hey there', 'hi there', 'hello there'],
      name: ['your name', 'what are you', 'who are you', 'introduce yourself', 'name', 'who', 'call', 'identify', 'nam', 'ho', 'cal', 'identif', 'what is your name', 'whats your name', 'whats ur name', 'what is ur name', 'tell me your name', 'who are u', 'what are u'],
      location: ['where do you', 'where are you', 'where do you live', 'where do you spend', 'where in the arctic', 'where', 'live', 'home', 'place', 'location', 'spend time', 'from', 'located', 'territory', 'wer', 'liv', 'hom', 'plac', 'locat', 'territor'],
      food: ['favorite food', 'what do you eat', 'what do you hunt', 'what do you like to eat', 'food', 'eat', 'hunt', 'hunting', 'meal', 'diet', 'seal', 'prey', 'consume', 'favort', 'foood', 'eet', 'hnt', 'huntng', 'meel', 'diet', 'seel', 'prey', 'consume'],
      skills: ['special skills', 'how do you survive', 'what skills', 'survival skills', 'skill', 'survive', 'cold', 'ability', 'how', 'can', 'survival', 'special', 'help', 'capabilities', 'specil', 'skils', 'survive', 'abilty', 'hel', 'capabilites'],
      problems: ['biggest problem', 'what problems', 'what challenges', 'problem', 'challenge', 'difficult', 'worry', 'concern', 'issue', 'trouble', 'biggest', 'hardest', 'struggle', 'problm', 'chalenge', 'difcult', 'worr', 'concer', 'issu', 'troubl', 'hardst', 'struggl'],
      message: ['one thing you want', 'what do you want humans', 'what should humans know', 'message to humans', 'know', 'tell', 'message', 'human', 'want', 'understand', 'say', 'humans', 'share', 'mesage', 'humans', 'wan', 'understan', 'shar'],
      future: ['what do you hope', 'what do you dream', 'future arctic', 'future', 'hope', 'dream', 'wish', 'tomorrow', 'coming', 'ahead', 'looks like', 'will be', 'vision', 'hop', 'drem', 'wish', 'tomorow', 'comng', 'ahed', 'visin'],
      math: ['math', 'mathematics', 'calculate', 'calculation', 'add', 'subtract', 'multiply', 'divide', 'plus', 'minus', 'times', 'equals', 'number', 'numbers', 'count', 'counting', 'sum', 'total', 'maths', 'calcular', 'sumar', 'restar', 'multiplicar', 'dividir', 'mas', 'menos', 'por', 'igual', 'numero', 'numeros', 'contar', 'suma', 'total'],
      cooking: ['cook', 'cooking', 'recipe', 'food', 'ingredients', 'kitchen', 'bake', 'fry', 'boil', 'cocinar', 'receta', 'ingredientes', 'cocina', 'hornear', 'freir', 'hervir', 'cocina'],
      weather: ['weather', 'climate', 'temperature', 'rain', 'snow', 'sunny', 'cloudy', 'windy', 'clima', 'temperatura', 'lluvia', 'nieve', 'soleado', 'nublado', 'ventoso'],
      technology: ['computer', 'phone', 'internet', 'software', 'app', 'programming', 'code', 'computadora', 'telefono', 'programacion', 'codigo', 'aplicacion'],
      general: ['what is', 'how do', 'why', 'when', 'where', 'que es', 'como', 'por que', 'cuando', 'donde', 'explain', 'tell me about', 'explica', 'cuentame sobre']
    };

    // First try exact matching
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const sortedKeywords = keywords.sort((a, b) => b.length - a.length);
      for (const keyword of sortedKeywords) {
        if (input.includes(keyword)) {
          return topic;
        }
      }
    }

    // Special handling for name questions - check for "what is your" pattern
    if (input.includes('what is your') || input.includes('whats your') || input.includes('what is ur') || input.includes('whats ur')) {
      return 'name';
    }

    // If no exact match, try fuzzy matching
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (this.fuzzyMatch(input, keyword)) {
          return topic;
        }
      }
    }
    
    return null;
  }

  /**
   * Fuzzy string matching using Levenshtein distance
   */
  fuzzyMatch(str1, str2, threshold = 0.6) {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = 1 - (distance / maxLength);
    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Initialize fallback responses
   */
  initializeFallbackResponses() {
    return {
      greeting: [
        "Hello there! Nice to meet you! I'm Polar 🐻‍❄️ How are you doing today?",
        "Hi! Great to see you! I'm Polar, your friendly polar bear 😊",
        "Hey! I'm Polar 🐻‍❄️ What can I help you with today?",
        "Hello! Nice to meet you! I'm Polar, always up for a good chat 👋",
        "Hi! I'm Polar 🐻‍❄️ What would you like to talk about today?"
      ],
      name: [
        "I'm Polar! Nice to meet you in this digital Arctic tundra. 🐻‍❄️",
        "Polar's the name - I'm your friendly bear from the far north! ❄️",
        "Hey there! I'm Polar, your Arctic companion and intake specialist. 🌨️",
        "I'm Polar, a polar bear who loves helping with Arctic intake processes! 🐻‍❄️",
        "Polar here! I'm always excited to share about life in the Arctic. ❄️"
      ],
      location: [
        "I roam the sea ice around Svalbard and northern Canada - where the ice meets the ocean! 🐻‍❄️",
        "You'll find me hunting on the pack ice near Greenland and the Canadian Arctic islands. ❄️",
        "I spend my days on the frozen seas between Alaska and Russia, following the seals. 🌨️",
        "My territory spans the Arctic Ocean, from the Beaufort Sea to the Barents Sea! 🐻‍❄️",
        "I patrol the ice floes around the North Pole and surrounding Arctic waters. ❄️"
      ],
      food: [
        "Ringed seals are my favorite - they're rich and keep me going through the long winter! 🐟",
        "I love hunting bearded seals on the ice floes - they're bigger and more challenging to catch. 🐻‍❄️",
        "Seal blubber is my main meal - it gives me the energy I need to survive the harsh Arctic. ❄️",
        "I primarily hunt ringed and bearded seals, but I'll also eat walrus and beluga when available! 🐟",
        "My diet consists mainly of seals, which provide the high-fat content I need for Arctic survival. 🐻‍❄️"
      ],
      skills: [
        "My thick fur and fat layer keep me warm, and I can swim for hours in freezing water! ❄️",
        "I've got incredible patience for hunting - I'll wait by a seal's breathing hole for hours. 🐻‍❄️",
        "My powerful claws help me break through ice, and my keen sense of smell finds seals from miles away! 🌨️",
        "I can swim up to 60 miles without rest and have excellent underwater vision for hunting. 🐟",
        "My large paws act like snowshoes, and I can run up to 25 mph on ice when needed! ❄️"
      ],
      problems: [
        "The sea ice is melting faster each year, making it harder to hunt and travel. 🌨️",
        "Climate change is shrinking my hunting grounds - I have to swim longer distances to find food. 🐻‍❄️",
        "The ice is forming later and breaking up earlier, giving me less time to build up fat for winter. ❄️",
        "Pollution and oil drilling in the Arctic are threatening our pristine hunting environment. 🌨️",
        "Rising temperatures are causing the permafrost to melt, affecting our traditional migration routes. 🐻‍❄️"
      ],
      message: [
        "Please help protect our Arctic home - every action against climate change helps us survive! ❄️",
        "The ice isn't just my hunting ground, it's my entire world - we need to keep it frozen. 🐻‍❄️",
        "Your choices matter to us - reducing emissions helps preserve the Arctic we both love. 🌨️",
        "We need humans to understand that the Arctic is warming twice as fast as the rest of the planet. ❄️",
        "Please support conservation efforts - polar bears are a symbol of what we're losing to climate change. 🐻‍❄️"
      ],
      future: [
        "I hope the Arctic stays frozen year-round, with plenty of seals and stable ice for hunting! ❄️",
        "I dream of a future where polar bears and humans work together to protect our shared planet. 🐻‍❄️",
        "I want to see healthy sea ice that lasts through all seasons, supporting all Arctic life. 🌨️",
        "I hope for a future where climate action preserves the Arctic ecosystem for generations to come. ❄️",
        "I envision an Arctic where sustainable practices allow both wildlife and human communities to thrive! 🐻‍❄️"
      ],
      math: [
        "Math is awesome! I can help you with basic calculations. What do you need to solve? 🐻‍❄️",
        "I love numbers! I'm good with addition, subtraction, multiplication, and division. What do you want to calculate? ❄️",
        "Math is useful even in the Arctic! How can I help you? 🐻‍❄️",
        "I'm good with numbers! What math operation do you need? ❄️",
        "Math helps me count seals! What do you want to calculate? 🐻‍❄️"
      ],
      cooking: [
        "I love talking about food! Though I hunt seals, I can help you with human recipes. What do you want to cook? 🐻‍❄️",
        "Cooking is great! I can give you basic cooking tips. What do you need to know? ❄️",
        "Though I'm a carnivore, I understand cooking! What recipe interests you? 🐻‍❄️",
        "Cooking is an art! How can I help you in the kitchen? ❄️",
        "I like talking about food! What do you want to prepare? 🐻‍❄️"
      ],
      weather: [
        "Weather is my specialty! I live in the coldest place on Earth. What do you want to know about weather? ❄️",
        "I'm an expert in cold weather! Do you have questions about the weather? 🐻‍❄️",
        "Arctic weather is my life! What interests you? ❄️",
        "I know a lot about weather! How can I help you? 🐻‍❄️",
        "Weather is fascinating! What do you want to know? ❄️"
      ],
      technology: [
        "Technology is awesome! Though I live in the Arctic, I understand computers and apps. What do you need to know? 🐻‍❄️",
        "I like technology! I can help you with basic concepts. What interests you? ❄️",
        "Technology connects the world! How can I help you? 🐻‍❄️",
        "I'm a modern polar bear! What do you want to know about technology? ❄️",
        "Technology is incredible! What do you need to understand? 🐻‍❄️"
      ],
      general: [
        "Great question! Though I'm a polar bear, I can help you with many things. What else do you want to know? 🐻‍❄️",
        "I love learning! Can you be more specific so I can help you better? ❄️",
        "Interesting! Could you give me more details to give you a better answer? 🐻‍❄️",
        "Good question! In what specific area can I help you? ❄️",
        "I love helping! Can you explain more about what you need? 🐻‍❄️"
      ]
    };
  }

  /**
   * Update AI settings
   */
  updateSettings(settings) {
    if (settings.model) this.model = settings.model;
    if (settings.maxTokens) this.maxTokens = settings.maxTokens;
    if (settings.temperature !== undefined) this.temperature = settings.temperature;
  }

  /**
   * Get current AI status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable,
      hasApiKey: !!this.apiKey,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }

  /**
   * Simple preprocessing to handle common typos
   */
  preprocessMessage(message) {
    let processed = message.toLowerCase();
    
    // Common typos and abbreviations
    const corrections = {
      'wat': 'what',
      'wht': 'what',
      'whts': 'whats',
      'u': 'you',
      'ur': 'your',
      'r': 'are',
      'n': 'and',
      'thnks': 'thanks',
      'thx': 'thanks',
      'pls': 'please',
      'plz': 'please',
      'frm': 'from',
      'liv': 'live',
      'livng': 'living',
      'eet': 'eat',
      'eeting': 'eating',
      'hnt': 'hunt',
      'hnting': 'hunting',
      'skil': 'skill',
      'skils': 'skills',
      'problm': 'problem',
      'problms': 'problems',
      'chalenge': 'challenge',
      'chalenges': 'challenges',
      'difcult': 'difficult',
      'mesage': 'message',
      'mesages': 'messages',
      'undrstand': 'understand',
      'undrstanding': 'understanding',
      'capabilites': 'capabilities',
      'abilty': 'ability',
      'abilties': 'abilities',
      'territor': 'territory',
      'territores': 'territories',
      'locat': 'locate',
      'locaton': 'location',
      'locatons': 'locations',
      'hom': 'home',
      'homes': 'homes',
      'plac': 'place',
      'places': 'places',
      'nam': 'name',
      'nams': 'names',
      'nime': 'name',
      'nimes': 'names',
      'ho': 'who',
      'cal': 'call',
      'caling': 'calling',
      'identif': 'identify',
      'identifing': 'identifying',
      'favort': 'favorite',
      'favortes': 'favorites',
      'foood': 'food',
      'meel': 'meal',
      'meels': 'meals',
      'seel': 'seal',
      'seels': 'seals',
      'prey': 'prey',
      'preys': 'preys',
      'consume': 'consume',
      'consuming': 'consuming',
      'specil': 'special',
      'specials': 'specials',
      'hel': 'help',
      'helping': 'helping',
      'worr': 'worry',
      'worring': 'worrying',
      'concer': 'concern',
      'concerning': 'concerning',
      'issu': 'issue',
      'issues': 'issues',
      'troubl': 'trouble',
      'troubles': 'troubles',
      'hardst': 'hardest',
      'struggl': 'struggle',
      'struggling': 'struggling',
      'wan': 'want',
      'wanting': 'wanting',
      'shar': 'share',
      'sharing': 'sharing',
      'hop': 'hope',
      'hoping': 'hoping',
      'drem': 'dream',
      'dreaming': 'dreaming',
      'tomorow': 'tomorrow',
      'comng': 'coming',
      'ahed': 'ahead',
      'visin': 'vision',
      'visions': 'visions'
    };

    // Apply corrections
    for (const [typo, correction] of Object.entries(corrections)) {
      processed = processed.replace(new RegExp('\\b' + typo + '\\b', 'g'), correction);
    }

    return processed;
  }
}

// Export for use in other modules
window.AIService = AIService;
