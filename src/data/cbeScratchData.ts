// CBE Scratch Programming Lessons and Experiment Projects

export interface CBEScratchLesson {
  id: number;
  title: string;
  grade: string;
  strand: string;
  subStrand: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  learningOutcomes: string[];
  learningObjectives: string[];
  keyCompetencies: string[];
  coreValues: string[];
  pertinentAndContemporaryIssues: string[];
  tutorial: {
    introduction: string;
    materials: string[];
    steps: { step: number; instruction: string; scratchCode?: string }[];
    assessment: string[];
    reflection: string[];
  };
  scratchBlocks: string[];
  expectedOutput: string;
  extensionActivities: string[];
}

export interface CBEScratchCourse {
  id: number;
  title: string;
  grade: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  learningOutcomes: string[];
  lessons: CBEScratchLesson[];
}

export const cbeScratchLessons: CBEScratchLesson[] = [
  // Grade 1 Lessons
  {
    id: 1,
    title: "My First Animation - Moving Animals",
    grade: "Grade 1",
    strand: "Digital Literacy",
    subStrand: "Introduction to Programming",
    duration: "40 minutes (1 lesson)",
    difficulty: "Beginner",
    learningOutcomes: [
      "Understand basic computer interaction",
      "Create simple movement animations",
      "Follow simple instructions",
      "Express creativity through digital tools"
    ],
    learningObjectives: [
      "Use mouse to drag and drop blocks",
      "Make a sprite move across the screen", 
      "Add simple sounds to animations",
      "Save and name their first project"
    ],
    keyCompetencies: [
      "Communication and Collaboration",
      "Digital literacy",
      "Creativity and imagination"
    ],
    coreValues: [
      "Respect",
      "Responsibility"
    ],
    pertinentAndContemporaryIssues: [
      "Digital citizenship for young learners",
      "Creative expression through technology"
    ],
    tutorial: {
      introduction: "Young learners will create their first animation by making a Kenyan animal move and make sounds.",
      materials: [
        "Computer with large screen",
        "Simple worksheets with animal pictures",
        "Headphones"
      ],
      steps: [
        {
          step: 1,
          instruction: "Open Scratch and look at the orange cat. Let's change it to a Kenyan animal!",
          scratchCode: "Choose elephant sprite from library"
        },
        {
          step: 2,
          instruction: "Drag the blue 'move 10 steps' block to make your animal walk.",
          scratchCode: "when green flag clicked\nmove 10 steps"
        },
        {
          step: 3,
          instruction: "Add a sound when your animal moves.",
          scratchCode: "when green flag clicked\nmove 10 steps\nplay sound [trumpet] until done"
        }
      ],
      assessment: [
        "Can the child use the mouse to drag blocks?",
        "Does the sprite move when the green flag is clicked?",
        "Has the child chosen appropriate animal sounds?"
      ],
      reflection: [
        "What animal did you choose and why?",
        "How did your animal move?",
        "What sounds did your animal make?"
      ]
    },
    scratchBlocks: [
      "Motion blocks (move steps)",
      "Sound blocks (play sound)",
      "Events blocks (when flag clicked)"
    ],
    expectedOutput: "A simple animation of a Kenyan animal that moves and makes sound when the green flag is clicked.",
    extensionActivities: [
      "Try different animals",
      "Add more movements",
      "Change the backdrop to show different Kenyan landscapes"
    ]
  },

  // Grade 2 Lessons
  {
    id: 2,
    title: "Counting with Scratch - Kenya Animals Census",
    grade: "Grade 2",
    strand: "Digital Literacy",
    subStrand: "Basic Programming Concepts",
    duration: "60 minutes (1.5 lessons)",
    difficulty: "Beginner",
    learningOutcomes: [
      "Count and display numbers using programming",
      "Use repeat loops for counting",
      "Create educational content about Kenyan wildlife",
      "Understand sequence in programming"
    ],
    learningObjectives: [
      "Program a counter that shows numbers",
      "Use repeat blocks to count animals",
      "Display counting results on screen",
      "Learn about Kenyan animal populations"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Digital literacy",
      "Communication and Collaboration"
    ],
    coreValues: [
      "Respect",
      "Responsibility",
      "Patriotism"
    ],
    pertinentAndContemporaryIssues: [
      "Wildlife conservation awareness",
      "Technology in education",
      "Environmental stewardship"
    ],
    tutorial: {
      introduction: "Students will create a counting program that helps count animals in Kenyan national parks, combining mathematics with programming.",
      materials: [
        "Computer with Scratch",
        "Counting worksheets",
        "Pictures of Kenyan animals",
        "Simple calculator for verification"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create a variable called 'animal count' to keep track of how many animals we see.",
          scratchCode: "Create variable: animal count\nset [animal count] to 0"
        },
        {
          step: 2,
          instruction: "Add elephants that appear one by one as we count them.",
          scratchCode: "when green flag clicked\nrepeat 5\nchange [animal count] by 1\nsay (animal count) for 1 seconds\nwait 1 seconds"
        },
        {
          step: 3,
          instruction: "Program the sprite to announce the final count.",
          scratchCode: "say (join [We counted ] (join (animal count) [ elephants!])) for 3 seconds"
        }
      ],
      assessment: [
        "Does the program count correctly from 1 to 5?",
        "Can the child explain what the repeat block does?",
        "Is the final count displayed correctly?"
      ],
      reflection: [
        "How did the computer help us count?",
        "Why is counting animals important for conservation?",
        "What other things could we count with Scratch?"
      ]
    },
    scratchBlocks: [
      "Variables (create, set, change)",
      "Control blocks (repeat)",
      "Looks blocks (say)",
      "Operators (join)"
    ],
    expectedOutput: "A counting animation that displays numbers 1-5 as it counts elephants, ending with the total count announcement.",
    extensionActivities: [
      "Count different animals",
      "Count to higher numbers",
      "Add subtraction when animals leave",
      "Create a counting song"
    ]
  },

  // Grade 3 Lessons
  {
    id: 3,
    title: "Interactive Quiz - Know Your Kenya",
    grade: "Grade 3",
    strand: "Digital Literacy",
    subStrand: "Programming Logic",
    duration: "80 minutes (2 lessons)",
    difficulty: "Beginner",
    learningOutcomes: [
      "Create interactive quiz applications",
      "Use conditional statements (if/then)",
      "Apply knowledge about Kenya in programming",
      "Design user-friendly interfaces"
    ],
    learningObjectives: [
      "Program questions and answers about Kenya",
      "Use if/then blocks for quiz logic",
      "Create scoring system for correct answers",
      "Design attractive quiz interface"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Communication and Collaboration",
      "Digital literacy",
      "Learning to learn"
    ],
    coreValues: [
      "Patriotism",
      "Respect",
      "Unity",
      "Responsibility"
    ],
    pertinentAndContemporaryIssues: [
      "National identity and pride",
      "Cultural awareness",
      "Technology in education"
    ],
    tutorial: {
      introduction: "Students create an interactive quiz about Kenya, learning about their country while developing programming skills.",
      materials: [
        "Computer with Scratch",
        "Kenya facts worksheet",
        "Map of Kenya",
        "Pictures of Kenyan landmarks"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create a variable called 'score' and set up the quiz introduction.",
          scratchCode: "when green flag clicked\nset [score] to 0\nsay [Welcome to the Kenya Quiz!] for 2 seconds"
        },
        {
          step: 2,
          instruction: "Ask the first question about Kenya's capital city.",
          scratchCode: "ask [What is the capital city of Kenya?] and wait\nif <(answer) = [Nairobi]> then\nchange [score] by 1\nsay [Correct! Nairobi is our capital.] for 2 seconds\nelse\nsay [Try again! The capital is Nairobi.] for 2 seconds"
        },
        {
          step: 3,
          instruction: "Add more questions about Kenyan animals, lakes, and mountains.",
          scratchCode: "ask [What is Kenya's highest mountain?] and wait\nif <(answer) = [Mount Kenya]> then\nchange [score] by 1\nsay [Excellent! Mount Kenya is 5,199 meters high.] for 3 seconds"
        },
        {
          step: 4,
          instruction: "Display the final score and encourage learning about Kenya.",
          scratchCode: "say (join [Your score is ] (join (score) [ out of 3!])) for 3 seconds\nif <(score) = 3> then\nsay [Perfect! You know Kenya very well!] for 2 seconds"
        }
      ],
      assessment: [
        "Does the quiz ask questions clearly?",
        "Are correct and incorrect answers handled properly?",
        "Is the scoring system working correctly?",
        "Has the student learned new facts about Kenya?"
      ],
      reflection: [
        "What new things did you learn about Kenya?",
        "How did programming help make learning fun?",
        "What other quiz topics would you like to create?",
        "How can quizzes help others learn about our country?"
      ]
    },
    scratchBlocks: [
      "Sensing blocks (ask and wait)",
      "Control blocks (if/then/else)",
      "Variables (score tracking)",
      "Operators (equals, join)",
      "Looks blocks (say)"
    ],
    expectedOutput: "An interactive quiz with at least 3 questions about Kenya that tracks correct answers and provides feedback.",
    extensionActivities: [
      "Add questions about different counties",
      "Include audio pronunciation of Kenyan place names",
      "Create multiple choice options",
      "Add pictures of Kenyan landmarks"
    ]
  },

  // Grade 4 Lessons
  {
    id: 4,
    title: "Interactive Storytelling - Kenyan Wildlife Adventure",
    grade: "Grade 4",
    strand: "Digital Literacy",
    subStrand: "Programming and Coding",
    duration: "80 minutes (2 lessons)",
    difficulty: "Beginner",
    learningOutcomes: [
      "Create an interactive story using Scratch programming",
      "Use sequence and repetition in programming",
      "Apply creative thinking to solve problems",
      "Demonstrate collaboration skills in project development"
    ],
    learningObjectives: [
      "Design a simple interactive story with characters and dialogue",
      "Use Scratch blocks to create movement and sound effects",
      "Apply conditional statements for user interaction",
      "Share and present their digital story to peers"
    ],
    keyCompetencies: [
      "Communication and Collaboration",
      "Critical thinking and Problem solving",
      "Creativity and imagination",
      "Digital literacy"
    ],
    coreValues: [
      "Responsibility",
      "Respect",
      "Unity"
    ],
    pertinentAndContemporaryIssues: [
      "Digital citizenship",
      "Creative expression through technology",
      "Cultural preservation through digital storytelling"
    ],
    tutorial: {
      introduction: "In this lesson, learners will create an interactive story about Kenyan wildlife using Scratch. They will learn basic programming concepts while telling a story about animals in Maasai Mara.",
      materials: [
        "Computer/tablet with Scratch installed",
        "Headphones for sound testing",
        "Worksheet for story planning",
        "Sample Kenyan animal sprites"
      ],
      steps: [
        {
          step: 1,
          instruction: "Open Scratch and delete the default cat sprite. Choose a Kenyan animal as your main character (lion, elephant, giraffe).",
          scratchCode: "when green flag clicked\nsay [Welcome to my Kenyan adventure!] for 2 seconds"
        },
        {
          step: 2,
          instruction: "Add a savannah background from the backdrop library or draw your own Kenyan landscape."
        },
        {
          step: 3,
          instruction: "Program your animal to introduce itself and move around the screen.",
          scratchCode: "when green flag clicked\nglide 2 secs to x: 100 y: 0\nsay [I am a lion from Maasai Mara] for 3 seconds\nglide 2 secs to x: -100 y: 0"
        },
        {
          step: 4,
          instruction: "Add sound effects when the animal moves. Use animal sounds or traditional Kenyan music.",
          scratchCode: "when green flag clicked\nplay sound [lion roar] until done"
        },
        {
          step: 5,
          instruction: "Create interactive elements - when the user clicks the animal, it tells part of the story.",
          scratchCode: "when this sprite clicked\nsay [Did you know lions live in prides?] for 3 seconds\nwait 1 seconds\nsay [We protect our territory together!] for 3 seconds"
        },
        {
          step: 6,
          instruction: "Add a second character and create a dialogue between animals about conservation.",
          scratchCode: "when green flag clicked\nwait 5 seconds\nsay [We must protect our environment!] for 3 seconds"
        }
      ],
      assessment: [
        "Does the story have a clear beginning, middle, and end?",
        "Are programming concepts (sequence, loops) correctly applied?",
        "Does the interactive story engage the audience?",
        "Has the learner demonstrated creativity and cultural awareness?"
      ],
      reflection: [
        "What did you learn about programming through storytelling?",
        "How can technology help preserve Kenyan culture and stories?",
        "What challenges did you face and how did you solve them?",
        "How would you improve your story if you had more time?"
      ]
    },
    scratchBlocks: [
      "Motion blocks (glide, go to)",
      "Looks blocks (say, show/hide)",
      "Sound blocks (play sound)",
      "Events blocks (when clicked, when flag clicked)",
      "Control blocks (wait)"
    ],
    expectedOutput: "An interactive story featuring Kenyan animals that responds to user clicks with dialogue and movement, incorporating cultural elements and conservation messages.",
    extensionActivities: [
      "Add more characters from different Kenyan regions",
      "Include traditional Kenyan music and dances",
      "Create a quiz about Kenyan wildlife",
      "Develop a series of connected stories about different counties"
    ]
  },

  // Grade 5 Lessons
  {
    id: 5,
    title: "Digital Mathematics Calculator",
    grade: "Grade 5",
    strand: "Digital Literacy",
    subStrand: "Computational Thinking",
    duration: "120 minutes (3 lessons)",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Design and create a functional calculator using Scratch",
      "Apply mathematical operations in programming context",
      "Use variables and operators effectively",
      "Debug and test program functionality"
    ],
    learningObjectives: [
      "Create variables to store numerical values",
      "Program basic arithmetic operations (addition, subtraction, multiplication, division)",
      "Design user-friendly interface with clear instructions",
      "Test calculator with various mathematical problems"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Communication and Collaboration",
      "Digital literacy",
      "Learning to learn"
    ],
    coreValues: [
      "Responsibility",
      "Integrity",
      "Respect"
    ],
    pertinentAndContemporaryIssues: [
      "Technology in education",
      "Problem-solving skills for future careers",
      "Digital tools for mathematical learning"
    ],
    tutorial: {
      introduction: "Learners will create a digital calculator that can perform basic mathematical operations, helping them understand both programming concepts and mathematical calculations used in Kenyan markets and businesses.",
      materials: [
        "Computer with Scratch software",
        "Calculator design worksheet",
        "Sample market price lists for testing",
        "Math exercise sheets"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create variables named 'number1', 'number2', and 'result' from the Variables category.",
          scratchCode: "Create variables:\n- number1\n- number2\n- result"
        },
        {
          step: 2,
          instruction: "Design calculator interface with number buttons (0-9) as sprites."
        },
        {
          step: 3,
          instruction: "Program number input functionality when number buttons are clicked.",
          scratchCode: "when this sprite clicked\nset [number1] to (join (number1) [1])\nsay (number1) for 1 seconds"
        },
        {
          step: 4,
          instruction: "Create operation buttons (+, -, ×, ÷) and program their functions.",
          scratchCode: "when this sprite clicked\nset [result] to ((number1) + (number2))\nsay (result) for 3 seconds"
        },
        {
          step: 5,
          instruction: "Add a clear button to reset all variables.",
          scratchCode: "when this sprite clicked\nset [number1] to [0]\nset [number2] to [0]\nset [result] to [0]"
        },
        {
          step: 6,
          instruction: "Test your calculator with simple problems and debug any issues.",
          scratchCode: "Test: 5 + 3 = 8\nTest: 10 - 4 = 6\nTest: 6 × 2 = 12"
        }
      ],
      assessment: [
        "Does the calculator perform all four basic operations correctly?",
        "Can users input numbers and see results clearly?",
        "Has the learner tested the program with different numbers?",
        "Is the interface user-friendly and intuitive?"
      ],
      reflection: [
        "How does creating a calculator help you understand math better?",
        "What was the most challenging part of programming the calculator?",
        "How could you improve your calculator design?",
        "Where might digital calculators be useful in Kenya?"
      ]
    },
    scratchBlocks: [
      "Variables (create, set, change)",
      "Operators (+, -, ×, ÷, join)",
      "Events (when clicked)",
      "Looks blocks (say)",
      "Control blocks (if/else)"
    ],
    expectedOutput: "A functional calculator that can perform addition, subtraction, multiplication, and division with clear number display and operation buttons.",
    extensionActivities: [
      "Add decimal number calculations",
      "Include percentage calculations",
      "Create memory functions (store/recall)",
      "Add currency conversion for Kenyan shillings"
    ]
  },

  // Grade 6 Lessons
  {
    id: 6,
    title: "Weather Prediction Simulator",
    grade: "Grade 6",
    strand: "Digital Literacy",
    subStrand: "Data and Information Processing",
    duration: "120 minutes (3 lessons)",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Create data-driven applications using Scratch",
      "Understand weather patterns and prediction concepts",
      "Use random numbers and conditional logic",
      "Apply scientific concepts through programming"
    ],
    learningObjectives: [
      "Create a weather simulation with different conditions",
      "Use random number generation for weather prediction",
      "Display weather information with appropriate visuals",
      "Connect programming with environmental science concepts"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Communication and Collaboration", 
      "Digital literacy",
      "Learning to learn"
    ],
    coreValues: [
      "Responsibility",
      "Respect",
      "Social Justice"
    ],
    pertinentAndContemporaryIssues: [
      "Climate change awareness",
      "Environmental monitoring",
      "Technology in weather forecasting",
      "Agricultural planning in Kenya"
    ],
    tutorial: {
      introduction: "Students will create a weather prediction simulator that shows different weather conditions for various regions in Kenya, helping them understand both programming and meteorology.",
      materials: [
        "Computer with Scratch",
        "Kenya weather data sheets",
        "Regional maps of Kenya",
        "Weather symbol cards"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create variables for temperature, rainfall, and wind speed.",
          scratchCode: "Create variables:\n- temperature\n- rainfall\n- wind_speed\n- weather_condition"
        },
        {
          step: 2,
          instruction: "Program random weather generation for different Kenyan regions.",
          scratchCode: "when green flag clicked\nset [temperature] to (pick random 15 to 35)\nset [rainfall] to (pick random 0 to 100)\nset [wind_speed] to (pick random 5 to 25)"
        },
        {
          step: 3,
          instruction: "Create conditional logic to determine weather conditions.",
          scratchCode: "if <(rainfall) > 50> then\nset [weather_condition] to [Rainy]\nelse\nif <(temperature) > 30> then\nset [weather_condition] to [Hot and Sunny]\nelse\nset [weather_condition] to [Mild and Cloudy]"
        },
        {
          step: 4,
          instruction: "Display weather information with appropriate sprites and backgrounds.",
          scratchCode: "say (join [Temperature: ] (join (temperature) [°C])) for 2 seconds\nwait 1 seconds\nsay (join [Rainfall: ] (join (rainfall) [mm])) for 2 seconds"
        },
        {
          step: 5,
          instruction: "Add regional selection for different parts of Kenya.",
          scratchCode: "ask [Which region? (Coast/Central/North)] and wait\nif <(answer) = [Coast]> then\nset [temperature] to (pick random 25 to 35)\nchange backdrop to [beach]"
        },
        {
          step: 6,
          instruction: "Include weather advice for farmers and students.",
          scratchCode: "if <(weather_condition) = [Rainy]> then\nsay [Good day for planting crops!] for 3 seconds\nelse\nsay [Remember to stay hydrated!] for 3 seconds"
        }
      ],
      assessment: [
        "Does the program generate realistic weather data?",
        "Are weather conditions displayed clearly and accurately?",
        "Has the learner included appropriate regional variations?",
        "Does the program provide useful weather advice?"
      ],
      reflection: [
        "How does weather affect daily life in Kenya?",
        "What did you learn about programming with random numbers?",
        "How could this weather simulator be improved?",
        "Why is weather prediction important for agriculture in Kenya?"
      ]
    },
    scratchBlocks: [
      "Variables (create, set, change)",
      "Operators (pick random, comparison)",
      "Control blocks (if/else, repeat)",
      "Sensing blocks (ask and wait)",
      "Looks blocks (say, backdrop)"
    ],
    expectedOutput: "A weather simulator that generates random but realistic weather data for different Kenyan regions and provides appropriate advice based on conditions.",
    extensionActivities: [
      "Add historical weather data comparison",
      "Include seasonal weather patterns",
      "Create weather warnings for extreme conditions",
      "Add agricultural calendar integration"
    ]
  }
];

