/*
  Artisan Story Weaver - Client-side UI logic
  - Drag & drop and browse uploads for images/videos
  - Optional context and tone selection
  - Client-side story generation stub to simulate AI
*/

(function () {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const browseBtn = document.getElementById('browseBtn');
  const consentChk = document.getElementById('consentChk');
  const generateBtn = document.getElementById('generateBtn');
  const previewGrid = document.getElementById('previewGrid');
  const contextText = document.getElementById('contextText');
  const toneSelect = document.getElementById('toneSelect');
  const storiesContainer = document.getElementById('storiesContainer');
  const statusEl = document.getElementById('status');

  /** @type {File[]} */
  let selectedFiles = [];

  function updateGenerateState() {
    const ok = selectedFiles.length > 0 && !!consentChk.checked;
    generateBtn.disabled = !ok;
  }

  function prettyBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let num = bytes;
    while (num >= 1024 && i < units.length - 1) {
      num /= 1024;
      i++;
    }
    return `${num.toFixed(num >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function clearPreviews() {
    previewGrid.innerHTML = '';
  }

  function buildPreviewItem(file, url) {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    let mediaEl;
    if (isImage) {
      mediaEl = document.createElement('img');
      mediaEl.className = 'media';
      mediaEl.alt = file.name;
      mediaEl.src = url;
    } else if (isVideo) {
      mediaEl = document.createElement('video');
      mediaEl.className = 'media';
      mediaEl.src = url;
      mediaEl.controls = true;
      mediaEl.playsInline = true;
      mediaEl.muted = true;
    } else {
      mediaEl = document.createElement('div');
      mediaEl.className = 'media';
      mediaEl.style.display = 'grid';
      mediaEl.style.placeItems = 'center';
      mediaEl.textContent = 'Unsupported';
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('span');
    name.className = 'name';
    name.title = file.name;
    name.textContent = file.name;
    const size = document.createElement('span');
    size.className = 'size';
    size.textContent = prettyBytes(file.size);
    meta.appendChild(name);
    meta.appendChild(size);

    item.appendChild(mediaEl);
    item.appendChild(meta);
    return item;
  }

  function refreshPreviews() {
    clearPreviews();
    selectedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const item = buildPreviewItem(file, url);
      previewGrid.appendChild(item);
      // Revoke URL after media loads to free memory (best-effort)
      const revoke = () => URL.revokeObjectURL(url);
      item.querySelectorAll('img,video').forEach(el => el.addEventListener('load', revoke, { once: true }));
    });
  }

  function handleFiles(files) {
    const accepted = [];
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        accepted.push(file);
      }
    }
    selectedFiles = accepted;
    refreshPreviews();
    updateGenerateState();
  }

  // Drag & drop
  ['dragenter', 'dragover'].forEach(evtName => {
    dropZone.addEventListener(evtName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = 'var(--accent-2)';
    });
  });
  ['dragleave', 'drop'].forEach(evtName => {
    dropZone.addEventListener(evtName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = 'rgba(0,0,0,0.18)';
    });
  });
  dropZone.addEventListener('drop', e => {
    const files = e.dataTransfer?.files;
    if (files && files.length) {
      handleFiles(files);
    }
  });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Browse
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files) handleFiles(fileInput.files);
  });

  consentChk.addEventListener('change', updateGenerateState);

  // Story generation stub
  const toneProfiles = {
    warm: {
      title: 'Warm & Heartfelt',
      adjectives: ['gentle', 'tender', 'familiar', 'sunlit', 'comforting'],
      cadence: 'soft'
    },
    celebratory: {
      title: 'Celebratory & Proud',
      adjectives: ['radiant', 'joyful', 'spirited', 'triumphant', 'vibrant'],
      cadence: 'exuberant'
    },
    humble: {
      title: 'Humble & Grounded',
      adjectives: ['steadfast', 'quiet', 'honest', 'earthbound', 'unadorned'],
      cadence: 'measured'
    },
    documentary: {
      title: 'Documentary & Factual',
      adjectives: ['precise', 'observed', 'methodical', 'archival', 'unvarnished'],
      cadence: 'matter-of-fact'
    },
    poetic: {
      title: 'Poetic & Evocative',
      adjectives: ['lilting', 'silken', 'hushed', 'amber', 'windswept'],
      cadence: 'lyrical'
    },
    energetic: {
      title: 'Energetic & Bold',
      adjectives: ['brisk', 'electric', 'crisp', 'bold', 'alive'],
      cadence: 'punchy'
    },
    reverent: {
      title: 'Reverent & Timeless',
      adjectives: ['sacred', 'devotional', 'ancestral', 'timeworn', 'cathedral'],
      cadence: 'solemn'
    },
    minimalist: {
      title: 'Minimalist & Crisp',
      adjectives: ['clean', 'spare', 'essential', 'clear', 'quiet'],
      cadence: 'simple'
    }
  };

  function titleCase(str) {
    return str.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  }

  function inferSubjectFromFilename(name) {
    const base = name.replace(/\.[^.]+$/, '');
    const words = base.split(/[-_\s]+/).filter(Boolean);
    if (words.length === 0) return 'the artisan';
    const guess = words.slice(0, 3).join(' ');
    return `“${titleCase(guess)}”`;
  }

  function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function synthesizeStory(toneKey, filename, extraContext) {
    const tone = toneProfiles[toneKey] || toneProfiles.warm;
    const subject = inferSubjectFromFilename(filename);
    const adjA = randomChoice(tone.adjectives);
    const adjB = randomChoice(tone.adjectives.filter(a => a !== adjA));
    const materialHint = (extraContext || '').match(/(clay|wood|metal|textile|loom|weave|dye|leather|stone|glass)/i)?.[0];
    const material = materialHint ? materialHint.toLowerCase() : 'hand and heart';

    const lines = [];
    if (toneKey === 'documentary') {
      lines.push(`${subject}: an ${adjA} record of process and detail.`);
      lines.push(`Tools, materials, and method are shown clearly. Primary material: ${material}.`);
      if (extraContext) lines.push(extraContext.trim());
      lines.push('This account preserves sequence, scale, and craft technique.');
    } else if (toneKey === 'minimalist') {
      lines.push(`${subject}. ${titleCase(material)}. ${adjA}.`);
      if (extraContext) lines.push(extraContext.trim());
    } else if (toneKey === 'energetic') {
      lines.push(`${subject} comes alive — ${adjA}, ${adjB}, unstoppable.`);
      lines.push(`Every motion sparks; craft flows through ${material}.`);
      if (extraContext) lines.push(extraContext.trim());
    } else if (toneKey === 'poetic') {
      lines.push(`${subject}, traced in ${adjA} light and ${adjB} air.`);
      lines.push(`Between breath and ${material}, a story gathers and glows.`);
      if (extraContext) lines.push(extraContext.trim());
    } else if (toneKey === 'reverent') {
      lines.push(`In a ${tone.cadence} hush, ${subject} is honored.`);
      lines.push(`Hands remember; ${material} answers. ${adjA}, ${adjB}, enduring.`);
      if (extraContext) lines.push(extraContext.trim());
    } else if (toneKey === 'celebratory') {
      lines.push(`${subject} — a joyous arc of making!`);
      lines.push(`Colors ring, edges dance. ${adjA} and ${adjB}. ${titleCase(material)} at its brightest.`);
      if (extraContext) lines.push(extraContext.trim());
    } else if (toneKey === 'humble') {
      lines.push(`${subject}, made steady and true.`);
      lines.push(`With ${material}, patience, and care: ${adjA}, ${adjB}.`);
      if (extraContext) lines.push(extraContext.trim());
    } else {
      lines.push(`${subject} — a ${adjA}, ${adjB} passage of craft.`);
      lines.push(`Time softens; ${material} tells its quiet tale.`);
      if (extraContext) lines.push(extraContext.trim());
    }
    return lines.join('\n');
  }

  function setStatus(text, spinning = false) {
    statusEl.innerHTML = spinning ? `<span class="spinner"></span>${text}` : text;
  }

  function createStoryCard({ title, toneTitle, storyText }) {
    const card = document.createElement('article');
    card.className = 'story-card';

    const header = document.createElement('header');
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const toneEl = document.createElement('div');
    toneEl.className = 'tone';
    toneEl.textContent = toneTitle;
    header.appendChild(h3);
    header.appendChild(toneEl);

    const story = document.createElement('div');
    story.className = 'story';
    story.textContent = storyText;

    const tools = document.createElement('div');
    tools.className = 'tools';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn ghost';
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(storyText);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
      } catch {}
    });
    tools.appendChild(copyBtn);

    card.appendChild(header);
    card.appendChild(story);
    card.appendChild(tools);
    return card;
  }

  async function generateStories() {
    if (selectedFiles.length === 0) return;
    setStatus('Weaving stories from your media...', true);
    storiesContainer.innerHTML = '';

    // Simulate latency
    await new Promise(r => setTimeout(r, 450));

    const toneKey = toneSelect.value;
    const ctx = contextText.value.trim();
    for (const file of selectedFiles) {
      const storyText = synthesizeStory(toneKey, file.name, ctx);
      const toneTitle = (toneProfiles[toneKey]?.title) || 'Custom Tone';
      const card = createStoryCard({
        title: inferSubjectFromFilename(file.name),
        toneTitle,
        storyText
      });
      storiesContainer.appendChild(card);
      // Yield to UI between items
      await new Promise(r => setTimeout(r, 80));
    }
    setStatus('Done. You can copy any story.');
  }

  generateBtn.addEventListener('click', () => generateStories());
})();

