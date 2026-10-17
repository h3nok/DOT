/** Shared by the reader, owner editor and static build. Only plain copy is editable. */
export function ammCopyFields(content) {
  const fields = [];
  const words = field => field.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase());
  const add = (group, path, label, key = path) => {
    const text = path.split('.').reduce((value, part) => value[part], content);
    fields.push({ group, path, label, key: `amm.${key.toLowerCase()}`, text });
  };
  add('Opening', 'headline.0', 'Headline — first line');
  add('Opening', 'headline.1', 'Headline — emphasis');
  add('Opening', 'heroAction', 'Primary reading link');
  add('Opening', 'description', 'Search description');
  add('Opening', 'introduction.label', 'Introduction link label');
  for (const [field, value] of Object.entries(content.home)) {
    if (typeof value === 'string') add('Home · Framing and reflection', `home.${field}`, words(field));
  }
  content.home.reasons.forEach((item, index) => {
    for (const field of ['title', 'text']) add('Home · Why this manifesto', `home.reasons.${index}.${field}`, `${item.title} — ${words(field)}`, `home.reasons.${item.id}.${field}`);
  });
  content.home.concepts.forEach((concept, index) => {
    for (const field of ['label', 'hint', 'title', 'text', 'question']) add(`Home · ${concept.label}`, `home.concepts.${index}.${field}`, words(field), `home.concepts.${concept.id}.${field}`);
  });
  content.home.reflections.forEach((item, index) => {
    for (const field of ['title', 'text']) add('Home · Questions about conduct', `home.reflections.${index}.${field}`, `${item.title} — ${words(field)}`, `home.reflections.${item.id}.${field}`);
  });
  add('Illustration', 'artwork.description', 'Illustration description');
  content.artwork.key.forEach((item, index) => {
    add('Illustration', `artwork.key.${index}.label`, `${item.label} — label`, `artwork.key.${item.id}.label`);
    add('Illustration', `artwork.key.${index}.meaning`, `${item.label} — meaning`, `artwork.key.${item.id}.meaning`);
  });
  add('Chapters', 'chapterSection.title', 'Section heading');
  add('Chapters', 'chapterSection.description', 'Section introduction');
  for (const [field, label] of Object.entries({ pathEyebrow: 'Reading path label', orderLabel: 'Orientation label', contentsLabel: 'Contents label', letterLabel: 'Letter orientation label', lettersEyebrow: 'Letters label', lettersTitle: 'Letters heading', lettersDescription: 'Letters introduction', nextLabel: 'Next part label', beginLabel: 'Begin label', latestNote: 'Latest part note' })) {
    add('Reading order', `reading.${field}`, label);
  }
  for (const [field, label] of Object.entries({ signupTitle: 'Signup heading', signupDescription: 'Signup description', supportTitle: 'Support heading', supportDescription: 'Support description', supportAction: 'Support link label', supportNote: 'Support note' })) {
    add('End of each edition', `reading.${field}`, label);
  }
  for (const [field, value] of Object.entries(content.capital)) {
    if (typeof value === 'string') add('How power works · Page copy', `capital.${field}`, words(field));
    else if (Array.isArray(value) && value.every(item => typeof item === 'string')) value.forEach((item, index) => add(`How power works · ${words(field)}`, `capital.${field}.${index}`, `${index + 1}. ${item}`));
  }
  content.capital.imageKey.forEach((item, index) => {
    for (const field of ['label', 'meaning']) add('How power works · Read the metaphor', `capital.imageKey.${index}.${field}`, `${item.label} — ${field}`, `capital.imageKey.${item.id}.${field}`);
  });
  content.capital.tiers.forEach((tier, index) => {
    const group = `How power works · The power map · ${tier.label}`;
    add(group, `capital.tiers.${index}.label`, 'Label', `capital.tiers.${tier.id}.label`);
    if (tier.detail) add(group, `capital.tiers.${index}.detail`, 'Detail', `capital.tiers.${tier.id}.detail`);
    tier.chips?.forEach((chip, part) => add(group, `capital.tiers.${index}.chips.${part}`, `${part + 1}. ${chip}`, `capital.tiers.${tier.id}.chips.${part}`));
  });
  content.capital.flows.forEach((flow, index) => flow.items.forEach((item, part) => add('How power works · The power map · Flows', `capital.flows.${index}.items.${part}.label`, `${flow.id}, ${item.direction}`, `capital.flows.${flow.id}.${part}`)));
  for (const [field, label] of Object.entries({ label: 'Paid straight up', note: 'Paid straight up — note' })) add('How power works · The power map · Flows', `capital.rail.${field}`, label);
  content.capital.story.forEach((step, index) => {
    for (const [field, label] of Object.entries({ title: 'Heading', text: 'Explanation', quote: 'Chapter line', source: 'Where the line comes from' })) {
      if (step[field]) add(`How power works · The story · ${step.title}`, `capital.story.${index}.${field}`, label, `capital.story.${step.id}.${field}`);
    }
  });
  for (const id of Object.keys(content.capital.interfaceLabels)) add('How power works · Interface labels', `capital.interfaceLabels.${id}`, id);
  content.capital.ledger.forEach((item, index) => {
    for (const [field, label] of Object.entries({ term: 'What the citizen supplies', becomes: 'What it becomes' })) add(`How power works · The ledger · ${item.term}`, `capital.ledger.${index}.${field}`, label, `capital.ledger.${item.id}.${field}`);
  });
  for (const [field, value] of Object.entries(content.money)) {
    if (typeof value === 'string') add('How power works · Shared copy', `money.${field}`, words(field));
  }
  for (const [collection, props] of Object.entries({ definitions: ['term', 'text'], examples: ['title', 'path', 'mechanic', 'pressure', 'question'], cycle: ['title', 'text'], tests: ['title', 'text'], companions: ['title', 'text', 'summary'] })) {
    content.money[collection].forEach((item, index) => {
      const labels = { title: 'Heading', term: 'Term', text: 'Explanation', path: 'Payment route', mechanic: 'How the payment works', pressure: 'AMM’s critique', question: 'Reader question', summary: 'Archive summary' };
      for (const field of props) add(`How power works · ${item.title ?? item.term}`, `money.${collection}.${index}.${field}`, labels[field], `money.${collection}.${item.id}.${field}`);
    });
  }
  add('Archive', 'archiveTitle', 'Archive heading');
  add('Archive', 'archiveDescription', 'Archive introduction');
  add('Archive', 'emptyTitle', 'Empty archive heading');
  add('Archive', 'emptyDescription', 'Empty archive description');
  add('Subscription', 'signupTitle', 'Signup heading');
  add('Subscription', 'signupDescription', 'Signup description');
  return fields;
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