// CBE Experiment Projects
export const cbeExperimentProjects: CBEScratchLesson[] = [
  {
    id: 101,
    title: "Virtual Science Laboratory - States of Matter",
    grade: "Grade 4",
    strand: "Science & Technology",
    subStrand: "Matter - States of Matter",
    duration: "100 minutes (2.5 lessons)",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Demonstrate understanding of three states of matter through programming",
      "Create interactive experiments showing state changes",
      "Apply scientific concepts in digital simulations",
      "Design educational content for peer learning"
    ],
    learningObjectives: [
      "Program animations showing melting, freezing, and evaporation",
      "Create interactive buttons to change states of matter",
      "Display temperature changes during state transitions",
      "Include real-life examples from Kenyan environment"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Communication and Collaboration",
      "Digital literacy",
      "Creativity and imagination"
    ],
    coreValues: [
      "Respect",
      "Responsibility",
      "Integrity"
    ],
    pertinentAndContemporaryIssues: [
      "Environmental science education",
      "Technology in scientific learning",
      "Climate change awareness"
    ],
    tutorial: {
      introduction: "Students will create a virtual laboratory where they can experiment with states of matter, observing how water behaves at different temperatures in various Kenyan environments.",
      materials: [
        "Computer with Scratch",
        "Science textbook on states of matter",
        "Thermometer props",
        "Water cycle diagrams"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create a water molecule sprite and design different costumes for solid, liquid, and gas states.",
          scratchCode: "Create costumes:\n- ice_crystal (solid)\n- water_drop (liquid)\n- steam_cloud (gas)"
        },
        {
          step: 2,
          instruction: "Program the ice melting experiment when temperature increases.",
          scratchCode: "when green flag clicked\nswitch costume to [ice_crystal]\nask [What temperature? (0-100°C)] and wait\nif <(answer) > 0> then\nswitch costume to [water_drop]\nsay [Ice is melting!] for 2 seconds"
        },
        {
          step: 3,
          instruction: "Add the evaporation process for temperatures above 100°C.",
          scratchCode: "if <(answer) > 100> then\nswitch costume to [steam_cloud]\nsay [Water is evaporating!] for 2 seconds\nrepeat 10\nchange [ghost] effect by 5\nwait 0.3 seconds"
        },
        {
          step: 4,
          instruction: "Create reverse processes - condensation and freezing.",
          scratchCode: "if <(answer) < 0> then\nswitch costume to [ice_crystal]\nsay [Water is freezing!] for 2 seconds\nif <(answer) < 100> and <(answer) > 0> then\nswitch costume to [water_drop]\nsay [Steam is condensing!] for 2 seconds"
        },
        {
          step: 5,
          instruction: "Add Kenyan examples - water at Lake Victoria vs. Mt. Kenya.",
          scratchCode: "ask [Location: Lake Victoria or Mt. Kenya?] and wait\nif <(answer) = [Mt. Kenya]> then\nsay [It's cold here - water might freeze!] for 3 seconds\nelse\nsay [It's warm here - perfect for liquid water!] for 3 seconds"
        },
        {
          step: 6,
          instruction: "Include educational information about the water cycle in Kenya.",
          scratchCode: "when space key pressed\nsay [In Kenya, the water cycle provides rain for our crops!] for 4 seconds\nwait 2 seconds\nsay [Evaporation from Lake Victoria creates clouds!] for 4 seconds"
        }
      ],
      assessment: [
        "Does the program correctly show all three states of matter?",
        "Are state changes triggered by appropriate temperatures?",
        "Has the learner included relevant Kenyan geographical examples?",
        "Does the simulation help explain scientific concepts clearly?"
      ],
      reflection: [
        "How does understanding states of matter help in daily life?",
        "Why is the water cycle important for Kenya's agriculture?",
        "What challenges did you face creating the simulation?",
        "How could this virtual lab help other students learn science?"
      ]
    },
    scratchBlocks: [
      "Looks blocks (switch costume, change effect)",
      "Control blocks (if/else, repeat)",
      "Sensing blocks (ask and wait, key pressed)",
      "Variables (temperature)",
      "Operators (comparison, logical)"
    ],
    expectedOutput: "An interactive states of matter simulator that responds to temperature input and shows appropriate state changes with Kenyan geographical context.",
    extensionActivities: [
      "Add pressure effects on state changes",
      "Include other substances besides water",
      "Create a complete water cycle animation",
      "Add sound effects for each state change"
    ]
  },
  
  {
    id: 102,
    title: "Plant Growth Simulation - From Seed to Harvest",
    grade: "Grade 4",
    strand: "Science & Technology",
    subStrand: "Plant Growth and Development",
    duration: "120 minutes (3 lessons)",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Demonstrate understanding of plant life cycles through programming",
      "Create time-based growth simulations",
      "Apply agricultural knowledge relevant to Kenya",
      "Design interactive educational content"
    ],
    learningObjectives: [
      "Program plant growth stages from seed to maturity",
      "Simulate effects of water, sunlight, and soil on growth",
      "Include common Kenyan crops in the simulation",
      "Create timing mechanisms for realistic growth patterns"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Learning to learn",
      "Digital literacy",
      "Communication and Collaboration"
    ],
    coreValues: [
      "Responsibility",
      "Patriotism",
      "Social Justice"
    ],
    pertinentAndContemporaryIssues: [
      "Food security in Kenya",
      "Sustainable agriculture practices",
      "Climate change effects on farming",
      "Technology in modern farming"
    ],
    tutorial: {
      introduction: "Students will create a plant growth simulator featuring common Kenyan crops like maize, beans, and kale, learning about optimal growing conditions while practicing programming skills.",
      materials: [
        "Computer with Scratch",
        "Seeds or pictures of different crops",
        "Plant growth charts",
        "Agricultural calendar for Kenya"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create plant sprites with different growth stages as costumes.",
          scratchCode: "Create costumes for maize:\n- seed\n- sprouting\n- young_plant\n- mature_plant\n- harvest_ready"
        },
        {
          step: 2,
          instruction: "Set up variables for growth conditions and plant health.",
          scratchCode: "Create variables:\n- water_level\n- sunlight_hours\n- growth_stage\n- days_growing\n- plant_health"
        },
        {
          step: 3,
          instruction: "Program the planting process and initial growth.",
          scratchCode: "when green flag clicked\nswitch costume to [seed]\nset [growth_stage] to 1\nset [days_growing] to 0\nset [plant_health] to 100\nsay [Planted maize seed!] for 2 seconds"
        },
        {
          step: 4,
          instruction: "Create daily growth cycle with user care interactions.",
          scratchCode: "when [w] key pressed\nchange [water_level] by 20\nsay [Plant watered!] for 1 seconds\nwhen [s] key pressed\nset [sunlight_hours] to 8\nsay [Perfect sunshine!] for 1 seconds"
        },
        {
          step: 5,
          instruction: "Program growth progression based on care conditions.",
          scratchCode: "when space key pressed\nchange [days_growing] by 1\nif <(water_level) > 50 and (sunlight_hours) > 6> then\nchange [growth_stage] by 1\nif <(growth_stage) = 2> then\nswitch costume to [sprouting]\nsay [Your maize is sprouting!] for 2 seconds"
        },
        {
          step: 6,
          instruction: "Add harvest timing and yield based on care quality.",
          scratchCode: "if <(growth_stage) = 5> then\nswitch costume to [harvest_ready]\nsay [Ready to harvest!] for 2 seconds\nif <(plant_health) > 80> then\nsay [Excellent yield! 10 cobs of maize!] for 3 seconds\nelse\nsay [Fair yield. Try better care next time!] for 3 seconds"
        },
        {
          step: 7,
          instruction: "Include Kenyan farming wisdom and seasonal advice.",
          scratchCode: "when [i] key pressed\nsay [In Kenya, plant maize at the start of rains!] for 3 seconds\nwait 2 seconds\nsay [March-May and October-December are best!] for 3 seconds"
        }
      ],
      assessment: [
        "Does the plant grow through realistic stages?",
        "Are growth conditions (water, sunlight) properly simulated?",
        "Has the learner included relevant Kenyan agricultural knowledge?",
        "Does the program teach proper plant care practices?"
      ],
      reflection: [
        "What did you learn about plant care through this simulation?",
        "How does farming technology help Kenyan farmers?",
        "What factors are most important for successful crop growth?",
        "How could this simulation help young farmers learn?"
      ]
    },
    scratchBlocks: [
      "Variables (create, set, change)",
      "Control blocks (if/else, repeat)",
      "Events (key pressed, when clicked)",
      "Looks blocks (switch costume, say)",
      "Operators (comparison, arithmetic)"
    ],
    expectedOutput: "An interactive plant growth simulator that responds to user care inputs and shows realistic growth progression with agricultural education content.",
    extensionActivities: [
      "Add different crop varieties (beans, kale, tomatoes)",
      "Include pest and disease management",
      "Simulate seasonal weather effects",
      "Create market pricing for harvest yields"
    ]
  },

  {
    id: 103,
    title: "Simple Machines Workshop - Levers and Pulleys",
    grade: "Grade 4",
    strand: "Science & Technology", 
    subStrand: "Force, Work and Energy - Simple Machines",
    duration: "100 minutes (2.5 lessons)",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Demonstrate understanding of simple machines through interactive simulations",
      "Calculate and display mechanical advantage in programming context",
      "Apply physics concepts using visual programming",
      "Create educational tools for understanding force and work"
    ],
    learningObjectives: [
      "Program working models of levers and pulleys",
      "Show how simple machines reduce effort needed",
      "Include real-world examples from Kenyan contexts",
      "Calculate and display force measurements"
    ],
    keyCompetencies: [
      "Critical thinking and Problem solving",
      "Digital literacy",
      "Communication and Collaboration",
      "Learning to learn"
    ],
    coreValues: [
      "Integrity",
      "Responsibility",
      "Respect"
    ],
    pertinentAndContemporaryIssues: [
      "Technology in daily life",
      "Engineering solutions to local problems",
      "Innovation and invention"
    ],
    tutorial: {
      introduction: "Students will create interactive simulations of simple machines, exploring how levers and pulleys are used in Kenyan homes, farms, and construction sites to make work easier.",
      materials: [
        "Computer with Scratch",
        "Simple machines reference book",
        "Pictures of local tools and machines",
        "Force measurement worksheets"
      ],
      steps: [
        {
          step: 1,
          instruction: "Create a lever simulation with fulcrum, effort, and load sprites.",
          scratchCode: "Create sprites:\n- lever_bar\n- fulcrum\n- effort_arrow\n- load_weight"
        },
        {
          step: 2,
          instruction: "Set up variables for force calculations and lever positions.",
          scratchCode: "Create variables:\n- effort_force\n- load_weight\n- effort_distance\n- load_distance\n- mechanical_advantage"
        },
        {
          step: 3,
          instruction: "Program the lever movement when effort is applied.",
          scratchCode: "when green flag clicked\nask [Load weight (kg)?] and wait\nset [load_weight] to (answer)\nask [Effort distance from fulcrum (m)?] and wait\nset [effort_distance] to (answer)"
        },
        {
          step: 4,
          instruction: "Calculate and display mechanical advantage.",
          scratchCode: "set [mechanical_advantage] to ((effort_distance) / (load_distance))\nset [effort_force] to ((load_weight) / (mechanical_advantage))\nsay (join [Effort needed: ] (join (effort_force) [ kg])) for 3 seconds"
        },
        {
          step: 5,
          instruction: "Animate the lever movement based on force application.",
          scratchCode: "when space key pressed\nif <(effort_force) < (load_weight)> then\npoint in direction 10\nsay [Lever lifts the load!] for 2 seconds\nelse\nsay [Need more mechanical advantage!] for 2 seconds"
        },
        {
          step: 6,
          instruction: "Add Kenyan examples - well pulley, crowbar, wheelbarrow.",
          scratchCode: "when [1] key pressed\nswitch backdrop to [village_well]\nsay [This pulley helps fetch water easily!] for 3 seconds\nwhen [2] key pressed\nswitch backdrop to [construction_site]\nsay [Crowbars help lift heavy stones!] for 3 seconds"
        },
        {
          step: 7,
          instruction: "Create a pulley system simulation.",
          scratchCode: "when [p] key pressed\nswitch backdrop to [pulley_system]\nsay [With pulleys, half the effort lifts the same weight!] for 4 seconds\nset [effort_force] to ((load_weight) / 2)"
        }
      ],
      assessment: [
        "Does the lever simulation show correct mechanical advantage calculations?",
        "Are force relationships demonstrated clearly?",
        "Has the learner included relevant real-world examples?",
        "Does the program help explain how simple machines work?"
      ],
      reflection: [
        "How do simple machines make work easier in your community?",
        "What simple machines do you see used in Kenyan construction?",
        "How could programming help design better tools?",
        "What was challenging about simulating physics concepts?"
      ]
    },
    scratchBlocks: [
      "Variables (create, set, change)",
      "Operators (division, multiplication, comparison)",
      "Control blocks (if/else)",
      "Motion blocks (point in direction)",
      "Looks blocks (switch backdrop, say)"
    ],
    expectedOutput: "Interactive simple machines simulator that calculates mechanical advantage and demonstrates how levers and pulleys reduce effort needed to lift loads.",
    extensionActivities: [
      "Add inclined plane simulations",
      "Include compound machines (bicycle, can opener)",
      "Create efficiency calculations with friction",
      "Design new simple machines for Kenyan farming"
    ]
  }
];

