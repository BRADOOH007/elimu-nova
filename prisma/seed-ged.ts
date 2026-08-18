/* eslint-disable */
// Seeds the US General Education Diploma (GED) curriculum + adult
// essential-skills courses (computer literacy, AI literacy, financial literacy).
// Idempotent: skips a curriculum if it already has strands.
// Run: npx tsx prisma/seed-ged.ts
import { PrismaClient, CurriculumType, CourseType, DifficultyLevel } from '@prisma/client'

const prisma = new PrismaClient()

interface LessonDef { title: string; objectives: string[]; content: string; duration?: number }
interface SubstrandDef { name: string; description: string; lessons: LessonDef[] }
interface StrandDef { name: string; description: string; substrands: SubstrandDef[] }
interface SubjectDef { subject: string; description: string; strands: StrandDef[] }

const GED_SUBJECTS: SubjectDef[] = [
  {
    subject: 'Mathematical Reasoning',
    description: 'Foundational math for adult learners — from whole numbers through basic algebra, geometry, and data interpretation.',
    strands: [
      {
        name: 'Number Sense & Operations',
        description: 'Confidence with whole numbers, fractions, decimals, ratios and percentages.',
        substrands: [
          {
            name: 'Whole Numbers & Place Value',
            description: 'Operations with whole numbers and understanding place value.',
            lessons: [
              { title: 'Adding, Subtracting, Multiplying & Dividing', objectives: ['Perform all four operations', 'Apply order of operations'], content: 'The four operations are the foundation of all math. Use **PEMDAS** (Parentheses, Exponents, Multiply/Divide, Add/Subtract) to do multi-step problems in the right order. Practice with everyday money examples, like adding up a shopping bill or working out change.', duration: 20 },
              { title: 'Place Value & Rounding', objectives: ['Read large numbers', 'Round to a given place value'], content: 'Place value tells you what each digit is worth (ones, tens, hundreds, and so on). Rounding makes big numbers easier to work with: look at the digit to the right of the place you are rounding to — if it is 5 or more, round up.', duration: 15 },
            ],
          },
          {
            name: 'Fractions, Decimals & Percentages',
            description: 'Converting between forms and solving real-world problems.',
            lessons: [
              { title: 'Working with Fractions', objectives: ['Simplify fractions', 'Add and multiply fractions'], content: 'A fraction is a part of a whole, written as top (numerator) over bottom (denominator). To add or subtract, make the bottom numbers the same first. To multiply, multiply the tops and the bottoms. Simplifying means dividing both by the same number.', duration: 25 },
              { title: 'Ratios, Proportions & Percentages', objectives: ['Solve ratio problems', 'Calculate percentage increase and decrease'], content: 'A **ratio** compares two amounts (like 3 cups of flour to 2 cups of sugar). A **percentage** is a ratio out of 100. To find a percentage, divide the part by the whole and multiply by 100. This is how discounts, tax, and interest work in real life.', duration: 25 },
            ],
          },
        ],
      },
      {
        name: 'Algebra & Functions',
        description: 'Expressions, equations, inequalities, and patterns.',
        substrands: [
          {
            name: 'Expressions & Equations',
            description: 'Building and solving linear equations.',
            lessons: [
              { title: 'Evaluating Expressions', objectives: ['Substitute values', 'Combine like terms'], content: 'An **expression** is a mix of numbers, letters (variables), and symbols, like `3x + 5`. To evaluate it, replace the variable with a number. "Like terms" are terms with the same variable, so `2x + 3x` combines to `5x`.', duration: 20 },
              { title: 'Solving One- & Two-Step Equations', objectives: ['Isolate variables', 'Check solutions'], content: 'An **equation** says two things are equal. To solve it, get the variable alone by doing the same operation to both sides. Always check your answer by putting it back into the original equation.', duration: 25 },
            ],
          },
          {
            name: 'Functions & Patterns',
            description: 'Interpreting patterns and function notation.',
            lessons: [
              { title: 'Patterns & Sequences', objectives: ['Identify arithmetic patterns', 'Predict next terms'], content: 'A sequence is a list of numbers that follows a rule. In an arithmetic sequence you add (or subtract) the same amount each time. Find that amount, then continue the pattern.', duration: 20 },
              { title: 'Graphing Linear Relationships', objectives: ['Plot points', 'Read slope and intercept'], content: 'A straight-line graph shows a steady relationship. The **slope** is how steep it is, and the **intercept** is where it crosses the y-axis. Together they describe the line with an equation like `y = mx + b`.', duration: 25 },
            ],
          },
        ],
      },
      {
        name: 'Geometry',
        description: 'Shapes, angles, and measurement.',
        substrands: [
          {
            name: 'Lines, Angles & Shapes',
            description: 'Classifying shapes and angle relationships.',
            lessons: [
              { title: 'Angles & Lines', objectives: ['Identify angle types', 'Use complementary and supplementary angles'], content: 'Angles are measured in degrees. A right angle is 90°, an acute angle is less, and an obtuse angle is more. **Complementary** angles add to 90° and **supplementary** angles add to 180°.', duration: 20 },
              { title: 'Classifying 2D & 3D Shapes', objectives: ['Name polygons', 'Identify solids'], content: 'Flat shapes are named by their number of sides (triangle = 3, quadrilateral = 4, pentagon = 5). 3D shapes like cubes, cylinders, and spheres have volume, not just area.', duration: 15 },
            ],
          },
          {
            name: 'Perimeter, Area & Volume',
            description: 'Measuring common shapes in practical contexts.',
            lessons: [
              { title: 'Perimeter & Area', objectives: ['Compute area of rectangles and triangles', 'Apply to real spaces'], content: '**Perimeter** is the distance around a shape (add all the sides). **Area** is the space inside — for a rectangle it is length × width, and for a triangle it is half of base × height. Use these to plan a room or measure a floor.', duration: 25 },
              { title: 'Volume & the Pythagorean Theorem', objectives: ['Find volume of prisms', 'Use a² + b² = c²'], content: '**Volume** is the space inside a 3D shape (length × width × height for a box). The **Pythagorean theorem** (a² + b² = c²) finds the longest side of a right triangle, useful for measuring diagonals.', duration: 25 },
            ],
          },
        ],
      },
      {
        name: 'Data & Statistics',
        description: 'Reading and reasoning with graphs, tables, and probability.',
        substrands: [
          {
            name: 'Reading Graphs & Tables',
            description: 'Interpreting visual data displays.',
            lessons: [
              { title: 'Bar, Line & Pie Charts', objectives: ['Extract values from charts', 'Compare categories'], content: 'Graphs turn numbers into pictures. **Bar charts** compare categories, **line charts** show change over time, and **pie charts** show parts of a whole. Always read the labels and the scale to get the right values.', duration: 20 },
              { title: 'Tables & Schedules', objectives: ['Read two-way tables', 'Solve scheduling problems'], content: 'Tables organise data into rows and columns. A two-way table shows two categories at once. To answer a question, find the row and column that match and read the cell where they meet.', duration: 20 },
            ],
          },
          {
            name: 'Averages & Probability',
            description: 'Summarizing data and basic chance.',
            lessons: [
              { title: 'Mean, Median & Mode', objectives: ['Compute each average', 'Choose the right measure'], content: 'The **mean** is the sum divided by the count. The **median** is the middle value when ordered. The **mode** is the most common value. Each describes "average" differently, so choose the one that best fits the situation.', duration: 20 },
              { title: 'Introduction to Probability', objectives: ['Express probability as a fraction', 'Predict outcomes'], content: 'Probability is how likely something is, from 0 (impossible) to 1 (certain). It is written as a fraction: favorable outcomes over total outcomes. For example, a coin landing heads is 1/2.', duration: 20 },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: 'Reasoning Through Language Arts',
    description: 'Reading comprehension, grammar, and extended-response writing for adult learners.',
    strands: [
      {
        name: 'Reading Comprehension',
        description: 'Understanding and analyzing written passages.',
        substrands: [
          {
            name: 'Main Idea & Details',
            description: 'Finding the point of a passage and supporting evidence.',
            lessons: [
              { title: 'Identifying the Main Idea', objectives: ['State the central point', 'Distinguish topic from main idea'], content: 'The **main idea** is the overall point the author is making — not just the topic. It is often stated in the first or last sentence. Supporting details back it up with facts and examples.', duration: 20 },
              { title: 'Supporting Details & Summaries', objectives: ['Find supporting facts', 'Write a summary'], content: 'A **summary** is a short version that keeps only the main idea and key details in your own words. Leave out examples and minor points. A good summary is much shorter than the original.', duration: 25 },
            ],
          },
          {
            name: 'Inference & Author\'s Purpose',
            description: 'Reading between the lines and understanding intent.',
            lessons: [
              { title: 'Making Inferences', objectives: ['Draw conclusions from evidence', 'Avoid unsupported guesses'], content: 'An **inference** is a reasonable conclusion you draw from clues in the text plus what you already know. The answer is not stated directly, but the evidence points to it. Make sure your inference is supported by the text.', duration: 25 },
              { title: 'Author\'s Purpose & Tone', objectives: ['Identify purpose', 'Recognize tone and bias'], content: 'Authors write to **inform**, **persuade**, or **entertain**. The **tone** is the feeling in the writing (serious, angry, hopeful). Recognising purpose and tone helps you judge how much to trust the message.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'Grammar & Language',
        description: 'Sentence structure, punctuation, and word usage.',
        substrands: [
          {
            name: 'Sentence Structure',
            description: 'Building clear, correct sentences.',
            lessons: [
              { title: 'Subjects, Verbs & Fragments', objectives: ['Identify complete sentences', 'Fix fragments and run-ons'], content: 'A complete sentence has a **subject** (who or what) and a **verb** (the action). A fragment is missing one of these. A run-on crams two sentences together — split them with a period or join them with a conjunction.', duration: 20 },
              { title: 'Combining & Varying Sentences', objectives: ['Use conjunctions', 'Improve sentence flow'], content: 'Short, choppy sentences are hard to read. Combine related ideas with conjunctions like **and, but, so, because**. Vary sentence length to keep your writing interesting and easy to follow.', duration: 20 },
            ],
          },
          {
            name: 'Punctuation, Verb Tense & Usage',
            description: 'Mechanics of standard written English.',
            lessons: [
              { title: 'Commas, Periods & Apostrophes', objectives: ['Apply comma rules', 'Use apostrophes correctly'], content: 'Commas separate items in a list, join clauses with a conjunction, and set off extra information. **Apostrophes** show possession (Maria\'s book) or a contraction (don\'t = do not). Do not use an apostrophe to make a word plural.', duration: 20 },
              { title: 'Verb Tense & Subject-Verb Agreement', objectives: ['Maintain consistent tense', 'Match subjects and verbs'], content: 'Verb tense shows when something happened (past, present, future). Keep the same tense throughout unless the meaning changes. A singular subject takes a singular verb: "She runs," not "She run."', duration: 25 },
            ],
          },
        ],
      },
      {
        name: 'Extended Response Writing',
        description: 'Planning and writing the GED essay.',
        substrands: [
          {
            name: 'Essay Structure',
            description: 'Introduction, body, and conclusion.',
            lessons: [
              { title: 'Planning an Essay', objectives: ['Analyze the prompt', 'Outline a response'], content: 'Before writing, read the prompt carefully and decide what it is asking. Spend a few minutes making an outline: your main point plus two or three supporting ideas. A plan keeps your essay focused and saves time.', duration: 25 },
              { title: 'Thesis, Topic Sentences & Conclusion', objectives: ['Write a clear thesis', 'Develop paragraphs'], content: 'The **thesis** states your main argument in the introduction. Each body paragraph starts with a topic sentence that supports the thesis. The conclusion restates the thesis and wraps up your argument.', duration: 25 },
            ],
          },
          {
            name: 'Argument & Evidence',
            description: 'Building a supported argument.',
            lessons: [
              { title: 'Using Evidence', objectives: ['Cite the passage', 'Connect evidence to claims'], content: 'A strong argument is backed by **evidence** — quotes or facts from the passage. After you give evidence, explain how it supports your point. Never make a claim without support.', duration: 25 },
              { title: 'Revising & Editing', objectives: ['Improve clarity', 'Check grammar and mechanics'], content: 'Always leave time to review your essay. Revise for clarity (does each paragraph make sense?) and edit for errors (spelling, punctuation, verb tense). Reading it aloud helps you catch mistakes.', duration: 20 },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: 'Science',
    description: 'Life, physical, and earth & space science with a focus on interpreting data.',
    strands: [
      {
        name: 'Life Science',
        description: 'Cells, genetics, evolution, and ecosystems.',
        substrands: [
          {
            name: 'Cells & the Human Body',
            description: 'The building blocks of life and body systems.',
            lessons: [
              { title: 'Cells & Organisms', objectives: ['Identify cell structures', 'Contrast plant and animal cells'], content: 'The **cell** is the smallest unit of life. Every living thing is made of cells. Plant cells have a cell wall and chloroplasts; animal cells do not. Both have a nucleus that holds the genetic material.', duration: 20 },
              { title: 'Human Body Systems', objectives: ['Name major systems', 'Explain their functions'], content: 'Your body is made of systems that work together: the **circulatory** system moves blood, the **respiratory** system brings in oxygen, and the **digestive** system breaks down food. Each system has a specific job.', duration: 25 },
            ],
          },
          {
            name: 'Genetics & Ecosystems',
            description: 'Heredity and the web of life.',
            lessons: [
              { title: 'DNA, Genes & Inheritance', objectives: ['Explain basic heredity', 'Interpret simple Punnett squares'], content: '**DNA** is the instruction manual for life. **Genes** are sections of DNA that you inherit from your parents. A Punnett square is a simple grid that predicts the chance of offspring inheriting a trait.', duration: 25 },
              { title: 'Food Chains & Ecosystems', objectives: ['Describe energy flow', 'Identify producers and consumers'], content: 'In an ecosystem, energy flows from the sun to **producers** (plants) to **consumers** (animals). A food chain shows this flow: plant → herbivore → carnivore. Remove one link and the whole chain is affected.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'Physical Science',
        description: 'Matter, energy, forces, and motion.',
        substrands: [
          {
            name: 'Matter & Energy',
            description: 'Atoms, states of matter, and energy transfer.',
            lessons: [
              { title: 'Atoms & States of Matter', objectives: ['Describe atomic structure', 'Contrast states of matter'], content: 'Everything is made of **atoms**, which contain protons, neutrons, and electrons. Matter exists as a solid, liquid, or gas depending on how tightly the atoms are packed and how fast they move.', duration: 20 },
              { title: 'Energy & Heat Transfer', objectives: ['Identify energy forms', 'Explain conduction and convection'], content: 'Energy comes in many forms: heat, light, motion, and electricity. Heat moves by **conduction** (direct contact), **convection** (through fluids), and **radiation** (through empty space).', duration: 25 },
            ],
          },
          {
            name: 'Forces & Motion',
            description: 'How objects move.',
            lessons: [
              { title: 'Force, Mass & Acceleration', objectives: ['Apply Newton\'s laws', 'Calculate speed'], content: 'A **force** is a push or pull. Newton\'s second law says force = mass × acceleration: heavier objects need more force to speed up. Speed is distance divided by time.', duration: 25 },
              { title: 'Gravity & Simple Machines', objectives: ['Explain gravity', 'Identify simple machines'], content: '**Gravity** is the force that pulls objects toward each other — it keeps you on the ground. Simple machines like levers, pulleys, and ramps make work easier by reducing the force you need.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'Earth & Space Science',
        description: 'Earth systems, weather, and the solar system.',
        substrands: [
          {
            name: 'Earth Systems & Weather',
            description: 'The water cycle and climate.',
            lessons: [
              { title: 'The Water Cycle & Climate', objectives: ['Describe the water cycle', 'Distinguish weather and climate'], content: 'The **water cycle** moves water through evaporation, condensation, and precipitation. **Weather** is the day-to-day condition; **climate** is the long-term average pattern of a region.', duration: 20 },
              { title: 'Natural Resources', objectives: ['Classify renewable and nonrenewable', 'Discuss conservation'], content: '**Renewable** resources (sunlight, wind, water) are replaced naturally. **Nonrenewable** resources (coal, oil, natural gas) take millions of years to form and will run out. Conservation means using them wisely.', duration: 20 },
            ],
          },
          {
            name: 'The Solar System',
            description: 'Earth\'s place in space.',
            lessons: [
              { title: 'Sun, Moon & Earth', objectives: ['Explain day, night and seasons', 'Describe moon phases'], content: 'Earth spins once a day, causing day and night. Earth orbits the sun once a year, and its tilt causes the seasons. The moon orbits Earth, and its changing position causes the phases we see.', duration: 25 },
              { title: 'The Planets & Beyond', objectives: ['Name the planets', 'Explain orbits'], content: 'The eight planets orbit the sun in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. An **orbit** is the curved path one object takes around another due to gravity.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'Scientific Reasoning',
        description: 'Reading experiments and interpreting data.',
        substrands: [
          {
            name: 'The Scientific Method',
            description: 'Designing and understanding experiments.',
            lessons: [
              { title: 'Hypotheses & Variables', objectives: ['Write a hypothesis', 'Identify variables'], content: 'A **hypothesis** is a testable prediction ("If..., then..."). Experiments test one thing at a time: the **independent variable** is what you change, and the **dependent variable** is what you measure.', duration: 20 },
              { title: 'Designing an Experiment', objectives: ['Define controls', 'Collect data'], content: 'A good experiment has a **control group** that stays unchanged, so you can compare results. Collect data carefully and repeat trials to be sure your results are reliable.', duration: 25 },
            ],
          },
          {
            name: 'Interpreting Data',
            description: 'Graphs, tables, and conclusions.',
            lessons: [
              { title: 'Reading Graphs & Tables', objectives: ['Extract data', 'Identify trends'], content: 'Science data is often shown in graphs and tables. Look for the **trend** — does the line go up, down, or stay flat? The axis labels tell you what is being measured.', duration:20 },
              { title: 'Drawing Conclusions', objectives: ['Connect data to claims', 'Evaluate evidence'], content: 'A conclusion must be supported by the data. Ask: does the evidence actually back up the claim? Be careful not to overstate — results can support a hypothesis without proving it absolutely.', duration: 20 },
            ],
          },
        ],
      },
    ],
  },
  {
    subject: 'Social Studies',
    description: 'US civics, history, geography, and economics for the GED.',
    strands: [
      {
        name: 'US Civics & Government',
        description: 'The Constitution and how government works.',
        substrands: [
          {
            name: 'The Constitution',
            description: 'Founding principles and structure.',
            lessons: [
              { title: 'The Constitution & Bill of Rights', objectives: ['Identify key amendments', 'Explain checks and balances'], content: 'The **Constitution** is the supreme law of the United States. The first ten amendments, the **Bill of Rights**, protect freedoms like speech and religion. **Checks and balances** keep any one branch from becoming too powerful.', duration: 25 },
              { title: 'The Three Branches', objectives: ['Name the branches', 'Describe their powers'], content: 'The government has three branches: the **legislative** (Congress) makes laws, the **executive** (President) enforces them, and the **judicial** (courts) interprets them. Each branch can limit the others.', duration: 20 },
            ],
          },
          {
            name: 'Rights & Citizenship',
            description: 'How citizens participate.',
            lessons: [
              { title: 'Rights & Responsibilities', objectives: ['List civic duties', 'Explain voting'], content: 'Citizens have rights (like voting and free speech) and responsibilities (like obeying laws and serving on juries). Voting is a key way citizens influence government decisions.', duration: 20 },
              { title: 'Elections & Political Parties', objectives: ['Describe the electoral process', 'Identify major parties'], content: 'Elections choose leaders at the local, state, and national level. The two major parties are the Democrats and Republicans. Candidates campaign to win votes, and the winner takes office after the election.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'US History',
        description: 'From the colonies to the modern era.',
        substrands: [
          {
            name: 'Founding the Nation',
            description: 'Revolution and early government.',
            lessons: [
              { title: 'Colonial America & the Revolution', objectives: ['Summarize colonial life', 'Explain the causes of the Revolution'], content: 'The 13 colonies were British settlements along the east coast. Disputes over taxes and representation led to the **American Revolution** (1775–1783), which ended with independence from Britain.', duration: 25 },
              { title: 'The New Nation', objectives: ['Describe the Constitution\'s creation', 'Identify early presidents'], content: 'After independence, the states created the **Constitution** in 1787 to form a stronger national government. George Washington became the first president in 1789.', duration: 20 },
            ],
          },
          {
            name: 'Growth & Conflict',
            description: 'Expansion, Civil War, and change.',
            lessons: [
              { title: 'Westward Expansion', objectives: ['Explain Manifest Destiny', 'Describe its impact'], content: 'In the 1800s, Americans moved west in a wave called **westward expansion**. The belief that expansion was destined — **Manifest Destiny** — drove this, but it displaced Native Americans and fueled conflict.', duration: 20 },
              { title: 'The Civil War & Reconstruction', objectives: ['Identify causes', 'Describe outcomes'], content: 'The **Civil War** (1861–1865) was fought over slavery and states\' rights, ending with the Union victory and the end of slavery. **Reconstruction** then rebuilt the South and tried to protect the rights of freed people.', duration: 25 },
            ],
          },
        ],
      },
      {
        name: 'Geography',
        description: 'Maps, regions, and human geography.',
        substrands: [
          {
            name: 'Maps & Regions',
            description: 'Reading maps and understanding US regions.',
            lessons: [
              { title: 'Reading Maps', objectives: ['Use latitude and longitude', 'Interpret map symbols'], content: 'Maps use a grid of **latitude** (north–south) and **longitude** (east–west) to locate places. The legend explains symbols and the scale shows real distances. Practice reading maps to find locations quickly.', duration: 20 },
              { title: 'US Regions & Physical Features', objectives: ['Name major regions', 'Identify landforms'], content: 'The US is often divided into regions like the Northeast, South, Midwest, and West. Major physical features include the Rocky Mountains, the Mississippi River, and the Great Plains.', duration: 20 },
            ],
          },
          {
            name: 'Human Geography',
            description: 'Population and movement.',
            lessons: [
              { title: 'Population & Migration', objectives: ['Explain push and pull factors', 'Describe urbanization'], content: 'People migrate because of **push factors** (war, poverty) and **pull factors** (jobs, safety). **Urbanization** is the movement of people from rural areas to cities, a major global trend.', duration: 20 },
              { title: 'Culture & Resources', objectives: ['Connect resources to settlement', 'Discuss cultural regions'], content: 'People settle where resources like water and fertile land are available. Culture — language, religion, and customs — varies by region and shapes how communities live and work.', duration: 20 },
            ],
          },
        ],
      },
      {
        name: 'Economics',
        description: 'Markets, government, and personal finance.',
        substrands: [
          {
            name: 'Markets & the Economy',
            description: 'How supply and demand work.',
            lessons: [
              { title: 'Supply & Demand', objectives: ['Explain the laws of supply and demand', 'Identify equilibrium'], content: '**Demand** is how much people want a product; **supply** is how much is available. When demand rises, prices rise; when supply rises, prices fall. **Equilibrium** is where supply and demand balance.', duration: 25 },
              { title: 'Types of Economies', objectives: ['Contrast market and command economies', 'Describe mixed economies'], content: 'In a **market economy**, people and businesses make decisions freely. In a **command economy**, the government controls them. Most real economies are **mixed**, combining both.', duration: 20 },
            ],
          },
          {
            name: 'Personal Finance',
            description: 'Money skills for adults.',
            lessons: [
              { title: 'Budgeting & Saving', objectives: ['Create a budget', 'Explain interest'], content: 'A **budget** tracks your income and expenses so you can save. **Interest** is money earned on savings or paid on loans — it can work for you (saving) or against you (debt).', duration: 25 },
              { title: 'Credit & Debt', objectives: ['Explain credit scores', 'Avoid debt traps'], content: 'A **credit score** is a number lenders use to judge how reliably you repay. Paying on time builds good credit. High-interest debt can trap you, so borrow only what you need and can repay.', duration: 25 },
            ],
          },
        ],
      },
    ],
  },
]

interface CourseDef {
  title: string
  description: string
  type: CourseType
  difficulty: DifficultyLevel
  duration: string
  objectives: string[]
  lessons: { title: string; description: string; content: string; duration?: number }[]
}

const ADULT_COURSES: CourseDef[] = [
  {
    title: 'Computer Literacy Essentials',
    description: 'Learn to confidently use a computer, the internet, email, and everyday office tools.',
    type: 'ADULT_COMPUTER_LITERACY',
    difficulty: 'EASY',
    duration: '6 weeks',
    objectives: ['Operate a computer and manage files', 'Browse the internet safely', 'Send professional emails', 'Create documents and spreadsheets'],
    lessons: [
      {
        title: 'Computer Basics & Files',
        description: 'Parts of a computer, operating systems, and file management.',
        duration: 25,
        content: `## The parts of a computer
A computer has four main parts: the **monitor** (screen), the **system unit** or laptop body (the brain), the **keyboard** (for typing), and the **mouse or touchpad** (for pointing and clicking). You do not need to know what is inside to use one — but knowing these parts helps you ask for help.

## What is an operating system?
The operating system is the software that runs the computer. Windows, macOS, and Android are examples. It is what you see when the computer starts — the desktop with icons and menus.

## Files and folders
Everything you save is a **file** (a document, photo, or video). Files live inside **folders** to keep them organised. To save a file, choose **File > Save**, give it a clear name, and pick a folder you will remember.

### Key takeaways
- The monitor, keyboard, mouse, and system unit are the basic parts.
- The operating system is the software that runs everything.
- Save files into named folders so you can find them again.`,
      },
      {
        title: 'The Internet & Web Browsers',
        description: 'Searching, bookmarks, and understanding URLs.',
        duration: 25,
        content: `## What is the internet?
The internet connects computers around the world. The **web** is the collection of websites you visit through a **browser** such as Chrome, Firefox, or Safari.

## Understanding a web address
A web address (URL) tells your browser where to go. Look at the start: a padlock icon and **https://** mean the site is secure. Be cautious about entering passwords or payment details on sites without it.

## Searching and bookmarks
Type keywords into a search engine to find information. To save a site for later, click the **star** in the address bar to create a **bookmark**.

### Key takeaways
- Use a browser to visit websites on the web.
- A padlock and https:// mean a connection is secure.
- Bookmark the sites you use often.`,
      },
      {
        title: 'Email & Online Communication',
        description: 'Writing, sending, attaching, and staying safe from scams.',
        duration: 25,
        content: `## Writing a clear email
A good email has three parts: a **subject line** that says what it is about, a short **message**, and a polite **closing** with your name. For example: *"Application for the sales role — John Mwangi."*

## Attaching files
To send a photo or document, click the **paperclip (attach)** icon and choose the file. Attachments have a size limit, so very large files may need a link instead.

## Avoiding scams
Scammers send fake emails to trick you. Never click links or open attachments from senders you do not know, and never share your password or bank details by email.

### Key takeaways
- Always write a clear subject line.
- Use the paperclip icon to attach files.
- Do not open unknown links or share passwords by email.`,
      },
      {
        title: 'Word Processing & Spreadsheets',
        description: 'Create documents and basic spreadsheets for work.',
        duration: 30,
        content: `## Word processing
A word processor (like Microsoft Word or Google Docs) lets you write letters, reports, and CVs. Use the toolbar to make text **bold**, change the font, and align paragraphs.

## Spreadsheets
A spreadsheet (like Excel or Google Sheets) is a grid of **cells** used for numbers and lists. Each cell has a name like **A1** (column A, row 1). You can add up a column with a formula such as **=SUM(A1:A10)**.

## Everyday uses
- Write a CV or a letter in a word processor.
- Track income and expenses in a spreadsheet.

### Key takeaways
- Use a word processor for letters and documents.
- Use a spreadsheet for numbers, lists, and calculations.`,
      },
      {
        title: 'Online Safety & Privacy',
        description: 'Passwords, phishing, and protecting your identity.',
        duration: 25,
        content: `## Strong passwords
Use a different password for every important account, and make each one long. A strong password uses a mix of letters, numbers, and symbols — or better, a short **passphrase** of random words.

## Recognising phishing
**Phishing** is when someone pretends to be a bank or company to steal your details. Be suspicious of urgent messages asking you to "verify your account" or "claim a prize."

## Protecting your identity
Do not share your ID number, bank PIN, or passwords online. Log out of shared computers, and only enter personal details on secure (https) sites.

### Key takeaways
- Use long, unique passwords for every account.
- Urgent "verify now" messages are often phishing.
- Never share your PIN, ID number, or passwords.`,
      },
    ],
  },
  {
    title: 'AI Literacy for Adults',
    description: 'Understand what AI is, how to use AI tools responsibly, and how AI is changing work.',
    type: 'ADULT_AI_LITERACY',
    difficulty: 'EASY',
    duration: '4 weeks',
    objectives: ['Explain what AI is and is not', 'Use AI assistants effectively with good prompts', 'Recognize AI limitations and bias', 'Apply AI tools to everyday work'],
    lessons: [
      {
        title: 'What Is AI?',
        description: 'A plain-language introduction to artificial intelligence.',
        duration: 20,
        content: `## A simple definition
Artificial intelligence (AI) is software that can perform tasks that normally need human thinking — like understanding language, answering questions, or recognising images.

## What AI is not
AI is not a person and does not "think" the way you do. It predicts the most likely next words or answers based on patterns it learned from huge amounts of text. It can be very helpful, but it also makes mistakes.

## Where you already see AI
- Voice assistants (Siri, Google Assistant)
- Auto-correct and suggested replies
- Recommendations on YouTube and shopping apps
- Chatbots that answer customer questions

### Key takeaways
- AI is software that mimics human-like tasks.
- AI predicts based on patterns — it does not truly understand.
- You already use AI every day without realising it.`,
      },
      {
        title: 'Using AI Assistants & Prompting',
        description: 'How to write clear prompts and get useful results.',
        duration: 30,
        content: `## What is a prompt?
A **prompt** is the instruction you give an AI assistant (like ChatGPT or Gemini). The quality of the answer depends a lot on how clear your prompt is.

## A simple formula
1. **Role** — tell it who to act as: *"You are a friendly career advisor."*
2. **Task** — what you want: *"Write a short CV summary for a shop assistant."*
3. **Details** — the facts it needs: *"I have 5 years of experience and work well with customers."*

## Asking for better answers
If the first answer is not right, keep refining: *"Make it shorter,"* *"Use simpler words,"* or *"Give me three options."*

### Key takeaways
- A prompt is your instruction to the AI.
- Use Role + Task + Details for better results.
- Refine your prompt if the answer is not what you need.`,
      },
      {
        title: 'AI Limitations & Ethics',
        description: 'Bias, hallucinations, privacy, and responsible use.',
        duration: 25,
        content: `## AI makes mistakes
AI can confidently state something that is wrong — this is called a **hallucination**. Always check important facts (dates, laws, prices) against a trusted source.

## Bias
Because AI learns from human data, it can repeat human **biases**. Be aware of this and do not take every AI answer as neutral truth.

## Privacy and honesty
Do not paste sensitive personal details (ID numbers, passwords) into AI tools. If you use AI to help write a document for work or study, be honest about it when the rules require it.

### Key takeaways
- AI can be confidently wrong — verify important facts.
- AI can reflect human bias.
- Keep personal and sensitive data out of AI tools.`,
      },
      {
        title: 'AI at Work & in Daily Life',
        description: 'Real-world ways AI helps with writing, research, and planning.',
        duration: 25,
        content: `## Writing help
Use AI to draft and polish emails, letters, reports, and CVs. Always read and adjust the result so it sounds like you.

## Research and learning
Ask AI to explain a topic in simple terms, summarise a long document, or create a study plan. Use it as a starting point, then verify with reliable sources.

## Planning and organisation
AI can help you plan a weekly schedule, write a meal plan, prepare for an interview, or brainstorm business ideas.

### Key takeaways
- Use AI to draft and polish writing.
- Use AI to explain, summarise, and plan.
- Always review and personalise the output.`,
      },
    ],
  },
  {
    title: 'Financial Literacy Foundations',
    description: 'Practical money skills: budgeting, banking, credit, and planning for the future.',
    type: 'ADULT_FINANCIAL_LITERACY',
    difficulty: 'EASY',
    duration: '4 weeks',
    objectives: ['Create and follow a budget', 'Use banking tools', 'Understand credit and debt', 'Plan for savings and goals'],
    lessons: [
      {
        title: 'Budgeting Basics',
        description: 'Track income and expenses with a simple budget.',
        duration: 25,
        content: `## What is a budget?
A budget is a plan for your money. It shows how much comes in (**income**) and how much goes out (**expenses**).

## The 50/30/20 rule
A simple way to start:
- **50%** for needs (rent, food, transport)
- **30%** for wants (entertainment, eating out)
- **20%** for savings and paying off debt

## Track your spending
For one month, write down everything you spend. You will quickly see where the money goes and where you can cut back.

### Key takeaways
- A budget is a plan for income and expenses.
- Try the 50/30/20 rule.
- Track spending to find savings.`,
      },
      {
        title: 'Banking & Accounts',
        description: 'Checking, savings, and online banking.',
        duration: 25,
        content: `## Types of accounts
- A **checking (current) account** is for everyday money — paying bills and receiving salary.
- A **savings account** is for money you keep aside, and it usually earns a small amount of **interest**.

## Online and mobile banking
Most banks let you check your balance, send money, and pay bills from a phone app. Keep your login details private and log out on shared devices.

## Avoiding fees
Some accounts charge monthly fees or fees for certain transactions. Ask your bank about fees so you can choose the right account.

### Key takeaways
- Use a checking account for daily money and a savings account for goals.
- Mobile banking is convenient — keep it secure.
- Ask about fees before choosing an account.`,
      },
      {
        title: 'Credit, Loans & Debt',
        description: 'Credit scores, interest, and borrowing wisely.',
        duration: 30,
        content: `## What is credit?
Credit means borrowing money now and paying it back later. A **credit score** is a number lenders use to judge how reliably you repay. Paying bills on time improves your score.

## Understanding interest
When you borrow, you usually pay back more than you borrowed — the extra is **interest**. High-interest loans (like some mobile loans) grow very fast, so borrow only what you truly need.

## Avoiding a debt trap
Only borrow for things that will improve your situation, and always check the total cost including interest. If you are struggling, talk to the lender early rather than ignoring it.

### Key takeaways
- A credit score reflects how reliably you repay.
- Interest is the extra you pay to borrow — it can grow fast.
- Borrow only what you need and can repay.`,
      },
      {
        title: 'Saving & Planning Ahead',
        description: 'Emergency funds and long-term goals.',
        duration: 25,
        content: `## Start an emergency fund
An **emergency fund** is money set aside for surprises — a medical bill or car repair. Aim to build up about 3 months of expenses, even if it takes time. Start small and be consistent.

## Set a savings goal
Decide what you are saving for and how much you need. Break it into monthly amounts: saving 1,000 a month reaches 12,000 in a year.

## Make saving automatic
Set up an automatic transfer to your savings account on payday, so you save before you spend.

### Key takeaways
- Build an emergency fund of about 3 months of expenses.
- Break big goals into monthly amounts.
- Automate saving so it happens before you spend.`,
      },
    ],
  },
]

async function seedGEDCurriculum() {
  for (const subj of GED_SUBJECTS) {
    let curriculum = await prisma.curriculum.findFirst({
      where: { type: 'GED', grade: 'Adult', subject: subj.subject },
    })
    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: {
          name: `GED ${subj.subject}`,
          type: 'GED',
          subject: subj.subject,
          grade: 'Adult',
          term: null,
          description: subj.description,
        },
      })
    } else {
      await prisma.curriculum.update({
        where: { id: curriculum.id },
        data: { description: subj.description, isActive: true },
      })
    }

    let createdLessons = 0
    let updatedLessons = 0
    let strandOrder = 0
    for (const strand of subj.strands) {
      let existingStrand = await prisma.curriculumStrand.findFirst({
        where: { curriculumId: curriculum.id, name: strand.name },
      })
      if (!existingStrand) {
        existingStrand = await prisma.curriculumStrand.create({
          data: { curriculumId: curriculum.id, name: strand.name, description: strand.description, order: strandOrder },
        })
      }
      strandOrder++
      let substrandOrder = 0
      for (const ss of strand.substrands) {
        let existingSub = await prisma.curriculumSubstrand.findFirst({
          where: { strandId: existingStrand.id, name: ss.name },
        })
        if (!existingSub) {
          existingSub = await prisma.curriculumSubstrand.create({
            data: {
              strandId: existingStrand.id,
              name: ss.name,
              description: ss.description,
              learningOutcomes: ss.lessons.flatMap((l) => l.objectives),
              activities: [`Read and complete: ${ss.name}`],
              order: substrandOrder,
            },
          })
        }
        substrandOrder++
        let lessonOrder = 0
        for (const lesson of ss.lessons) {
          const existingLesson = await prisma.curriculumLesson.findFirst({
            where: { substrandId: existingSub.id, title: lesson.title },
          })
          if (existingLesson) {
            if (!existingLesson.content) {
              await prisma.curriculumLesson.update({
                where: { id: existingLesson.id },
                data: { content: lesson.content, objectives: lesson.objectives },
              })
              updatedLessons++
            }
          } else {
            await prisma.curriculumLesson.create({
              data: {
                substrandId: existingSub.id,
                title: lesson.title,
                objectives: lesson.objectives,
                content: lesson.content,
                duration: lesson.duration ?? 20,
                order: lessonOrder,
              },
            })
            createdLessons++
          }
          lessonOrder++
        }
      }
    }
    console.log(`  • ${subj.subject}: ${createdLessons} created, ${updatedLessons} content-filled`)
  }
}

async function seedAdultCourses() {
  for (const course of ADULT_COURSES) {
    let existing = await prisma.course.findFirst({ where: { title: course.title } })
    if (!existing) {
      existing = await prisma.course.create({
        data: {
          title: course.title,
          description: course.description,
          type: course.type,
          gradeLevel: 'Adult',
          difficulty: course.difficulty,
          duration: course.duration,
          objectives: course.objectives,
        },
      })
    }
    const courseId = existing.id

    // Upsert each lesson: create if missing, else fill in content if empty.
    let order = 0
    let created = 0
    let updated = 0
    for (const l of course.lessons) {
      const found = await prisma.courseLesson.findFirst({ where: { courseId, title: l.title } })
      if (found) {
        if (!found.content) {
          await prisma.courseLesson.update({ where: { id: found.id }, data: { content: l.content, description: l.description } })
          updated++
        }
      } else {
        await prisma.courseLesson.create({
          data: { courseId, title: l.title, description: l.description, content: l.content, duration: l.duration ?? 20, order: order },
        })
        created++
      }
      order++
    }
    console.log(`  • ${course.title}: ${created} created, ${updated} content-filled, ${course.lessons.length} total`)
  }
}

async function main() {
  console.log('🌱 Seeding GED curriculum & adult courses...')
  console.log('GED subjects:')
  await seedGEDCurriculum()
  console.log('Adult courses:')
  await seedAdultCourses()
  console.log('✅ GED seed complete.')
}

main()
  .catch((e) => {
    console.error('GED seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
