/* eslint-disable */
// Seeds the US General Education Diploma (GED) curriculum + adult
// essential-skills courses (computer literacy, AI literacy, financial literacy).
// Idempotent: skips a curriculum if it already has strands.
// Run: npx tsx prisma/seed-ged.ts
import { PrismaClient, CurriculumType, CourseType, DifficultyLevel } from '@prisma/client'

const prisma = new PrismaClient()

interface LessonDef { title: string; objectives: string[]; duration?: number }
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
              { title: 'Adding, Subtracting, Multiplying & Dividing', objectives: ['Perform all four operations', 'Apply order of operations'], duration: 20 },
              { title: 'Place Value & Rounding', objectives: ['Read large numbers', 'Round to a given place value'], duration: 15 },
            ],
          },
          {
            name: 'Fractions, Decimals & Percentages',
            description: 'Converting between forms and solving real-world problems.',
            lessons: [
              { title: 'Working with Fractions', objectives: ['Simplify fractions', 'Add and multiply fractions'], duration: 25 },
              { title: 'Ratios, Proportions & Percentages', objectives: ['Solve ratio problems', 'Calculate percentage increase and decrease'], duration: 25 },
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
              { title: 'Evaluating Expressions', objectives: ['Substitute values', 'Combine like terms'], duration: 20 },
              { title: 'Solving One- & Two-Step Equations', objectives: ['Isolate variables', 'Check solutions'], duration: 25 },
            ],
          },
          {
            name: 'Functions & Patterns',
            description: 'Interpreting patterns and function notation.',
            lessons: [
              { title: 'Patterns & Sequences', objectives: ['Identify arithmetic patterns', 'Predict next terms'], duration: 20 },
              { title: 'Graphing Linear Relationships', objectives: ['Plot points', 'Read slope and intercept'], duration: 25 },
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
              { title: 'Angles & Lines', objectives: ['Identify angle types', 'Use complementary and supplementary angles'], duration: 20 },
              { title: 'Classifying 2D & 3D Shapes', objectives: ['Name polygons', 'Identify solids'], duration: 15 },
            ],
          },
          {
            name: 'Perimeter, Area & Volume',
            description: 'Measuring common shapes in practical contexts.',
            lessons: [
              { title: 'Perimeter & Area', objectives: ['Compute area of rectangles and triangles', 'Apply to real spaces'], duration: 25 },
              { title: 'Volume & the Pythagorean Theorem', objectives: ['Find volume of prisms', 'Use a² + b² = c²'], duration: 25 },
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
              { title: 'Bar, Line & Pie Charts', objectives: ['Extract values from charts', 'Compare categories'], duration: 20 },
              { title: 'Tables & Schedules', objectives: ['Read two-way tables', 'Solve scheduling problems'], duration: 20 },
            ],
          },
          {
            name: 'Averages & Probability',
            description: 'Summarizing data and basic chance.',
            lessons: [
              { title: 'Mean, Median & Mode', objectives: ['Compute each average', 'Choose the right measure'], duration: 20 },
              { title: 'Introduction to Probability', objectives: ['Express probability as a fraction', 'Predict outcomes'], duration: 20 },
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
              { title: 'Identifying the Main Idea', objectives: ['State the central point', 'Distinguish topic from main idea'], duration: 20 },
              { title: 'Supporting Details & Summaries', objectives: ['Find supporting facts', 'Write a summary'], duration: 25 },
            ],
          },
          {
            name: 'Inference & Author\'s Purpose',
            description: 'Reading between the lines and understanding intent.',
            lessons: [
              { title: 'Making Inferences', objectives: ['Draw conclusions from evidence', 'Avoid unsupported guesses'], duration: 25 },
              { title: 'Author\'s Purpose & Tone', objectives: ['Identify purpose', 'Recognize tone and bias'], duration: 20 },
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
              { title: 'Subjects, Verbs & Fragments', objectives: ['Identify complete sentences', 'Fix fragments and run-ons'], duration: 20 },
              { title: 'Combining & Varying Sentences', objectives: ['Use conjunctions', 'Improve sentence flow'], duration: 20 },
            ],
          },
          {
            name: 'Punctuation, Verb Tense & Usage',
            description: 'Mechanics of standard written English.',
            lessons: [
              { title: 'Commas, Periods & Apostrophes', objectives: ['Apply comma rules', 'Use apostrophes correctly'], duration: 20 },
              { title: 'Verb Tense & Subject-Verb Agreement', objectives: ['Maintain consistent tense', 'Match subjects and verbs'], duration: 25 },
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
              { title: 'Planning an Essay', objectives: ['Analyze the prompt', 'Outline a response'], duration: 25 },
              { title: 'Thesis, Topic Sentences & Conclusion', objectives: ['Write a clear thesis', 'Develop paragraphs'], duration: 25 },
            ],
          },
          {
            name: 'Argument & Evidence',
            description: 'Building a supported argument.',
            lessons: [
              { title: 'Using Evidence', objectives: ['Cite the passage', 'Connect evidence to claims'], duration: 25 },
              { title: 'Revising & Editing', objectives: ['Improve clarity', 'Check grammar and mechanics'], duration: 20 },
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
              { title: 'Cells & Organisms', objectives: ['Identify cell structures', 'Contrast plant and animal cells'], duration: 20 },
              { title: 'Human Body Systems', objectives: ['Name major systems', 'Explain their functions'], duration: 25 },
            ],
          },
          {
            name: 'Genetics & Ecosystems',
            description: 'Heredity and the web of life.',
            lessons: [
              { title: 'DNA, Genes & Inheritance', objectives: ['Explain basic heredity', 'Interpret simple Punnett squares'], duration: 25 },
              { title: 'Food Chains & Ecosystems', objectives: ['Describe energy flow', 'Identify producers and consumers'], duration: 20 },
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
              { title: 'Atoms & States of Matter', objectives: ['Describe atomic structure', 'Contrast states of matter'], duration: 20 },
              { title: 'Energy & Heat Transfer', objectives: ['Identify energy forms', 'Explain conduction and convection'], duration: 25 },
            ],
          },
          {
            name: 'Forces & Motion',
            description: 'How objects move.',
            lessons: [
              { title: 'Force, Mass & Acceleration', objectives: ['Apply Newton\'s laws', 'Calculate speed'], duration: 25 },
              { title: 'Gravity & Simple Machines', objectives: ['Explain gravity', 'Identify simple machines'], duration: 20 },
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
              { title: 'The Water Cycle & Climate', objectives: ['Describe the water cycle', 'Distinguish weather and climate'], duration: 20 },
              { title: 'Natural Resources', objectives: ['Classify renewable and nonrenewable', 'Discuss conservation'], duration: 20 },
            ],
          },
          {
            name: 'The Solar System',
            description: 'Earth\'s place in space.',
            lessons: [
              { title: 'Sun, Moon & Earth', objectives: ['Explain day, night and seasons', 'Describe moon phases'], duration: 25 },
              { title: 'The Planets & Beyond', objectives: ['Name the planets', 'Explain orbits'], duration: 20 },
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
              { title: 'Hypotheses & Variables', objectives: ['Write a hypothesis', 'Identify variables'], duration: 20 },
              { title: 'Designing an Experiment', objectives: ['Define controls', 'Collect data'], duration: 25 },
            ],
          },
          {
            name: 'Interpreting Data',
            description: 'Graphs, tables, and conclusions.',
            lessons: [
              { title: 'Reading Graphs & Tables', objectives: ['Extract data', 'Identify trends'], duration: 20 },
              { title: 'Drawing Conclusions', objectives: ['Connect data to claims', 'Evaluate evidence'], duration: 20 },
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
              { title: 'The Constitution & Bill of Rights', objectives: ['Identify key amendments', 'Explain checks and balances'], duration: 25 },
              { title: 'The Three Branches', objectives: ['Name the branches', 'Describe their powers'], duration: 20 },
            ],
          },
          {
            name: 'Rights & Citizenship',
            description: 'How citizens participate.',
            lessons: [
              { title: 'Rights & Responsibilities', objectives: ['List civic duties', 'Explain voting'], duration: 20 },
              { title: 'Elections & Political Parties', objectives: ['Describe the electoral process', 'Identify major parties'], duration: 20 },
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
              { title: 'Colonial America & the Revolution', objectives: ['Summarize colonial life', 'Explain the causes of the Revolution'], duration: 25 },
              { title: 'The New Nation', objectives: ['Describe the Constitution\'s creation', 'Identify early presidents'], duration: 20 },
            ],
          },
          {
            name: 'Growth & Conflict',
            description: 'Expansion, Civil War, and change.',
            lessons: [
              { title: 'Westward Expansion', objectives: ['Explain Manifest Destiny', 'Describe its impact'], duration: 20 },
              { title: 'The Civil War & Reconstruction', objectives: ['Identify causes', 'Describe outcomes'], duration: 25 },
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
              { title: 'Reading Maps', objectives: ['Use latitude and longitude', 'Interpret map symbols'], duration: 20 },
              { title: 'US Regions & Physical Features', objectives: ['Name major regions', 'Identify landforms'], duration: 20 },
            ],
          },
          {
            name: 'Human Geography',
            description: 'Population and movement.',
            lessons: [
              { title: 'Population & Migration', objectives: ['Explain push and pull factors', 'Describe urbanization'], duration: 20 },
              { title: 'Culture & Resources', objectives: ['Connect resources to settlement', 'Discuss cultural regions'], duration: 20 },
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
              { title: 'Supply & Demand', objectives: ['Explain the laws of supply and demand', 'Identify equilibrium'], duration: 25 },
              { title: 'Types of Economies', objectives: ['Contrast market and command economies', 'Describe mixed economies'], duration: 20 },
            ],
          },
          {
            name: 'Personal Finance',
            description: 'Money skills for adults.',
            lessons: [
              { title: 'Budgeting & Saving', objectives: ['Create a budget', 'Explain interest'], duration: 25 },
              { title: 'Credit & Debt', objectives: ['Explain credit scores', 'Avoid debt traps'], duration: 25 },
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
  lessons: { title: string; description: string; duration?: number }[]
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
      { title: 'Computer Basics & Files', description: 'Parts of a computer, operating systems, and file management.', duration: 25 },
      { title: 'The Internet & Web Browsers', description: 'Searching, bookmarks, and understanding URLs.', duration: 25 },
      { title: 'Email & Online Communication', description: 'Writing, sending, attaching, and staying safe from scams.', duration: 25 },
      { title: 'Word Processing & Spreadsheets', description: 'Create documents and basic spreadsheets for work.', duration: 30 },
      { title: 'Online Safety & Privacy', description: 'Passwords, phishing, and protecting your identity.', duration: 25 },
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
      { title: 'What Is AI?', description: 'A plain-language introduction to artificial intelligence.', duration: 20 },
      { title: 'Using AI Assistants & Prompting', description: 'How to write clear prompts and get useful results.', duration: 30 },
      { title: 'AI Limitations & Ethics', description: 'Bias, hallucinations, privacy, and responsible use.', duration: 25 },
      { title: 'AI at Work & in Daily Life', description: 'Real-world ways AI helps with writing, research, and planning.', duration: 25 },
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
      { title: 'Budgeting Basics', description: 'Track income and expenses with a simple budget.', duration: 25 },
      { title: 'Banking & Accounts', description: 'Checking, savings, and online banking.', duration: 25 },
      { title: 'Credit, Loans & Debt', description: 'Credit scores, interest, and borrowing wisely.', duration: 30 },
      { title: 'Saving & Planning Ahead', description: 'Emergency funds and long-term goals.', duration: 25 },
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

    const existingStrands = await prisma.curriculumStrand.count({ where: { curriculumId: curriculum.id } })
    if (existingStrands > 0) {
      console.log(`  • ${subj.subject}: already seeded (skip)`)
      continue
    }

    let strandOrder = 0
    for (const strand of subj.strands) {
      const createdStrand = await prisma.curriculumStrand.create({
        data: { curriculumId: curriculum.id, name: strand.name, description: strand.description, order: strandOrder++ },
      })
      let substrandOrder = 0
      for (const ss of strand.substrands) {
        const createdSub = await prisma.curriculumSubstrand.create({
          data: {
            strandId: createdStrand.id,
            name: ss.name,
            description: ss.description,
            learningOutcomes: ss.lessons.flatMap((l) => l.objectives),
            activities: [`Read and complete: ${ss.name}`],
            order: substrandOrder++,
          },
        })
        let lessonOrder = 0
        for (const lesson of ss.lessons) {
          await prisma.curriculumLesson.create({
            data: {
              substrandId: createdSub.id,
              title: lesson.title,
              objectives: lesson.objectives,
              duration: lesson.duration ?? 20,
              order: lessonOrder++,
            },
          })
        }
      }
    }
    console.log(`  • ${subj.subject}: seeded ${subj.strands.length} strands`)
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

    const existingLessons = await prisma.courseLesson.count({ where: { courseId } })
    if (existingLessons > 0) {
      console.log(`  • ${course.title}: already seeded (skip)`)
      continue
    }
    let order = 0
    for (const l of course.lessons) {
      await prisma.courseLesson.create({
        data: { courseId, title: l.title, description: l.description, duration: l.duration ?? 20, order: order++ },
      })
    }
    console.log(`  • ${course.title}: seeded ${course.lessons.length} lessons`)
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