// Organize lessons into courses
export const cbeScratchCourses: CBEScratchCourse[] = [
  {
    id: 1,
    title: "CBC Grade 1-3 Scratch Fundamentals",
    grade: "Grade 1-3",
    description: "Introduction to programming concepts through creative projects and storytelling, designed for early primary learners.",
    duration: "12 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Understand basic programming concepts",
      "Create simple animations and interactions",
      "Develop problem-solving skills through coding",
      "Express creativity through digital projects"
    ],
    lessons: cbeScratchLessons.filter(lesson => 
      ["Grade 1", "Grade 2", "Grade 3"].includes(lesson.grade)
    )
  },
  {
    id: 2,
    title: "CBC Grade 4-6 Interactive Programming",
    grade: "Grade 4-6",
    description: "Intermediate programming projects that integrate with science, mathematics, and social studies curriculum.",
    duration: "16 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Apply programming to solve real-world problems",
      "Create educational content and simulations",
      "Understand data processing and variables",
      "Collaborate on digital projects"
    ],
    lessons: cbeScratchLessons.filter(lesson => 
      ["Grade 4", "Grade 5", "Grade 6"].includes(lesson.grade)
    )
  },
  {
    id: 3,
    title: "CBC Science Experiment Projects",
    grade: "Grade 4-6",
    description: "Hands-on science experiments recreated in Scratch, covering states of matter, plant growth, and simple machines.",
    duration: "10 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Simulate scientific experiments digitally",
      "Understand scientific concepts through programming",
      "Create interactive educational content",
      "Apply computational thinking to science"
    ],
    lessons: cbeExperimentProjects
  }
];

// CBE Experiment Projects structured as courses
export const cbeExperimentCourses: CBEScratchCourse[] = [
  {
    id: 1,
    title: "Grade 4-6 Science Experiments",
    grade: "Grade 4-6",
    description: "Hands-on science experiments recreated in Scratch programming environment",
    duration: "15 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Simulate scientific experiments digitally",
      "Understand states of matter through programming",
      "Create interactive plant growth simulations",
      "Design simple machine demonstrations"
    ],
    lessons: cbeExperimentProjects.slice(0, 3) // First 3 experiment lessons
  },
  {
    id: 2,
    title: "Grade 7-9 Advanced Experiments",
    grade: "Grade 7-9", 
    description: "Advanced science experiments and simulations for upper primary students",
    duration: "20 weeks",
    difficulty: "Advanced",
    learningOutcomes: [
      "Model complex scientific phenomena",
      "Create weather simulation systems",
      "Design environmental monitoring tools",
      "Build interactive educational content"
    ],
    lessons: cbeExperimentProjects.slice(3) // Remaining experiment lessons
  }
];

