export const SOURCES = {
  unesco: { label: 'UNESCO World Heritage Centre — property overview', url: 'https://whc.unesco.org/en/list/596/' },
  landscape: { label: 'ICOMOS — evaluation of the Transylvanian villages', url: 'https://whc.unesco.org/document/285' },
  soil: { label: 'FAO — soil cover and conservation', url: 'https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en/' },
  rotation: { label: 'FAO — managing soil organic matter', url: 'https://www.fao.org/4/a0100e/a0100e07.htm' },
  compost: { label: 'FAO — organic matter and soil structure', url: 'https://www.fao.org/4/a0100e/a0100e04.htm' },
};

export const CHAPTERS = [
  { id: 'churches', title: 'Churches and shelter', symbol: '⌂', text: 'In southern Transylvania, fortified churches stand at the heart of historic villages. Their walls and towers tell a story of worship and protection. Viscri is part of the Romanian World Heritage property that inspires this game.', connection: 'Our church is an original illustration, not a reconstruction of Viscri.', sources: ['unesco', 'landscape'] },
  { id: 'community', title: 'A village is its people', symbol: '♧', text: 'Transylvanian Saxon communities helped shape these village settlements. Homes, farmsteads, schools, and churches formed a shared place to live. Caring for heritage today also means caring about the people who live there.', connection: 'In our fictional village, everyone shares the harvest and contributes winter compost. This is a game story, not a claim about historical customs in Viscri.', sources: ['unesco', 'landscape'] },
  { id: 'landscape', title: 'Beyond the church walls', symbol: '❧', text: 'Heritage includes more than buildings. The arrangement of homes, farmsteads, and cultivated land helps tell the story of these villages. A rural landscape connects the work of many generations.', connection: 'Your Village Heritage meter celebrates care for this fictional landscape. It is not a UNESCO rating and does not change victory conditions.', sources: ['unesco'] },
  { id: 'soil', title: 'A living ground', symbol: '✦', text: 'Soil supports plants and living organisms. Keeping soil covered helps protect it from rain and wind. Organic matter helps soil hold together and gives soil life something to feed on.', connection: 'Keep an eye on fertility as well as food. The game’s percentages are teaching tools, not scientific measurements.', sources: ['soil', 'compost'] },
  { id: 'rotation', title: 'Give the field variety', symbol: '♣', text: 'Different crops use the soil in different ways. Rotating crops can help maintain fertility and interrupt some pest and disease cycles. Repeating one crop can put pressure on nutrients and encourage crop-specific pests.', connection: 'Try beans or clover before a demanding crop. A simple pest event can affect repeated crops. Its numbers are game rules, not a model of historical Viscri farming or real pest behavior.', sources: ['rotation'] },
  { id: 'compost', title: 'Return something to the soil', symbol: '♻', text: 'Compost returns decomposed organic material to the soil. Organic matter helps improve soil structure and supports soil organisms. It is one part of caring for soil, alongside thoughtful crop choices.', connection: 'Our shared compost supply is limited. Combine it with crop rotation rather than relying on it alone. The +20 bonus is a game value.', sources: ['compost', 'rotation'] },
];

export const LESSONS = {
  rotation: { chapter: 'rotation', text: 'Rotating crops helps maintain soil fertility and can reduce some pest and disease pressures. Your successful rotation also cares for the village landscape.' },
  monoculture: { chapter: 'rotation', text: 'Growing the same crop repeatedly can deplete nutrients and increase crop-specific pest risks. Our occasional pest event is a simplified game rule, not a scientific prediction.' },
  compost: { chapter: 'compost', text: 'Compost adds organic matter and helps improve soil structure. Shared resources work best alongside careful crop rotation.' },
  year: { chapter: 'landscape', text: 'A living landscape needs both healthy soil and a community that can feed itself. Caring for fields helps keep the village’s story alive.' },
};

export const CREDITS = [
  { role: 'Project', text: 'Fortified Church Garden: The Soil Remembers — a 48-hour game jam project about soil conservation and cultural heritage.' },
  { role: 'Illustrations', text: 'Original procedural Canvas and CSS shapes. No external artwork, copied photographs, or AI-generated image assets.' },
  { role: 'Research', text: 'UNESCO World Heritage Centre, ICOMOS, and FAO. Source links accompany the book chapters; educational text is written for this game.' },
  { role: 'Development tools', text: 'Vanilla JavaScript, HTML Canvas, CSS, and Vite (MIT license).' },
  { role: 'AI assistance', text: 'OpenAI Codex assisted with programming, educational copy, procedural drawing code, and automated tests.' },
];
