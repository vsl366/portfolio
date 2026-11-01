/* =====================================================================
   SITE CONTENT — edit everything here (shared by every page).
   No build step: just save and refresh.
   ===================================================================== */
const SITE = {
  name: "Vishal S",
  first: "Vishal",
  email: "vishalsubramoniam@gmail.com",
  status: "CS @ SSN · Data Science @ IIT-M",
  roles: ["ML research.", "games in C.", "web apps.", "slick interfaces.", "things that feel alive."],

  // Shown word-by-word as you scroll through the About section.
  story:
    "I'm a curious, introspective CS student who lives where logic meets creativity. " +
    "By day I build APIs, train models and chase bugs. " +
    "By night I sketch, take photos and play classical piano. " +
    "I like problems that make me think twice, and things that make people look twice.",

  stats: [
    { value: 8.53, decimals: 2, suffix: "", label: "CGPA · SSN CSE" },
    { value: 8.25, decimals: 2, suffix: "", label: "CGPA · IIT Madras" },
    { value: 3, decimals: 0, suffix: "", label: "Research papers" },
    { value: 2, decimals: 0, prefix: "#", suffix: "", label: "IBM Z Datathon, of 1384" },
  ],

  // The three heads (left → right). Each one links to that side of me.
  sides: [
    { key: "brahma", deity: "Brahma", role: "Creation", title: "Art", sub: "Sketch · Paint · Photo", href: "art.html" },
    { key: "vishnu", deity: "Vishnu", role: "Preservation", title: "Code", sub: "Research · Systems", href: "#work" },
    { key: "shiva", deity: "Shiva", role: "Rhythm", title: "Piano", sub: "Classical · Keys", href: "piano.html" },
  ],

  marqueeA: ["Python", "PyTorch", "TensorFlow", "Hugging Face", "LangChain", "FAISS", "Scikit-learn", "Pandas", "Docker"],
  marqueeB: ["Java", "C", "SQL", "React", "Vue", "Spring Boot", "Flask", "Node", "Redis", "Celery", "GitLab CI"],

  // scene = palette of the little parallax landscape on each card (night, lilac, dusk, ember, dawn).
  // emblem: "pac" draws a Pac-Man on the card. link "play.html" opens the game.
  projects: [
    // row 1: research
    { title: "VQA in GI Images", kind: "Research · MediaEval 2025, ranked 1st", desc: "Benchmarked PaliGemma, Florence-2 and BLIP-2 on 159k medical Q&A pairs with LoRA fine-tuning. BLEU 0.5, ROUGE 0.71.", tags: ["VLMs", "LoRA", "PyTorch"], scene: "night", link: "#" },
    { title: "Multimodal Emotion Detection", kind: "Research · SemEval 2025", desc: "An ensemble of transformers with custom scoring from POS tags, lexical rules and extremity scores. 70% F1.", tags: ["Transformers", "Ensembles"], scene: "dusk", link: "#" },
    { title: "Fake News Detection", kind: "Research · SPELLL 2024", desc: "BERT-family classifiers for Dravidian languages at 96% average accuracy, and how sentiment extremeness affects them.", tags: ["BERT", "NLP"], scene: "lilac", link: "#" },
    // row 2: things I built (Pac-Man in the middle)
    { title: "Document Intelligence", kind: "Platform", desc: "Multilingual handwritten documents through OCR, vector search and alerting, with RAG-powered summaries and Q&A.", tags: ["OCR", "RAG", "FAISS"], scene: "lilac", link: "#" },
    { title: "Pac-Man in C", kind: "Game · Team 2, SSN CSE", desc: "A faithful Pac-Man in Raylib with a custom SSN CSE maze and BFS multi-goal ghosts. Now playable in the browser.", tags: ["C", "Raylib", "BFS"], scene: "ember", emblem: "pac", link: "play.html", cta: "Play it in your browser" },
    { title: "Efficient Graph Transformers", kind: "Research project", desc: "Learned discrete token selection to cut quadratic attention cost, benchmarked on mesh-based PDE surrogates.", tags: ["PyTorch", "Graphs"], scene: "night", link: "#" },
    // row 3: data and products
    { title: "IBM Z Datathon '25", kind: "Global 2nd of 1384 teams", desc: "A multi-model time-series pipeline forecasting demand in public kitchens. 90% score (1-MAPE) and a $750 prize.", tags: ["Time series", "Python"], scene: "dawn", link: "#" },
    { title: "Forte Furniture Analytics", kind: "Business analytics", desc: "3 lakh+ rows of sales data. ABC classification and SARIMA forecasting projected up to 10% lower holding costs.", tags: ["SARIMA", "Pandas"], scene: "dusk", link: "#" },
    { title: "Full-stack Quiz App", kind: "Web app", desc: "Timed quizzes, results and a leaderboard, with Celery and Redis handling background jobs.", tags: ["Flask", "Celery", "Redis"], scene: "lilac", link: "#" },
  ],

  journey: [
    { when: "Jun to Sep 2026", role: "GSoC '26 contributor", org: "German Center for Open Source AI", desc: "Fixed anti-conservative p-values for smooth terms in pyGAM with Wood's Wald test, matching R's mgcv to about 1e-9 across 88 tests." },
    { when: "Jun to Aug 2026", role: "Technology summer intern", org: "Barclays", desc: "Built production automation tooling (Playwright, React, GitLab CI) that generates branded client templates and mobile builds. 88% fetch accuracy, 14-minute builds." },
    { when: "Jul to Sep 2024", role: "Backend developer intern", org: "Runverve", desc: "Flask and Postgres APIs handling 1000+ requests a day." },
    { when: "2023 to 2027", role: "B.E. Computer Science", org: "SSN College of Engineering", desc: "CGPA 8.53. Coding Club core committee and department association event organizer." },
    { when: "2023 to 2027", role: "B.S. Data Science", org: "IIT Madras", desc: "CGPA 8.25." },
    { when: "Until 2023", role: "School Head Boy", org: "TI School", desc: "PCM 198/200, 96.5% overall." },
  ],

  socials: [
    { label: "GitHub", url: "https://github.com/vsl366" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/vishal-s-544730305" },
    { label: "LeetCode", url: "https://leetcode.com/u/vsl366" },
    { label: "Resume", url: "files/Vishal_S_Resume.pdf" },
  ],

  // ---- Art page (filler until real work is added) ----
  art: [
    { title: "Untitled sketch", medium: "Pencil on paper", size: "tall" },
    { title: "Night study", medium: "Ibis Paint", size: "wide" },
    { title: "Portrait", medium: "Graphite", size: "" },
    { title: "City lights", medium: "Photography", size: "" },
    { title: "Hill Climb sprites", medium: "Digital", size: "wide" },
    { title: "Hands", medium: "Pencil", size: "tall" },
    { title: "Golden hour", medium: "Photography", size: "" },
    { title: "Character concept", medium: "Ibis Paint", size: "" },
  ],

  // ---- Piano page (filler until real recordings are added) ----
  pieces: [
    { title: "Clair de Lune", composer: "Debussy", note: "Recording soon" },
    { title: "Nocturne Op. 9 No. 2", composer: "Chopin", note: "Recording soon" },
    { title: "Moonlight Sonata, 1st mvt.", composer: "Beethoven", note: "Recording soon" },
    { title: "Gymnopédie No. 1", composer: "Satie", note: "Recording soon" },
  ],
};
