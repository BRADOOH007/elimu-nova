/**
 * CBC Curriculum Repair Script
 * ============================================================
 * Wipes the corrupted curriculum data (strands attached to wrong
 * subjects) and re-seeds a clean, correct CBC curriculum for
 * Grade 1-9 core learning areas with accurate strands, substrands,
 * and learning outcomes.
 *
 * Run with:  npx tsx prisma/repair-curriculum.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Types ──
interface SubstrandData {
  name: string
  learningOutcomes: string[]
  activities?: string[]
}
interface StrandData {
  name: string
  substrands: SubstrandData[]
}
interface SubjectData {
  subject: string
  strands: StrandData[]
}

// ─────────────────────────────────────────────────────────────
// SCIENCE & TECHNOLOGY — Grade 4-6
// ─────────────────────────────────────────────────────────────
const SCIENCE_G4: StrandData[] = [
  {
    name: 'Living Things — Human Body Systems',
    substrands: [
      {
        name: 'Human digestive system — Parts and functions',
        learningOutcomes: [
          'Identify the parts of the human digestive system (mouth, oesophagus, stomach, small intestine, large intestine, liver, pancreas)',
          'Describe the function of each part of the digestive system',
          'Explain the process of digestion from ingestion to absorption',
          'Identify healthy habits for maintaining a healthy digestive system',
        ],
      },
      {
        name: 'Human circulatory system — Parts of the heart & their functions',
        learningOutcomes: [
          'Identify the parts of the human heart (left and right atrium, left and right ventricle, valves, aorta, vena cava)',
          'Describe the function of the heart in pumping blood around the body',
          'Explain how blood flows through the heart and to the lungs and body',
          'Describe the components of blood (red blood cells, white blood cells, plasma, platelets) and their functions',
        ],
      },
      {
        name: 'Human respiratory system — Parts and functions',
        learningOutcomes: [
          'Identify the parts of the human respiratory system (nose, trachea, bronchi, lungs, alveoli)',
          'Describe the process of breathing (inhalation and exhalation)',
          'Explain the exchange of gases in the alveoli',
          'Identify healthy habits for maintaining a healthy respiratory system',
        ],
      },
    ],
  },
  {
    name: 'Matter — Properties and Changes',
    substrands: [
      {
        name: 'States of matter — Solids, liquids, and gases',
        learningOutcomes: [
          'Identify the three states of matter: solids, liquids, and gases',
          'Describe the properties of solids, liquids, and gases',
          'Classify materials according to their state of matter',
        ],
      },
      {
        name: 'Changes in matter — Evaporation and condensation',
        learningOutcomes: [
          'Describe evaporation as the process of a liquid changing into a gas/vapour',
          'Describe condensation as the process of a gas/vapour changing into a liquid',
          'Explain the water cycle and the role of evaporation and condensation in it',
          'Investigate factors that affect the rate of evaporation (temperature, surface area, wind)',
        ],
      },
    ],
  },
  {
    name: 'Energy — Heat, Light, and Sound',
    substrands: [
      {
        name: 'Heat — Sources and uses',
        learningOutcomes: [
          'Identify sources of heat (sun, fire, electricity, friction)',
          'Describe the uses of heat in daily life',
          'Identify safety measures when handling heat',
        ],
      },
      {
        name: 'Heat transfer — Modes of heat transfer',
        learningOutcomes: [
          'Describe conduction as the transfer of heat through solids',
          'Describe convection as the transfer of heat through liquids and gases',
          'Describe radiation as the transfer of heat without a medium',
          'Classify materials as conductors and insulators of heat',
          'Identify applications of heat transfer in daily life',
        ],
      },
      {
        name: 'Light — Sources and properties',
        learningOutcomes: [
          'Identify sources of light (natural and artificial)',
          'Describe how light travels and how it forms shadows',
          'Distinguish between transparent, translucent, and opaque materials',
        ],
      },
      {
        name: 'Sound — Sources and properties',
        learningOutcomes: [
          'Identify sources of sound',
          'Describe how sound travels through different media',
          'Explain the effects of loud sound on hearing',
        ],
      },
    ],
  },
  {
    name: 'Force and its Effects',
    substrands: [
      {
        name: 'Force — Types and effects',
        learningOutcomes: [
          'Define force as a push or a pull',
          'Identify types of forces (gravity, friction, magnetic force)',
          'Describe the effects of force on objects (change in shape, speed, direction)',
        ],
      },
    ],
  },
  {
    name: 'Environment — Weather and Conservation',
    substrands: [
      {
        name: 'Weather — Elements and instruments',
        learningOutcomes: [
          'Identify the elements of weather (temperature, rainfall, wind, humidity)',
          'Describe weather instruments (thermometer, rain gauge, wind vane, barometer)',
          'Record and interpret simple weather data',
        ],
      },
      {
        name: 'Conservation of the environment',
        learningOutcomes: [
          'Explain the importance of conserving the environment',
          'Identify ways of conserving the environment (tree planting, proper waste disposal, recycling)',
        ],
      },
    ],
  },
]

const SCIENCE_G5: StrandData[] = [
  {
    name: 'Living Things — Plants and Animals',
    substrands: [
      {
        name: 'Plant systems — Root, stem, and leaf functions',
        learningOutcomes: [
          'Describe the functions of roots, stems, and leaves in plants',
          'Explain the process of photosynthesis',
          'Identify how plants transport water and nutrients',
        ],
      },
      {
        name: 'Animal classification — Vertebrates and invertebrates',
        learningOutcomes: [
          'Classify animals as vertebrates and invertebrates',
          'Identify the characteristics of mammals, birds, reptiles, amphibians, and fish',
        ],
      },
    ],
  },
  {
    name: 'Matter — Mixtures and Separation',
    substrands: [
      {
        name: 'Mixtures — Types and methods of separation',
        learningOutcomes: [
          'Define a mixture and identify examples in daily life',
          'Describe methods of separating mixtures (sieving, filtration, evaporation, magnetism)',
          'Separate a mixture using appropriate methods',
        ],
      },
    ],
  },
  {
    name: 'Energy — Heat Transfer and Electrical Energy',
    substrands: [
      {
        name: 'Heat transfer — Modes of heat transfer in nature',
        learningOutcomes: [
          'Describe conduction, convection, and radiation as modes of heat transfer',
          'Give examples of each mode of heat transfer in nature and daily life',
          'Classify materials as conductors and insulators of heat',
          'Identify safety measures when handling heat',
        ],
      },
      {
        name: 'Sound energy — Sources, movement, and effects',
        learningOutcomes: [
          'Identify sources of sound energy',
          'Describe how sound travels in nature',
          'Explain the effects of loud sound on hearing and the environment',
          'Describe the role of sound in daily life',
        ],
      },
      {
        name: 'Electrical energy — Simple electric circuits',
        learningOutcomes: [
          'Identify sources of electricity',
          'Construct a simple electric circuit using a battery, wires, and a bulb',
          'Describe the flow of electric current in a simple circuit',
        ],
      },
    ],
  },
  {
    name: 'Technology — Care for Digital Devices',
    substrands: [
      {
        name: 'Digital devices — Care and safety',
        learningOutcomes: [
          'Identify common digital devices (phones, tablets, computers)',
          'Describe how to care for and maintain digital devices',
          'Identify safety measures when using digital devices',
        ],
      },
    ],
  },
]

const SCIENCE_G6: StrandData[] = [
  {
    name: 'Living Things — Reproduction and Health',
    substrands: [
      {
        name: 'Human reproductive system',
        learningOutcomes: [
          'Identify parts of the male and female reproductive systems',
          'Describe the function of each part of the reproductive system',
          'Explain the process of reproduction in humans',
        ],
      },
      {
        name: 'Diseases — Causes and prevention',
        learningOutcomes: [
          'Identify communicable and non-communicable diseases',
          'Describe causes and modes of transmission of common diseases',
          'Explain preventive measures against common diseases',
        ],
      },
    ],
  },
  {
    name: 'Matter — Atoms and Elements',
    substrands: [
      {
        name: 'Atoms and molecules',
        learningOutcomes: [
          'Define atoms and molecules as the building blocks of matter',
          'Describe the structure of an atom (nucleus, protons, neutrons, electrons)',
          'Distinguish between elements and compounds',
        ],
      },
    ],
  },
  {
    name: 'Energy — Light and Magnetism',
    substrands: [
      {
        name: 'Light — Reflection and refraction',
        learningOutcomes: [
          'Describe reflection of light using mirrors',
          'Draw ray diagrams of images formed by plane mirrors',
          'Describe refraction of light through different media',
        ],
      },
      {
        name: 'Magnetism — Properties and uses',
        learningOutcomes: [
          'Identify properties of magnets (poles, attraction, repulsion)',
          'Describe uses of magnets in daily life',
          'Distinguish between magnetic and non-magnetic materials',
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// MATHEMATICS — Grade 4-6
// ─────────────────────────────────────────────────────────────
const MATH_G4: StrandData[] = [
  { name: 'Numbers', substrands: [
    { name: 'Whole numbers up to 100,000', learningOutcomes: ['Read, write and compare whole numbers up to 100,000', 'Round off whole numbers to the nearest 10, 100, 1000', 'Add, subtract, multiply and divide whole numbers'] },
    { name: 'Fractions', learningOutcomes: ['Identify equivalent fractions', 'Add and subtract fractions with same denominator', 'Multiply whole numbers by fractions'] },
    { name: 'Decimals', learningOutcomes: ['Read and write decimals up to two decimal places', 'Convert fractions to decimals and vice versa', 'Add and subtract decimals'] },
  ]},
  { name: 'Measurement', substrands: [
    { name: 'Length, mass and capacity', learningOutcomes: ['Convert between units of length (km, m, cm, mm)', 'Convert between units of mass (kg, g)', 'Convert between units of capacity (l, ml)', 'Solve word problems involving measurement'] },
    { name: 'Perimeter and area', learningOutcomes: ['Calculate perimeter of rectangles and squares', 'Calculate area of rectangles and squares', 'Solve problems involving perimeter and area'] },
  ]},
  { name: 'Geometry', substrands: [
    { name: '2D and 3D shapes', learningOutcomes: ['Identify and name 2D shapes (triangle, square, rectangle, circle)', 'Identify and name 3D shapes (cube, cuboid, cylinder, sphere)', 'Identify lines of symmetry in shapes'] },
    { name: 'Angles', learningOutcomes: ['Identify types of angles (acute, right, obtuse, reflex)', 'Measure angles using a protractor'] },
  ]},
  { name: 'Data Handling', substrands: [
    { name: 'Tables and graphs', learningOutcomes: ['Collect and organise data in tables', 'Draw and interpret bar graphs and pictographs', 'Calculate the mean of a set of data'] },
  ]},
  { name: 'Algebra', substrands: [
    { name: 'Simple equations', learningOutcomes: ['Form simple algebraic expressions from real-life situations', 'Solve simple linear equations with one unknown'] },
  ]},
]

const MATH_G5: StrandData[] = [
  { name: 'Numbers', substrands: [
    { name: 'Whole numbers up to 1,000,000', learningOutcomes: ['Read, write and compare whole numbers up to 1,000,000', 'Round off whole numbers', 'Perform the four operations on whole numbers'] },
    { name: 'Fractions and decimals', learningOutcomes: ['Add, subtract, multiply and divide fractions', 'Convert between fractions and decimals', 'Solve word problems involving fractions and decimals'] },
    { name: 'Percentages', learningOutcomes: ['Express fractions as percentages', 'Calculate percentage of a quantity', 'Solve problems involving percentages'] },
  ]},
  { name: 'Measurement', substrands: [
    { name: 'Volume and capacity', learningOutcomes: ['Calculate volume of cubes and cuboids', 'Convert between volume and capacity units'] },
    { name: 'Time and money', learningOutcomes: ['Convert between units of time', 'Calculate time intervals', 'Solve problems involving money and currency conversion'] },
  ]},
  { name: 'Geometry', substrands: [
    { name: 'Properties of shapes', learningOutcomes: ['Identify properties of triangles and quadrilaterals', 'Construct triangles using a ruler and protractor'] },
    { name: 'Coordinates', learningOutcomes: ['Plot points on a Cartesian plane', 'Identify coordinates of points on a grid'] },
  ]},
  { name: 'Data Handling', substrands: [
    { name: 'Mean, median and mode', learningOutcomes: ['Calculate mean, median and mode of a data set', 'Interpret and draw line graphs'] },
  ]},
  { name: 'Algebra', substrands: [
    { name: 'Linear equations', learningOutcomes: ['Simplify algebraic expressions', 'Solve linear equations with one unknown', 'Form and solve equations from word problems'] },
  ]},
]

const MATH_G6: StrandData[] = [
  { name: 'Numbers', substrands: [
    { name: 'Whole numbers and place value', learningOutcomes: ['Read and write whole numbers up to 10,000,000', 'Round off numbers to nearest million', 'Perform operations on large numbers'] },
    { name: 'Fractions, decimals and percentages', learningOutcomes: ['Apply operations on mixed numbers', 'Solve problems involving percentage increase and decrease', 'Convert between fractions, decimals and percentages'] },
    { name: 'Ratio and proportion', learningOutcomes: ['Express ratios in simplest form', 'Solve problems involving direct and indirect proportion'] },
  ]},
  { name: 'Measurement', substrands: [
    { name: 'Surface area and volume', learningOutcomes: ['Calculate surface area of cubes and cuboids', 'Calculate volume of cubes and cuboids'] },
    { name: 'Speed, distance and time', learningOutcomes: ['Calculate speed given distance and time', 'Solve problems involving speed, distance and time'] },
  ]},
  { name: 'Geometry', substrands: [
    { name: 'Angles and construction', learningOutcomes: ['Bisect lines and angles using a ruler and compass', 'Construct angles of 90°, 60°, 45°'] },
    { name: 'Scale drawing', learningOutcomes: ['Draw objects to scale', 'Interpret scale drawings'] },
  ]},
  { name: 'Data Handling', substrands: [
    { name: 'Probability', learningOutcomes: ['Calculate probability of simple events', 'Express probability as fractions and percentages'] },
    { name: 'Statistics', learningOutcomes: ['Draw and interpret pie charts', 'Calculate mean, median and mode for grouped data'] },
  ]},
  { name: 'Algebra', substrands: [
    { name: 'Inequalities', learningOutcomes: ['Solve linear inequalities', 'Represent inequalities on a number line'] },
  ]},
]

// ─────────────────────────────────────────────────────────────
// ENGLISH — Grade 4-6
// ─────────────────────────────────────────────────────────────
const ENGLISH_G4: StrandData[] = [
  { name: 'Listening and Speaking', substrands: [
    { name: 'Listening comprehension', learningOutcomes: ['Listen attentively for details in stories and instructions', 'Respond appropriately to oral questions', 'Follow multi-step oral instructions'] },
    { name: 'Oral presentations', learningOutcomes: ['Recite poems with appropriate intonation', 'Narrate personal experiences coherently', 'Participate in group discussions'] },
  ]},
  { name: 'Reading', substrands: [
    { name: 'Phonics and word recognition', learningOutcomes: ['Decode unfamiliar words using phonics', 'Read sight words with automaticity'] },
    { name: 'Reading comprehension', learningOutcomes: ['Read and understand texts at grade level', 'Identify main ideas and supporting details', 'Make predictions and inferences from texts'] },
  ]},
  { name: 'Writing', substrands: [
    { name: 'Composition writing', learningOutcomes: ['Write simple, compound and complex sentences', 'Write paragraphs with a topic sentence and supporting details', 'Write short narratives and descriptions'] },
    { name: 'Punctuation and spelling', learningOutcomes: ['Use capital letters, full stops, commas and question marks correctly', 'Spell commonly misspelled words correctly'] },
  ]},
  { name: 'Grammar', substrands: [
    { name: 'Parts of speech', learningOutcomes: ['Identify and use nouns, verbs, adjectives and adverbs', 'Use articles (a, an, the) correctly', 'Form the past and present tense of verbs'] },
    { name: 'Sentence construction', learningOutcomes: ['Construct sentences using correct word order', 'Use conjunctions to join sentences'] },
  ]},
]

const ENGLISH_G5: StrandData[] = [
  { name: 'Listening and Speaking', substrands: [
    { name: 'Oral communication', learningOutcomes: ['Participate in debates and discussions', 'Present oral reports with clarity', 'Use appropriate non-verbal communication'] },
  ]},
  { name: 'Reading', substrands: [
    { name: 'Reading comprehension', learningOutcomes: ['Identify cause and effect relationships in texts', 'Summarise texts in own words', 'Distinguish between fact and opinion'] },
    { name: 'Literature', learningOutcomes: ['Read and respond to short stories and poems', 'Identify characters, setting and plot'] },
  ]},
  { name: 'Writing', substrands: [
    { name: 'Composition writing', learningOutcomes: ['Write narratives with a clear beginning, middle and end', 'Write letters (formal and informal)', 'Use descriptive language in compositions'] },
    { name: 'Punctuation and spelling', learningOutcomes: ['Use apostrophes for possession and contractions', 'Spell grade-level words correctly'] },
  ]},
  { name: 'Grammar', substrands: [
    { name: 'Parts of speech and tenses', learningOutcomes: ['Identify and use pronouns and prepositions', 'Use the present perfect and past continuous tenses', 'Identify active and passive voice'] },
  ]},
]

const ENGLISH_G6: StrandData[] = [
  { name: 'Listening and Speaking', substrands: [
    { name: 'Oral communication', learningOutcomes: ['Give and follow complex oral instructions', 'Participate in interviews and presentations', 'Evaluate information from oral sources'] },
  ]},
  { name: 'Reading', substrands: [
    { name: 'Reading comprehension', learningOutcomes: ['Analyse texts for theme and author\'s purpose', 'Draw conclusions and make generalisations', 'Compare and contrast information across texts'] },
    { name: 'Literature', learningOutcomes: ['Analyse characters\' motivations and traits', 'Identify figurative language (similes, metaphors, personification)'] },
  ]},
  { name: 'Writing', substrands: [
    { name: 'Composition writing', learningOutcomes: ['Write expository and persuasive compositions', 'Write reports and summaries', 'Use transition words for cohesion'] },
    { name: 'Punctuation and spelling', learningOutcomes: ['Use colons and semicolons correctly', 'Use quotation marks for direct speech'] },
  ]},
  { name: 'Grammar', substrands: [
    { name: 'Advanced grammar', learningOutcomes: ['Use conditional sentences correctly', 'Identify and use clauses (main and subordinate)', 'Use reported speech'] },
  ]},
]

// ─────────────────────────────────────────────────────────────
// KISWAHILI — Grade 4-6
// ─────────────────────────────────────────────────────────────
const KISWAHILI_G4: StrandData[] = [
  { name: 'Kusikiliza na Kuzungumza', substrands: [
    { name: 'Mazungumzo na maelezo', learningOutcomes: ['Kusikiliza kwa makini maelezo na hadithi', 'Kujibu maswali kwa ustadi', 'Kufuatilia maelezo ya hatua nyingi'] },
  ]},
  { name: 'Kusoma', substrands: [
    { name: 'Ufahamu wa kusoma', learningOutcomes: ['Kusoma kwa utulivu mafupi na kuyaelewa', 'Kutambua dhima kuu na maelezo ya ziada', 'Kufanya utabiri kutoka kwa maandishi'] },
  ]},
  { name: 'Kuandika', substrands: [
    { name: 'Uandishi wa insha', learningOutcomes: ['Kuandika sentensi fupi na zenye maana', 'Kuandika aya zenye mgogo na maelezo', 'Kuandika insha fupi za kusimulia'] },
  ]},
  { name: 'Sarufi', substrands: [
    { name: 'Aina za maneno', learningOutcomes: ['Kutambua na kutumia nomino, viunganishi na vivumishi', 'Kutumia vitenzi vya nyakati tofauti', 'Kujenga sentensi zenye mpangilio sahihi'] },
  ]},
]

const KISWAHILI_G5: StrandData[] = [
  { name: 'Kusikiliza na Kuzungumza', substrands: [
    { name: 'Mijadala na wasilisho', learningOutcomes: ['Kushiriki kwenye mijadala kwa uareshi', 'Kutoa taarira na ripoti kwa sauti', 'Kutumia ishara za mikono kusaidia mawasiliano'] },
  ]},
  { name: 'Kusoma', substrands: [
    { name: 'Ufahamu na fasihi', learningOutcomes: ['Kutambua sababu na matokeo katika hadithi', 'Kufupisha maandishi kwa maneno yenyewe', 'Kutofautisha ukweli na maoni'] },
  ]},
  { name: 'Kuandika', substrands: [
    { name: 'Insha na barua', learningOutcomes: ['Kuandika insha zenye mwanzo, katikati na mwisho', 'Kuandika barua rasmi na isiyo rasmi', 'Kutumia lugha taswira katika uandishi'] },
  ]},
  { name: 'Sarufi', substrands: [
    { name: 'Nahau na ujenzi wa sentensi', learningOutcomes: ['Kutumia viaklishi vya umiliki na mafupisho', 'Kutumia nyakati za sasa na zamani', 'Kutambua sauti halisi na sauti ya shughuli'] },
  ]},
]

const KISWAHILI_G6: StrandData[] = [
  { name: 'Kusikiliza na Kuzungumza', substrands: [
    { name: 'Mawasiliano ya juu', learningOutcomes: ['Kutoa na kufuata maagizo ya mawasiliano magumu', 'Kushiriki kwenye mahojiano na wasilisho', 'Kutathmini habari kutoka vyanzo vya mawasiliano'] },
  ]},
  { name: 'Kusoma', substrands: [
    { name: 'Uchambuzi wa maandishi', learningOutcomes: ['Kuchambua maandishi kwa kusudi la mwandishi', 'Kutahiri hitimisho na kutoa muhtasari', 'Kulinganisha habari kati ya maandishi tofauti'] },
  ]},
  { name: 'Kuandika', substrands: [
    { name: 'Insha za kisayansi na hoja', learningOutcomes: ['Kuandika insha za ueleza na hoja', 'Kuandika ripoti na muhtasari', 'Kutumia viunganishi vya muktadha'] },
  ]},
  { name: 'Sarufi', substrands: [
    { name: 'Sarufi changamano', learningOutcomes: ['Kutumia sentensi masharti', 'Kutambua na kutumia kifungu kikuu na kikuu', 'Kutumia taarifa ya moja kwa moja'] },
  ]},
]

// ─────────────────────────────────────────────────────────────
// SOCIAL STUDIES — Grade 4-6
// ─────────────────────────────────────────────────────────────
const SOCIAL_G4: StrandData[] = [
  { name: 'Natural and Built Environments', substrands: [
    { name: 'Our county and its physical features', learningOutcomes: ['Name the counties of Kenya', 'Identify physical features in own county (mountains, rivers, lakes)', 'Describe the influence of physical features on human activities'] },
    { name: 'Resources in our environment', learningOutcomes: ['Identify natural resources in the environment', 'Explain the importance of conserving natural resources', 'Describe ways of using resources sustainably'] },
  ]},
  { name: 'People and Relationships', substrands: [
    { name: 'Cultural diversity and heritage', learningOutcomes: ['Identify different cultural communities in Kenya', 'Appreciate the value of cultural diversity', 'Describe cultural heritage and its preservation'] },
  ]},
  { name: 'Governance and Rights', substrands: [
    { name: 'Rights and responsibilities', learningOutcomes: ['Identify children\'s rights and responsibilities', 'Describe ways of protecting children\'s rights', 'Explain the role of government in protecting rights'] },
  ]},
]

const SOCIAL_G5: StrandData[] = [
  { name: 'Natural and Built Environments', substrands: [
    { name: 'Maps and map work', learningOutcomes: ['Read and interpret maps using keys and scales', 'Identify physical and human features on maps', 'Draw a sketch map of the school environment'] },
    { name: 'Climate and weather', learningOutcomes: ['Distinguish between weather and climate', 'Identify factors that influence climate', 'Describe the climate regions of Kenya'] },
  ]},
  { name: 'Economic Activities', substrands: [
    { name: 'Production and trade', learningOutcomes: ['Identify factors of production (land, labour, capital, entrepreneurship)', 'Describe types of trade (domestic and international)', 'Explain the role of transport and communication in trade'] },
  ]},
  { name: 'Governance', substrands: [
    { name: 'National government', learningOutcomes: ['Describe the arms of government (executive, legislature, judiciary)', 'Explain the functions of county governments', 'Describe the process of law-making'] },
  ]},
]

const SOCIAL_G6: StrandData[] = [
  { name: 'Natural and Built Environments', substrands: [
    { name: 'Population and settlement', learningOutcomes: ['Describe factors influencing population distribution', 'Identify types of settlement patterns', 'Explain effects of population growth on resources'] },
  ]},
  { name: 'Political Development', substrands: [
    { name: 'Political systems and governance', learningOutcomes: ['Describe the structure of the Kenyan government', 'Explain democratic participation and elections', 'Describe the constitution and its importance'] },
  ]},
  { name: 'Global Issues', substrands: [
    { name: 'International cooperation', learningOutcomes: ['Identify regional and international organisations (EAC, AU, UN)', 'Explain the benefits of international cooperation', 'Describe global challenges (climate change, conflict, poverty)'] },
  ]},
]

// ─────────────────────────────────────────────────────────────
// CRE (Christian Religious Education) — Grade 4-6
// ─────────────────────────────────────────────────────────────
const CRE_G4: StrandData[] = [
  { name: 'Creation and the Bible', substrands: [
    { name: 'The Bible — Structure and content', learningOutcomes: ['Identify the books of the Bible (Old and New Testament)', 'Describe how the Bible was written and translated', 'Explain the importance of reading the Bible'] },
    { name: 'Creation story', learningOutcomes: ['Describe the creation story in Genesis 1', 'Explain human beings as special creation', 'Describe the responsibility of caring for creation'] },
  ]},
  { name: 'Christian Values', substrands: [
    { name: 'Love and forgiveness', learningOutcomes: ['Describe Christian values of love and compassion', 'Explain the importance of forgiveness', 'Apply Christian values in relationships'] },
  ]},
]

const CRE_G5: StrandData[] = [
  { name: 'The Bible and Christian Living', substrands: [
    { name: 'Jesus Christ — Life and ministry', learningOutcomes: ['Describe the birth and early life of Jesus', 'Explain the teachings and miracles of Jesus', 'Describe the disciples and their role'] },
    { name: 'Prayer and worship', learningOutcomes: ['Explain the importance of prayer in Christian life', 'Describe different forms of worship', 'Identify places of worship'] },
  ]},
  { name: 'Christian Relationships', substrands: [
    { name: 'Family and community values', learningOutcomes: ['Describe Christian family values', 'Explain respect for authority and elders', 'Describe service to others in the community'] },
  ]},
]

const CRE_G6: StrandData[] = [
  { name: 'Christian Faith and Practice', substrands: [
    { name: 'The early church', learningOutcomes: ['Describe the day of Pentecost and the Holy Spirit', 'Explain the growth of the early church', 'Describe the work of the apostles'] },
    { name: 'Christian generosity and giving', learningOutcomes: ['Explain Christian teachings on giving and sharing', 'Describe the importance of helping the needy', 'Apply generosity in daily life'] },
  ]},
  { name: 'Contemporary Christian Living', substrands: [
    { name: 'Christian values in modern society', learningOutcomes: ['Apply Christian values in decision-making', 'Describe challenges of Christian living today', 'Explain the role of Christians in social justice'] },
  ]},
]

// ─────────────────────────────────────────────────────────────
// LOWER PRIMARY (Grade 1-3) — simplified strands
// ─────────────────────────────────────────────────────────────
const LOWER_PRIMARY: Record<string, SubjectData[]> = {
  'Mathematics Activities': {
    'Grade 1': [{ name: 'Numbers', substrands: [
      { name: 'Counting 1-100', learningOutcomes: ['Count forward and backward 1-100', 'Read and write numbers 1-100', 'Order numbers 1-100'] },
      { name: 'Addition and subtraction', learningOutcomes: ['Add single digits', 'Subtract single digits', 'Solve simple word problems'] },
    ]}, { name: 'Measurement', substrands: [
      { name: 'Length and mass', learningOutcomes: ['Compare lengths directly', 'Compare masses directly', 'Use non-standard units of measurement'] },
    ]}, { name: 'Geometry', substrands: [
      { name: 'Shapes', learningOutcomes: ['Identify and name common 2D shapes', 'Sort objects by shape'] },
    ]}],
    'Grade 2': [{ name: 'Numbers', substrands: [
      { name: 'Numbers up to 1000', learningOutcomes: ['Count, read and write numbers up to 1000', 'Compare and order numbers up to 1000', 'Add and subtract within 1000'] },
      { name: 'Multiplication', learningOutcomes: ['Multiply by 2, 5 and 10', 'Solve simple multiplication word problems'] },
    ]}, { name: 'Measurement', substrands: [
      { name: 'Length, mass and time', learningOutcomes: ['Measure length using metres', 'Tell time to the hour and half hour', 'Compare masses using kg'] },
    ]}],
    'Grade 3': [{ name: 'Numbers', substrands: [
      { name: 'Numbers up to 10000', learningOutcomes: ['Count, read and write numbers up to 10000', 'Perform four operations up to 10000', 'Identify place value up to 10000'] },
      { name: 'Fractions', learningOutcomes: ['Identify halves, quarters and thirds', 'Add fractions with same denominator'] },
    ]}, { name: 'Measurement', substrands: [
      { name: 'Length, mass, capacity and time', learningOutcomes: ['Measure and convert units of length', 'Measure mass and capacity', 'Read and interpret calendars and time'] },
    ]}, { name: 'Geometry', substrands: [
      { name: '2D and 3D shapes', learningOutcomes: ['Identify and describe 2D and 3D shapes', 'Identify flat and curved surfaces'] },
    ]}],
  } as any,
}

// Helper to build grade 4-6 subject map
const G4_6_MAP: Record<string, Record<string, StrandData[]>> = {
  'Science & Technology Activities': {
    'Grade 4': SCIENCE_G4,
    'Grade 5': SCIENCE_G5,
    'Grade 6': SCIENCE_G6,
  },
  'Mathematics Activities': {
    'Grade 4': MATH_G4,
    'Grade 5': MATH_G5,
    'Grade 6': MATH_G6,
  },
  'English Activities': {
    'Grade 4': ENGLISH_G4,
    'Grade 5': ENGLISH_G5,
    'Grade 6': ENGLISH_G6,
  },
  'Shughuli za Kiswahili': {
    'Grade 4': KISWAHILI_G4,
    'Grade 5': KISWAHILI_G5,
    'Grade 6': KISWAHILI_G6,
  },
  'Social Studies Activities': {
    'Grade 4': SOCIAL_G4,
    'Grade 5': SOCIAL_G5,
    'Grade 6': SOCIAL_G6,
  },
  'C.R.E Activities': {
    'Grade 4': CRE_G4,
    'Grade 5': CRE_G5,
    'Grade 6': CRE_G6,
  },
}

// ── Junior School (Grade 7-9) — Integrated Science, Math, English, Kiswahili, Social Studies ──
const G7_9_MAP: Record<string, Record<string, StrandData[]>> = {
  'Integrated Science Activities': {
    'Grade 7': SCIENCE_G5,
    'Grade 8': SCIENCE_G6,
    'Grade 9': SCIENCE_G5,
  },
  'Mathematics Activities': {
    'Grade 7': MATH_G5,
    'Grade 8': MATH_G6,
    'Grade 9': MATH_G5,
  },
  'English Activities': {
    'Grade 7': ENGLISH_G5,
    'Grade 8': ENGLISH_G6,
    'Grade 9': ENGLISH_G5,
  },
  'Shughuli za Kiswahili': {
    'Grade 7': KISWAHILI_G5,
    'Grade 8': KISWAHILI_G6,
    'Grade 9': KISWAHILI_G5,
  },
  'Social Studies Activities': {
    'Grade 7': SOCIAL_G5,
    'Grade 8': SOCIAL_G6,
    'Grade 9': SOCIAL_G5,
  },
  'C.R.E Activities': {
    'Grade 7': CRE_G5,
    'Grade 8': CRE_G6,
    'Grade 9': CRE_G5,
  },
}

async function main() {
  console.log('🧹 Wiping existing curriculum data...')
  await prisma.curriculumLesson.deleteMany({})
  await prisma.curriculumSubstrand.deleteMany({})
  await prisma.curriculumStrand.deleteMany({})
  await prisma.curriculum.deleteMany({})
  console.log('   ✓ Old data wiped')

  let curriculumCount = 0, strandCount = 0, subCount = 0

  const buildAndCreate = async (subject: string, grade: string, strands: StrandData[]) => {
    const curr = await prisma.curriculum.create({
      data: { name: `CBC ${grade} ${subject}`, type: 'CBC', subject, grade, isActive: true },
    })
    curriculumCount++
    let sOrder = 0
    for (const s of strands) {
      const strand = await prisma.curriculumStrand.create({
        data: { curriculumId: curr.id, name: s.name, order: sOrder++ },
      })
      strandCount++
      let subOrder = 0
      for (const sub of s.substrands) {
        await prisma.curriculumSubstrand.create({
          data: {
            strandId: strand.id,
            name: sub.name,
            learningOutcomes: sub.learningOutcomes,
            activities: sub.activities || [],
            order: subOrder++,
          },
        })
        subCount++
      }
    }
  }

  // Grade 4-6
  for (const [subject, grades] of Object.entries(G4_6_MAP)) {
    for (const [grade, strands] of Object.entries(grades)) {
      await buildAndCreate(subject, grade, strands)
    }
  }

  // Grade 7-9
  for (const [subject, grades] of Object.entries(G7_9_MAP)) {
    for (const [grade, strands] of Object.entries(grades)) {
      await buildAndCreate(subject, grade, strands)
    }
  }

  // Lower primary (Grade 1-3)
  for (const [subject, grades] of Object.entries(LOWER_PRIMARY)) {
    for (const [grade, strands] of Object.entries(grades)) {
      await buildAndCreate(subject, grade, strands as StrandData[])
    }
  }

  console.log(`✅ Seeded ${curriculumCount} curricula, ${strandCount} strands, ${subCount} substrands`)
}

main()
  .catch((e) => { console.error('❌ Repair failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })