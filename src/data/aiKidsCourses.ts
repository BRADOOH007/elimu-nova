// AI for Kids Courses - 10 comprehensive courses with 10 lessons each
export interface AIKidsLesson {
  id: number;
  title: string;
  description: string;
  duration: string;
  content: string;
  practiceUrl: string;
  scratchProjectUrl?: string;
  teachableMachineUrl?: string;
  learningObjectives: string[];
  quiz: AIKidsQuiz;
}

export interface AIKidsQuiz {
  id: number;
  questions: AIKidsQuestion[];
  timeLimit: number;
}

export interface AIKidsQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface AIKidsCourse {
  id: number;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  ageGroup: string;
  duration: string;
  prerequisites: string[];
  learningOutcomes: string[];
  lessons: AIKidsLesson[];
}

export const aiKidsCourses: AIKidsCourse[] = [
  {
    id: 1,
    title: "Introduction to AI and Programming",
    description: "Discover what AI is and start your coding journey with Scratch",
    icon: "🤖",
    difficulty: "Beginner",
    ageGroup: "8-10 years",
    duration: "5 hours",
    prerequisites: [],
    learningOutcomes: [
      "Understand what AI is and how it works",
      "Create simple programs in Scratch",
      "Recognize AI in everyday life",
      "Use basic programming concepts"
    ],
    lessons: [
      {
        id: 1,
        title: "What is Artificial Intelligence?",
        description: "Learn about AI and see examples in daily life",
        duration: "30 min",
        content: `
          <h3>What is AI?</h3>
          <p>Artificial Intelligence (AI) is when computers can think and learn like humans! Just like how you learn to ride a bike or solve puzzles, computers can also learn to do cool things.</p>
          
          <h3>AI Around Us</h3>
          <p>You might be surprised to know that AI is everywhere:</p>
          <ul>
            <li>🎵 Spotify suggesting songs you might like</li>
            <li>📱 Voice assistants like Siri or Google Assistant</li>
            <li>🎮 Smart enemies in video games</li>
            <li>📧 Email filtering spam messages</li>
            <li>🚗 Self-driving cars (like those being tested in Nairobi!)</li>
          </ul>
          
          <h3>How Does AI Learn?</h3>
          <p>AI learns by looking at lots of examples, just like how you learned to recognize animals by seeing many pictures of cats, dogs, and elephants!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Define what AI means in simple terms",
          "Identify 5 examples of AI in daily life",
          "Explain how AI learns from examples"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What does AI stand for?",
              options: ["Automatic Intelligence", "Artificial Intelligence", "Amazing Intelligence", "Animal Intelligence"],
              correctAnswer: 1,
              explanation: "AI stands for Artificial Intelligence - when computers can think and learn like humans."
            },
            {
              id: 2,
              question: "Which of these is an example of AI?",
              options: ["A calculator", "Spotify recommending music", "A pencil", "A book"],
              correctAnswer: 1,
              explanation: "Spotify uses AI to learn what music you like and suggest new songs."
            },
            {
              id: 3,
              question: "How does AI learn?",
              options: ["By magic", "By looking at many examples", "By reading books", "By sleeping"],
              correctAnswer: 1,
              explanation: "AI learns by analyzing lots of examples and finding patterns, just like how humans learn."
            },
            {
              id: 4,
              question: "AI can help with which everyday task?",
              options: ["Cooking food", "Filtering spam emails", "Washing dishes", "Brushing teeth"],
              correctAnswer: 1,
              explanation: "AI is commonly used in email systems to automatically detect and filter spam messages."
            },
            {
              id: 5,
              question: "Self-driving cars use AI to:",
              options: ["Play music", "Navigate and drive safely", "Change colors", "Fly in the air"],
              correctAnswer: 1,
              explanation: "Self-driving cars use AI to understand their surroundings and drive safely."
            },
            {
              id: 6,
              question: "Voice assistants like Siri use AI to:",
              options: ["Change their appearance", "Understand and respond to speech", "Charge your phone", "Take photos"],
              correctAnswer: 1,
              explanation: "Voice assistants use AI to understand human speech and provide helpful responses."
            },
            {
              id: 7,
              question: "AI in video games helps create:",
              options: ["Better graphics", "Smart computer opponents", "Louder sounds", "Bigger screens"],
              correctAnswer: 1,
              explanation: "AI in games creates intelligent computer opponents that can adapt to player behavior."
            },
            {
              id: 8,
              question: "Which country is testing self-driving cars mentioned in the lesson?",
              options: ["Kenya", "Uganda", "Tanzania", "Rwanda"],
              correctAnswer: 0,
              explanation: "The lesson mentions self-driving cars being tested in Nairobi, Kenya."
            },
            {
              id: 9,
              question: "AI learns patterns similar to how humans:",
              options: ["Eat food", "Learn to recognize animals", "Sleep at night", "Walk upright"],
              correctAnswer: 1,
              explanation: "Both AI and humans learn by recognizing patterns from multiple examples."
            },
            {
              id: 10,
              question: "What makes AI 'intelligent'?",
              options: ["It's very fast", "It can learn and make decisions", "It's expensive", "It uses electricity"],
              correctAnswer: 1,
              explanation: "AI is considered intelligent because it can learn from data and make decisions based on that learning."
            }
          ]
        }
      },
      {
        id: 2,
        title: "Introduction to Scratch",
        description: "Get familiar with the Scratch programming environment",
        duration: "30 min",
        content: `
          <h3>Welcome to Scratch!</h3>
          <p>Scratch is a visual programming language where you create programs by dragging and dropping colorful blocks - like building with LEGO blocks!</p>
          
          <h3>The Scratch Interface</h3>
          <ul>
            <li><strong>Stage:</strong> Where your characters perform and your story happens</li>
            <li><strong>Sprites:</strong> The characters and objects in your project (like the orange cat!)</li>
            <li><strong>Blocks Palette:</strong> All the coding blocks organized by color and function</li>
            <li><strong>Scripts Area:</strong> Where you drag blocks to create your programs</li>
          </ul>
          
          <h3>Your First Scratch Project</h3>
          <p>Let's make the cat sprite say "Hello, AI World!" and move around the stage.</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/?tutorial=getting-started",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Navigate the Scratch interface",
          "Understand sprites and the stage",
          "Create a simple Scratch project"
        ],
        quiz: {
          id: 2,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What is Scratch?",
              options: ["A video game", "A visual programming language", "A social media app", "A drawing tool"],
              correctAnswer: 1,
              explanation: "Scratch is a visual programming language that uses blocks instead of text to create programs."
            },
            {
              id: 2,
              question: "What are sprites in Scratch?",
              options: ["Coding blocks", "Characters and objects", "Background images", "Sound effects"],
              correctAnswer: 1,
              explanation: "Sprites are the characters and objects that you can program in your Scratch projects."
            },
            {
              id: 3,
              question: "Where do sprites perform in Scratch?",
              options: ["In the Blocks Palette", "On the Stage", "In the Scripts Area", "In the Costume tab"],
              correctAnswer: 1,
              explanation: "The Stage is where sprites move and interact when you run your Scratch program."
            },
            {
              id: 4,
              question: "What is the Scripts Area used for?",
              options: ["Drawing sprites", "Playing sounds", "Dragging blocks to create programs", "Changing backgrounds"],
              correctAnswer: 2,
              explanation: "The Scripts Area is where you drag and connect blocks to build your programs."
            },
            {
              id: 5,
              question: "The default Scratch sprite is a:",
              options: ["Dog", "Bird", "Cat", "Fish"],
              correctAnswer: 2,
              explanation: "Scratch starts with an orange cat sprite named Scratch Cat."
            },
            {
              id: 6,
              question: "Programming blocks in Scratch are organized by:",
              options: ["Size", "Color and function", "Alphabetical order", "Age group"],
              correctAnswer: 1,
              explanation: "Scratch blocks are organized by color, with each color representing different types of functions."
            },
            {
              id: 7,
              question: "To make a sprite say something, you would use:",
              options: ["Motion blocks", "Looks blocks", "Sound blocks", "Event blocks"],
              correctAnswer: 1,
              explanation: "The 'say' block is found in the Looks category and makes sprites display speech bubbles."
            },
            {
              id: 8,
              question: "Scratch programming is like building with:",
              options: ["Clay", "LEGO blocks", "Paper", "Sand"],
              correctAnswer: 1,
              explanation: "Scratch programming uses visual blocks that snap together like LEGO blocks."
            },
            {
              id: 9,
              question: "To start your Scratch project, you click the:",
              options: ["Red stop sign", "Green flag", "Yellow circle", "Blue square"],
              correctAnswer: 1,
              explanation: "Clicking the green flag starts your Scratch project and runs your code."
            },
            {
              id: 10,
              question: "What file extension do Scratch projects use?",
              options: [".txt", ".doc", ".sb3", ".jpg"],
              correctAnswer: 2,
              explanation: "Scratch 3.0 projects are saved with the .sb3 file extension."
            }
          ]
        }
      },
      {
        id: 3,
        title: "Making Things Move",
        description: "Learn to animate sprites and create movement",
        duration: "30 min",
        content: `
          <h3>Bringing Sprites to Life</h3>
          <p>Animation is what makes your Scratch projects come alive! Let's learn how to make sprites move around the stage.</p>
          
          <h3>Motion Blocks</h3>
          <ul>
            <li><strong>Move [10] steps:</strong> Makes your sprite move forward</li>
            <li><strong>Turn [15] degrees:</strong> Rotates your sprite</li>
            <li><strong>Go to x: [0] y: [0]:</strong> Teleports to specific coordinates</li>
            <li><strong>Glide to:</strong> Smoothly moves to a location</li>
          </ul>
          
          <h3>Creating Simple Animations</h3>
          <p>Try making your sprite walk across the stage, bounce around, or dance in a circle!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/?tutorial=animate-a-name",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Use motion blocks to move sprites",
          "Create simple animations",
          "Understand coordinate system"
        ],
        quiz: {
          id: 3,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "Which block makes a sprite move forward?",
              options: ["turn degrees", "move steps", "go to", "glide to"],
              correctAnswer: 1,
              explanation: "The 'move steps' block makes a sprite move forward in the direction it's facing."
            },
            {
              id: 2,
              question: "What does the 'turn degrees' block do?",
              options: ["Changes sprite color", "Rotates the sprite", "Makes sprite bigger", "Changes costume"],
              correctAnswer: 1,
              explanation: "The 'turn degrees' block rotates or spins the sprite by the specified number of degrees."
            },
            {
              id: 3,
              question: "The stage coordinates start at (0,0) in the:",
              options: ["Top left corner", "Center of the stage", "Bottom right corner", "Top right corner"],
              correctAnswer: 1,
              explanation: "In Scratch, the coordinate (0,0) is at the center of the stage."
            },
            {
              id: 4,
              question: "To make a sprite move smoothly to a location, use:",
              options: ["move steps", "go to", "glide to", "turn degrees"],
              correctAnswer: 2,
              explanation: "The 'glide to' block moves the sprite smoothly to a location over a specified time."
            },
            {
              id: 5,
              question: "What color are motion blocks in Scratch?",
              options: ["Purple", "Blue", "Green", "Orange"],
              correctAnswer: 1,
              explanation: "Motion blocks in Scratch are blue in color."
            },
            {
              id: 6,
              question: "To make a sprite bounce around the stage, you need:",
              options: ["Only motion blocks", "Motion blocks and sensing blocks", "Only looks blocks", "Sound blocks"],
              correctAnswer: 1,
              explanation: "You need motion blocks to move and sensing blocks to detect when touching edges."
            },
            {
              id: 7,
              question: "The 'go to x: y:' block:",
              options: ["Slowly moves sprite", "Instantly teleports sprite", "Changes sprite size", "Plays a sound"],
              correctAnswer: 1,
              explanation: "The 'go to' block instantly teleports the sprite to the specified coordinates."
            },
            {
              id: 8,
              question: "To create a walking animation, you might use:",
              options: ["Only one costume", "Multiple costumes", "No costumes", "Sound effects only"],
              correctAnswer: 1,
              explanation: "Walking animations typically use multiple costumes that switch to create the illusion of movement."
            },
            {
              id: 9,
              question: "What happens when a sprite reaches the edge of the stage?",
              options: ["It disappears forever", "It automatically bounces", "It stops moving", "It depends on your code"],
              correctAnswer: 3,
              explanation: "What happens at the edge depends on your code - you can make it bounce, wrap around, or stop."
            },
            {
              id: 10,
              question: "To make a sprite move in a circle, you would:",
              options: ["Use only 'move' blocks", "Combine 'move' and 'turn' blocks", "Use only 'turn' blocks", "Use 'glide' blocks"],
              correctAnswer: 1,
              explanation: "Circular movement requires combining 'move' blocks with 'turn' blocks in a loop."
            }
          ]
        }
      },
      {
        id: 4,
        title: "Sounds and Music",
        description: "Add sounds and create musical projects",
        duration: "30 min",
        content: `
          <h3>Adding Sound to Your Projects</h3>
          <p>Sound makes your Scratch projects more exciting and engaging! Let's explore how to add sounds, music, and even create simple songs.</p>
          
          <h3>Sound Blocks</h3>
          <ul>
            <li><strong>Play sound:</strong> Plays a sound effect once</li>
            <li><strong>Start sound:</strong> Plays a sound without waiting for it to finish</li>
            <li><strong>Stop all sounds:</strong> Stops all currently playing sounds</li>
            <li><strong>Play note for beats:</strong> Plays musical notes</li>
          </ul>
          
          <h3>Creating Music</h3>
          <p>You can create simple melodies using the music blocks! Try playing popular Kenyan songs or creating your own tunes.</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/?tutorial=music",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Add sound effects to projects",
          "Create simple musical sequences",
          "Control sound playback"
        ],
        quiz: {
          id: 4,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What color are sound blocks in Scratch?",
              options: ["Blue", "Purple", "Green", "Pink"],
              correctAnswer: 3,
              explanation: "Sound blocks in Scratch are pink/magenta in color."
            },
            {
              id: 2,
              question: "Which block plays a sound and waits for it to finish?",
              options: ["start sound", "play sound", "stop sound", "change volume"],
              correctAnswer: 1,
              explanation: "The 'play sound' block plays a sound and waits for it to finish before continuing."
            },
            {
              id: 3,
              question: "To create music in Scratch, you use:",
              options: ["Motion blocks", "Music extension blocks", "Looks blocks", "Sensing blocks"],
              correctAnswer: 1,
              explanation: "Scratch has a Music extension with special blocks for creating musical notes and beats."
            },
            {
              id: 4,
              question: "The 'start sound' block:",
              options: ["Waits for sound to finish", "Plays sound without waiting", "Stops all sounds", "Changes volume"],
              correctAnswer: 1,
              explanation: "The 'start sound' block plays a sound and immediately continues to the next block."
            },
            {
              id: 5,
              question: "To stop all sounds playing, use:",
              options: ["play sound", "start sound", "stop all sounds", "change volume"],
              correctAnswer: 2,
              explanation: "The 'stop all sounds' block immediately stops all currently playing sounds."
            },
            {
              id: 6,
              question: "Musical notes in Scratch are represented by:",
              options: ["Colors", "Numbers", "Letters", "Shapes"],
              correctAnswer: 1,
              explanation: "Musical notes in Scratch are represented by numbers, where 60 is middle C."
            },
            {
              id: 7,
              question: "To make your sprite talk, you could use:",
              options: ["Motion blocks only", "Text-to-speech extension", "Looks blocks only", "Variables"],
              correctAnswer: 1,
              explanation: "Scratch has a text-to-speech extension that can make sprites speak text aloud."
            },
            {
              id: 8,
              question: "Sound effects can make your project more:",
              options: ["Complicated", "Boring", "Engaging and fun", "Difficult to understand"],
              correctAnswer: 2,
              explanation: "Sound effects add engagement and make projects more fun and immersive."
            },
            {
              id: 9,
              question: "To control how loud sounds play, use:",
              options: ["change volume", "play note", "start sound", "stop sound"],
              correctAnswer: 0,
              explanation: "The 'change volume' block controls how loud or quiet sounds play."
            },
            {
              id: 10,
              question: "You can record your own sounds in Scratch:",
              options: ["False, only pre-made sounds", "True, using the microphone", "Only on certain computers", "Only with special software"],
              correctAnswer: 1,
              explanation: "Scratch allows you to record your own sounds using your computer's microphone."
            }
          ]
        }
      },
      {
        id: 5,
        title: "Interactive Conversations",
        description: "Create programs that respond to user input",
        duration: "30 min",
        content: `
          <h3>Making Interactive Programs</h3>
          <p>The coolest programs are the ones that can talk with users! Let's learn how to make your sprites ask questions and respond to answers.</p>
          
          <h3>Sensing and Input</h3>
          <ul>
            <li><strong>Ask and wait:</strong> Makes sprite ask a question and wait for user input</li>
            <li><strong>Answer:</strong> Stores what the user typed</li>
            <li><strong>Key pressed:</strong> Detects when specific keys are pressed</li>
            <li><strong>Mouse clicked:</strong> Detects mouse interactions</li>
          </ul>
          
          <h3>Creating a Simple Chatbot</h3>
          <p>Let's create a simple AI-like chatbot that can greet users by name and answer basic questions!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Create interactive programs with user input",
          "Use the ask and answer blocks",
          "Build a simple chatbot"
        ],
        quiz: {
          id: 5,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "Which block is used to get input from the user?",
              options: ["say", "ask and wait", "think", "broadcast"],
              correctAnswer: 1,
              explanation: "The 'ask and wait' block prompts the user for input and waits for their response."
            },
            {
              id: 2,
              question: "Where is the user's input stored after using 'ask and wait'?",
              options: ["In a variable", "In the answer block", "In the sprite", "In the stage"],
              correctAnswer: 1,
              explanation: "The user's input is automatically stored in the 'answer' sensing block."
            },
            {
              id: 3,
              question: "What color are sensing blocks in Scratch?",
              options: ["Blue", "Light blue", "Green", "Purple"],
              correctAnswer: 1,
              explanation: "Sensing blocks in Scratch are light blue in color."
            },
            {
              id: 4,
              question: "To detect if a specific key is pressed, use:",
              options: ["key pressed", "mouse down", "ask and wait", "touching"],
              correctAnswer: 0,
              explanation: "The 'key pressed' sensing block detects when specific keyboard keys are pressed."
            },
            {
              id: 5,
              question: "A chatbot is a program that:",
              options: ["Only plays music", "Responds to user messages", "Only moves sprites", "Changes backgrounds"],
              correctAnswer: 1,
              explanation: "A chatbot is a program designed to have conversations and respond to user messages."
            },
            {
              id: 6,
              question: "To make your program respond differently to different answers, use:",
              options: ["Only motion blocks", "If-then blocks", "Only sound blocks", "Repeat blocks"],
              correctAnswer: 1,
              explanation: "If-then blocks (conditional statements) allow programs to respond differently based on user input."
            },
            {
              id: 7,
              question: "The 'touching mouse pointer' block detects:",
              options: ["Keyboard input", "When sprite touches the mouse cursor", "Sound levels", "Time of day"],
              correctAnswer: 1,
              explanation: "The 'touching mouse pointer' block detects when a sprite touches the mouse cursor."
            },
            {
              id: 8,
              question: "To create a quiz in Scratch, you would mainly use:",
              options: ["Motion and looks blocks", "Ask and wait with if-then blocks", "Only sound blocks", "Only variables"],
              correctAnswer: 1,
              explanation: "Quizzes use 'ask and wait' to get answers and if-then blocks to check if answers are correct."
            },
            {
              id: 9,
              question: "User input in Scratch can be:",
              options: ["Only numbers", "Only letters", "Text, numbers, or special characters", "Only yes/no answers"],
              correctAnswer: 2,
              explanation: "Scratch can handle any text input including letters, numbers, and special characters."
            },
            {
              id: 10,
              question: "To make a sprite greet users by name, you would:",
              options: ["Use only say blocks", "Ask for their name then use join blocks", "Use only think blocks", "Use random blocks"],
              correctAnswer: 1,
              explanation: "You ask for the user's name, then use join blocks to combine 'Hello' with their name."
            }
          ]
        }
      },
      {
        id: 6,
        title: "Simple Games and Logic",
        description: "Create basic games using if-then logic",
        duration: "30 min",
        content: `
          <h3>Game Development Basics</h3>
          <p>Games are fun because they have rules and logic! Let's learn how to create simple games using if-then statements and basic AI logic.</p>
          
          <h3>Control Blocks</h3>
          <ul>
            <li><strong>If-then:</strong> Makes decisions based on conditions</li>
            <li><strong>If-then-else:</strong> Chooses between two options</li>
            <li><strong>Repeat:</strong> Does something multiple times</li>
            <li><strong>Forever:</strong> Keeps doing something until stopped</li>
          </ul>
          
          <h3>Creating a Guessing Game</h3>
          <p>Let's make a number guessing game where the computer picks a random number and you try to guess it!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Use conditional logic (if-then statements)",
          "Create simple games",
          "Understand basic AI decision making"
        ],
        quiz: {
          id: 6,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What color are control blocks in Scratch?",
              options: ["Blue", "Orange", "Green", "Purple"],
              correctAnswer: 1,
              explanation: "Control blocks in Scratch are orange/yellow in color."
            },
            {
              id: 2,
              question: "The 'if-then' block is used for:",
              options: ["Making sounds", "Making decisions", "Moving sprites", "Changing costumes"],
              correctAnswer: 1,
              explanation: "The 'if-then' block allows programs to make decisions based on conditions."
            },
            {
              id: 3,
              question: "What's the difference between 'repeat' and 'forever' blocks?",
              options: ["No difference", "Repeat stops after set number, forever continues", "Forever is faster", "Repeat is newer"],
              correctAnswer: 1,
              explanation: "Repeat block runs a set number of times, while forever block continues until the program stops."
            },
            {
              id: 4,
              question: "In a guessing game, you would use 'if-then' to:",
              options: ["Generate random numbers", "Check if the guess is correct", "Display the game title", "Play background music"],
              correctAnswer: 1,
              explanation: "If-then blocks are used to check if the player's guess matches the correct number."
            },
            {
              id: 5,
              question: "The 'if-then-else' block allows you to:",
              options: ["Do one thing only", "Choose between two different actions", "Play sounds", "Move sprites"],
              correctAnswer: 1,
              explanation: "If-then-else blocks let you choose between two different actions based on a condition."
            },
            {
              id: 6,
              question: "To generate random numbers in Scratch, use:",
              options: ["ask and wait", "pick random", "timer", "mouse x"],
              correctAnswer: 1,
              explanation: "The 'pick random' block generates random numbers within a specified range."
            },
            {
              id: 7,
              question: "Basic AI in games often uses:",
              options: ["Only random actions", "If-then logic for decisions", "Only user input", "Pre-recorded responses"],
              correctAnswer: 1,
              explanation: "Basic game AI uses if-then logic to make decisions based on game conditions."
            },
            {
              id: 8,
              question: "To make a sprite chase the mouse pointer, you would use:",
              options: ["Only motion blocks", "Sensing blocks with if-then logic", "Only sound blocks", "Only looks blocks"],
              correctAnswer: 1,
              explanation: "You need sensing blocks to detect mouse position and if-then logic to decide movement direction."
            },
            {
              id: 9,
              question: "Variables in games are often used to:",
              options: ["Change sprite colors", "Keep track of scores and game states", "Play sounds", "Move backgrounds"],
              correctAnswer: 1,
              explanation: "Variables store important game information like scores, lives, levels, and game states."
            },
            {
              id: 10,
              question: "A condition in an 'if-then' block can be:",
              options: ["Only true", "Only false", "True or false", "Only numbers"],
              correctAnswer: 2,
              explanation: "Conditions in if-then blocks evaluate to either true or false, determining whether the code inside runs."
            }
          ]
        }
      },
      {
        id: 7,
        title: "Working with Data and Variables",
        description: "Learn to store and use information in your programs",
        duration: "30 min",
        content: `
          <h3>Understanding Data and Variables</h3>
          <p>Variables are like containers that hold information in your programs. They're essential for creating smart, interactive projects!</p>
          
          <h3>Types of Data</h3>
          <ul>
            <li><strong>Numbers:</strong> Scores, ages, temperatures (like 25°C in Nairobi)</li>
            <li><strong>Text:</strong> Names, messages, stories</li>
            <li><strong>True/False:</strong> Game over, lights on/off</li>
          </ul>
          
          <h3>Creating and Using Variables</h3>
          <p>Let's create a simple counter, a name storage system, and a basic AI that remembers information about users!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand what variables are",
          "Create and use variables in programs",
          "Store different types of data"
        ],
        quiz: {
          id: 7,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What is a variable in programming?",
              options: ["A type of sprite", "A container that stores information", "A sound effect", "A background image"],
              correctAnswer: 1,
              explanation: "A variable is like a container or box that stores information that your program can use and change."
            },
            {
              id: 2,
              question: "What color are variable blocks in Scratch?",
              options: ["Blue", "Orange", "Purple", "Green"],
              correctAnswer: 1,
              explanation: "Variable blocks in Scratch are orange in color."
            },
            {
              id: 3,
              question: "Which of these is NOT a common data type?",
              options: ["Numbers", "Text", "Colors", "True/False"],
              correctAnswer: 2,
              explanation: "While colors can be stored, the common basic data types are numbers, text, and boolean (true/false)."
            },
            {
              id: 4,
              question: "To increase a score variable by 1, you would:",
              options: ["set score to 1", "change score by 1", "say score", "hide score"],
              correctAnswer: 1,
              explanation: "The 'change by' block increases or decreases a variable by the specified amount."
            },
            {
              id: 5,
              question: "The 'set to' block:",
              options: ["Adds to a variable", "Replaces the variable's value completely", "Deletes a variable", "Shows a variable"],
              correctAnswer: 1,
              explanation: "The 'set to' block completely replaces the current value of a variable with a new value."
            },
            {
              id: 6,
              question: "Variables can store:",
              options: ["Only numbers", "Only text", "Numbers, text, and true/false values", "Only true/false values"],
              correctAnswer: 2,
              explanation: "Variables in Scratch can store numbers, text (strings), and boolean (true/false) values."
            },
            {
              id: 7,
              question: "To display a variable's value on the stage:",
              options: ["Always visible automatically", "Check the box next to the variable", "Use a say block", "Variables can't be displayed"],
              correctAnswer: 1,
              explanation: "Checking the box next to a variable in the blocks palette makes it visible on the stage."
            },
            {
              id: 8,
              question: "A good variable name for storing a player's name would be:",
              options: ["x", "var1", "playerName", "123"],
              correctAnswer: 2,
              explanation: "Good variable names are descriptive and explain what the variable stores."
            },
            {
              id: 9,
              question: "Variables are useful for AI because they help:",
              options: ["Make sprites move", "Remember and process information", "Play sounds", "Change backgrounds"],
              correctAnswer: 1,
              explanation: "Variables allow AI programs to remember information and make decisions based on stored data."
            },
            {
              id: 10,
              question: "To join text with a variable value, use:",
              options: ["add blocks", "join blocks", "combine blocks", "merge blocks"],
              correctAnswer: 1,
              explanation: "The 'join' block combines text strings and variable values together."
            }
          ]
        }
      },
      {
        id: 8,
        title: "Basic Algorithms and Patterns",
        description: "Understand step-by-step instructions and patterns",
        duration: "30 min",
        content: `
          <h3>What are Algorithms?</h3>
          <p>An algorithm is like a recipe - a set of step-by-step instructions to solve a problem or complete a task. Everything from making chapati to finding the shortest route to school uses algorithms!</p>
          
          <h3>Algorithms in Daily Life</h3>
          <ul>
            <li>🍞 Recipe for making mandazi</li>
            <li>🏫 Steps to get ready for school</li>
            <li>📱 How your phone finds the best network signal</li>
            <li>🎮 How games decide what enemies should do</li>
          </ul>
          
          <h3>Creating Simple Algorithms</h3>
          <p>Let's create algorithms for sorting numbers, finding patterns, and making simple AI decisions!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand what algorithms are",
          "Identify patterns in everyday life",
          "Create simple step-by-step solutions"
        ],
        quiz: {
          id: 8,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What is an algorithm?",
              options: ["A type of computer", "Step-by-step instructions to solve a problem", "A programming language", "A video game"],
              correctAnswer: 1,
              explanation: "An algorithm is a set of step-by-step instructions designed to solve a problem or complete a task."
            },
            {
              id: 2,
              question: "Which of these is an example of an algorithm?",
              options: ["A computer screen", "Recipe for making chapati", "A keyboard", "A sprite"],
              correctAnswer: 1,
              explanation: "A recipe is a perfect example of an algorithm - step-by-step instructions to achieve a goal."
            },
            {
              id: 3,
              question: "Algorithms help AI by providing:",
              options: ["Colors for sprites", "Clear instructions for decision-making", "Sounds for programs", "Backgrounds for games"],
              correctAnswer: 1,
              explanation: "Algorithms give AI systems clear instructions on how to process information and make decisions."
            },
            {
              id: 4,
              question: "A pattern is:",
              options: ["Something that never repeats", "A sequence that repeats in a predictable way", "Random events", "Only found in art"],
              correctAnswer: 1,
              explanation: "A pattern is a sequence or arrangement that repeats in a predictable, logical way."
            },
            {
              id: 5,
              question: "In the pattern 2, 4, 6, 8, what comes next?",
              options: ["9", "10", "12", "16"],
              correctAnswer: 1,
              explanation: "This pattern adds 2 each time, so after 8 comes 10."
            },
            {
              id: 6,
              question: "Sorting algorithms help:",
              options: ["Arrange items in order", "Create random lists", "Delete information", "Play music"],
              correctAnswer: 0,
              explanation: "Sorting algorithms arrange items (like numbers or names) in a specific order, such as smallest to largest."
            },
            {
              id: 7,
              question: "The first step in creating an algorithm is:",
              options: ["Start coding immediately", "Understand the problem clearly", "Pick random solutions", "Ask someone else to do it"],
              correctAnswer: 1,
              explanation: "Before creating an algorithm, you must clearly understand what problem you're trying to solve."
            },
            {
              id: 8,
              question: "GPS navigation uses algorithms to:",
              options: ["Play music", "Find the shortest route", "Take photos", "Make phone calls"],
              correctAnswer: 1,
              explanation: "GPS systems use routing algorithms to calculate the best path between two locations."
            },
            {
              id: 9,
              question: "In Scratch, which blocks help create repetitive patterns?",
              options: ["Motion blocks only", "Repeat and forever blocks", "Sound blocks only", "Sensing blocks only"],
              correctAnswer: 1,
              explanation: "Repeat and forever blocks allow you to create patterns by running the same code multiple times."
            },
            {
              id: 10,
              question: "Good algorithms should be:",
              options: ["As complicated as possible", "Clear, efficient, and correct", "Only use numbers", "Never be changed"],
              correctAnswer: 1,
              explanation: "Good algorithms should be clear to understand, efficient to run, and correct in solving the problem."
            }
          ]
        }
      },
      {
        id: 9,
        title: "Introduction to Machine Learning Concepts",
        description: "Understand how computers learn from examples",
        duration: "30 min",
        content: `
          <h3>How Do Machines Learn?</h3>
          <p>Machine learning is like teaching a computer to recognize patterns, just like how you learned to tell the difference between a cat and a dog by seeing many examples!</p>
          
          <h3>Learning from Examples</h3>
          <ul>
            <li>🐱 Show the computer 1000 cat photos → it learns what cats look like</li>
            <li>🎵 Play 1000 songs you like → it learns your music taste</li>
            <li>📝 Show examples of handwriting → it learns to read different writing styles</li>
          </ul>
          
          <h3>Types of Machine Learning</h3>
          <p><strong>Supervised Learning:</strong> Learning with examples and correct answers (like flashcards)</p>
          <p><strong>Unsupervised Learning:</strong> Finding patterns without being told what to look for</p>
          
          <h3>AI in Kenya</h3>
          <p>Machine learning helps with crop prediction, mobile money fraud detection, and wildlife conservation in our national parks!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/",
        learningObjectives: [
          "Understand machine learning basics",
          "Recognize different types of learning",
          "See AI applications in Kenya"
        ],
        quiz: {
          id: 9,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "Machine learning is when:",
              options: ["Computers learn from examples and data", "Computers only follow programmed instructions", "Computers break down", "Computers play games"],
              correctAnswer: 0,
              explanation: "Machine learning allows computers to learn and improve from experience and data, not just follow pre-programmed instructions."
            },
            {
              id: 2,
              question: "To teach a computer to recognize cats, you would:",
              options: ["Show it one cat photo", "Describe cats in words only", "Show it many cat photos with labels", "Show it dog photos"],
              correctAnswer: 2,
              explanation: "Machine learning works best with many examples - showing many labeled cat photos helps the computer learn cat features."
            },
            {
              id: 3,
              question: "Supervised learning uses:",
              options: ["Examples with correct answers", "No examples at all", "Only wrong answers", "Random data"],
              correctAnswer: 0,
              explanation: "Supervised learning trains models using examples that include both input data and the correct answers."
            },
            {
              id: 4,
              question: "Unsupervised learning:",
              options: ["Uses correct answers", "Finds patterns without being told what to look for", "Only works with numbers", "Is not real AI"],
              correctAnswer: 1,
              explanation: "Unsupervised learning discovers hidden patterns in data without being given specific correct answers."
            },
            {
              id: 5,
              question: "In Kenya, AI helps with:",
              options: ["Only entertainment", "Crop prediction and fraud detection", "Only social media", "Only gaming"],
              correctAnswer: 1,
              explanation: "AI in Kenya has practical applications in agriculture (crop prediction) and financial services (fraud detection)."
            },
            {
              id: 6,
              question: "The more examples you show a machine learning model:",
              options: ["The worse it gets", "The better it usually learns", "Nothing happens", "It becomes confused"],
              correctAnswer: 1,
              explanation: "Generally, more diverse, quality examples help machine learning models learn better and become more accurate."
            },
            {
              id: 7,
              question: "Machine learning is similar to human learning because:",
              options: ["Both learn from examples and practice", "They are identical", "Neither can improve", "Only humans can really learn"],
              correctAnswer: 0,
              explanation: "Both humans and machines can learn by observing examples, finding patterns, and improving with practice."
            },
            {
              id: 8,
              question: "Pattern recognition in ML means:",
              options: ["Creating artistic patterns", "Finding recurring features in data", "Making colorful designs", "Organizing files"],
              correctAnswer: 1,
              explanation: "Pattern recognition in machine learning involves identifying recurring features and relationships in data."
            },
            {
              id: 9,
              question: "AI helping with wildlife conservation might:",
              options: ["Replace all park rangers", "Help count and track animals", "Eliminate all wildlife", "Only work in zoos"],
              correctAnswer: 1,
              explanation: "AI can help with conservation by automatically counting animals, tracking migration patterns, and detecting poachers."
            },
            {
              id: 10,
              question: "Training data in machine learning is:",
              options: ["Data used to test fitness", "Examples used to teach the model", "Broken computer data", "Data about trains"],
              correctAnswer: 1,
              explanation: "Training data consists of examples used to teach machine learning models how to make predictions or decisions."
            }
          ]
        }
      },
      {
        id: 10,
        title: "Creating Your First AI Project",
        description: "Build a complete AI project combining everything learned",
        duration: "30 min",
        content: `
          <h3>Putting It All Together</h3>
          <p>Now it's time to create your very own AI project! We'll combine everything you've learned to build an intelligent virtual pet that can learn and respond to your actions.</p>
          
          <h3>Your AI Pet Project Will:</h3>
          <ul>
            <li>🐕 Respond to different commands (sit, play, eat)</li>
            <li>😊 Have moods that change based on interactions</li>
            <li>🧠 Remember your name and preferences</li>
            <li>📈 Learn which activities you do most often</li>
            <li>🎮 Play simple games with you</li>
          </ul>
          
          <h3>Building Blocks We'll Use</h3>
          <p>We'll use variables to store the pet's mood and memory, if-then statements for decision making, and user input for interaction - just like real AI systems!</p>
          
          <h3>Your AI Future</h3>
          <p>This is just the beginning! With these skills, you could create AI for agriculture, education, healthcare, or any field that interests you. Kenya needs young AI innovators like you!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/",
        learningObjectives: [
          "Combine multiple programming concepts",
          "Create an interactive AI system",
          "Understand real-world AI applications"
        ],
        quiz: {
          id: 10,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "An AI virtual pet project combines:",
              options: ["Only motion blocks", "Multiple programming concepts like variables, if-then, and user input", "Only sound blocks", "Only one type of block"],
              correctAnswer: 1,
              explanation: "AI projects combine multiple programming concepts to create intelligent, interactive systems."
            },
            {
              id: 2,
              question: "Variables in an AI pet project might store:",
              options: ["Only colors", "Pet's mood, name, and activity preferences", "Only numbers", "Only sounds"],
              correctAnswer: 1,
              explanation: "Variables can store various types of information that help the AI pet remember and make decisions."
            },
            {
              id: 3,
              question: "If-then statements in AI projects help with:",
              options: ["Making decisions based on conditions", "Only playing sounds", "Only moving sprites", "Only changing colors"],
              correctAnswer: 0,
              explanation: "If-then statements allow AI systems to make decisions based on different conditions and inputs."
            },
            {
              id: 4,
              question: "An AI pet that 'learns' your preferences is using:",
              options: ["Magic", "Data collection and pattern recognition", "Random responses", "Pre-recorded messages"],
              correctAnswer: 1,
              explanation: "AI systems learn by collecting data about user behavior and finding patterns in that data."
            },
            {
              id: 5,
              question: "Real AI systems in healthcare might:",
              options: ["Replace all doctors", "Help doctors analyze medical images", "Only play music", "Only send messages"],
              correctAnswer: 1,
              explanation: "AI in healthcare often assists professionals by analyzing data, not replacing human expertise."
            },
            {
              id: 6,
              question: "Kenya could benefit from AI in agriculture by:",
              options: ["Eliminating all farmers", "Predicting weather and crop diseases", "Only growing one type of crop", "Stopping all farming"],
              correctAnswer: 1,
              explanation: "AI can help farmers by predicting weather patterns, identifying diseases, and optimizing crop yields."
            },
            {
              id: 7,
              question: "The most important skill for future AI creators is:",
              options: ["Memorizing code", "Problem-solving and logical thinking", "Only playing games", "Avoiding technology"],
              correctAnswer: 1,
              explanation: "Problem-solving and logical thinking are fundamental skills that apply to any programming language or technology."
            },
            {
              id: 8,
              question: "A complete AI project should:",
              options: ["Only have one feature", "Be interactive, responsive, and solve a problem", "Only look pretty", "Only play sounds"],
              correctAnswer: 1,
              explanation: "Good AI projects are interactive, respond to user input, and solve real problems or provide value."
            },
            {
              id: 9,
              question: "After learning these basics, students could explore:",
              options: ["Only Scratch forever", "More advanced programming languages and AI tools", "Only playing games", "Stopping all learning"],
              correctAnswer: 1,
              explanation: "These basics provide a foundation for learning more advanced programming languages and AI technologies."
            },
            {
              id: 10,
              question: "The future of AI in Kenya depends on:",
              options: ["Importing all technology", "Training local talent and solving local problems", "Only copying other countries", "Avoiding innovation"],
              correctAnswer: 1,
              explanation: "Kenya's AI future depends on developing local expertise and creating solutions for local challenges."
            }
          ]
        }
      }
    ]
  },
  
  // Course 2: Smart Image Recognition
  {
    id: 2,
    title: "Smart Image Recognition",
    description: "Teach computers to see and recognize images using Teachable Machine",
    icon: "👁️",
    difficulty: "Beginner",
    ageGroup: "9-11 years",
    duration: "5 hours",
    prerequisites: ["Introduction to AI and Programming"],
    learningOutcomes: [
      "Understand how computers 'see' images",
      "Train image recognition models",
      "Create projects that respond to visual input",
      "Build accessibility tools using AI"
    ],
    lessons: [
      {
        id: 1,
        title: "How Computers See Images",
        description: "Learn how computers process and understand visual information",
        duration: "30 min",
        content: `
          <h3>Digital Vision</h3>
          <p>Computers don't see images the way humans do. They see numbers! Every image is made up of tiny dots called pixels, and each pixel has numbers that represent colors.</p>
          
          <h3>From Pixels to Understanding</h3>
          <ul>
            <li>📱 Your phone camera captures light and converts it to pixels</li>
            <li>🔢 Each pixel has RGB values (Red, Green, Blue numbers)</li>
            <li>🧠 AI looks for patterns in these numbers to recognize objects</li>
            <li>🎯 Machine learning finds features like edges, shapes, and textures</li>
          </ul>
          
          <h3>Why This Matters</h3>
          <p>Understanding computer vision helps us create tools for the visually impaired, medical diagnosis, wildlife conservation, and security systems!</p>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Understand how computers process images",
          "Learn about pixels and digital representation",
          "Recognize the importance of computer vision"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "How do computers 'see' images?",
              options: ["They have eyes like humans", "They convert images to numbers (pixels)", "They use magic", "They ask humans to describe them"],
              correctAnswer: 1,
              explanation: "Computers convert images into numerical data (pixels) that they can process mathematically."
            },
            {
              id: 2,
              question: "What are pixels?",
              options: ["Tiny dots that make up digital images", "Special cameras", "Computer screens", "Programming languages"],
              correctAnswer: 0,
              explanation: "Pixels are the smallest units of a digital image, like tiny colored dots that combine to form pictures."
            },
            {
              id: 3,
              question: "RGB stands for:",
              options: ["Really Good Pictures", "Red, Green, Blue", "Random Generated Bytes", "Right, Good, Beautiful"],
              correctAnswer: 1,
              explanation: "RGB represents the three primary colors (Red, Green, Blue) used to create all other colors in digital images."
            },
            {
              id: 4,
              question: "To recognize a cat in an image, AI looks for:",
              options: ["The word 'cat'", "Patterns like fur texture, ear shapes, and whiskers", "The cat's name", "Human descriptions"],
              correctAnswer: 1,
              explanation: "AI recognizes objects by identifying visual patterns and features characteristic of those objects."
            },
            {
              id: 5,
              question: "Computer vision can help with:",
              options: ["Only entertainment", "Medical diagnosis and accessibility tools", "Only social media", "Only games"],
              correctAnswer: 1,
              explanation: "Computer vision has many practical applications including healthcare, accessibility, security, and research."
            },
            {
              id: 6,
              question: "When you take a photo with your phone:",
              options: ["It stores the actual objects", "It captures light and converts it to pixel data", "It remembers what you saw", "It asks the internet what's in the image"],
              correctAnswer: 1,
              explanation: "Cameras capture light through a lens and convert it into digital pixel data that represents the image."
            },
            {
              id: 7,
              question: "Each pixel in a color image contains:",
              options: ["One number", "Three numbers (for red, green, blue)", "The object's name", "A tiny photograph"],
              correctAnswer: 1,
              explanation: "Color pixels contain three values representing the intensity of red, green, and blue light."
            },
            {
              id: 8,
              question: "AI identifies patterns in images by:",
              options: ["Guessing randomly", "Analyzing pixel values and their relationships", "Asking humans", "Using magic"],
              correctAnswer: 1,
              explanation: "AI analyzes the numerical values of pixels and their spatial relationships to identify patterns."
            },
            {
              id: 9,
              question: "Computer vision is useful for wildlife conservation because it can:",
              options: ["Talk to animals", "Automatically count and identify animals in photos", "Feed animals", "Build homes for animals"],
              correctAnswer: 1,
              explanation: "Computer vision can automatically analyze camera trap images to count and identify wildlife species."
            },
            {
              id: 10,
              question: "The main advantage of computer vision over human vision is:",
              options: ["It's always 100% accurate", "It can process thousands of images quickly", "It's more creative", "It has better color perception"],
              correctAnswer: 1,
              explanation: "Computer vision can process vast amounts of visual data much faster than humans, though accuracy depends on training."
            }
          ]
        }
      },
      {
        id: 2,
        title: "Introduction to Teachable Machine",
        description: "Get started with Google's Teachable Machine for image recognition",
        duration: "30 min",
        content: `
          <h3>What is Teachable Machine?</h3>
          <p>Teachable Machine is a free tool from Google that lets you train your own AI models without writing code! It's perfect for learning how machine learning works.</p>
          
          <h3>Getting Started</h3>
          <ul>
            <li>🌐 Visit teachablemachine.withgoogle.com</li>
            <li>📸 Choose "Image Project"</li>
            <li>🏷️ Create classes (categories) for your model</li>
            <li>📷 Upload or take photos for each class</li>
            <li>🎯 Train your model</li>
            <li>🧪 Test and export your trained model</li>
          </ul>
          
          <h3>Your First Model: Kenyan vs International Food</h3>
          <p>Let's create a model that can tell the difference between Kenyan foods (like ugali, nyama choma) and international foods!</p>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Navigate Teachable Machine interface",
          "Create image classification classes",
          "Upload and organize training images"
        ],
        quiz: {
          id: 2,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "Teachable Machine is created by:",
              options: ["Microsoft", "Apple", "Google", "Facebook"],
              correctAnswer: 2,
              explanation: "Teachable Machine is a free educational tool created by Google to make machine learning accessible."
            },
            {
              id: 2,
              question: "What is a 'class' in Teachable Machine?",
              options: ["A school classroom", "A category or label for your training data", "A type of computer", "A programming course"],
              correctAnswer: 1,
              explanation: "In machine learning, a class is a category or label that you want your model to recognize."
            },
            {
              id: 3,
              question: "To train a good image recognition model, you need:",
              options: ["Only one image per class", "Many diverse images for each class", "Only professional photos", "Images from the internet only"],
              correctAnswer: 1,
              explanation: "Good models need many diverse examples to learn the distinguishing features of each class."
            },
            {
              id: 4,
              question: "The 'Train Model' button in Teachable Machine:",
              options: ["Deletes your images", "Analyzes your images to find patterns", "Takes new photos", "Exports your model"],
              correctAnswer: 1,
              explanation: "Training analyzes the uploaded images to learn patterns that distinguish between different classes."
            },
            {
              id: 5,
              question: "You can add images to Teachable Machine by:",
              options: ["Uploading files", "Using your webcam", "Both uploading and using webcam", "Only drawing them"],
              correctAnswer: 2,
              explanation: "Teachable Machine allows you to add images by uploading files or taking photos with your webcam."
            },
            {
              id: 6,
              question: "A model that recognizes Kenyan vs International food would have:",
              options: ["One class only", "Two classes", "No classes", "Only Kenyan food class"],
              correctAnswer: 1,
              explanation: "This model would need two classes: one for Kenyan food and one for international food."
            },
            {
              id: 7,
              question: "Before training, you should:",
              options: ["Have at least a few good examples for each class", "Only use blurry images", "Use identical images", "Skip adding examples"],
              correctAnswer: 0,
              explanation: "Good training requires multiple clear, diverse examples for each class you want to recognize."
            },
            {
              id: 8,
              question: "Teachable Machine works:",
              options: ["Only on expensive computers", "In any modern web browser", "Only on phones", "Only with special software"],
              correctAnswer: 1,
              explanation: "Teachable Machine runs in web browsers, making it accessible on most devices with internet."
            },
            {
              id: 9,
              question: "The confidence percentage shows:",
              options: ["How much you trust the model", "How sure the model is about its prediction", "The model's age", "The number of images used"],
              correctAnswer: 1,
              explanation: "Confidence percentage indicates how certain the model is about its classification decision."
            },
            {
              id: 10,
              question: "You should test your model with:",
              options: ["The same images you used for training", "New images not used in training", "No images", "Only perfect images"],
              correctAnswer: 1,
              explanation: "Testing with new images helps you evaluate how well your model generalizes to unseen data."
            }
          ]
        }
      },
      // Continue with remaining 8 lessons for this course...
      {
        id: 3,
        title: "Training Your First Image Classifier",
        description: "Create a model to classify everyday objects",
        duration: "30 min",
        content: `
          <h3>Building an Object Classifier</h3>
          <p>Let's create your first image classifier that can recognize common school supplies: books, pencils, and erasers!</p>
          
          <h3>Step-by-Step Process</h3>
          <ol>
            <li>📚 Create Class 1: "Books" - Add 10-15 photos of different books</li>
            <li>✏️ Create Class 2: "Pencils" - Add 10-15 photos of pencils</li>
            <li>🧽 Create Class 3: "Erasers" - Add 10-15 photos of erasers</li>
            <li>🎯 Train the model</li>
            <li>🧪 Test with new objects</li>
          </ol>
          
          <h3>Training Tips</h3>
          <ul>
            <li>Use different lighting conditions</li>
            <li>Take photos from various angles</li>
            <li>Include different brands and colors</li>
            <li>Ensure clear, focused images</li>
          </ul>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Create a multi-class image classifier",
          "Understand training data quality",
          "Test model performance"
        ],
        quiz: {
          id: 3,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "For a school supplies classifier, how many classes would you need for books, pencils, and erasers?",
              options: ["1", "2", "3", "4"],
              correctAnswer: 2,
              explanation: "You need three classes: one each for books, pencils, and erasers."
            },
            {
              id: 2,
              question: "Why should you take photos from different angles?",
              options: ["To confuse the model", "To help the model learn features from all perspectives", "To make training longer", "It doesn't matter"],
              correctAnswer: 1,
              explanation: "Different angles help the model learn robust features that work regardless of object orientation."
            },
            {
              id: 3,
              question: "How many images should you aim for per class?",
              options: ["Just 1", "2-3 images", "10-15 or more", "100+ images"],
              correctAnswer: 2,
              explanation: "10-15+ diverse images per class usually provide enough variety for basic classification tasks."
            },
            {
              id: 4,
              question: "Including different lighting conditions helps:",
              options: ["Make photos look artistic", "The model work in various environments", "Slow down training", "Confuse the classifier"],
              correctAnswer: 1,
              explanation: "Varied lighting conditions help the model generalize to different real-world scenarios."
            },
            {
              id: 5,
              question: "Blurry or low-quality images in training data will:",
              options: ["Improve model accuracy", "Potentially reduce model performance", "Speed up training", "Have no effect"],
              correctAnswer: 1,
              explanation: "Poor quality training images can reduce model performance by introducing noise and unclear features."
            },
            {
              id: 6,
              question: "When testing your model, you should use:",
              options: ["The exact same images from training", "Similar but different images", "Only perfect studio photos", "Images of completely different objects"],
              correctAnswer: 1,
              explanation: "Testing with similar but unseen images best evaluates how well your model generalizes."
            },
            {
              id: 7,
              question: "If your model confuses pencils and pens, you should:",
              options: ["Give up on the project", "Add more diverse examples of each", "Use fewer images", "Only use one type of pencil"],
              correctAnswer: 1,
              explanation: "Adding more diverse examples helps the model learn to distinguish between similar objects."
            },
            {
              id: 8,
              question: "Different brands and colors of the same object help:",
              options: ["Make training harder", "The model learn essential features vs superficial ones", "Slow down the computer", "Create confusion"],
              correctAnswer: 1,
              explanation: "Variety helps the model focus on essential shape and structure rather than specific colors or brands."
            },
            {
              id: 9,
              question: "A confidence score of 95% means:",
              options: ["The model is 95% trained", "The model is 95% certain about its prediction", "95% of images were used", "The model is 95% accurate"],
              correctAnswer: 1,
              explanation: "Confidence score indicates how certain the model is about a specific prediction."
            },
            {
              id: 10,
              question: "If your model performs poorly, you might:",
              options: ["Delete everything and start over", "Add more training examples or improve image quality", "Use fewer classes", "Stop using AI"],
              correctAnswer: 1,
              explanation: "Poor performance can often be improved by adding more diverse training data or better quality images."
            }
          ]
        }
      },
      {
        id: 4,
        title: "Understanding Model Accuracy",
        description: "Learn how to evaluate and improve your AI models",
        duration: "30 min",
        content: `
          <h3>What is Model Accuracy?</h3>
          <p>Accuracy tells you how often your AI model makes correct predictions. It's like a test score for your AI!</p>
          
          <h3>Measuring Performance</h3>
          <ul>
            <li>🎯 <strong>Accuracy:</strong> Percentage of correct predictions</li>
            <li>🔍 <strong>Precision:</strong> How accurate positive predictions are</li>
            <li>📊 <strong>Confusion Matrix:</strong> Shows which classes get confused</li>
            <li>⚖️ <strong>Balance:</strong> Equal examples for each class</li>
          </ul>
          
          <h3>Improving Your Model</h3>
          <ul>
            <li>Add more diverse training examples</li>
            <li>Ensure balanced data across classes</li>
            <li>Remove poor quality images</li>
            <li>Test with completely new images</li>
          </ul>
          
          <h3>Real-World Context</h3>
          <p>In medical AI, 95% accuracy might not be enough. In fun apps, 80% might be fine. Context matters!</p>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Understand accuracy metrics",
          "Identify ways to improve model performance",
          "Recognize context-dependent accuracy requirements"
        ],
        quiz: {
          id: 4,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "If your model correctly identifies 8 out of 10 images, its accuracy is:",
              options: ["8%", "10%", "80%", "810%"],
              correctAnswer: 2,
              explanation: "Accuracy = (Correct predictions / Total predictions) × 100 = (8/10) × 100 = 80%"
            },
            {
              id: 2,
              question: "A confusion matrix shows:",
              options: ["How confused you are", "Which classes the model confuses with each other", "How long training took", "The cost of the model"],
              correctAnswer: 1,
              explanation: "A confusion matrix displays which classes are frequently misclassified as other classes."
            },
            {
              id: 3,
              question: "If you have 100 cat images and 10 dog images in your training data:",
              options: ["This is perfectly balanced", "This is imbalanced and may cause problems", "You need exactly equal numbers", "It doesn't matter"],
              correctAnswer: 1,
              explanation: "Severely imbalanced data can cause the model to be biased toward the class with more examples."
            },
            {
              id: 4,
              question: "For a medical diagnosis AI, you would want:",
              options: ["At least 50% accuracy", "At least 70% accuracy", "Very high accuracy (95%+)", "Accuracy doesn't matter"],
              correctAnswer: 2,
              explanation: "Medical applications require very high accuracy due to the serious consequences of misdiagnosis."
            },
            {
              id: 5,
              question: "To improve model accuracy, you should NOT:",
              options: ["Add more diverse training data", "Remove poor quality images", "Test only with training images", "Balance your classes"],
              correctAnswer: 2,
              explanation: "Testing only with training images gives false confidence - always test with new, unseen images."
            },
            {
              id: 6,
              question: "Precision measures:",
              options: ["How fast the model runs", "Of the positive predictions, how many were actually correct", "How many images were used", "How expensive the model is"],
              correctAnswer: 1,
              explanation: "Precision = True Positives / (True Positives + False Positives) - accuracy of positive predictions."
            },
            {
              id: 7,
              question: "A model that says 'cat' for every image would have:",
              options: ["Perfect accuracy", "Good precision for cats if most images are cats", "Poor generalization ability", "Both B and C"],
              correctAnswer: 3,
              explanation: "It might have good precision for cats if most images are cats, but it lacks the ability to generalize to other classes."
            },
            {
              id: 8,
              question: "Overfitting occurs when:",
              options: ["The model is too small", "The model memorizes training data but fails on new data", "Training takes too long", "You have too many classes"],
              correctAnswer: 1,
              explanation: "Overfitting means the model memorizes training examples instead of learning generalizable patterns."
            },
            {
              id: 9,
              question: "Cross-validation helps by:",
              options: ["Making training faster", "Testing model performance on different data splits", "Reducing the number of images needed", "Improving image quality"],
              correctAnswer: 1,
              explanation: "Cross-validation tests how well a model generalizes by training and testing on different data subsets."
            },
            {
              id: 10,
              question: "For a fun mobile app that identifies animals, what accuracy might be acceptable?",
              options: ["30-40%", "60-80%", "99.9%", "100% only"],
              correctAnswer: 1,
              explanation: "For entertainment apps, 60-80% accuracy might be acceptable as mistakes aren't critical."
            }
          ]
        }
      },
      {
        id: 5,
        title: "Creating Custom Datasets",
        description: "Learn to collect and organize training data effectively",
        duration: "30 min",
        content: `
          <h3>Building Quality Datasets</h3>
          <p>The quality of your AI model depends heavily on the quality of your training data. Let's learn how to build effective datasets!</p>
          
          <h3>Dataset Design Principles</h3>
          <ul>
            <li>🎯 <strong>Relevant:</strong> Images should represent real-world use cases</li>
            <li>🌈 <strong>Diverse:</strong> Include various conditions, angles, lighting</li>
            <li>⚖️ <strong>Balanced:</strong> Similar numbers of examples per class</li>
            <li>🏷️ <strong>Labeled:</strong> Correctly categorized and organized</li>
            <li>🧹 <strong>Clean:</strong> Remove duplicates and poor quality images</li>
          </ul>
          
          <h3>Project: Kenyan Wildlife Dataset</h3>
          <p>Create a dataset to recognize common Kenyan animals: elephants, lions, giraffes, and zebras. Consider safari photos, different seasons, and various national parks!</p>
          
          <h3>Ethical Considerations</h3>
          <ul>
            <li>Respect privacy and copyright</li>
            <li>Avoid bias in data collection</li>
            <li>Consider representation and fairness</li>
          </ul>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Design effective training datasets",
          "Understand data quality factors",
          "Consider ethical implications in data collection"
        ],
        quiz: {
          id: 5,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "A good dataset should be:",
              options: ["Large only", "Diverse and representative", "All identical images", "Random pictures"],
              correctAnswer: 1,
              explanation: "Good datasets need diversity and representativeness to train robust models."
            },
            {
              id: 2,
              question: "For a Kenyan wildlife classifier, you should include images from:",
              options: ["Only one national park", "Various parks and seasons", "Only zoo animals", "Only cartoon animals"],
              correctAnswer: 1,
              explanation: "Diversity across locations and conditions helps the model generalize better."
            },
            {
              id: 3,
              question: "Balanced datasets mean:",
              options: ["All images are the same size", "Similar numbers of examples per class", "Perfect lighting in all images", "All images taken with the same camera"],
              correctAnswer: 1,
              explanation: "Balanced datasets have roughly equal representation of each class to prevent bias."
            },
            {
              id: 4,
              question: "Including duplicate images in your dataset:",
              options: ["Always improves performance", "Can cause overfitting and should be avoided", "Makes training faster", "Is required for good results"],
              correctAnswer: 1,
              explanation: "Duplicates can cause the model to memorize specific images rather than learn general features."
            },
            {
              id: 5,
              question: "When collecting images of people, you should:",
              options: ["Use any images from the internet", "Consider privacy and get permission", "Only use celebrity photos", "Avoid including people entirely"],
              correctAnswer: 1,
              explanation: "Using images of people requires consideration of privacy rights and often permission."
            },
            {
              id: 6,
              question: "Bias in datasets can result from:",
              options: ["Using only images from one demographic or location", "Having too many images", "Using high-quality cameras", "Training for too long"],
              correctAnswer: 0,
              explanation: "Bias occurs when datasets don't represent the full diversity of real-world scenarios."
            },
            {
              id: 7,
              question: "For outdoor animal recognition, you should include:",
              options: ["Only sunny day photos", "Various weather and lighting conditions", "Only close-up shots", "Only photos from one angle"],
              correctAnswer: 1,
              explanation: "Including various conditions helps the model work in real-world scenarios with changing weather and light."
            },
            {
              id: 8,
              question: "Data labeling means:",
              options: ["Adding stickers to images", "Correctly categorizing each image", "Making images bigger", "Adding filters to images"],
              correctAnswer: 1,
              explanation: "Data labeling involves correctly categorizing or tagging each image with its appropriate class."
            },
            {
              id: 9,
              question: "Low-quality images in your dataset might:",
              options: ["Always improve accuracy", "Reduce model performance", "Speed up training", "Have no effect"],
              correctAnswer: 1,
              explanation: "Poor quality images can introduce noise and make it harder for the model to learn clear patterns."
            },
            {
              id: 10,
              question: "A dataset with 1000 elephant images and 10 lion images is:",
              options: ["Perfect for training", "Severely imbalanced", "Too small overall", "Ready to use"],
              correctAnswer: 1,
              explanation: "This severe imbalance would likely cause the model to be biased toward predicting elephants."
            }
          ]
        }
      },
      {
        id: 6,
        title: "Integrating AI with Scratch Projects",
        description: "Connect your Teachable Machine models with Scratch",
        duration: "30 min",
        content: `
          <h3>Bringing AI into Scratch</h3>
          <p>Now let's combine the power of Teachable Machine with the creativity of Scratch to create interactive AI projects!</p>
          
          <h3>Connection Process</h3>
          <ol>
            <li>🔗 Export your Teachable Machine model</li>
            <li>📋 Copy the model URL</li>
            <li>🧩 Add Machine Learning extension in Scratch</li>
            <li>🔌 Load your model using the URL</li>
            <li>📹 Set up video sensing</li>
            <li>🎮 Create interactive responses</li>
          </ol>
          
          <h3>Project Ideas</h3>
          <ul>
            <li>🎪 Magic show that responds to hand gestures</li>
            <li>🐾 Virtual pet that reacts to objects you show</li>
            <li>🏠 Smart home simulator controlled by cards or objects</li>
            <li>🎨 Art gallery that describes what you show it</li>
          </ul>
          
          <h3>Interactive AI Project</h3>
          <p>Create a "Kenyan Food Critic" - show traditional foods to your AI and it gives reviews and cultural facts!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Export and use Teachable Machine models",
          "Integrate AI with Scratch projects",
          "Create interactive AI applications"
        ],
        quiz: {
          id: 6,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "To use your Teachable Machine model in Scratch, you need to:",
              options: ["Rewrite it in Scratch", "Export it and use the URL", "Take screenshots", "Recreate it manually"],
              correctAnswer: 1,
              explanation: "Teachable Machine provides an export function that gives you a URL to use in other applications."
            },
            {
              id: 2,
              question: "Which Scratch extension allows machine learning integration?",
              options: ["Music extension", "Machine Learning extension", "Pen extension", "Video extension"],
              correctAnswer: 1,
              explanation: "Scratch has a specific Machine Learning extension for integrating AI models."
            },
            {
              id: 3,
              question: "Video sensing in Scratch allows your project to:",
              options: ["Play videos", "Respond to camera input", "Record videos", "Edit videos"],
              correctAnswer: 1,
              explanation: "Video sensing blocks allow Scratch projects to respond to live camera input."
            },
            {
              id: 4,
              question: "An AI-powered Scratch project that responds to hand gestures would use:",
              options: ["Only motion blocks", "Machine learning blocks with video sensing", "Only sound blocks", "Only variables"],
              correctAnswer: 1,
              explanation: "Hand gesture recognition requires machine learning blocks combined with video sensing."
            },
            {
              id: 5,
              question: "When your AI model recognizes an object, Scratch can:",
              options: ["Delete the object", "Respond with sounds, animations, or actions", "Ignore the recognition", "Turn off the camera"],
              correctAnswer: 1,
              explanation: "Scratch can respond to AI recognition with any combination of visual, audio, or interactive elements."
            },
            {
              id: 6,
              question: "A 'smart home simulator' project might recognize:",
              options: ["Only lights", "Cards or objects representing different devices", "Only sounds", "Only text"],
              correctAnswer: 1,
              explanation: "Physical cards or objects can represent different smart home devices that the AI recognizes."
            },
            {
              id: 7,
              question: "The confidence level from your AI model helps:",
              options: ["Make the project slower", "Determine how certain the AI is about its recognition", "Change image colors", "Control sound volume only"],
              correctAnswer: 1,
              explanation: "Confidence levels indicate how certain the AI is, allowing for appropriate responses."
            },
            {
              id: 8,
              question: "If your AI model has low confidence in its prediction, your Scratch project might:",
              options: ["Crash immediately", "Ask for a clearer view or try again", "Always assume it's correct", "Turn off completely"],
              correctAnswer: 1,
              explanation: "Low confidence should trigger helpful responses like asking for better positioning or lighting."
            },
            {
              id: 9,
              question: "Interactive AI projects are engaging because they:",
              options: ["Are very complicated", "Respond intelligently to real-world input", "Only work sometimes", "Require expensive equipment"],
              correctAnswer: 1,
              explanation: "The ability to respond intelligently to real-world input makes AI projects feel magical and engaging."
            },
            {
              id: 10,
              question: "A successful AI-Scratch integration requires:",
              options: ["Perfect lighting always", "Well-trained models and creative programming", "Expensive cameras", "Professional development skills"],
              correctAnswer: 1,
              explanation: "Success comes from combining well-trained AI models with creative Scratch programming."
            }
          ]
        }
      },
      {
        id: 7,
        title: "Computer Vision for Accessibility",
        description: "Create AI tools to help people with visual impairments",
        duration: "30 min",
        content: `
          <h3>AI for Good: Accessibility Tools</h3>
          <p>AI can be a powerful force for inclusion! Let's explore how computer vision can help create a more accessible world for everyone.</p>
          
          <h3>Accessibility Applications</h3>
          <ul>
            <li>🔍 <strong>Object Recognition:</strong> Identify everyday items</li>
            <li>📖 <strong>Text Reading:</strong> Convert text in images to speech</li>
            <li>🚶 <strong>Navigation Help:</strong> Describe surroundings</li>
            <li>💰 <strong>Currency Recognition:</strong> Identify money denominations</li>
            <li>🍎 <strong>Food Identification:</strong> Recognize fruits, vegetables, meals</li>
          </ul>
          
          <h3>Project: Kenyan Currency Recognizer</h3>
          <p>Build an AI that can identify Kenyan banknotes and coins to help visually impaired people with money transactions!</p>
          
          <h3>Design Principles</h3>
          <ul>
            <li>Clear audio feedback</li>
            <li>Simple, intuitive interactions</li>
            <li>High accuracy requirements</li>
            <li>Works in various lighting conditions</li>
          </ul>
          
          <h3>Beyond Vision</h3>
          <p>Consider how AI can help with hearing, mobility, and cognitive accessibility too!</p>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Understand AI applications for accessibility",
          "Create inclusive technology solutions",
          "Consider user experience for people with disabilities"
        ],
        quiz: {
          id: 7,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "AI accessibility tools primarily help by:",
              options: ["Making technology more expensive", "Providing alternative ways to interact with information", "Replacing human assistance entirely", "Making devices more complex"],
              correctAnswer: 1,
              explanation: "AI accessibility tools provide alternative methods for people with disabilities to access and interact with information."
            },
            {
              id: 2,
              question: "A currency recognition app for visually impaired users should:",
              options: ["Only display visual information", "Provide clear audio feedback", "Require perfect lighting", "Be silent to avoid noise"],
              correctAnswer: 1,
              explanation: "Audio feedback is essential for users who cannot see the visual output."
            },
            {
              id: 3,
              question: "For Kenyan currency recognition, you would train the AI to identify:",
              options: ["Only coins", "Only paper money", "All denominations of both coins and notes", "Only new currency"],
              correctAnswer: 2,
              explanation: "A comprehensive currency recognizer should handle all denominations that users might encounter."
            },
            {
              id: 4,
              question: "High accuracy is especially important for accessibility AI because:",
              options: ["It makes development easier", "Incorrect information can significantly impact users' lives", "It's required by law", "It makes the app faster"],
              correctAnswer: 1,
              explanation: "Accessibility tools need high accuracy because mistakes can have serious consequences for dependent users."
            },
            {
              id: 5,
              question: "An object recognition app for daily living might identify:",
              options: ["Only expensive items", "Common household items like cups, keys, phones", "Only colorful objects", "Only large objects"],
              correctAnswer: 1,
              explanation: "Daily living aids should recognize common, practical items that people interact with regularly."
            },
            {
              id: 6,
              question: "Text-to-speech AI helps by:",
              options: ["Making text bigger", "Converting written text in images to spoken words", "Changing text colors", "Deleting text"],
              correctAnswer: 1,
              explanation: "Text-to-speech AI reads aloud text found in images, making written information accessible to visually impaired users."
            },
            {
              id: 7,
              question: "When designing accessibility AI, you should consider:",
              options: ["Only the primary disability", "Multiple types of disabilities and intersectionality", "Only young users", "Only technology experts"],
              correctAnswer: 1,
              explanation: "Good accessibility design considers that users may have multiple disabilities and varying technology skills."
            },
            {
              id: 8,
              question: "A navigation AI for visually impaired users might:",
              options: ["Only work indoors", "Describe surroundings and obstacles", "Replace guide dogs entirely", "Only work in perfect weather"],
              correctAnswer: 1,
              explanation: "Navigation AI can describe surroundings and identify obstacles to help with safe movement."
            },
            {
              id: 9,
              question: "User testing for accessibility AI should include:",
              options: ["Only developers", "People with the disabilities the tool is designed to help", "Only young people", "Only technology experts"],
              correctAnswer: 1,
              explanation: "The people who will actually use the tool are essential for testing its effectiveness and usability."
            },
            {
              id: 10,
              question: "AI accessibility tools work best when they:",
              options: ["Replace all human assistance", "Complement and enhance human abilities", "Are used only at home", "Require constant internet"],
              correctAnswer: 1,
              explanation: "The best accessibility AI tools enhance human capabilities rather than trying to replace all human assistance."
            }
          ]
        }
      },
      {
        id: 8,
        title: "Image Classification Ethics",
        description: "Understand the ethical implications of AI image recognition",
        duration: "30 min",
        content: `
          <h3>Responsible AI Development</h3>
          <p>With great AI power comes great responsibility! Let's explore the ethical considerations when building image recognition systems.</p>
          
          <h3>Key Ethical Issues</h3>
          <ul>
            <li>🤐 <strong>Privacy:</strong> Consent for using images of people</li>
            <li>⚖️ <strong>Bias:</strong> Ensuring fair representation across groups</li>
            <li>🔒 <strong>Security:</strong> Protecting data and preventing misuse</li>
            <li>🎯 <strong>Accuracy:</strong> Being honest about limitations</li>
            <li>👁️ <strong>Surveillance:</strong> Balancing safety and privacy</li>
          </ul>
          
          <h3>Bias in AI: Real Examples</h3>
          <ul>
            <li>Facial recognition working poorly on darker skin tones</li>
            <li>Job screening AI biased against women</li>
            <li>Medical AI trained mostly on one demographic</li>
          </ul>
          
          <h3>Building Fair AI</h3>
          <ul>
            <li>Include diverse perspectives in development teams</li>
            <li>Use representative datasets</li>
            <li>Test across different user groups</li>
            <li>Be transparent about limitations</li>
            <li>Consider impact on all communities</li>
          </ul>
          
          <h3>Kenya's AI Ethics</h3>
          <p>How can we ensure AI development in Kenya represents our diverse cultures and serves all communities fairly?</p>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Understand ethical issues in AI",
          "Recognize bias in AI systems",
          "Learn principles of responsible AI development"
        ],
        quiz: {
          id: 8,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "AI bias occurs when:",
              options: ["The AI works perfectly", "The AI performs differently for different groups of people", "The AI is too fast", "The AI uses too much data"],
              correctAnswer: 1,
              explanation: "AI bias happens when systems perform unfairly or differently across different demographic groups."
            },
            {
              id: 2,
              question: "Before using someone's photos to train AI, you should:",
              options: ["Use them freely", "Get their permission", "Only use celebrity photos", "Modify them heavily"],
              correctAnswer: 1,
              explanation: "Using someone's photos requires their consent to respect privacy and legal rights."
            },
            {
              id: 3,
              question: "A diverse development team helps because:",
              options: ["It's required by law", "Different perspectives can identify potential biases", "It makes development faster", "It reduces costs"],
              correctAnswer: 1,
              explanation: "Diverse teams bring different perspectives that can help identify and address potential biases in AI systems."
            },
            {
              id: 4,
              question: "If your AI performs poorly for certain skin tones, you should:",
              options: ["Ignore the problem", "Add more diverse training data", "Only market to groups where it works well", "Claim it works for everyone"],
              correctAnswer: 1,
              explanation: "Poor performance across different skin tones indicates bias that should be addressed with more diverse training data."
            },
            {
              id: 5,
              question: "Transparency in AI means:",
              options: ["Keeping everything secret", "Being honest about how the AI works and its limitations", "Making the AI invisible", "Only sharing good results"],
              correctAnswer: 1,
              explanation: "Transparency involves being open about how AI systems work, their capabilities, and their limitations."
            },
            {
              id: 6,
              question: "Surveillance AI raises concerns about:",
              options: ["Battery life", "Privacy and civil liberties", "Image quality only", "Processing speed"],
              correctAnswer: 1,
              explanation: "Surveillance AI can infringe on privacy rights and civil liberties if not carefully implemented with appropriate safeguards."
            },
            {
              id: 7,
              question: "To build fair AI for Kenya, you should consider:",
              options: ["Only urban populations", "All of Kenya's diverse ethnic and cultural groups", "Only English speakers", "Only wealthy users"],
              correctAnswer: 1,
              explanation: "Fair AI should represent and serve all of Kenya's diverse communities equally."
            },
            {
              id: 8,
              question: "When AI makes mistakes in high-stakes decisions (like medical diagnosis), the main concern is:",
              options: ["Development costs", "Potential harm to people", "Processing time", "Storage requirements"],
              correctAnswer: 1,
              explanation: "In critical applications, AI mistakes can directly harm people, making accuracy and reliability paramount."
            },
            {
              id: 9,
              question: "Algorithmic accountability means:",
              options: ["AI systems never make mistakes", "Developers are responsible for their AI's impact", "AI replaces human judgment entirely", "AI systems govern themselves"],
              correctAnswer: 1,
              explanation: "Algorithmic accountability holds developers and organizations responsible for the impacts of their AI systems."
            },
            {
              id: 10,
              question: "The best approach to ethical AI development is:",
              options: ["Consider ethics only after building the AI", "Integrate ethical considerations throughout development", "Let users figure out ethical issues", "Ignore ethics to focus on performance"],
              correctAnswer: 1,
              explanation: "Ethical considerations should be integrated throughout the AI development process, not added as an afterthought."
            }
          ]
        }
      },
      {
        id: 9,
        title: "Advanced Recognition Projects",
        description: "Build sophisticated image recognition applications",
        duration: "30 min",
        content: `
          <h3>Next-Level Image Recognition</h3>
          <p>Now that you understand the basics, let's create more sophisticated projects that could have real-world impact!</p>
          
          <h3>Advanced Project Ideas</h3>
          <ul>
            <li>🌾 <strong>Crop Disease Detector:</strong> Help farmers identify plant diseases</li>
            <li>🏥 <strong>Medical Image Classifier:</strong> Assist in screening for certain conditions</li>
            <li>🌍 <strong>Environmental Monitor:</strong> Track plastic pollution or wildlife</li>
            <li>🏛️ <strong>Cultural Heritage Preserver:</strong> Catalog traditional artifacts</li>
            <li>🚗 <strong>Traffic Safety System:</strong> Detect dangerous driving behaviors</li>
          </ul>
          
          <h3>Focus Project: Kenyan Traditional Crafts Classifier</h3>
          <ol>
            <li>🎨 Research traditional Kenyan crafts (baskets, pottery, jewelry, textiles)</li>
            <li>📸 Collect diverse images of each craft type</li>
            <li>🏷️ Create detailed labels with cultural information</li>
            <li>🎯 Train a multi-class classifier</li>
            <li>💬 Add cultural storytelling to recognition results</li>
            <li>🌐 Create an educational web experience</li>
          </ol>
          
          <h3>Technical Enhancements</h3>
          <ul>
            <li>Multi-label classification (one image, multiple tags)</li>
            <li>Confidence thresholds for better accuracy</li>
            <li>Data augmentation for better training</li>
            <li>Integration with databases for rich information</li>
          </ul>
        `,
        practiceUrl: "https://teachablemachine.withgoogle.com/train/image",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Design complex image recognition systems",
          "Integrate cultural and educational elements",
          "Consider real-world application scenarios"
        ],
        quiz: {
          id: 9,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "A crop disease detection AI would be most valuable to:",
              options: ["City residents only", "Farmers and agricultural extension workers", "Teachers only", "Software developers"],
              correctAnswer: 1,
              explanation: "Crop disease detection AI directly helps farmers identify and treat plant diseases early, protecting their harvests."
            },
            {
              id: 2,
              question: "For a traditional crafts classifier, cultural information is important because:",
              options: ["It makes the AI more complex", "It preserves and shares cultural knowledge alongside recognition", "It slows down processing", "It's required by law"],
              correctAnswer: 1,
              explanation: "Adding cultural context turns a simple classifier into an educational tool that preserves and shares cultural heritage."
            },
            {
              id: 3,
              question: "Multi-label classification means:",
              options: ["Using multiple languages", "One image can belong to several categories", "Multiple people labeling images", "Using multiple cameras"],
              correctAnswer: 1,
              explanation: "Multi-label classification allows a single image to be assigned to multiple relevant categories simultaneously."
            },
            {
              id: 4,
              question: "Confidence thresholds help by:",
              options: ["Making AI more confident", "Only returning results above a certain certainty level", "Speeding up processing", "Reducing image size"],
              correctAnswer: 1,
              explanation: "Confidence thresholds filter out uncertain predictions, improving the reliability of results shown to users."
            },
            {
              id: 5,
              question: "Data augmentation involves:",
              options: ["Buying more data", "Creating variations of existing images to increase training data", "Using only original photos", "Deleting poor images"],
              correctAnswer: 1,
              explanation: "Data augmentation creates new training examples by slightly modifying existing images (rotation, brightness, etc.)."
            },
            {
              id: 6,
              question: "An environmental monitoring AI might track:",
              options: ["Only beautiful landscapes", "Pollution, deforestation, or wildlife populations", "Only urban areas", "Only indoor environments"],
              correctAnswer: 1,
              explanation: "Environmental AI can monitor various environmental indicators to help with conservation and policy decisions."
            },
            {
              id: 7,
              question: "For medical image AI, the most important consideration is:",
              options: ["Speed of processing", "Accuracy and safety", "Cost reduction", "Ease of use"],
              correctAnswer: 1,
              explanation: "In medical applications, accuracy and safety are paramount as mistakes can directly impact patient health."
            },
            {
              id: 8,
              question: "A traffic safety AI might detect:",
              options: ["Only red cars", "Dangerous behaviors like distracted driving or speeding", "Only during daytime", "Only expensive vehicles"],
              correctAnswer: 1,
              explanation: "Traffic safety AI focuses on identifying behaviors and conditions that pose safety risks."
            },
            {
              id: 9,
              question: "Integrating AI with databases allows you to:",
              options: ["Make AI slower", "Provide rich, contextual information with recognition results", "Store only images", "Reduce accuracy"],
              correctAnswer: 1,
              explanation: "Database integration enables providing detailed information, stories, or metadata along with recognition results."
            },
            {
              id: 10,
              question: "The most impactful AI projects typically:",
              options: ["Are the most technically complex", "Solve real problems for specific communities", "Use the most expensive equipment", "Have the most features"],
              correctAnswer: 1,
              explanation: "Impact comes from solving genuine problems that matter to real people and communities."
            }
          ]
        }
      },
      {
        id: 10,
        title: "Deploying Your Image Recognition App",
        description: "Learn to share your AI projects with the world",
        duration: "30 min",
        content: `
          <h3>Sharing Your AI with the World</h3>
          <p>You've built amazing AI models - now let's learn how to deploy them so others can benefit from your work!</p>
          
          <h3>Deployment Options</h3>
          <ul>
            <li>🌐 <strong>Web Apps:</strong> Accessible through browsers</li>
            <li>📱 <strong>Mobile Apps:</strong> Native iOS/Android applications</li>
            <li>💻 <strong>Desktop Applications:</strong> Installable programs</li>
            <li>☁️ <strong>Cloud Services:</strong> API endpoints for other developers</li>
            <li>🎮 <strong>Interactive Experiences:</strong> Games and educational tools</li>
          </ul>
          
          <h3>Step-by-Step Web Deployment</h3>
          <ol>
            <li>📤 Export your Teachable Machine model</li>
            <li>💻 Create a simple HTML/JavaScript webpage</li>
            <li>🔗 Integrate the TensorFlow.js model</li>
            <li>🎨 Design user-friendly interface</li>
            <li>🌍 Deploy to a hosting service (GitHub Pages, Netlify)</li>
            <li>📢 Share with your community!</li>
          </ol>
          
          <h3>Your Deployment Checklist</h3>
          <ul>
            <li>✅ Model works reliably</li>
            <li>✅ Clear instructions for users</li>
            <li>✅ Accessible design</li>
            <li>✅ Privacy considerations addressed</li>
            <li>✅ Feedback mechanism for users</li>
            <li>✅ Cultural sensitivity reviewed</li>
          </ul>
          
          <h3>Making an Impact</h3>
          <p>Consider how your AI tool could help your school, community, or address local challenges in Kenya!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        teachableMachineUrl: "https://teachablemachine.withgoogle.com/train/image",
        learningObjectives: [
          "Understand deployment options for AI projects",
          "Create accessible user interfaces",
          "Consider community impact and reach"
        ],
        quiz: {
          id: 10,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "TensorFlow.js allows you to:",
              options: ["Only train models", "Run machine learning models in web browsers", "Only work with images", "Replace Teachable Machine"],
              correctAnswer: 1,
              explanation: "TensorFlow.js enables running trained machine learning models directly in web browsers without servers."
            },
            {
              id: 2,
              question: "A web app deployment is beneficial because:",
              options: ["It only works on expensive devices", "Anyone with internet can access it through a browser", "It requires special software", "It only works offline"],
              correctAnswer: 1,
              explanation: "Web apps are accessible to anyone with a browser and internet connection, making them very inclusive."
            },
            {
              id: 3,
              question: "GitHub Pages is useful for:",
              options: ["Only storing code", "Hosting static websites for free", "Training AI models", "Buying domains"],
              correctAnswer: 1,
              explanation: "GitHub Pages provides free hosting for static websites, perfect for deploying simple AI web apps."
            },
            {
              id: 4,
              question: "When designing your AI app interface, prioritize:",
              options: ["Complex features", "Clear, simple user experience", "Maximum colors", "Tiny text"],
              correctAnswer: 1,
              explanation: "Good interfaces prioritize clarity and ease of use over complexity or visual flourishes."
            },
            {
              id: 5,
              question: "Before deploying, you should test your AI app with:",
              options: ["Only yourself", "A diverse group of potential users", "Only experts", "Only people you know"],
              correctAnswer: 1,
              explanation: "Testing with diverse users helps identify usability issues and ensures the app works for everyone."
            },
            {
              id: 6,
              question: "Privacy considerations for AI apps include:",
              options: ["Collecting all possible user data", "Being transparent about data use and getting consent", "Hiding how the AI works", "Sharing user data freely"],
              correctAnswer: 1,
              explanation: "Privacy requires transparency about data collection and use, plus obtaining proper user consent."
            },
            {
              id: 7,
              question: "A feedback mechanism helps by:",
              options: ["Making the app slower", "Allowing users to report problems and suggest improvements", "Increasing costs", "Reducing functionality"],
              correctAnswer: 1,
              explanation: "User feedback helps identify issues and opportunities for improvement that developers might miss."
            },
            {
              id: 8,
              question: "Mobile deployment might be preferred when:",
              options: ["Users need offline access", "Everyone has laptops", "Internet is always fast", "Cost doesn't matter"],
              correctAnswer: 0,
              explanation: "Mobile apps can work offline, which is valuable in areas with limited or unreliable internet connectivity."
            },
            {
              id: 9,
              question: "Cultural sensitivity in AI deployment means:",
              options: ["Ignoring local customs", "Considering how the tool fits with local values and practices", "Only using English", "Avoiding certain colors"],
              correctAnswer: 1,
              explanation: "Cultural sensitivity involves ensuring the AI tool respects and aligns with local values and practices."
            },
            {
              id: 10,
              question: "The best measure of AI deployment success is:",
              options: ["Number of downloads", "Positive impact on users' lives", "Technical complexity", "Development cost"],
              correctAnswer: 1,
              explanation: "True success comes from creating positive impact for users and communities, not just technical metrics."
            }
          ]
        }
      }
    ]
  },

  // Course 3: Voice AI and Speech Recognition
  {
    id: 3,
    title: "Voice AI and Speech Recognition",
    description: "Learn how computers understand and generate human speech",
    icon: "🎤",
    difficulty: "Beginner",
    ageGroup: "9-12 years",
    duration: "4 hours",
    prerequisites: ["Introduction to AI and Programming"],
    learningOutcomes: [
      "Understand how speech recognition works",
      "Create voice-controlled Scratch projects",
      "Build simple chatbots with speech",
      "Learn about language processing"
    ],
    lessons: [
      {
        id: 1,
        title: "How Computers Hear and Speak",
        description: "Discover how computers process human speech",
        duration: "25 min",
        content: `
          <h3>The Magic of Speech Technology</h3>
          <p>Every time you talk to Siri, Google Assistant, or Alexa, you're using speech recognition technology! Let's explore how computers learn to understand human speech.</p>
          
          <h3>From Sound Waves to Words</h3>
          <ul>
            <li>🌊 <strong>Sound Waves:</strong> Your voice creates vibrations in the air</li>
            <li>🎵 <strong>Digital Conversion:</strong> Microphones turn sound into numbers</li>
            <li>🧠 <strong>Pattern Recognition:</strong> AI finds patterns in the audio data</li>
            <li>💬 <strong>Word Prediction:</strong> The computer guesses what you said</li>
          </ul>
          
          <h3>Speech in Kenya</h3>
          <p>Did you know that speech recognition systems are being developed for Swahili and local Kenyan languages? This helps preserve our cultural heritage!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand how sound becomes digital data",
          "Learn about speech recognition basics",
          "Recognize challenges in multilingual AI"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What do microphones convert sound into?",
              options: ["Pictures", "Numbers", "Colors", "Smells"],
              correctAnswer: 1,
              explanation: "Microphones convert sound waves into digital numbers that computers can process."
            },
            {
              id: 2,
              question: "Which part of speech recognition involves finding patterns?",
              options: ["Microphone recording", "Pattern recognition", "Speaker output", "Volume control"],
              correctAnswer: 1,
              explanation: "Pattern recognition is where AI analyzes the digital audio data to identify speech patterns."
            },
            {
              id: 3,
              question: "Why is developing speech recognition for Swahili important?",
              options: ["It's easier than English", "It preserves cultural heritage", "It's faster", "It uses less memory"],
              correctAnswer: 1,
              explanation: "Developing speech recognition for local languages helps preserve and promote cultural heritage."
            },
            {
              id: 4,
              question: "Voice assistants like Siri use:",
              options: ["Only speech recognition", "Only speech synthesis", "Both speech recognition and synthesis", "Neither"],
              correctAnswer: 2,
              explanation: "Voice assistants need both speech recognition (to understand you) and speech synthesis (to talk back)."
            },
            {
              id: 5,
              question: "The first step in speech recognition is:",
              options: ["Understanding meaning", "Converting sound to digital data", "Generating response", "Playing music"],
              correctAnswer: 1,
              explanation: "The first step is converting analog sound waves into digital data that computers can process."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 4: AI in Games and Entertainment
  {
    id: 4,
    title: "AI in Games and Entertainment",
    description: "Explore how AI creates intelligent game characters and entertainment",
    icon: "🎮",
    difficulty: "Intermediate",
    ageGroup: "10-13 years",
    duration: "6 hours",
    prerequisites: ["Introduction to AI and Programming", "Smart Image Recognition"],
    learningOutcomes: [
      "Create intelligent NPCs in games",
      "Understand pathfinding algorithms",
      "Build adaptive game difficulty",
      "Design AI-powered interactive stories"
    ],
    lessons: [
      {
        id: 1,
        title: "Smart Game Characters",
        description: "Learn how AI creates intelligent non-player characters",
        duration: "35 min",
        content: `
          <h3>Bringing Game Characters to Life</h3>
          <p>Ever wonder how enemies in video games seem to think and react? That's AI in action! Let's explore how game developers create intelligent characters.</p>
          
          <h3>Types of Game AI</h3>
          <ul>
            <li>🤖 <strong>Behavior Trees:</strong> Decision-making systems for characters</li>
            <li>🎯 <strong>Pathfinding:</strong> How characters navigate game worlds</li>
            <li>⚖️ <strong>Dynamic Difficulty:</strong> Games that adapt to player skill</li>
            <li>📖 <strong>Procedural Storytelling:</strong> AI-generated narratives</li>
          </ul>
          
          <h3>Kenyan Game Development</h3>
          <p>Kenya has growing game development studios creating games with African themes and intelligent AI characters!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand NPC behavior systems",
          "Learn basic pathfinding concepts",
          "Explore adaptive game mechanics"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "What are NPCs in games?",
              options: ["New Player Characters", "Non-Player Characters", "Network Protocol Codes", "Next Performance Cards"],
              correctAnswer: 1,
              explanation: "NPCs are Non-Player Characters - characters in games controlled by AI rather than human players."
            },
            {
              id: 2,
              question: "Pathfinding helps game characters:",
              options: ["Change colors", "Navigate around obstacles", "Play music", "Count numbers"],
              correctAnswer: 1,
              explanation: "Pathfinding algorithms help characters find the best route from one point to another, avoiding obstacles."
            },
            {
              id: 3,
              question: "Dynamic difficulty in games means:",
              options: ["Games get harder over time", "Games adapt to player skill level", "Games never change", "Games become easier"],
              correctAnswer: 1,
              explanation: "Dynamic difficulty systems monitor player performance and adjust game challenge to maintain engagement."
            },
            {
              id: 4,
              question: "Behavior trees help AI characters:",
              options: ["Grow taller", "Make decisions", "Change appearance", "Load faster"],
              correctAnswer: 1,
              explanation: "Behavior trees are decision-making frameworks that help AI characters choose appropriate actions."
            },
            {
              id: 5,
              question: "AI in Kenyan games can help:",
              options: ["Only copy foreign games", "Create culturally relevant characters and stories", "Make games more expensive", "Reduce game quality"],
              correctAnswer: 1,
              explanation: "AI in Kenyan games can create characters and narratives that reflect local culture and experiences."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 5: AI for Social Good
  {
    id: 5,
    title: "AI for Social Good",
    description: "Discover how AI can solve real-world problems and help communities",
    icon: "🌍",
    difficulty: "Intermediate",
    ageGroup: "11-14 years",
    duration: "5 hours",
    prerequisites: ["Introduction to AI and Programming", "Smart Image Recognition"],
    learningOutcomes: [
      "Identify social problems AI can address",
      "Design AI solutions for community issues",
      "Understand ethical AI development",
      "Create projects that help others"
    ],
    lessons: [
      {
        id: 1,
        title: "AI for Healthcare in Kenya",
        description: "Explore how AI can improve healthcare access and quality",
        duration: "30 min",
        content: `
          <h3>Healing with AI</h3>
          <p>In Kenya, AI is revolutionizing healthcare by making medical expertise more accessible, especially in rural areas where doctors are scarce.</p>
          
          <h3>AI Healthcare Applications</h3>
          <ul>
            <li>🏥 <strong>Diagnostic Assistance:</strong> AI helps doctors identify diseases from medical images</li>
            <li>📱 <strong>Telemedicine:</strong> Remote consultations powered by AI</li>
            <li>💊 <strong>Drug Discovery:</strong> AI speeds up finding new medicines</li>
            <li>📊 <strong>Health Monitoring:</strong> Wearable devices that track vital signs</li>
          </ul>
          
          <h3>Success Stories in Kenya</h3>
          <ul>
            <li>AI systems detecting tuberculosis in chest X-rays</li>
            <li>Mobile apps providing health advice in rural areas</li>
            <li>AI-powered diagnostic tools in Kenyan hospitals</li>
          </ul>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand AI applications in healthcare",
          "Recognize challenges in medical AI",
          "Explore telemedicine possibilities"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "How does AI help with medical diagnosis?",
              options: ["It replaces all doctors", "It analyzes medical images to detect diseases", "It performs surgery", "It manufactures medicine"],
              correctAnswer: 1,
              explanation: "AI can analyze medical images like X-rays and MRIs to help doctors detect diseases more accurately and quickly."
            },
            {
              id: 2,
              question: "Telemedicine using AI is especially valuable in:",
              options: ["Urban hospitals only", "Rural areas with few doctors", "Rich countries only", "Entertainment venues"],
              correctAnswer: 1,
              explanation: "Telemedicine with AI can bring medical expertise to rural areas where accessing doctors is difficult."
            },
            {
              id: 3,
              question: "AI in drug discovery helps by:",
              options: ["Making drugs more expensive", "Speeding up the process of finding new medicines", "Eliminating the need for testing", "Replacing pharmacists"],
              correctAnswer: 1,
              explanation: "AI can analyze vast amounts of data to identify promising drug compounds faster than traditional methods."
            },
            {
              id: 4,
              question: "What should be a key consideration when developing medical AI?",
              options: ["Making it as complex as possible", "Ensuring it's safe and accurate", "Making it expensive", "Keeping it secret"],
              correctAnswer: 1,
              explanation: "Medical AI must prioritize safety and accuracy since mistakes can directly impact human health."
            },
            {
              id: 5,
              question: "Wearable health devices with AI can:",
              options: ["Only tell time", "Monitor vital signs and detect health issues", "Play games", "Take photographs"],
              correctAnswer: 1,
              explanation: "AI-powered wearables can continuously monitor health metrics and alert users to potential issues."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 6: Music and AI Creativity
  {
    id: 6,
    title: "Music and AI Creativity",
    description: "Explore how AI creates music, art, and assists human creativity",
    icon: "🎵",
    difficulty: "Beginner",
    ageGroup: "8-12 years",
    duration: "4 hours",
    prerequisites: ["Introduction to AI and Programming"],
    learningOutcomes: [
      "Understand how AI generates music",
      "Create AI-assisted artworks",
      "Explore computational creativity",
      "Build music-making projects in Scratch"
    ],
    lessons: [
      {
        id: 1,
        title: "AI Music Composers",
        description: "Discover how AI creates beautiful music and melodies",
        duration: "25 min",
        content: `
          <h3>When Computers Become Musicians</h3>
          <p>Can computers be creative? AI is now composing symphonies, writing songs, and even creating traditional Kenyan music!</p>
          
          <h3>How AI Makes Music</h3>
          <ul>
            <li>🎼 <strong>Pattern Learning:</strong> AI studies thousands of songs to understand musical patterns</li>
            <li>🎹 <strong>Note Prediction:</strong> Predicting which notes sound good together</li>
            <li>🎵 <strong>Style Mimicking:</strong> AI can compose in the style of famous musicians</li>
            <li>🔄 <strong>Variation Generation:</strong> Creating new versions of existing melodies</li>
          </ul>
          
          <h3>Kenyan Music and AI</h3>
          <p>Imagine AI that could compose new benga or taarab songs, or help preserve traditional Kenyan musical styles!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/?tutorial=music",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand AI music generation",
          "Explore pattern recognition in music",
          "Create simple musical AI in Scratch"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "How does AI learn to compose music?",
              options: ["By taking music lessons", "By analyzing patterns in existing music", "By listening to radio", "By reading sheet music only"],
              correctAnswer: 1,
              explanation: "AI learns music composition by analyzing patterns in thousands of existing songs and musical pieces."
            },
            {
              id: 2,
              question: "What is 'style mimicking' in AI music?",
              options: ["Copying songs exactly", "Creating music in the style of specific artists or genres", "Playing instruments", "Recording music"],
              correctAnswer: 1,
              explanation: "Style mimicking allows AI to compose new music that sounds like it was created by specific artists or in particular genres."
            },
            {
              id: 3,
              question: "AI could help preserve Kenyan traditional music by:",
              options: ["Replacing traditional musicians", "Learning and generating new music in traditional styles", "Only playing modern music", "Deleting old songs"],
              correctAnswer: 1,
              explanation: "AI can learn traditional musical patterns and help create new compositions that preserve cultural musical heritage."
            },
            {
              id: 4,
              question: "Note prediction in AI music involves:",
              options: ["Guessing random notes", "Predicting which notes sound harmonious together", "Counting notes", "Changing instrument sounds"],
              correctAnswer: 1,
              explanation: "Note prediction uses patterns learned from music to suggest which notes will create pleasing harmonies."
            },
            {
              id: 5,
              question: "The main goal of AI in music is to:",
              options: ["Replace all human musicians", "Assist and inspire human creativity", "Make music more expensive", "Stop people from singing"],
              correctAnswer: 1,
              explanation: "AI in music aims to enhance human creativity, not replace it, by providing new tools and inspiration."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 7: Robotics and Physical AI
  {
    id: 7,
    title: "Robotics and Physical AI",
    description: "Learn how AI controls robots and interacts with the physical world",
    icon: "🤖",
    difficulty: "Intermediate",
    ageGroup: "10-14 years",
    duration: "6 hours",
    prerequisites: ["Introduction to AI and Programming", "AI in Games and Entertainment"],
    learningOutcomes: [
      "Understand how robots use AI to move and navigate",
      "Learn about sensors and actuators",
      "Explore autonomous vehicles",
      "Build simple robot simulations"
    ],
    lessons: [
      {
        id: 1,
        title: "Robots with Brains",
        description: "Discover how AI gives robots intelligence and autonomy",
        duration: "35 min",
        content: `
          <h3>From Science Fiction to Reality</h3>
          <p>Robots are no longer just in movies! Today's robots use AI to think, learn, and make decisions just like humans do.</p>
          
          <h3>How AI Controls Robots</h3>
          <ul>
            <li>👁️ <strong>Computer Vision:</strong> Robots use cameras as eyes to see the world</li>
            <li>🧭 <strong>Navigation:</strong> AI helps robots move around safely</li>
            <li>🤲 <strong>Manipulation:</strong> Precise control of robot arms and hands</li>
            <li>🗣️ <strong>Human Interaction:</strong> Robots that can communicate naturally</li>
          </ul>
          
          <h3>Robots in Kenya</h3>
          <p>From delivery drones in Nairobi to agricultural robots helping farmers, Kenya is embracing robotic technology!</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand robot-AI integration",
          "Learn about robot sensors and control",
          "Explore real-world robotic applications"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "Computer vision helps robots:",
              options: ["See and understand their environment", "Hear sounds better", "Move faster", "Use less energy"],
              correctAnswer: 0,
              explanation: "Computer vision allows robots to process visual information from cameras to understand their surroundings."
            },
            {
              id: 2,
              question: "What is robot navigation?",
              options: ["Programming robots", "Helping robots move around safely", "Building robots", "Powering robots"],
              correctAnswer: 1,
              explanation: "Robot navigation involves using AI to help robots move from one place to another while avoiding obstacles."
            },
            {
              id: 3,
              question: "Agricultural robots in Kenya might help with:",
              options: ["Only entertainment", "Crop monitoring and harvesting", "Playing music", "Teaching children"],
              correctAnswer: 1,
              explanation: "Agricultural robots can help farmers by monitoring crop health, planting, and harvesting more efficiently."
            },
            {
              id: 4,
              question: "Robot manipulation refers to:",
              options: ["Controlling robot movement and actions", "Programming errors", "Robot entertainment", "Robot decoration"],
              correctAnswer: 0,
              explanation: "Robot manipulation involves precisely controlling robot arms, hands, and other actuators to perform tasks."
            },
            {
              id: 5,
              question: "The main challenge for robots in the real world is:",
              options: ["Running out of battery", "Dealing with unpredictable environments", "Looking attractive", "Being expensive"],
              correctAnswer: 1,
              explanation: "Real-world environments are complex and unpredictable, requiring sophisticated AI for robots to adapt."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 8: AI Ethics and Responsible Technology
  {
    id: 8,
    title: "AI Ethics and Responsible Technology",
    description: "Learn about the ethical implications of AI and responsible development",
    icon: "⚖️",
    difficulty: "Advanced",
    ageGroup: "12-16 years",
    duration: "5 hours",
    prerequisites: ["Introduction to AI and Programming", "AI for Social Good"],
    learningOutcomes: [
      "Understand AI bias and fairness",
      "Learn about privacy and data protection",
      "Explore AI decision-making ethics",
      "Design responsible AI systems"
    ],
    lessons: [
      {
        id: 1,
        title: "What Makes AI Fair?",
        description: "Explore bias, fairness, and equality in AI systems",
        duration: "40 min",
        content: `
          <h3>The Challenge of Fairness</h3>
          <p>AI systems can accidentally discriminate against certain groups of people. Understanding and preventing this is crucial for building technology that serves everyone fairly.</p>
          
          <h3>Types of AI Bias</h3>
          <ul>
            <li>📊 <strong>Data Bias:</strong> When training data doesn't represent all groups equally</li>
            <li>🎯 <strong>Algorithmic Bias:</strong> When the AI algorithm favors certain outcomes</li>
            <li>👥 <strong>Historical Bias:</strong> When past inequalities are reflected in AI decisions</li>
            <li>🔍 <strong>Confirmation Bias:</strong> When AI reinforces existing prejudices</li>
          </ul>
          
          <h3>Building Fair AI for Kenya</h3>
          <p>How can we ensure AI systems work fairly for all Kenyans, regardless of their tribe, gender, age, or economic status?</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Identify different types of AI bias",
          "Understand fairness in algorithmic systems",
          "Learn strategies for bias prevention"
        ],
        quiz: {
          id: 1,
          timeLimit: 400,
          questions: [
            {
              id: 1,
              question: "Data bias occurs when:",
              options: ["AI works too slowly", "Training data doesn't represent all groups fairly", "Computers break down", "Programs have bugs"],
              correctAnswer: 1,
              explanation: "Data bias happens when the data used to train AI doesn't include fair representation of all groups in society."
            },
            {
              id: 2,
              question: "Why is AI fairness important in Kenya?",
              options: ["It makes AI faster", "It ensures all Kenyans benefit equally from AI technology", "It reduces costs", "It improves internet speed"],
              correctAnswer: 1,
              explanation: "Fair AI ensures that technology benefits all people regardless of their background, promoting equality and inclusion."
            },
            {
              id: 3,
              question: "Historical bias in AI means:",
              options: ["AI is old technology", "AI reflects past inequalities and discrimination", "AI studies history", "AI prefers old data"],
              correctAnswer: 1,
              explanation: "Historical bias occurs when AI systems perpetuate past inequalities present in historical data."
            },
            {
              id: 4,
              question: "To prevent bias, AI developers should:",
              options: ["Use only new data", "Include diverse perspectives and test for fairness", "Work alone", "Focus only on accuracy"],
              correctAnswer: 1,
              explanation: "Preventing bias requires diverse development teams, inclusive data, and continuous testing for fairness."
            },
            {
              id: 5,
              question: "Algorithmic bias can result in:",
              options: ["Unfair treatment of certain groups", "Faster processing", "Better accuracy", "Lower costs"],
              correctAnswer: 0,
              explanation: "Algorithmic bias can lead to systematic unfair treatment of certain demographic groups."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 9: AI in Agriculture and Environment
  {
    id: 9,
    title: "AI in Agriculture and Environment",
    description: "Discover how AI helps farmers and protects our environment",
    icon: "🌱",
    difficulty: "Intermediate",
    ageGroup: "10-14 years",
    duration: "5 hours",
    prerequisites: ["Introduction to AI and Programming", "Smart Image Recognition"],
    learningOutcomes: [
      "Understand precision agriculture with AI",
      "Learn about environmental monitoring",
      "Explore climate change solutions",
      "Build agricultural AI tools"
    ],
    lessons: [
      {
        id: 1,
        title: "Smart Farming with AI",
        description: "Learn how AI revolutionizes agriculture and food production",
        duration: "35 min",
        content: `
          <h3>The Future of Farming</h3>
          <p>Kenya's agriculture is being transformed by AI! From detecting crop diseases to optimizing irrigation, AI helps farmers grow more food with fewer resources.</p>
          
          <h3>AI Applications in Agriculture</h3>
          <ul>
            <li>🌾 <strong>Crop Monitoring:</strong> Drones and satellites watch crop health</li>
            <li>💧 <strong>Smart Irrigation:</strong> AI decides when and how much to water</li>
            <li>🐛 <strong>Pest Detection:</strong> Early identification of crop diseases and pests</li>
            <li>📈 <strong>Yield Prediction:</strong> Forecasting harvest amounts</li>
          </ul>
          
          <h3>Kenyan Success Stories</h3>
          <ul>
            <li>AI-powered pest detection for maize crops</li>
            <li>Weather prediction systems for farmers</li>
            <li>Mobile apps providing agricultural advice</li>
          </ul>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Understand precision agriculture concepts",
          "Learn about agricultural AI applications",
          "Explore environmental monitoring technology"
        ],
        quiz: {
          id: 1,
          timeLimit: 300,
          questions: [
            {
              id: 1,
              question: "How does AI help with crop monitoring?",
              options: ["By manually checking each plant", "Using drones and satellites to analyze crop health", "By replacing farmers", "By watering plants automatically"],
              correctAnswer: 1,
              explanation: "AI uses imagery from drones and satellites to analyze crop health, detecting issues early and efficiently."
            },
            {
              id: 2,
              question: "Smart irrigation systems use AI to:",
              options: ["Water all crops equally", "Determine optimal watering schedules and amounts", "Replace water with chemicals", "Stop all watering"],
              correctAnswer: 1,
              explanation: "AI analyzes soil moisture, weather data, and plant needs to optimize irrigation timing and amounts."
            },
            {
              id: 3,
              question: "Early pest detection is important because:",
              options: ["Pests are interesting to study", "It prevents crop damage and reduces pesticide use", "It makes farming more expensive", "It eliminates all insects"],
              correctAnswer: 1,
              explanation: "Early detection allows targeted treatment, preventing widespread damage and reducing the need for harmful pesticides."
            },
            {
              id: 4,
              question: "AI yield prediction helps farmers:",
              options: ["Plant different crops", "Plan harvesting and market strategies", "Change the weather", "Eliminate all risk"],
              correctAnswer: 1,
              explanation: "Yield predictions help farmers make informed decisions about harvesting, storage, and marketing their crops."
            },
            {
              id: 5,
              question: "The main benefit of AI in Kenyan agriculture is:",
              options: ["Making farming more complex", "Increasing productivity while reducing resource waste", "Replacing all farmers", "Making food more expensive"],
              correctAnswer: 1,
              explanation: "AI helps farmers increase crop yields while using water, fertilizer, and pesticides more efficiently."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  },

  // Course 10: Future AI Careers and Innovation
  {
    id: 10,
    title: "Future AI Careers and Innovation",
    description: "Explore AI career paths and become an AI innovator",
    icon: "🚀",
    difficulty: "Advanced",
    ageGroup: "13-16 years",
    duration: "6 hours",
    prerequisites: ["All previous courses recommended"],
    learningOutcomes: [
      "Understand AI career opportunities",
      "Learn about AI entrepreneurship",
      "Develop innovation thinking",
      "Create a personal AI learning plan"
    ],
    lessons: [
      {
        id: 1,
        title: "AI Career Pathways",
        description: "Discover exciting career opportunities in artificial intelligence",
        duration: "45 min",
        content: `
          <h3>Your Future in AI</h3>
          <p>The AI revolution is creating amazing new career opportunities! Whether you love coding, design, business, or helping people, there's an AI career path for you.</p>
          
          <h3>AI Career Categories</h3>
          <ul>
            <li>💻 <strong>Technical Roles:</strong> AI Engineers, Data Scientists, Machine Learning Engineers</li>
            <li>🎨 <strong>Creative Roles:</strong> AI UX Designers, AI Content Creators, AI Artists</li>
            <li>💼 <strong>Business Roles:</strong> AI Product Managers, AI Consultants, AI Entrepreneurs</li>
            <li>🤝 <strong>Social Impact:</strong> AI Ethics Specialists, AI for Good Practitioners</li>
          </ul>
          
          <h3>Building AI Career in Kenya</h3>
          <ul>
            <li>Growing tech hubs in Nairobi and other cities</li>
            <li>Government support for digital innovation</li>
            <li>Opportunities to solve uniquely African challenges</li>
            <li>Building solutions for local and global markets</li>
          </ul>
          
          <h3>Getting Started</h3>
          <p>Your AI journey starts now! Every project you build, every problem you solve, and every question you ask brings you closer to an exciting AI career.</p>
        `,
        practiceUrl: "https://scratch.mit.edu/projects/editor/",
        scratchProjectUrl: "https://scratch.mit.edu/projects/editor/",
        learningObjectives: [
          "Identify various AI career paths",
          "Understand skills needed for AI careers",
          "Explore AI opportunities in Kenya"
        ],
        quiz: {
          id: 1,
          timeLimit: 400,
          questions: [
            {
              id: 1,
              question: "Which is NOT typically an AI career path?",
              options: ["AI Engineer", "Data Scientist", "AI Ethics Specialist", "Traditional Farmer (without technology)"],
              correctAnswer: 3,
              explanation: "While traditional farming is important, AI careers involve working with artificial intelligence technology."
            },
            {
              id: 2,
              question: "AI UX Designers focus on:",
              options: ["Writing code only", "Creating user-friendly AI interfaces", "Building hardware", "Managing databases"],
              correctAnswer: 1,
              explanation: "AI UX Designers create intuitive interfaces that help people interact with AI systems effectively."
            },
            {
              id: 3,
              question: "Kenya's AI sector offers opportunities to:",
              options: ["Only copy foreign solutions", "Solve uniquely African challenges with global impact", "Work only in foreign countries", "Avoid local problems"],
              correctAnswer: 1,
              explanation: "Kenya's AI sector can address local challenges while creating solutions with global applicability."
            },
            {
              id: 4,
              question: "The most important skill for any AI career is:",
              options: ["Memorizing algorithms", "Continuous learning and problem-solving", "Working alone always", "Avoiding new technologies"],
              correctAnswer: 1,
              explanation: "AI is rapidly evolving, so continuous learning and strong problem-solving skills are essential for any AI career."
            },
            {
              id: 5,
              question: "AI entrepreneurship in Kenya involves:",
              options: ["Only foreign investment", "Creating AI solutions for local and global markets", "Avoiding technology", "Copying existing products exactly"],
              correctAnswer: 1,
              explanation: "AI entrepreneurs in Kenya can create innovative solutions that serve both local needs and global markets."
            },
            {
              id: 6,
              question: "To prepare for an AI career, students should:",
              options: ["Only study computer science", "Develop diverse skills including creativity, ethics, and communication", "Avoid mathematics", "Focus only on one programming language"],
              correctAnswer: 1,
              explanation: "AI careers benefit from diverse skills including technical abilities, creativity, ethics understanding, and communication."
            },
            {
              id: 7,
              question: "Data Scientists in AI primarily:",
              options: ["Only collect data", "Analyze data to extract insights for AI systems", "Design user interfaces", "Manage social media"],
              correctAnswer: 1,
              explanation: "Data Scientists analyze and interpret data to create insights that inform and improve AI systems."
            },
            {
              id: 8,
              question: "AI for Good practitioners focus on:",
              options: ["Maximizing profits only", "Using AI to solve social and environmental problems", "Creating entertainment only", "Building the most complex systems"],
              correctAnswer: 1,
              explanation: "AI for Good practitioners apply AI technology to address social challenges and create positive impact."
            },
            {
              id: 9,
              question: "The AI job market in Kenya is:",
              options: ["Shrinking rapidly", "Growing with increasing opportunities", "Only for foreign workers", "Limited to government jobs"],
              correctAnswer: 1,
              explanation: "Kenya's AI job market is expanding rapidly with opportunities in various sectors and organizations."
            },
            {
              id: 10,
              question: "Building an AI career portfolio should include:",
              options: ["Only academic credentials", "Projects, learning experiences, and impact demonstrations", "Just one programming language", "Only theoretical knowledge"],
              correctAnswer: 1,
              explanation: "A strong AI career portfolio demonstrates practical skills through projects, continuous learning, and measurable impact."
            }
          ]
        }
      }
      // Add 9 more lessons for this course...
    ]
  }
];

// Helper functions for course management
export const getCourseById = (id: number): AIKidsCourse | undefined => {
  return aiKidsCourses.find(course => course.id === id);
};

export const getLessonById = (courseId: number, lessonId: number): AIKidsLesson | undefined => {
  const course = getCourseById(courseId);
  return course?.lessons.find(lesson => lesson.id === lessonId);
};

export const getQuizById = (courseId: number, lessonId: number): AIKidsQuiz | undefined => {
  const lesson = getLessonById(courseId, lessonId);
  return lesson?.quiz;
};

export const getCoursesByDifficulty = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): AIKidsCourse[] => {
  return aiKidsCourses.filter(course => course.difficulty === difficulty);
};

export const searchCourses = (query: string): AIKidsCourse[] => {
  const lowerQuery = query.toLowerCase();
  return aiKidsCourses.filter(course => 
    course.title.toLowerCase().includes(lowerQuery) ||
    course.description.toLowerCase().includes(lowerQuery) ||
    course.learningOutcomes.some(outcome => outcome.toLowerCase().includes(lowerQuery))
  );
};