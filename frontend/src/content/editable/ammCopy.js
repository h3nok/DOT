/** Shared by the reader, owner editor and static build. Only plain copy is editable. */
export function ammCopyFields(content) {
  const fields = [];
  const words = field => field.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
  const add = (group, path, label, key = path) => {
    const text = path.split('.').reduce((value, part) => value[part], content);
    fields.push({ group, path, label, key: `amm.${key.toLowerCase()}`, text });
  };
  // The opening's words: by default the author's title and line as he published them in Studio
  // ("The American Culture", "Profess values we never practice.", 2026-11-22).
  add('Opening', 'model.heroTitle', 'Opening heading');
  add('Opening', 'model.heroLine', 'Opening line');
  add('Opening', 'heroAction', 'Primary reading link');
  add('Opening', 'description', 'Search description');
  add('Opening', 'artwork.alt', 'Image description');
  add('Opening', 'introduction.label', 'Introduction link label');
  add('Opening', 'model.mirrorKey', 'Painting caption');
  add('Footer', 'dot.footer', 'Digital Organism Theory line');
  add('Footer', 'movement.footer', '4Us line');
  // Studio offers what the live pages show (the author, 2026-11-18): the home's screens,
  // the figures page, and the inquirer's page. The book's sentences come from the
  // published chapters (amm-model.json) and change with the book, not here.
  const each = (group, entries) => entries.forEach(([path, label]) => add(group, path, label));
  // The thesis, set as a manifesto (2026-11-22): the author's articles, one per field. Its
  // conviction ("You were born valuable…") is the book's and is not edited here.
  each('Home · The thesis', [
    ['model.thesisTitle', 'Label above the thesis'],
    ['model.thesisPurposeLabel', 'Left column label'],
    ['model.thesisSociety', 'Article 1: what a society is for'],
    ['model.thesisHonor', 'Article 2: how a society honors your worth'],
    ['model.thesisInversionLabel', 'Right column label'],
    ['model.thesisInverts', 'Article 3: the inversion'],
    ['model.thesisMyth', 'Article 4: the myth'],
    ['model.thesisBelief', 'Article 5: the belief'],
    ['model.thesisCharacter', 'Article 6: the conditioned character'],
  ]);
  each('Home · The model', [
    ['model.readDiagnosis', 'Diagnosis link'],
    // Each part's heading is "Term: what it means"; the term before the colon is set in the flame.
    ['model.hostTitle', 'Host heading (term: what it means)'],
    ['model.leechTitle', 'Leech heading (term: what it means)'],
    ['model.anatomyTitle', 'Oligarchy heading (term: what it means)'],
    ['model.figuresLink', 'Chapter Two figures link'],
    ['model.feedingTitle', 'Feeding heading (term: what it means)'],
  ]);
  each('Home · The way out', [
    ['model.revolutionEyebrow', 'Label'],
    ['model.revolutionLine', 'Heading: the way out'],
    ['model.revolutionPosition', 'Your position: what comes first'],
    ['model.revolutionAction', 'Link to Chapter Four'],
  ]);
  each('Home · The book', [
    ['model.bookTitle', 'Book heading'],
    ['model.closingBook', 'All chapters link'],
  ]);
  each('Figures page', [
    ['power.figuresNav', 'Footer link'],
    ['power.figuresTitle', 'Page heading'],
    ['power.figuresIntro', 'Introduction'],
    ['power.figuresBack', 'Link back to Chapter Two'],
    ...['wealth', 'equity', 'savings', 'housing'].map(id => [`power.screens.${id}`, `Heading: ${id}`]),
    ['power.wealthTitle', 'Wealth chart title'],
    ['power.wealthBottom', 'Wealth figure caption'],
    ['power.equityTop', 'Equity: top 1% caption'],
    ['power.equityBottom', 'Equity: bottom half caption'],
    ['power.savingsTitle', 'Savings chart title'],
    ['power.managers', 'Savings figure caption'],
    ['power.homesLabel', 'Housing figure caption'],
    ['power.metrosTitle', 'Housing chart title'],
    ['power.sourcesTitle', 'Sources heading'],
  ]);
  each('Shared labels', [
    ['model.sourceLabel', 'Source line prefix'],
    ['model.shareAction', 'Copy link button'],
    ['model.shareDone', 'Copy link confirmation'],
    ['model.shareUnavailable', 'Copy link fallback'],
    ['reflect.disclosure', 'AI illustration note (under every painting)'],
  ]);
  for (const [field, text] of Object.entries(content.inquiry)) {
    if (typeof text === 'string' && field !== 'route') add('Inquiry page', `inquiry.${field}`, words(field));
  }
  each('Inquiry page', [['model.mapLabel', 'Map label'], ['model.mapCaption', 'Map caption']]);
  add('Chapters', 'chapterSection.title', 'Section heading');
  add('Chapters', 'chapterSection.description', 'Section introduction');
  add('Chapters', 'manuscript.status', 'Working edition status');
  for (const field of Object.keys(content.participation)) add('Readers and membership', `participation.${field}`, words(field));
  content.chapterSection.chapters.forEach((chapter, index) => add('Chapters', `chapterSection.chapters.${index}.line`, `Chapter ${index + 1} — one line`, `chapterSection.chapters.${chapter.id}.line`));
  for (const [field, label] of Object.entries({ orderLabel: 'Orientation label', contentsLabel: 'Contents label', letterLabel: 'Letter orientation label', lettersEyebrow: 'Letters label', lettersTitle: 'Letters heading', lettersDescription: 'Letters introduction', nextLabel: 'Next part label', beginLabel: 'Begin label', latestNote: 'Latest part note' })) {
    add('Reading order', `reading.${field}`, label);
  }
  for (const [field, label] of Object.entries({ signupTitle: 'Signup heading', signupDescription: 'Signup description', supportTitle: 'Support heading', supportDescription: 'Support description', supportAction: 'Support link label', supportNote: 'Support note' })) {
    add('End of each edition', `reading.${field}`, label);
  }
  // Archive summaries for the earlier serialized editions (their keys predate the archive).
  content.money.companions.forEach((item, index) => {
    for (const [field, label] of Object.entries({ title: 'Heading', text: 'Explanation', summary: 'Archive summary' })) add(`Archive · ${item.title}`, `money.companions.${index}.${field}`, label, `money.companions.${item.id}.${field}`);
  });
  add('Archive', 'archiveTitle', 'Archive heading');
  add('Archive', 'archiveDescription', 'Archive introduction');
  add('Archive', 'emptyTitle', 'Empty archive heading');
  add('Archive', 'emptyDescription', 'Empty archive description');
  add('Subscription', 'signupTitle', 'Signup heading');
  add('Subscription', 'signupDescription', 'Signup description');
  // Studio lists the groups in the order a reader meets them (2026-11-22): the home from top to
  // bottom, then the other pages, the archive, and what every page shares.
  const order = ['Opening', 'Home · The thesis', 'Home · The model', 'Home · The way out', 'Home · The book', 'Figures page', 'Inquiry page', 'Chapters', 'Reading order', 'End of each edition', 'Readers and membership', 'Subscription', 'Archive', 'Shared labels', 'Footer'];
  const rank = group => {
    const at = order.indexOf(group.startsWith('Archive · ') ? 'Archive' : group);
    return (at < 0 ? order.length : at) + (group.startsWith('Archive · ') ? 0.5 : 0);
  };
  return fields.map((field, index) => ({ field, index })).sort((a, b) => rank(a.field.group) - rank(b.field.group) || a.index - b.index).map(({ field }) => field);
}

export function resolveAmmCopy(content, resolve) {
  const result = structuredClone(content);
  for (const field of ammCopyFields(content)) {
    const parts = field.path.split('.');
    const last = parts.pop();
    const parent = parts.reduce((value, part) => value[part], result);
    parent[last] = resolve(field.key, field.text);
  }
  return result;
}
