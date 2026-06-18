export interface WebDevQuiz {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface WebDevLesson {
  id: number;
  title: string;
  description: string;
  duration: string;
  content: string;
  learningObjectives: string[];
  codeExamples: {
    html: string;
    css: string;
    javascript: string;
  };
  quiz: WebDevQuiz[];
  practiceTask: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface WebDevCourse {
  id: number;
  title: string;
  description: string;
  gradeLevel: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  learningOutcomes: string[];
  prerequisites: string[];
  technologies: string[];
  lessons: WebDevLesson[];
}

export const webDevCourses: WebDevCourse[] = [
  // HTML Curriculum for Kids (Ages 7-12)
  {
    id: 101,
    title: "Course 1 - HTML Explorers",
    description: "Start your HTML journey by exploring the basics of web page creation. Learn what HTML is and create your first web pages!",
    gradeLevel: "Grades 1-3 (Ages 7-9)",
    duration: "4 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Understand what HTML is and how it works",
      "Create basic web pages with simple text",
      "Learn about opening and closing tags",
      "Use headings and paragraphs",
      "Add line breaks and basic formatting"
    ],
    prerequisites: ["Basic reading skills", "Computer familiarity"],
    technologies: ["HTML5"],
    lessons: [
      {
        id: 1,
        title: "What is HTML?",
        description: "Discover the magic language that creates websites",
        duration: "30 minutes",
        content: `
          <h2>Welcome to HTML Land! 🌐</h2>
          <p>HTML is like a special language that computers understand to make websites. It's like giving instructions to the computer to show pictures, text, and colors on a screen!</p>
          
          <h3>What does HTML do?</h3>
          <ul>
            <li>🏠 Makes websites and web pages</li>
            <li>📝 Shows text and words</li>
            <li>🖼️ Displays pictures</li>
            <li>🎨 Makes things look pretty</li>
          </ul>
          
          <h3>HTML is everywhere!</h3>
          <p>Every website you visit - YouTube, games, educational sites - they all use HTML!</p>
        `,
        learningObjectives: [
          "Define HTML in simple terms",
          "Understand that HTML creates websites",
          "Recognize HTML in everyday internet use"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My First Web Page</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>I am learning HTML!</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What is HTML used for?",
            options: ["Making websites", "Cooking food", "Playing music", "Drawing pictures"],
            correctAnswer: 0,
            explanation: "HTML is used to create websites and web pages!"
          },
          {
            id: 2,
            question: "What does HTML stand for?",
            options: ["Hyperlink Text Markup Language", "HyperText Markup Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
            correctAnswer: 1,
            explanation: "HTML stands for HyperText Markup Language - the language that creates web pages!"
          },
          {
            id: 3,
            question: "What type of websites use HTML?",
            options: ["Only simple websites", "Only complicated websites", "All websites", "Only colorful websites"],
            correctAnswer: 2,
            explanation: "Every website you visit uses HTML - from simple blogs to complex sites like YouTube!"
          },
          {
            id: 4,
            question: "Which symbol is used in HTML tags?",
            options: ["( )", "[ ]", "< >", "{ }"],
            correctAnswer: 2,
            explanation: "HTML tags use angle brackets < > to tell the browser what to do!"
          },
          {
            id: 5,
            question: "What makes a website appear on your computer screen?",
            options: ["Magic", "HTML code", "Pictures only", "Music"],
            correctAnswer: 1,
            explanation: "HTML code gives instructions to your browser about what to show on the screen!"
          }
        ],
        practiceTask: "Create a simple web page that says 'Hello, I am [your name]!'",
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: 102,
    title: "Course 2 - HTML Story Makers", 
    description: "Learn to tell amazing stories using HTML! Create interactive story pages with headings, paragraphs, and basic formatting.",
    gradeLevel: "Grades 2-4 (Ages 8-10)",
    duration: "4 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Create story pages with proper structure",
      "Use different heading levels for story chapters",
      "Format text with bold and italic",
      "Add lists to organize story elements",
      "Build multi-page story websites"
    ],
    prerequisites: ["HTML Explorers completion", "Basic writing skills"],
    technologies: ["HTML5"],
    lessons: [
      {
        id: 1,
        title: "Story Structure with Headings",
        description: "Learn to organize your stories with different heading sizes",
        duration: "35 minutes",
        content: `
          <h2>Creating Story Structure! 📚</h2>
          <p>Just like books have titles and chapters, HTML stories use headings to organize content!</p>
          
          <h3>Different Heading Sizes:</h3>
          <ul>
            <li>📖 &lt;h1&gt; - Main story title (biggest)</li>
            <li>📑 &lt;h2&gt; - Chapter titles</li>
            <li>📄 &lt;h3&gt; - Section titles</li>
            <li>📃 &lt;h4&gt; - Smaller sections</li>
          </ul>
          
          <h3>Building Your Story:</h3>
          <p>Start with a big title, then add chapters, and fill with exciting paragraphs!</p>
        `,
        learningObjectives: [
          "Use h1, h2, h3, h4 tags appropriately",
          "Structure content hierarchically", 
          "Create story outlines with headings"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>The Adventure Story</title>
</head>
<body>
    <h1>The Magic Forest Adventure</h1>
    
    <h2>Chapter 1: The Beginning</h2>
    <p>Once upon a time, there was a brave explorer...</p>
    
    <h2>Chapter 2: The Discovery</h2>
    <p>Deep in the forest, they found something amazing...</p>
    
    <h3>The Secret Cave</h3>
    <p>Inside the cave, there were sparkling crystals!</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "Which heading is the biggest?",
            options: ["h1", "h2", "h3", "h4"],
            correctAnswer: 0,
            explanation: "h1 creates the biggest heading - perfect for main titles!"
          },
          {
            id: 2,
            question: "What heading would you use for a chapter title?",
            options: ["h1", "h2", "h3", "h4"],
            correctAnswer: 1,
            explanation: "h2 is perfect for chapter titles - smaller than the main title but bigger than sections!"
          },
          {
            id: 3,
            question: "How do you create a paragraph in HTML?",
            options: ["<paragraph>", "<para>", "<p>", "<text>"],
            correctAnswer: 2,
            explanation: "The <p> tag is used to create paragraphs in HTML!"
          },
          {
            id: 4,
            question: "Which is the correct way to structure a story?",
            options: ["h1 for title, h2 for chapters", "h4 for title, h1 for chapters", "Only use h1 tags", "Only use paragraphs"],
            correctAnswer: 0,
            explanation: "Use h1 for the main title and h2 for chapter titles to create good structure!"
          },
          {
            id: 5,
            question: "What makes headings different from paragraphs?",
            options: ["Headings are bigger and bolder", "Headings are smaller", "Headings are the same", "Headings are invisible"],
            correctAnswer: 0,
            explanation: "Headings are bigger and bolder to help organize and highlight important sections!"
          }
        ],
        practiceTask: "Create a story about your favorite animal with a main title and at least 2 chapters",
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: 103,
    title: "Course 3 - HTML Page Builders",
    description: "Build complete web pages with images, links, and organized content. Learn to create beautiful layouts!",
    gradeLevel: "Grades 3-5 (Ages 9-11)", 
    duration: "5 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Add and resize images on web pages",
      "Create links between pages",
      "Organize content with lists",
      "Build navigation menus",
      "Design complete multi-page websites"
    ],
    prerequisites: ["HTML Story Makers completion"],
    technologies: ["HTML5"],
    lessons: [
      {
        id: 1,
        title: "Adding Images to Pages",
        description: "Make your web pages colorful and exciting with pictures!",
        duration: "40 minutes",
        content: `
          <h2>Pictures Make Everything Better! 🖼️</h2>
          <p>Images bring your web pages to life! Let's learn how to add them.</p>
          
          <h3>The Image Tag:</h3>
          <p>The &lt;img&gt; tag is special - it doesn't need a closing tag!</p>
          
          <h3>Important Parts:</h3>
          <ul>
            <li>🔗 src="picture.jpg" - where to find the image</li>
            <li>📝 alt="description" - describes the picture</li>
            <li>📏 width="300" - how wide the image should be</li>
          </ul>
        `,
        learningObjectives: [
          "Use the img tag correctly",
          "Add alt text for accessibility",
          "Control image sizes"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Photo Gallery</title>
</head>
<body>
    <h1>My Summer Vacation</h1>
    
    <h2>At the Beach</h2>
    <img src="beach.jpg" alt="Beautiful sandy beach with blue water" width="400">
    <p>We built the most amazing sandcastle!</p>
    
    <h2>Mountain Hiking</h2>
    <img src="mountain.jpg" alt="Tall mountain with green trees" width="400">
    <p>The view from the top was incredible!</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What attribute tells where to find an image?",
            options: ["alt", "src", "width", "title"],
            correctAnswer: 1,
            explanation: "The 'src' attribute tells the browser where to find the image file!"
          },
          {
            id: 2,
            question: "What is the alt attribute used for?",
            options: ["Making images bigger", "Describing the image", "Changing image colors", "Deleting images"],
            correctAnswer: 1,
            explanation: "The 'alt' attribute describes what the image shows, helping people who can't see it!"
          },
          {
            id: 3,
            question: "Which is the correct way to add an image?",
            options: ["<image src='photo.jpg'>", "<img src='photo.jpg'>", "<picture src='photo.jpg'>", "<photo src='photo.jpg'>"],
            correctAnswer: 1,
            explanation: "Use <img src='filename.jpg'> to add images to your web page!"
          },
          {
            id: 4,
            question: "What attribute controls how wide an image appears?",
            options: ["size", "width", "big", "scale"],
            correctAnswer: 1,
            explanation: "The 'width' attribute controls how wide the image appears on the page!"
          },
          {
            id: 5,
            question: "Does the img tag need a closing tag?",
            options: ["Yes, always", "No, it's self-closing", "Sometimes", "Only for big images"],
            correctAnswer: 1,
            explanation: "The img tag is self-closing - it doesn't need a separate closing tag!"
          }
        ],
        practiceTask: "Create a page about your hobbies with at least 3 images",
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: 104,
    title: "Course 4 - HTML Info Posters",
    description: "Design informational web pages like digital posters! Learn about lists, tables, and organizing information clearly.",
    gradeLevel: "Grades 4-6 (Ages 10-12)",
    duration: "5 weeks", 
    difficulty: "Beginner",
    learningOutcomes: [
      "Create ordered and unordered lists",
      "Design information layouts",
      "Use HTML for educational content",
      "Organize data clearly",
      "Build fact sheets and info graphics"
    ],
    prerequisites: ["HTML Page Builders completion"],
    technologies: ["HTML5"],
    lessons: [
      {
        id: 1,
        title: "Making Lists",
        description: "Organize information with bullet points and numbered lists",
        duration: "35 minutes",
        content: `
          <h2>Lists Make Information Clear! 📋</h2>
          <p>Lists help organize information so it's easy to read and understand.</p>
          
          <h3>Two Types of Lists:</h3>
          <ul>
            <li>🔸 Unordered lists (&lt;ul&gt;) - use bullet points</li>
            <li>🔢 Ordered lists (&lt;ol&gt;) - use numbers</li>
          </ul>
          
          <h3>List Items:</h3>
          <p>Both types use &lt;li&gt; tags for each item in the list!</p>
        `,
        learningObjectives: [
          "Create unordered lists with ul and li tags",
          "Create ordered lists with ol and li tags", 
          "Choose appropriate list types for content"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Animal Facts</title>
</head>
<body>
    <h1>Amazing Animal Facts!</h1>
    
    <h2>Things Lions Can Do:</h2>
    <ul>
        <li>Run up to 50 mph</li>
        <li>Jump 36 feet horizontally</li>
        <li>Roar so loud you can hear it 5 miles away</li>
        <li>Sleep 20 hours a day</li>
    </ul>
    
    <h2>Steps to Help Endangered Animals:</h2>
    <ol>
        <li>Learn about endangered species</li>
        <li>Support wildlife conservation</li>
        <li>Reduce plastic use</li>
        <li>Visit wildlife sanctuaries</li>
    </ol>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "Which tag creates a numbered list?",
            options: ["&lt;ul&gt;", "&lt;ol&gt;", "&lt;li&gt;", "&lt;list&gt;"],
            correctAnswer: 1,
            explanation: "&lt;ol&gt; creates ordered (numbered) lists!"
          },
          {
            id: 2,
            question: "Which tag creates a bulleted list?",
            options: ["&lt;ul&gt;", "&lt;ol&gt;", "&lt;bullet&gt;", "&lt;dots&gt;"],
            correctAnswer: 0,
            explanation: "&lt;ul&gt; creates unordered lists with bullet points!"
          },
          {
            id: 3,
            question: "What tag do you use for each item in a list?",
            options: ["&lt;item&gt;", "&lt;li&gt;", "&lt;list&gt;", "&lt;point&gt;"],
            correctAnswer: 1,
            explanation: "&lt;li&gt; stands for 'list item' and is used for each item in any list!"
          },
          {
            id: 4,
            question: "When should you use a numbered list?",
            options: ["For random items", "For steps in order", "For colors", "Never"],
            correctAnswer: 1,
            explanation: "Use numbered lists when the order matters, like steps in a recipe or instructions!"
          },
          {
            id: 5,
            question: "What's inside a list tag (&lt;ul&gt; or &lt;ol&gt;)?",
            options: ["Paragraphs", "Headings", "List items (&lt;li&gt;)", "Images"],
            correctAnswer: 2,
            explanation: "List tags contain list items (&lt;li&gt;) - each &lt;li&gt; is one item in your list!"
          }
        ],
        practiceTask: "Create an info poster about your favorite subject with both types of lists",
        difficulty: "Beginner"
      }
    ]
  },
  {
    id: 105,
    title: "Course 5 - HTML Media Magic",
    description: "Add videos, audio, and interactive media to your web pages. Make your sites come alive with multimedia!",
    gradeLevel: "Grades 5-7 (Ages 11-13)",
    duration: "6 weeks",
    difficulty: "Intermediate", 
    learningOutcomes: [
      "Embed videos in web pages",
      "Add audio files and music",
      "Create interactive media experiences",
      "Use HTML5 media controls",
      "Build multimedia presentations"
    ],
    prerequisites: ["HTML Info Posters completion"],
    technologies: ["HTML5", "Media APIs"],
    lessons: [
      {
        id: 1,
        title: "Adding Videos",
        description: "Learn to embed videos that play right in your web pages!",
        duration: "45 minutes",
        content: `
          <h2>Videos Make Websites Exciting! 🎬</h2>
          <p>Videos can show tutorials, stories, or just fun content right on your webpage!</p>
          
          <h3>The Video Tag:</h3>
          <p>The &lt;video&gt; tag lets you add video files to your website.</p>
          
          <h3>Video Controls:</h3>
          <ul>
            <li>▶️ controls - adds play/pause buttons</li>
            <li>📐 width/height - sets video size</li>
            <li>🔄 autoplay - starts playing automatically</li>
            <li>🔁 loop - plays video over and over</li>
          </ul>
        `,
        learningObjectives: [
          "Use the video tag to embed videos",
          "Add video controls for user interaction",
          "Set appropriate video dimensions"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Video Gallery</title>
</head>
<body>
    <h1>Cool Science Experiments</h1>
    
    <h2>Volcano Eruption</h2>
    <video width="400" height="300" controls>
        <source src="volcano.mp4" type="video/mp4">
        Your browser doesn't support video playback.
    </video>
    <p>Watch as baking soda and vinegar create an amazing eruption!</p>
    
    <h2>Rainbow in a Glass</h2>
    <video width="400" height="300" controls>
        <source src="rainbow.mp4" type="video/mp4">
        Your browser doesn't support video playback.
    </video>
    <p>Learn how to make a colorful density tower!</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What attribute adds play/pause buttons to a video?",
            options: ["buttons", "controls", "play", "pause"],
            correctAnswer: 1,
            explanation: "The 'controls' attribute adds play/pause buttons and other video controls!"
          },
          {
            id: 2,
            question: "Which tag is used to add videos to web pages?",
            options: ["&lt;movie&gt;", "&lt;video&gt;", "&lt;film&gt;", "&lt;media&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;video&gt; tag is used to embed videos in HTML pages!"
          },
          {
            id: 3,
            question: "What attribute makes a video start playing automatically?",
            options: ["start", "autoplay", "begin", "auto"],
            correctAnswer: 1,
            explanation: "The 'autoplay' attribute makes videos start playing as soon as the page loads!"
          },
          {
            id: 4,
            question: "How do you set the size of a video?",
            options: ["size attribute", "width and height attributes", "scale attribute", "big attribute"],
            correctAnswer: 1,
            explanation: "Use width and height attributes to control video size on your page!"
          },
          {
            id: 5,
            question: "What happens if a browser can't play your video?",
            options: ["Page breaks", "Shows error message", "Shows fallback text", "Nothing happens"],
            correctAnswer: 2,
            explanation: "Text between video tags shows as fallback when browsers can't play the video!"
          }
        ],
        practiceTask: "Create a page with your favorite educational videos",
        difficulty: "Intermediate"
      }
    ]
  },
  {
    id: 106,
    title: "Course 6 - HTML Form Fun",
    description: "Create interactive forms where users can input information. Build surveys, contact forms, and interactive quizzes!",
    gradeLevel: "Grades 6-8 (Ages 12-14)",
    duration: "6 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Create input fields for text and numbers",
      "Build dropdown menus and checkboxes",
      "Design user-friendly forms",
      "Add form validation",
      "Create interactive surveys and quizzes"
    ],
    prerequisites: ["HTML Media Magic completion"],
    technologies: ["HTML5", "Form APIs"],
    lessons: [
      {
        id: 1,
        title: "Text Input Fields",
        description: "Let users type information into your web pages!",
        duration: "40 minutes",
        content: `
          <h2>Let Users Talk to Your Website! 💬</h2>
          <p>Forms let people send information to your website - like filling out a survey or leaving a message!</p>
          
          <h3>Basic Input Types:</h3>
          <ul>
            <li>✏️ text - for typing words</li>
            <li>📧 email - for email addresses</li>
            <li>🔢 number - for numbers only</li>
            <li>📅 date - for picking dates</li>
          </ul>
          
          <h3>Form Structure:</h3>
          <p>All inputs go inside a &lt;form&gt; tag, with labels to tell users what to type!</p>
        `,
        learningObjectives: [
          "Create text input fields",
          "Use different input types appropriately",
          "Add labels for accessibility"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Student Survey</title>
</head>
<body>
    <h1>Tell Us About Yourself!</h1>
    
    <form>
        <label for="name">Your Name:</label>
        <input type="text" id="name" name="name">
        
        <label for="age">Your Age:</label>
        <input type="number" id="age" name="age" min="5" max="18">
        
        <label for="email">Email (optional):</label>
        <input type="email" id="email" name="email">
        
        <label for="birthday">Your Birthday:</label>
        <input type="date" id="birthday" name="birthday">
        
        <button type="submit">Submit Survey</button>
    </form>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What input type is best for collecting email addresses?",
            options: ["text", "email", "number", "date"],
            correctAnswer: 1,
            explanation: "The 'email' input type is specifically designed for email addresses and includes validation!"
          },
          {
            id: 2,
            question: "Which tag contains all form elements?",
            options: ["&lt;input&gt;", "&lt;form&gt;", "&lt;field&gt;", "&lt;survey&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;form&gt; tag wraps around all input fields and form controls!"
          },
          {
            id: 3,
            question: "What input type is used for numbers only?",
            options: ["text", "num", "number", "digit"],
            correctAnswer: 2,
            explanation: "The 'number' input type only allows numbers and provides number controls!"
          },
          {
            id: 4,
            question: "What element describes what users should type in an input?",
            options: ["&lt;description&gt;", "&lt;label&gt;", "&lt;title&gt;", "&lt;hint&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;label&gt; element tells users what information to enter in each field!"
          },
          {
            id: 5,
            question: "What input type is used for selecting dates?",
            options: ["calendar", "date", "time", "day"],
            correctAnswer: 1,
            explanation: "The 'date' input type provides a calendar picker for selecting dates!"
          }
        ],
        practiceTask: "Create a form to collect information about someone's favorite hobbies",
        difficulty: "Intermediate"
      }
    ]
  },
  {
    id: 107,
    title: "Course 7 - HTML Tables & Schedules",
    description: "Organize data in tables and create schedules, calendars, and data displays that are easy to read and understand.",
    gradeLevel: "Grades 7-9 (Ages 13-15)",
    duration: "5 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Create data tables with headers",
      "Design class schedules and calendars", 
      "Use table styling for better readability",
      "Organize complex information clearly",
      "Build responsive table layouts"
    ],
    prerequisites: ["HTML Form Fun completion"],
    technologies: ["HTML5", "CSS (basic)"],
    lessons: [
      {
        id: 1,
        title: "Creating Data Tables",
        description: "Organize information in neat rows and columns!",
        duration: "45 minutes",
        content: `
          <h2>Tables Keep Things Organized! 📊</h2>
          <p>Tables are perfect for showing data that has rows and columns - like schedules, scores, or comparisons!</p>
          
          <h3>Table Parts:</h3>
          <ul>
            <li>🏗️ &lt;table&gt; - the whole table</li>
            <li>📋 &lt;tr&gt; - table row</li>
            <li>🏷️ &lt;th&gt; - table header (bold)</li>
            <li>📝 &lt;td&gt; - table data (regular cell)</li>
          </ul>
          
          <h3>Building Tables:</h3>
          <p>Start with headers, then add rows of data. Keep it organized and easy to read!</p>
        `,
        learningObjectives: [
          "Create tables with proper structure",
          "Use table headers for clarity",
          "Organize data in rows and columns"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Class Schedule</title>
</head>
<body>
    <h1>Weekly Class Schedule</h1>
    
    <table border="1">
        <tr>
            <th>Time</th>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
        </tr>
        <tr>
            <td>9:00 AM</td>
            <td>Math</td>
            <td>Science</td>
            <td>Math</td>
            <td>English</td>
            <td>Art</td>
        </tr>
        <tr>
            <td>10:00 AM</td>
            <td>English</td>
            <td>Math</td>
            <td>Science</td>
            <td>Physical Ed</td>
            <td>Music</td>
        </tr>
        <tr>
            <td>11:00 AM</td>
            <td>Science</td>
            <td>History</td>
            <td>English</td>
            <td>Math</td>
            <td>Computer</td>
        </tr>
    </table>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "Which tag creates a table header cell?",
            options: ["&lt;td&gt;", "&lt;th&gt;", "&lt;tr&gt;", "&lt;table&gt;"],
            correctAnswer: 1,
            explanation: "&lt;th&gt; creates table header cells that are bold and centered by default!"
          },
          {
            id: 2,
            question: "Which tag creates a table row?",
            options: ["&lt;row&gt;", "&lt;tr&gt;", "&lt;td&gt;", "&lt;line&gt;"],
            correctAnswer: 1,
            explanation: "&lt;tr&gt; stands for 'table row' and creates horizontal rows in tables!"
          },
          {
            id: 3,
            question: "Which tag creates a regular table cell?",
            options: ["&lt;cell&gt;", "&lt;tc&gt;", "&lt;td&gt;", "&lt;data&gt;"],
            correctAnswer: 2,
            explanation: "&lt;td&gt; stands for 'table data' and creates regular cells in table rows!"
          },
          {
            id: 4,
            question: "What wraps around all table content?",
            options: ["&lt;table&gt;", "&lt;grid&gt;", "&lt;chart&gt;", "&lt;data&gt;"],
            correctAnswer: 0,
            explanation: "The &lt;table&gt; tag wraps around all rows, headers, and cells in a table!"
          },
          {
            id: 5,
            question: "When should you use tables?",
            options: ["For page layout", "For organizing data in rows and columns", "For adding images", "For making text bold"],
            correctAnswer: 1,
            explanation: "Tables are perfect for organizing data that naturally fits in rows and columns, like schedules or comparisons!"
          }
        ],
        practiceTask: "Create a table showing your favorite books, movies, and games",
        difficulty: "Intermediate"
      }
    ]
  },
  {
    id: 108,
    title: "Course 8 - HTML Mini-Sites",
    description: "Build complete mini websites with multiple pages, navigation, and professional layouts. Create your first real website!",
    gradeLevel: "Grades 8-10 (Ages 14-16)",
    duration: "7 weeks",
    difficulty: "Intermediate",
    learningOutcomes: [
      "Create multi-page websites",
      "Build navigation menus",
      "Link pages together",
      "Design consistent layouts",
      "Plan and organize website structure"
    ],
    prerequisites: ["HTML Tables & Schedules completion"],
    technologies: ["HTML5", "CSS (intermediate)"],
    lessons: [
      {
        id: 1,
        title: "Planning Your Website",
        description: "Learn to plan and structure a complete website before building it!",
        duration: "50 minutes",
        content: `
          <h2>Planning Makes Perfect Websites! 🗺️</h2>
          <p>Before building a house, architects make blueprints. Before building websites, we make plans!</p>
          
          <h3>Website Planning Steps:</h3>
          <ol>
            <li>🎯 Choose your website topic</li>
            <li>📝 Plan your pages (Home, About, Contact, etc.)</li>
            <li>🗂️ Organize your content</li>
            <li>🎨 Design your navigation</li>
            <li>🔗 Plan how pages connect</li>
          </ol>
          
          <h3>Common Website Pages:</h3>
          <ul>
            <li>🏠 Home - welcomes visitors</li>
            <li>👋 About - tells your story</li>
            <li>📞 Contact - how to reach you</li>
            <li>📋 Services/Projects - what you offer</li>
          </ul>
        `,
        learningObjectives: [
          "Plan website structure and content",
          "Identify essential pages for a website",
          "Design user navigation flow"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Portfolio - Home</title>
</head>
<body>
    <!-- Navigation Menu -->
    <nav>
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About Me</a></li>
            <li><a href="projects.html">My Projects</a></li>
            <li><a href="contact.html">Contact</a></li>
        </ul>
    </nav>
    
    <!-- Main Content -->
    <h1>Welcome to My Portfolio!</h1>
    <p>Hi! I'm a student learning web development. Check out my projects and learn more about me!</p>
    
    <h2>Latest Updates</h2>
    <ul>
        <li>🎉 Completed HTML Tables course</li>
        <li>🚀 Started building my first mini-site</li>
        <li>📚 Learning advanced HTML techniques</li>
    </ul>
    
    <a href="about.html">Learn more about me →</a>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What should you do before building a website?",
            options: ["Start coding immediately", "Plan the structure and content", "Choose colors first", "Buy a domain name"],
            correctAnswer: 1,
            explanation: "Planning the structure and content first helps create a better, more organized website!"
          },
          {
            id: 2,
            question: "What is usually the main page of a website called?",
            options: ["Main page", "Start page", "Home page", "First page"],
            correctAnswer: 2,
            explanation: "The home page is typically the main page visitors see first when they visit your website!"
          },
          {
            id: 3,
            question: "Which element is commonly used for navigation menus?",
            options: ["&lt;menu&gt;", "&lt;nav&gt;", "&lt;navigation&gt;", "&lt;links&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;nav&gt; element is specifically designed for navigation menus and links!"
          },
          {
            id: 4,
            question: "How do you link to another page on your website?",
            options: ["&lt;link to='page.html'&gt;", "&lt;a href='page.html'&gt;", "&lt;go to='page.html'&gt;", "&lt;page src='page.html'&gt;"],
            correctAnswer: 1,
            explanation: "Use &lt;a href='filename.html'&gt; to create links to other pages!"
          },
          {
            id: 5,
            question: "What makes a good website structure?",
            options: ["Random organization", "Clear navigation and logical page hierarchy", "Lots of colors", "Many animations"],
            correctAnswer: 1,
            explanation: "Good websites have clear navigation and logical organization so visitors can find what they need!"
          }
        ],
        practiceTask: "Create a plan for a website about your favorite hobby, including at least 4 pages",
        difficulty: "Intermediate"
      }
    ]
  },
  {
    id: 109,
    title: "Course 9 - HTML & Multimedia",
    description: "Master advanced multimedia integration! Combine HTML with audio, video, animations, and interactive elements.",
    gradeLevel: "Grades 9-11 (Ages 15-17)",
    duration: "8 weeks",
    difficulty: "Advanced",
    learningOutcomes: [
      "Create complex multimedia experiences",
      "Integrate audio and video seamlessly",
      "Build interactive media galleries",
      "Use advanced HTML5 features",
      "Optimize media for web performance"
    ],
    prerequisites: ["HTML Mini-Sites completion"],
    technologies: ["HTML5", "CSS3", "Media APIs", "Canvas"],
    lessons: [
      {
        id: 1,
        title: "Advanced Video Integration",
        description: "Create professional video experiences with custom controls and effects!",
        duration: "60 minutes",
        content: `
          <h2>Professional Video Experiences! 🎬</h2>
          <p>Learn to create video galleries, custom players, and interactive video content!</p>
          
          <h3>Advanced Video Features:</h3>
          <ul>
            <li>🎥 Multiple video sources for compatibility</li>
            <li>🎨 Custom video controls</li>
            <li>📱 Responsive video sizing</li>
            <li>⚡ Video optimization techniques</li>
            <li>🔄 Video playlists and galleries</li>
          </ul>
          
          <h3>Video Best Practices:</h3>
          <ul>
            <li>Always provide fallback content</li>
            <li>Use appropriate video formats</li>
            <li>Consider loading times</li>
            <li>Add captions for accessibility</li>
          </ul>
        `,
        learningObjectives: [
          "Implement advanced video features",
          "Create responsive video layouts",
          "Optimize video performance"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Video Gallery</title>
    <style>
        .video-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .video-item {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
        }
        video {
            width: 100%;
            height: auto;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>My Video Collection</h1>
    
    <div class="video-gallery">
        <div class="video-item">
            <h3>Nature Documentary</h3>
            <video controls poster="nature-poster.jpg">
                <source src="nature.mp4" type="video/mp4">
                <source src="nature.webm" type="video/webm">
                <track kind="captions" src="nature-captions.vtt" srclang="en" label="English">
                Your browser doesn't support video playback.
            </video>
            <p>Amazing wildlife footage from around the world!</p>
        </div>
        
        <div class="video-item">
            <h3>Science Experiment</h3>
            <video controls poster="science-poster.jpg">
                <source src="science.mp4" type="video/mp4">
                <source src="science.webm" type="video/webm">
                Your browser doesn't support video playback.
            </video>
            <p>Cool chemistry reactions you can try at home!</p>
        </div>
    </div>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "Why should you provide multiple video source formats?",
            options: ["To make files bigger", "For browser compatibility", "To use more storage", "To make videos slower"],
            correctAnswer: 1,
            explanation: "Different browsers support different video formats, so multiple sources ensure your video works everywhere!"
          },
          {
            id: 2,
            question: "What is a video poster attribute used for?",
            options: ["Adding sound", "Showing an image before video plays", "Making video bigger", "Adding captions"],
            correctAnswer: 1,
            explanation: "The poster attribute shows a preview image before the video starts playing!"
          },
          {
            id: 3,
            question: "What element provides captions for videos?",
            options: ["&lt;captions&gt;", "&lt;track&gt;", "&lt;subtitle&gt;", "&lt;text&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;track&gt; element provides captions and subtitles for videos!"
          },
          {
            id: 4,
            question: "How do you make videos responsive (work on different screen sizes)?",
            options: ["Set fixed width", "Use width: 100%", "Make them very small", "Use only height"],
            correctAnswer: 1,
            explanation: "Setting width: 100% makes videos scale to fit different screen sizes!"
          },
          {
            id: 5,
            question: "What should you always provide for videos?",
            options: ["Loud sound", "Fallback content for unsupported browsers", "Automatic playing", "Very large file size"],
            correctAnswer: 1,
            explanation: "Always provide fallback content between video tags for browsers that can't play the video!"
          }
        ],
        practiceTask: "Create a video gallery showcasing different topics with proper optimization",
        difficulty: "Advanced"
      }
    ]
  },
  {
    id: 110,
    title: "Course 10 - Final Project & Portfolio",
    description: "Create your ultimate HTML portfolio! Showcase all your skills in a professional website that demonstrates your web development journey.",
    gradeLevel: "Grades 10-12 (Ages 16-18)",
    duration: "10 weeks",
    difficulty: "Advanced",
    learningOutcomes: [
      "Build a complete professional portfolio",
      "Demonstrate mastery of all HTML concepts",
      "Create an impressive showcase of projects",
      "Present work professionally",
      "Prepare for advanced web development"
    ],
    prerequisites: ["HTML & Multimedia completion"],
    technologies: ["HTML5", "CSS3", "JavaScript (basic)", "Responsive Design"],
    lessons: [
      {
        id: 1,
        title: "Portfolio Planning & Design",
        description: "Plan and design a professional portfolio that showcases your best work!",
        duration: "90 minutes",
        content: `
          <h2>Building Your Professional Portfolio! 🌟</h2>
          <p>Your portfolio is your chance to shine! It's where you show off everything you've learned and created.</p>
          
          <h3>Portfolio Essentials:</h3>
          <ul>
            <li>🏠 Professional homepage with clear branding</li>
            <li>👨‍💻 About section telling your story</li>
            <li>🎨 Project showcase with descriptions</li>
            <li>🛠️ Skills and technologies section</li>
            <li>📬 Contact information and social links</li>
            <li>📱 Mobile-friendly responsive design</li>
          </ul>
          
          <h3>Making It Professional:</h3>
          <ul>
            <li>Use consistent colors and fonts</li>
            <li>Include high-quality images</li>
            <li>Write clear, engaging descriptions</li>
            <li>Test on different devices</li>
            <li>Include your best projects only</li>
          </ul>
        `,
        learningObjectives: [
          "Plan a professional portfolio structure",
          "Design consistent branding and layout",
          "Select and present best projects effectively"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alex Chen - Web Developer Portfolio</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
        }
        
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        nav {
            background: #333;
            padding: 1rem 0;
        }
        
        nav ul {
            list-style: none;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        nav li {
            margin: 0 1rem;
        }
        
        nav a {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        nav a:hover {
            background: #667eea;
        }
        
        .section {
            padding: 3rem 0;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .project-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            padding: 1.5rem;
            transition: transform 0.3s;
        }
        
        .project-card:hover {
            transform: translateY(-5px);
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="hero">
                <h1>Alex Chen</h1>
                <p>Student Web Developer & HTML Enthusiast</p>
            </div>
        </div>
    </header>
    
    <nav>
        <div class="container">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>
    
    <main>
        <section id="about" class="section">
            <div class="container">
                <h2>About Me</h2>
                <p>I'm a passionate student who has completed the full HTML curriculum! I love creating websites and have built everything from simple pages to complex multimedia sites. My journey started with HTML Explorers and now I'm ready to take on the world of web development!</p>
            </div>
        </section>
        
        <section id="projects" class="section">
            <div class="container">
                <h2>My Projects</h2>
                <div class="projects-grid">
                    <div class="project-card">
                        <h3>Interactive Story Website</h3>
                        <p>A multi-chapter adventure story with navigation, images, and engaging content. Built using semantic HTML and proper structure.</p>
                        <strong>Skills Used:</strong> HTML5, Story Structure, Navigation
                    </div>
                    
                    <div class="project-card">
                        <h3>Science Experiment Gallery</h3>
                        <p>Video gallery showcasing cool science experiments with responsive design and accessibility features.</p>
                        <strong>Skills Used:</strong> HTML5 Video, Responsive Design, Accessibility
                    </div>
                    
                    <div class="project-card">
                        <h3>Student Survey Form</h3>
                        <p>Interactive form collecting student information with proper validation and user-friendly design.</p>
                        <strong>Skills Used:</strong> HTML Forms, Input Validation, UX Design
                    </div>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What's the most important aspect of a professional portfolio?",
            options: ["Fancy animations", "Showing your best work clearly", "Using lots of colors", "Having many pages"],
            correctAnswer: 1,
            explanation: "A professional portfolio should clearly showcase your best work with good organization and presentation!"
          },
          {
            id: 2,
            question: "Which section is essential in every portfolio?",
            options: ["Games page", "About section", "Shopping cart", "Weather widget"],
            correctAnswer: 1,
            explanation: "An About section tells visitors who you are and your story - it's crucial for connecting with viewers!"
          },
          {
            id: 3,
            question: "How should you organize projects in your portfolio?",
            options: ["Randomly", "By color", "By skill level and relevance", "Alphabetically"],
            correctAnswer: 2,
            explanation: "Organize projects by skill level and relevance to show your growth and highlight your best work first!"
          },
          {
            id: 4,
            question: "What makes a portfolio mobile-friendly?",
            options: ["Lots of text", "Responsive design", "Fixed width layout", "Many pop-ups"],
            correctAnswer: 1,
            explanation: "Responsive design ensures your portfolio looks great and works well on all devices and screen sizes!"
          },
          {
            id: 5,
            question: "Before building your portfolio, you should:",
            options: ["Start coding immediately", "Plan your content and structure", "Choose random colors", "Copy someone else's design"],
            correctAnswer: 1,
            explanation: "Planning your content and structure first helps create a more effective and professional portfolio!"
          }
        ],
        practiceTask: "Begin planning your portfolio by listing all the projects you've created and organizing them by skill level",
        difficulty: "Advanced"
      }
    ]
  },
  // Continue with existing courses...
  {
    id: 1,
    title: "Digital Art with HTML - Introduction to HTML Basics",
    description: "Learn to create beautiful digital art and web pages using HTML fundamentals",
    gradeLevel: "All Grades",
    duration: "10 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Master fundamental HTML tags and structure",
      "Create visually appealing web pages with text, images, and multimedia",
      "Understand semantic HTML and accessibility principles",
      "Develop creative digital art skills using HTML",
      "Build interactive content using basic HTML forms and links",
      "Apply best practices for web development"
    ],
    prerequisites: ["Basic computer literacy", "Text editing skills"],
    technologies: ["HTML5", "Web Browsers"],
    lessons: [
      {
        id: 1,
        title: "Introduction to HTML and Web Pages",
        description: "Discover what HTML is and how it creates the foundation of every website",
        duration: "45 minutes",
        content: `
          <h2>Welcome to HTML - The Language of the Web!</h2>
          <p>HTML (HyperText Markup Language) is the foundation of every website you've ever visited. Think of it as the skeleton that gives structure to web pages, just like how bones give structure to your body!</p>
          
          <h3>What is HTML?</h3>
          <ul>
            <li>🏗️ <strong>Structure:</strong> HTML provides the basic structure of web pages</li>
            <li>📝 <strong>Content:</strong> It defines what content appears on the page</li>
            <li>🎯 <strong>Meaning:</strong> It gives meaning to different parts of content</li>
            <li>🌐 <strong>Universal:</strong> It works on all devices and browsers</li>
          </ul>
          
          <h3>HTML Elements and Tags</h3>
          <p>HTML uses <strong>tags</strong> to mark up content. Tags are like containers that tell the browser how to display content.</p>
          
          <h3>Your First HTML Document</h3>
          <p>Every HTML document has a basic structure with these essential parts:</p>
          <ul>
            <li><code>&lt;!DOCTYPE html&gt;</code> - Tells the browser this is HTML5</li>
            <li><code>&lt;html&gt;</code> - The root element</li>
            <li><code>&lt;head&gt;</code> - Contains metadata</li>
            <li><code>&lt;body&gt;</code> - Contains visible content</li>
          </ul>
        `,
        learningObjectives: [
          "Define HTML and explain its purpose in web development",
          "Identify the basic structure of an HTML document",
          "Understand the concept of tags and elements",
          "Create a simple HTML page with proper structure"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Digital Art Page</title>
</head>
<body>
    <h1>Welcome to My Digital Art Gallery</h1>
    <p>This is where I'll create amazing digital art with HTML!</p>
    <p>Today marks the beginning of my web development journey.</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What does HTML stand for?",
            options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
            correctAnswer: 0,
            explanation: "HTML stands for HyperText Markup Language, which is used to create the structure and content of web pages."
          },
          {
            id: 2,
            question: "Which tag tells the browser that this is an HTML5 document?",
            options: ["<html>", "<!DOCTYPE html>", "<head>", "<body>"],
            correctAnswer: 1,
            explanation: "The <!DOCTYPE html> declaration tells the browser that this is an HTML5 document."
          },
          {
            id: 3,
            question: "What is the root element of an HTML document?",
            options: ["<body>", "<head>", "<html>", "<title>"],
            correctAnswer: 2,
            explanation: "The <html> element is the root element that contains all other elements in an HTML document."
          },
          {
            id: 4,
            question: "Where do you put the visible content of a webpage?",
            options: ["<head>", "<body>", "<title>", "<html>"],
            correctAnswer: 1,
            explanation: "The <body> element contains all the visible content that appears on the webpage."
          },
          {
            id: 5,
            question: "What type of information goes in the <head> section?",
            options: ["Visible content", "Metadata about the page", "Images", "Navigation menus"],
            correctAnswer: 1,
            explanation: "The <head> section contains metadata about the page, such as the title, character encoding, and viewport settings."
          },
          {
            id: 6,
            question: "HTML tags are like:",
            options: ["Containers for content", "Pictures", "Colors", "Sounds"],
            correctAnswer: 0,
            explanation: "HTML tags act like containers that wrap around content to give it structure and meaning."
          },
          {
            id: 7,
            question: "Which element sets the title that appears in the browser tab?",
            options: ["<h1>", "<title>", "<header>", "<name>"],
            correctAnswer: 1,
            explanation: "The <title> element, placed inside the <head>, sets the title that appears in the browser tab."
          },
          {
            id: 8,
            question: "Is HTML a programming language?",
            options: ["Yes, it's a programming language", "No, it's a markup language", "Sometimes", "Only on weekends"],
            correctAnswer: 1,
            explanation: "HTML is a markup language, not a programming language. It describes the structure and content of web pages."
          },
          {
            id: 9,
            question: "What attribute should you include in the <html> tag for accessibility?",
            options: ["id", "class", "lang", "style"],
            correctAnswer: 2,
            explanation: "The 'lang' attribute specifies the language of the document, which helps screen readers and search engines."
          },
          {
            id: 10,
            question: "What makes HTML universal?",
            options: ["It only works on computers", "It works on all devices and browsers", "It only works with images", "It needs special software"],
            correctAnswer: 1,
            explanation: "HTML is universal because it works on all devices and browsers, making websites accessible everywhere."
          }
        ],
        practiceTask: "Create your first HTML page with a proper document structure, including a title 'My Digital Art Journey' and a welcome message in the body.",
        difficulty: "Beginner"
      },
      {
        id: 2,
        title: "HTML Tags - Building Blocks",
        description: "Learn about HTML tags and how they work like containers for content",
        duration: "35 minutes",
        content: `
          <h2>HTML Tags - Your Building Blocks!</h2>
          <p>HTML tags are like special containers that tell the computer what type of content you want to show. Think of them like different shaped boxes!</p>
          
          <h3>What are HTML Tags?</h3>
          <p>Tags are like labels that wrap around your content. They always come in pairs:</p>
          <ul>
            <li>🏷️ Opening tag: &lt;h1&gt;</li>
            <li>🏷️ Closing tag: &lt;/h1&gt;</li>
            <li>📝 Content goes between them: &lt;h1&gt;My Title&lt;/h1&gt;</li>
          </ul>
          
          <h3>Basic HTML Tags You'll Use:</h3>
          <ul>
            <li><strong>&lt;h1&gt;</strong> - Big titles (like chapter names)</li>
            <li><strong>&lt;p&gt;</strong> - Paragraphs (regular text)</li>
            <li><strong>&lt;strong&gt;</strong> - Bold text</li>
            <li><strong>&lt;br&gt;</strong> - Line break (moves to next line)</li>
          </ul>
          
          <h3>Remember the Rules:</h3>
          <p>1. Every opening tag needs a closing tag<br>
          2. Tags go around the content they describe<br>
          3. Be careful with spelling!</p>
        `,
        learningObjectives: [
          "Understand what HTML tags are and how they work",
          "Learn basic HTML tag structure with opening and closing tags",
          "Practice using heading and paragraph tags",
          "Apply proper HTML syntax rules"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Learning HTML Tags</title>
</head>
<body>
    <h1>My Favorite Animal</h1>
    <p>My favorite animal is a <strong>lion</strong> because they are brave and strong!</p>
    <p>Lions live in Africa and they have big manes.</p>
    <br>
    <p>What's your favorite animal?</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What are HTML tags like?",
            options: ["Containers or boxes", "Pencils", "Erasers", "Books"],
            correctAnswer: 0,
            explanation: "HTML tags are like containers that hold and describe different types of content."
          },
          {
            id: 2,
            question: "How many parts does an HTML tag have?",
            options: ["One", "Two (opening and closing)", "Three", "Four"],
            correctAnswer: 1,
            explanation: "HTML tags come in pairs: an opening tag and a closing tag that wraps around content."
          },
          {
            id: 3,
            question: "What does the &lt;h1&gt; tag do?",
            options: ["Makes small text", "Makes big titles", "Adds pictures", "Changes colors"],
            correctAnswer: 1,
            explanation: "The &lt;h1&gt; tag creates large titles or headings on a webpage."
          },
          {
            id: 4,
            question: "What does the &lt;p&gt; tag do?",
            options: ["Makes paragraphs", "Adds music", "Creates games", "Changes fonts"],
            correctAnswer: 0,
            explanation: "The &lt;p&gt; tag creates paragraphs of regular text."
          },
          {
            id: 5,
            question: "What makes text bold?",
            options: ["&lt;big&gt;", "&lt;strong&gt;", "&lt;small&gt;", "&lt;thin&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;strong&gt; tag makes text appear bold and emphasizes its importance."
          },
          {
            id: 6,
            question: "What does &lt;br&gt; do?",
            options: ["Makes text blue", "Creates a line break", "Adds borders", "Makes text bigger"],
            correctAnswer: 1,
            explanation: "The &lt;br&gt; tag creates a line break, moving content to the next line."
          },
          {
            id: 7,
            question: "Do all HTML tags need a closing tag?",
            options: ["Yes, most do", "No, never", "Only on Mondays", "Only big ones"],
            correctAnswer: 0,
            explanation: "Most HTML tags need both opening and closing tags, with a few exceptions like &lt;br&gt;."
          },
          {
            id: 8,
            question: "Where does content go in HTML tags?",
            options: ["Before the tags", "Between opening and closing tags", "After the tags", "Outside the tags"],
            correctAnswer: 1,
            explanation: "Content goes between the opening tag and closing tag."
          },
          {
            id: 9,
            question: "What happens if you misspell an HTML tag?",
            options: ["It works perfectly", "It might not work correctly", "The computer explodes", "Nothing happens"],
            correctAnswer: 1,
            explanation: "Misspelled HTML tags might not work correctly, so it's important to spell them properly."
          },
          {
            id: 10,
            question: "Which is correct HTML?",
            options: ["&lt;h1&gt;Title", "Title&lt;/h1&gt;", "&lt;h1&gt;Title&lt;/h1&gt;", "&lt;/h1&gt;Title&lt;h1&gt;"],
            correctAnswer: 2,
            explanation: "Correct HTML has the opening tag, then content, then the closing tag: &lt;h1&gt;Title&lt;/h1&gt;"
          }
        ],
        practiceTask: "Create a webpage about your favorite hobby using h1 for the title, p for descriptions, and strong for important words.",
        difficulty: "Beginner"
      },
      // Add 8 more lessons for this course...
      {
        id: 3,
        title: "Adding Pictures to Your Website",
        description: "Learn how to add images to make your websites colorful and fun",
        duration: "40 minutes",
        content: `
          <h2>Making Your Website Colorful with Pictures!</h2>
          <p>Pictures make websites fun and interesting! Today you'll learn how to add images to your webpages.</p>
          
          <h3>The Image Tag: &lt;img&gt;</h3>
          <p>The &lt;img&gt; tag is special because it doesn't need a closing tag. It's like a picture frame that shows an image!</p>
          
          <h3>Parts of an Image Tag:</h3>
          <ul>
            <li><strong>src</strong> - tells where to find the picture</li>
            <li><strong>alt</strong> - describes the picture for people who can't see it</li>
            <li><strong>width</strong> - how wide the picture should be</li>
            <li><strong>height</strong> - how tall the picture should be</li>
          </ul>
          
          <h3>Example:</h3>
          <p>&lt;img src="cat.jpg" alt="A cute orange cat" width="200" height="150"&gt;</p>
          
          <h3>Where to Find Pictures:</h3>
          <p>You can use pictures from your computer or from the internet (with permission!).</p>
        `,
        learningObjectives: [
          "Learn to use the &lt;img&gt; tag to add images",
          "Understand image attributes like src, alt, width, and height",
          "Practice adding descriptive alt text for accessibility",
          "Create visually appealing webpages with images"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Pet Gallery</title>
</head>
<body>
    <h1>My Amazing Pets</h1>
    <p>Here are pictures of my favorite animals!</p>
    
    <h2>My Dog Buddy</h2>
    <img src="dog.jpg" alt="A golden retriever playing in the park" width="300" height="200">
    <p>Buddy loves to play fetch and swim in the lake!</p>
    
    <h2>My Cat Whiskers</h2>
    <img src="cat.jpg" alt="A gray cat sleeping on a sunny windowsill" width="250" height="200">
    <p>Whiskers likes to nap in warm, sunny spots.</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What tag is used to add pictures?",
            options: ["&lt;picture&gt;", "&lt;img&gt;", "&lt;photo&gt;", "&lt;image&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;img&gt; tag is used to add images to webpages."
          },
          {
            id: 2,
            question: "Does the &lt;img&gt; tag need a closing tag?",
            options: ["Yes, always", "No, it's self-closing", "Sometimes", "Only for big pictures"],
            correctAnswer: 1,
            explanation: "The &lt;img&gt; tag is self-closing and doesn't need a closing tag."
          },
          {
            id: 3,
            question: "What does 'src' mean in an image tag?",
            options: ["Source - where to find the picture", "Size of the picture", "Color of the picture", "Name of the picture"],
            correctAnswer: 0,
            explanation: "'src' stands for source and tells the browser where to find the image file."
          },
          {
            id: 4,
            question: "What is 'alt' text for?",
            options: ["Making pictures bigger", "Describing the picture", "Changing picture colors", "Adding borders"],
            correctAnswer: 1,
            explanation: "Alt text describes the image for people who can't see it or when the image doesn't load."
          },
          {
            id: 5,
            question: "How do you make a picture smaller?",
            options: ["Use smaller width and height", "Use bigger numbers", "Add more alt text", "Use different src"],
            correctAnswer: 0,
            explanation: "You can control image size using the width and height attributes with smaller numbers."
          },
          {
            id: 6,
            question: "What makes a good alt text?",
            options: ["Very long descriptions", "Short, clear descriptions", "The file name", "Random words"],
            correctAnswer: 1,
            explanation: "Good alt text is short and clearly describes what's in the image."
          },
          {
            id: 7,
            question: "Can you add multiple pictures to one webpage?",
            options: ["No, only one", "Yes, as many as you want", "Only two", "Only on weekends"],
            correctAnswer: 1,
            explanation: "You can add as many images as you want to a single webpage."
          },
          {
            id: 8,
            question: "What happens if the image file is missing?",
            options: ["The alt text shows instead", "The page breaks", "Nothing happens", "The computer crashes"],
            correctAnswer: 0,
            explanation: "If an image can't load, the alt text is displayed instead."
          },
          {
            id: 9,
            question: "Which is a correct image tag?",
            options: ["&lt;img&gt;picture.jpg&lt;/img&gt;", "&lt;img src='picture.jpg' alt='A picture'&gt;", "&lt;image source='picture.jpg'&gt;", "&lt;photo file='picture.jpg'&gt;"],
            correctAnswer: 1,
            explanation: "The correct format uses src for the file path and alt for description."
          },
          {
            id: 10,
            question: "Why are pictures important on websites?",
            options: ["They take up space", "They make websites more interesting and fun", "They slow things down", "They're required by law"],
            correctAnswer: 1,
            explanation: "Pictures make websites more visually appealing, interesting, and engaging for visitors."
          }
        ],
        practiceTask: "Create a webpage about your favorite foods with at least 3 images, each with proper alt text and good sizes.",
        difficulty: "Beginner"
      },
      {
        id: 4,
        title: "Text Formatting and Typography",
        description: "Learn to style text beautifully with different fonts, sizes, and emphasis",
        duration: "40 minutes",
        content: `
          <h2>Making Text Beautiful and Readable</h2>
          <p>Typography is the art of making text look beautiful and easy to read. HTML gives us many tools to format text in different ways!</p>
          
          <h3>Text Formatting Tags</h3>
          <ul>
            <li><strong>&lt;strong&gt;</strong> or <strong>&lt;b&gt;</strong> - Makes text bold and important</li>
            <li><strong>&lt;em&gt;</strong> or <strong>&lt;i&gt;</strong> - Makes text italic and emphasized</li>
            <li><strong>&lt;u&gt;</strong> - Underlines text</li>
            <li><strong>&lt;mark&gt;</strong> - Highlights text like a marker</li>
            <li><strong>&lt;small&gt;</strong> - Makes text smaller</li>
            <li><strong>&lt;big&gt;</strong> - Makes text bigger</li>
          </ul>
          
          <h3>Headings Hierarchy</h3>
          <p>HTML has 6 levels of headings from h1 (biggest) to h6 (smallest). Use them to organize your content!</p>
          
          <h3>Special Characters</h3>
          <p>You can add special symbols and characters to make your text more interesting and expressive.</p>
        `,
        learningObjectives: [
          "Master various text formatting tags in HTML",
          "Understand heading hierarchy and proper usage",
          "Create visually organized and readable content",
          "Apply emphasis and importance to text appropriately"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>Beautiful Text Formatting</title>
</head>
<body>
    <h1>My Adventure Story</h1>
    <h2>Chapter 1: The Beginning</h2>
    
    <p>Once upon a time, there was a <strong>brave explorer</strong> named Alex.</p>
    <p>Alex loved to <em>discover new places</em> and meet <u>interesting people</u>.</p>
    
    <h3>What Alex Found:</h3>
    <ul>
        <li><mark>Golden treasures</mark> buried under old trees</li>
        <li><strong>Ancient maps</strong> with mysterious symbols</li>
        <li><em>Friendly animals</em> who became loyal companions</li>
    </ul>
    
    <h4>Important Note:</h4>
    <p><small>This story is a work of fiction and imagination.</small></p>
    
    <h2>Chapter 2: The Journey Continues...</h2>
    <p>Alex's journey was just beginning! 🌟</p>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "Which tag makes text bold and indicates importance?",
            options: ["&lt;bold&gt;", "&lt;strong&gt;", "&lt;big&gt;", "&lt;thick&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;strong&gt; tag makes text bold and indicates that the content is important."
          },
          {
            id: 2,
            question: "What does the &lt;em&gt; tag do?",
            options: ["Makes text bigger", "Makes text italic and emphasized", "Changes text color", "Deletes text"],
            correctAnswer: 1,
            explanation: "The &lt;em&gt; tag makes text italic and adds emphasis to show importance."
          },
          {
            id: 3,
            question: "Which heading tag creates the biggest heading?",
            options: ["&lt;h6&gt;", "&lt;h3&gt;", "&lt;h1&gt;", "&lt;h5&gt;"],
            correctAnswer: 2,
            explanation: "&lt;h1&gt; creates the biggest heading and should be used for main titles."
          },
          {
            id: 4,
            question: "What does the &lt;mark&gt; tag do?",
            options: ["Deletes text", "Highlights text like a marker", "Makes text invisible", "Changes font"],
            correctAnswer: 1,
            explanation: "The &lt;mark&gt; tag highlights text with a background color, like using a highlighter marker."
          },
          {
            id: 5,
            question: "How many heading levels does HTML have?",
            options: ["3 levels", "6 levels (h1 to h6)", "10 levels", "No limit"],
            correctAnswer: 1,
            explanation: "HTML has 6 heading levels from h1 (largest) to h6 (smallest)."
          },
          {
            id: 6,
            question: "What's the difference between &lt;strong&gt; and &lt;b&gt;?",
            options: ["No difference", "&lt;strong&gt; shows importance, &lt;b&gt; just makes bold", "They do opposite things", "&lt;b&gt; is newer"],
            correctAnswer: 1,
            explanation: "&lt;strong&gt; indicates importance and makes text bold, while &lt;b&gt; just makes text bold without semantic meaning."
          },
          {
            id: 7,
            question: "Which tag underlines text?",
            options: ["&lt;line&gt;", "&lt;under&gt;", "&lt;u&gt;", "&lt;underline&gt;"],
            correctAnswer: 2,
            explanation: "The &lt;u&gt; tag underlines text, though it's less commonly used in modern web design."
          },
          {
            id: 8,
            question: "What makes text smaller?",
            options: ["&lt;tiny&gt;", "&lt;small&gt;", "&lt;mini&gt;", "&lt;little&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;small&gt; tag makes text appear smaller than the normal text size."
          },
          {
            id: 9,
            question: "Why should you use heading tags properly?",
            options: ["They're required by law", "They help organize content and improve accessibility", "They make pages load faster", "They add colors"],
            correctAnswer: 1,
            explanation: "Proper heading usage organizes content hierarchically and helps screen readers and search engines understand page structure."
          },
          {
            id: 10,
            question: "Can you combine formatting tags?",
            options: ["No, never", "Yes, you can nest them properly", "Only on Tuesdays", "Only two at a time"],
            correctAnswer: 1,
            explanation: "You can combine formatting tags by nesting them properly, like &lt;strong&gt;&lt;em&gt;bold and italic&lt;/em&gt;&lt;/strong&gt;."
          }
        ],
        practiceTask: "Create a story webpage using all heading levels (h1-h6) and at least 5 different text formatting tags to make it visually interesting.",
        difficulty: "Beginner"
      },
      {
        id: 5,
        title: "Creating Lists and Organization",
        description: "Learn to organize information with ordered and unordered lists",
        duration: "35 minutes",
        content: `
          <h2>Organizing Information with Lists</h2>
          <p>Lists help organize information in a clear, easy-to-read way. They're perfect for showing steps, items, or any group of related things!</p>
          
          <h3>Types of Lists in HTML</h3>
          <ul>
            <li><strong>Unordered Lists (&lt;ul&gt;)</strong> - Bullet points for items in no particular order</li>
            <li><strong>Ordered Lists (&lt;ol&gt;)</strong> - Numbered lists for steps or ranked items</li>
            <li><strong>List Items (&lt;li&gt;)</strong> - Individual items within any list</li>
          </ul>
          
          <h3>When to Use Each Type</h3>
          <p><strong>Unordered Lists:</strong> Shopping lists, features, menu items<br>
          <strong>Ordered Lists:</strong> Instructions, rankings, step-by-step processes</p>
          
          <h3>Nested Lists</h3>
          <p>You can put lists inside other lists to create sub-categories and organize complex information!</p>
        `,
        learningObjectives: [
          "Create and use unordered lists with bullet points",
          "Create and use ordered lists with numbers",
          "Understand when to use each type of list",
          "Create nested lists for complex organization"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Organized Lists</title>
</head>
<body>
    <h1>My Favorite Things</h1>
    
    <h2>My Favorite Foods (No particular order)</h2>
    <ul>
        <li>Pizza with cheese and pepperoni</li>
        <li>Chocolate chip cookies</li>
        <li>Fresh strawberries</li>
        <li>Homemade ice cream</li>
    </ul>
    
    <h2>How to Make a Peanut Butter Sandwich</h2>
    <ol>
        <li>Get two slices of bread</li>
        <li>Open the peanut butter jar</li>
        <li>Spread peanut butter on one slice</li>
        <li>Add jelly if desired</li>
        <li>Put the slices together</li>
        <li>Enjoy your sandwich!</li>
    </ol>
    
    <h2>My School Subjects</h2>
    <ul>
        <li>Math
            <ul>
                <li>Addition and subtraction</li>
                <li>Multiplication tables</li>
                <li>Geometry shapes</li>
            </ul>
        </li>
        <li>Science
            <ul>
                <li>Animals and plants</li>
                <li>Weather patterns</li>
                <li>Space and planets</li>
            </ul>
        </li>
    </ul>
</body>
</html>`,
          css: "",
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What tag creates an unordered list?",
            options: ["&lt;ol&gt;", "&lt;ul&gt;", "&lt;list&gt;", "&lt;bullets&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;ul&gt; tag creates an unordered list with bullet points."
          },
          {
            id: 2,
            question: "What tag creates an ordered list?",
            options: ["&lt;ol&gt;", "&lt;ul&gt;", "&lt;order&gt;", "&lt;numbers&gt;"],
            correctAnswer: 0,
            explanation: "The &lt;ol&gt; tag creates an ordered list with numbers."
          },
          {
            id: 3,
            question: "What tag do you use for each item in a list?",
            options: ["&lt;item&gt;", "&lt;li&gt;", "&lt;point&gt;", "&lt;entry&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;li&gt; tag is used for each individual item in both ordered and unordered lists."
          },
          {
            id: 4,
            question: "When should you use an ordered list?",
            options: ["For random items", "For step-by-step instructions", "Never", "Only for colors"],
            correctAnswer: 1,
            explanation: "Ordered lists are perfect for step-by-step instructions, rankings, or any sequence where order matters."
          },
          {
            id: 5,
            question: "When should you use an unordered list?",
            options: ["For cooking steps", "For items where order doesn't matter", "For counting", "For dates"],
            correctAnswer: 1,
            explanation: "Unordered lists are great for items where the order doesn't matter, like shopping lists or features."
          },
          {
            id: 6,
            question: "Can you put a list inside another list?",
            options: ["No, it's impossible", "Yes, they're called nested lists", "Only sometimes", "Only on weekends"],
            correctAnswer: 1,
            explanation: "Yes! You can create nested lists by putting one list inside a list item of another list."
          },
          {
            id: 7,
            question: "What appears before items in an unordered list?",
            options: ["Numbers", "Bullet points", "Letters", "Nothing"],
            correctAnswer: 1,
            explanation: "Unordered lists display bullet points (•) before each list item by default."
          },
          {
            id: 8,
            question: "What appears before items in an ordered list?",
            options: ["Bullet points", "Numbers", "Stars", "Colors"],
            correctAnswer: 1,
            explanation: "Ordered lists display numbers (1, 2, 3...) before each list item by default."
          },
          {
            id: 9,
            question: "Which list type would you use for a recipe?",
            options: ["Unordered list", "Ordered list", "No list needed", "Both are wrong"],
            correctAnswer: 1,
            explanation: "An ordered list is perfect for recipes because the steps need to be followed in a specific order."
          },
          {
            id: 10,
            question: "What makes lists useful on websites?",
            options: ["They use less space", "They organize information clearly", "They add colors", "They make sounds"],
            correctAnswer: 1,
            explanation: "Lists organize information in a clear, scannable format that makes content easier to read and understand."
          }
        ],
        practiceTask: "Create a webpage about your daily routine using an ordered list for morning activities and an unordered list for your favorite hobbies.",
        difficulty: "Beginner"
      },
      {
        id: 6,
        title: "Creating Links and Navigation",
        description: "Learn to connect web pages and create navigation with hyperlinks",
        duration: "45 minutes",
        content: `
          <h2>Connecting the Web with Links</h2>
          <p>Links are what make the World Wide Web a "web"! They connect pages together and let users navigate between different websites and content.</p>
          
          <h3>The Anchor Tag: &lt;a&gt;</h3>
          <p>The &lt;a&gt; tag creates links. The 'href' attribute tells the browser where to go when someone clicks the link.</p>
          
          <h3>Types of Links</h3>
          <ul>
            <li><strong>External Links</strong> - Go to other websites</li>
            <li><strong>Internal Links</strong> - Go to other pages on your site</li>
            <li><strong>Email Links</strong> - Open email to send someone a message</li>
            <li><strong>Section Links</strong> - Jump to different parts of the same page</li>
          </ul>
          
          <h3>Link Attributes</h3>
          <ul>
            <li><strong>href</strong> - Where the link goes</li>
            <li><strong>target</strong> - How the link opens (same window or new window)</li>
            <li><strong>title</strong> - Tooltip text that appears when you hover</li>
          </ul>
          
          <h3>Making Good Links</h3>
          <p>Good links have descriptive text that tells users where they're going. Avoid "click here" - instead use meaningful descriptions!</p>
        `,
        learningObjectives: [
          "Create external links to other websites",
          "Create internal links between your own pages",
          "Use proper link attributes and accessibility practices",
          "Build basic navigation menus"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Links and Navigation</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    
    <nav>
        <h2>Navigation Menu</h2>
        <ul>
            <li><a href="#about">About Me</a></li>
            <li><a href="#hobbies">My Hobbies</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    
    <section id="about">
        <h2>About Me</h2>
        <p>Hi! I'm learning web development and I love creating websites.</p>
        <p>Check out <a href="https://www.google.com" target="_blank" title="Search on Google">Google</a> for more information about anything!</p>
    </section>
    
    <section id="hobbies">
        <h2>My Hobbies</h2>
        <ul>
            <li>Reading books - visit <a href="https://www.goodreads.com" target="_blank">Goodreads</a></li>
            <li>Playing soccer</li>
            <li>Learning to code</li>
        </ul>
    </section>
    
    <section id="contact">
        <h2>Contact Me</h2>
        <p>Send me an email: <a href="mailto:student@school.com">student@school.com</a></p>
        <p><a href="#top">Back to top</a></p>
    </section>
</body>
</html>`,
          css: `nav {
    background-color: #f0f0f0;
    padding: 20px;
    border-radius: 10px;
}

nav ul {
    list-style-type: none;
    padding: 0;
}

nav li {
    display: inline;
    margin-right: 20px;
}

a {
    color: #0066cc;
    text-decoration: none;
    font-weight: bold;
}

a:hover {
    color: #004499;
    text-decoration: underline;
}`,
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What tag creates links in HTML?",
            options: ["&lt;link&gt;", "&lt;a&gt;", "&lt;url&gt;", "&lt;href&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;a&gt; (anchor) tag is used to create links in HTML."
          },
          {
            id: 2,
            question: "What attribute tells the browser where a link should go?",
            options: ["src", "href", "link", "url"],
            correctAnswer: 1,
            explanation: "The 'href' attribute specifies the destination URL or location of the link."
          },
          {
            id: 3,
            question: "How do you make a link open in a new window?",
            options: ["target='_new'", "target='_blank'", "new='true'", "window='new'"],
            correctAnswer: 1,
            explanation: "Using target='_blank' makes a link open in a new browser window or tab."
          },
          {
            id: 4,
            question: "What type of link would 'https://www.google.com' be?",
            options: ["Internal link", "External link", "Email link", "Broken link"],
            correctAnswer: 1,
            explanation: "This is an external link because it goes to a different website (Google)."
          },
          {
            id: 5,
            question: "How do you create an email link?",
            options: ["href='email@example.com'", "href='mailto:email@example.com'", "src='email@example.com'", "email='email@example.com'"],
            correctAnswer: 1,
            explanation: "Email links use 'mailto:' followed by the email address in the href attribute."
          },
          {
            id: 6,
            question: "What does a link to '#about' do?",
            options: ["Goes to another website", "Jumps to a section with id='about' on the same page", "Sends an email", "Downloads a file"],
            correctAnswer: 1,
            explanation: "Links starting with # jump to elements with matching id attributes on the same page."
          },
          {
            id: 7,
            question: "What makes a good link text?",
            options: ["'Click here'", "'Link'", "Descriptive text about the destination", "'Press this'"],
            correctAnswer: 2,
            explanation: "Good link text describes where the link goes or what it does, helping users understand the destination."
          },
          {
            id: 8,
            question: "What is the title attribute used for in links?",
            options: ["To make links bigger", "To show tooltip text on hover", "To change link colors", "To make links bold"],
            correctAnswer: 1,
            explanation: "The title attribute provides tooltip text that appears when users hover over the link."
          },
          {
            id: 9,
            question: "Can you style links with CSS?",
            options: ["No, links can't be styled", "Yes, you can change colors, fonts, and more", "Only the color", "Only the size"],
            correctAnswer: 1,
            explanation: "CSS can style links extensively - colors, fonts, sizes, hover effects, and much more."
          },
          {
            id: 10,
            question: "Why are links important for websites?",
            options: ["They make sites load faster", "They connect pages and create navigation", "They add animations", "They're not important"],
            correctAnswer: 1,
            explanation: "Links are essential for navigation and connecting different pages, making the web truly interconnected."
          }
        ],
        practiceTask: "Create a simple website with 3 pages connected by navigation links, including one external link to your favorite educational website.",
        difficulty: "Beginner"
      },
      {
        id: 7,
        title: "Tables for Data Organization",
        description: "Learn to create and format tables to display organized data",
        duration: "40 minutes",
        content: `
          <h2>Organizing Data with Tables</h2>
          <p>Tables are perfect for organizing data in rows and columns, like showing schedules, scores, or any information that needs to be compared side by side.</p>
          
          <h3>Table Structure</h3>
          <ul>
            <li><strong>&lt;table&gt;</strong> - The main container for the entire table</li>
            <li><strong>&lt;tr&gt;</strong> - Table row</li>
            <li><strong>&lt;th&gt;</strong> - Table header (column titles)</li>
            <li><strong>&lt;td&gt;</strong> - Table data (individual cells)</li>
            <li><strong>&lt;thead&gt;</strong> - Groups header content</li>
            <li><strong>&lt;tbody&gt;</strong> - Groups body content</li>
          </ul>
          
          <h3>When to Use Tables</h3>
          <p>Tables are great for:</p>
          <ul>
            <li>📊 Displaying data and statistics</li>
            <li>📅 Creating schedules and calendars</li>
            <li>📋 Comparing features or prices</li>
            <li>📈 Showing scores or rankings</li>
          </ul>
          
          <h3>Table Accessibility</h3>
          <p>Always use &lt;th&gt; tags for headers and meaningful captions to make tables accessible to everyone!</p>
        `,
        learningObjectives: [
          "Create well-structured HTML tables",
          "Use proper table headers and organization",
          "Apply basic table styling and formatting",
          "Understand when tables are appropriate to use"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My School Data Tables</title>
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #4CAF50;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>My School Information</h1>
    
    <h2>Class Schedule</h2>
    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>9:00 AM</td>
                <td>Math</td>
                <td>Science</td>
                <td>English</td>
                <td>Math</td>
                <td>Art</td>
            </tr>
            <tr>
                <td>10:00 AM</td>
                <td>English</td>
                <td>Math</td>
                <td>Science</td>
                <td>English</td>
                <td>Music</td>
            </tr>
            <tr>
                <td>11:00 AM</td>
                <td>Science</td>
                <td>Art</td>
                <td>Math</td>
                <td>PE</td>
                <td>Science</td>
            </tr>
        </tbody>
    </table>
    
    <h2>Test Scores</h2>
    <table>
        <thead>
            <tr>
                <th>Subject</th>
                <th>Test 1</th>
                <th>Test 2</th>
                <th>Average</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Math</td>
                <td>85</td>
                <td>92</td>
                <td>88.5</td>
            </tr>
            <tr>
                <td>Science</td>
                <td>78</td>
                <td>84</td>
                <td>81</td>
            </tr>
            <tr>
                <td>English</td>
                <td>91</td>
                <td>89</td>
                <td>90</td>
            </tr>
        </tbody>
    </table>
</body>
</html>`,
          css: `table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

th {
    background-color: #4CAF50;
    color: white;
    font-weight: bold;
}

tr:nth-child(even) {
    background-color: #f9f9f9;
}

tr:hover {
    background-color: #f0f0f0;
}

caption {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 10px;
}`,
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What tag creates the main table container?",
            options: ["&lt;table&gt;", "&lt;data&gt;", "&lt;grid&gt;", "&lt;chart&gt;"],
            correctAnswer: 0,
            explanation: "The &lt;table&gt; tag is the main container that holds all table content."
          },
          {
            id: 2,
            question: "What tag creates a table row?",
            options: ["&lt;row&gt;", "&lt;tr&gt;", "&lt;line&gt;", "&lt;horizontal&gt;"],
            correctAnswer: 1,
            explanation: "The &lt;tr&gt; (table row) tag creates horizontal rows in a table."
          },
          {
            id: 3,
            question: "What's the difference between &lt;th&gt; and &lt;td&gt;?",
            options: ["No difference", "&lt;th&gt; is for headers, &lt;td&gt; is for data", "Size only", "Color only"],
            correctAnswer: 1,
            explanation: "&lt;th&gt; creates header cells (bold and centered), while &lt;td&gt; creates regular data cells."
          },
          {
            id: 4,
            question: "What does &lt;thead&gt; do?",
            options: ["Makes text bigger", "Groups header rows together", "Changes colors", "Adds borders"],
            correctAnswer: 1,
            explanation: "&lt;thead&gt; semantically groups the header rows of a table for better organization and accessibility."
          },
          {
            id: 5,
            question: "When should you use tables?",
            options: ["For page layout", "For organizing tabular data", "For making text bigger", "Never"],
            correctAnswer: 1,
            explanation: "Tables should be used for organizing tabular data like schedules, scores, or comparisons - not for layout."
          },
          {
            id: 6,
            question: "What CSS property removes space between table borders?",
            options: ["border-spacing: 0", "border-collapse: collapse", "border-remove: true", "border-style: none"],
            correctAnswer: 1,
            explanation: "border-collapse: collapse removes the space between table cell borders for a cleaner look."
          },
          {
            id: 7,
            question: "How can you make alternating row colors?",
            options: ["tr:odd and tr:even selectors", "tr:nth-child(odd) and tr:nth-child(even)", "Both A and B", "It's impossible"],
            correctAnswer: 2,
            explanation: "Both :nth-child(odd/even) and :odd/:even pseudo-selectors can create alternating row colors."
          },
          {
            id: 8,
            question: "What makes tables accessible?",
            options: ["Using &lt;th&gt; for headers", "Adding meaningful captions", "Proper table structure", "All of the above"],
            correctAnswer: 3,
            explanation: "Accessibility requires proper headers, captions, structure, and semantic markup for screen readers."
          },
          {
            id: 9,
            question: "What does &lt;tbody&gt; do?",
            options: ["Makes text bold", "Groups body content rows", "Changes font size", "Adds colors"],
            correctAnswer: 1,
            explanation: "&lt;tbody&gt; semantically groups the main content rows of a table, separate from headers."
          },
          {
            id: 10,
            question: "Can tables be responsive?",
            options: ["No, tables are always fixed", "Yes, with CSS techniques", "Only on mobile", "Only small tables"],
            correctAnswer: 1,
            explanation: "Tables can be made responsive using CSS techniques like overflow scrolling, responsive design patterns, and media queries."
          }
        ],
        practiceTask: "Create a table showing your weekly chore schedule or favorite movies with ratings, using proper headers and styling.",
        difficulty: "Beginner"
      },
      {
        id: 8,
        title: "HTML Forms and User Input",
        description: "Learn to create interactive forms to collect user information",
        duration: "50 minutes",
        content: `
          <h2>Interactive Forms - Getting User Input</h2>
          <p>Forms let users interact with your website by typing information, making choices, and submitting data. They're essential for contact pages, surveys, and interactive features!</p>
          
          <h3>Form Elements</h3>
          <ul>
            <li><strong>&lt;form&gt;</strong> - Container for all form elements</li>
            <li><strong>&lt;input&gt;</strong> - Various input types (text, email, password, etc.)</li>
            <li><strong>&lt;textarea&gt;</strong> - Multi-line text input</li>
            <li><strong>&lt;select&gt;</strong> - Dropdown menus</li>
            <li><strong>&lt;button&gt;</strong> - Submit buttons and actions</li>
            <li><strong>&lt;label&gt;</strong> - Descriptions for form fields</li>
          </ul>
          
          <h3>Input Types</h3>
          <ul>
            <li><strong>text</strong> - Regular text input</li>
            <li><strong>email</strong> - Email address validation</li>
            <li><strong>password</strong> - Hidden text for passwords</li>
            <li><strong>number</strong> - Numeric input</li>
            <li><strong>date</strong> - Date picker</li>
            <li><strong>checkbox</strong> - Multiple selections</li>
            <li><strong>radio</strong> - Single selection from options</li>
          </ul>
          
          <h3>Form Accessibility</h3>
          <p>Always use labels with your inputs to make forms accessible and user-friendly!</p>
        `,
        learningObjectives: [
          "Create various types of form inputs",
          "Use labels and proper form structure",
          "Understand different input types and their purposes",
          "Build user-friendly and accessible forms"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Interactive Forms</title>
    <style>
        form {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        
        label {
            display: block;
            margin-top: 15px;
            font-weight: bold;
            color: #333;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 10px;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        button {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
            cursor: pointer;
        }
        
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <h1>Student Information Form</h1>
    
    <form>
        <h2>Tell Us About Yourself!</h2>
        
        <label for="name">Your Name:</label>
        <input type="text" id="name" name="name" required>
        
        <label for="email">Email Address:</label>
        <input type="email" id="email" name="email" required>
        
        <label for="age">Your Age:</label>
        <input type="number" id="age" name="age" min="5" max="18">
        
        <label for="grade">Your Grade:</label>
        <select id="grade" name="grade">
            <option value="">Choose your grade</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
        </select>
        
        <label>Favorite Subjects (check all that apply):</label>
        <input type="checkbox" id="math" name="subjects" value="math">
        <label for="math">Math</label><br>
        
        <input type="checkbox" id="science" name="subjects" value="science">
        <label for="science">Science</label><br>
        
        <input type="checkbox" id="art" name="subjects" value="art">
        <label for="art">Art</label><br>
        
        <label>How do you learn best?</label>
        <input type="radio" id="visual" name="learning" value="visual">
        <label for="visual">Visual (pictures and diagrams)</label><br>
        
        <input type="radio" id="auditory" name="learning" value="auditory">
        <label for="auditory">Auditory (listening)</label><br>
        
        <input type="radio" id="hands-on" name="learning" value="hands-on">
        <label for="hands-on">Hands-on (doing activities)</label><br>
        
        <label for="message">Tell us about your goals:</label>
        <textarea id="message" name="message" rows="4" placeholder="What do you want to learn or achieve?"></textarea>
        
        <button type="submit">Submit Information</button>
    </form>
</body>
</html>`,
          css: `form {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    border: 2px solid #4CAF50;
    border-radius: 10px;
    background-color: #f9f9f9;
    font-family: Arial, sans-serif;
}

label {
    display: block;
    margin-top: 15px;
    font-weight: bold;
    color: #333;
}

input[type="text"], 
input[type="email"], 
input[type="number"], 
textarea, 
select {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
    box-sizing: border-box;
}

input[type="checkbox"], 
input[type="radio"] {
    width: auto;
    margin-right: 8px;
}

button {
    background-color: #4CAF50;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    margin-top: 20px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #45a049;
}`,
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What tag creates the main form container?",
            options: ["&lt;form&gt;", "&lt;input&gt;", "&lt;field&gt;", "&lt;survey&gt;"],
            correctAnswer: 0,
            explanation: "The &lt;form&gt; tag is the main container that holds all form elements."
          },
          {
            id: 2,
            question: "What input type is best for email addresses?",
            options: ["type='text'", "type='email'", "type='mail'", "type='address'"],
            correctAnswer: 1,
            explanation: "type='email' provides built-in email validation and shows appropriate keyboards on mobile devices."
          },
          {
            id: 3,
            question: "What's the purpose of the &lt;label&gt; tag?",
            options: ["To style inputs", "To describe what an input is for", "To make inputs bigger", "To add colors"],
            correctAnswer: 1,
            explanation: "Labels describe what each input field is for, improving accessibility and user experience."
          },
          {
            id: 4,
            question: "When would you use a checkbox input?",
            options: ["For single selections", "For multiple selections", "For passwords", "For dates"],
            correctAnswer: 1,
            explanation: "Checkboxes allow users to select multiple options from a list."
          },
          {
            id: 5,
            question: "When would you use radio buttons?",
            options: ["For multiple selections", "For single selection from options", "For text input", "For file uploads"],
            correctAnswer: 1,
            explanation: "Radio buttons allow users to select only one option from a group of choices."
          },
          {
            id: 6,
            question: "What does the 'required' attribute do?",
            options: ["Makes text bigger", "Makes the field mandatory", "Changes colors", "Adds borders"],
            correctAnswer: 1,
            explanation: "The 'required' attribute makes a field mandatory - users must fill it out before submitting."
          },
          {
            id: 7,
            question: "What tag creates multi-line text input?",
            options: ["&lt;input type='text'&gt;", "&lt;textarea&gt;", "&lt;multitext&gt;", "&lt;bigtext&gt;"],
            correctAnswer: 1,
            explanation: "&lt;textarea&gt; creates a multi-line text input area for longer text entries."
          },
          {
            id: 8,
            question: "What creates a dropdown menu?",
            options: ["&lt;dropdown&gt;", "&lt;menu&gt;", "&lt;select&gt;", "&lt;options&gt;"],
            correctAnswer: 2,
            explanation: "The &lt;select&gt; tag creates dropdown menus with &lt;option&gt; tags for each choice."
          },
          {
            id: 9,
            question: "How do you connect a label to an input?",
            options: ["Place them next to each other", "Use the 'for' attribute with the input's id", "Use the same name", "Use CSS"],
            correctAnswer: 1,
            explanation: "The label's 'for' attribute should match the input's 'id' to create the connection."
          },
          {
            id: 10,
            question: "Why are forms important on websites?",
            options: ["They make sites look pretty", "They allow user interaction and data collection", "They add animations", "They're required by law"],
            correctAnswer: 1,
            explanation: "Forms enable user interaction, data collection, feedback, and many interactive features on websites."
          }
        ],
        practiceTask: "Create a 'Contact Us' form with name, email, subject dropdown, message textarea, and a submit button. Include proper labels for all fields.",
        difficulty: "Beginner"
      },
      {
        id: 9,
        title: "Semantic HTML and Web Structure",
        description: "Learn to use semantic HTML elements for better website structure and accessibility",
        duration: "45 minutes",
        content: `
          <h2>Building Meaningful Web Structure</h2>
          <p>Semantic HTML uses elements that describe the meaning and structure of content, not just its appearance. This makes websites more accessible and easier for search engines to understand!</p>
          
          <h3>What is Semantic HTML?</h3>
          <p>Semantic elements clearly describe their meaning to both browsers and developers. Instead of using generic &lt;div&gt; elements everywhere, we use specific tags that tell us what the content is for.</p>
          
          <h3>Main Semantic Elements</h3>
          <ul>
            <li><strong>&lt;header&gt;</strong> - Top section with navigation and titles</li>
            <li><strong>&lt;nav&gt;</strong> - Navigation menus and links</li>
            <li><strong>&lt;main&gt;</strong> - Main content of the page</li>
            <li><strong>&lt;section&gt;</strong> - Thematic sections of content</li>
            <li><strong>&lt;article&gt;</strong> - Independent, self-contained content</li>
            <li><strong>&lt;aside&gt;</strong> - Sidebar content related to main content</li>
            <li><strong>&lt;footer&gt;</strong> - Bottom section with contact info and links</li>
          </ul>
          
          <h3>Why Use Semantic HTML?</h3>
          <ul>
            <li>🔍 <strong>SEO:</strong> Search engines understand content better</li>
            <li>♿ <strong>Accessibility:</strong> Screen readers can navigate more easily</li>
            <li>👥 <strong>Teamwork:</strong> Other developers understand your code</li>
            <li>🧹 <strong>Clean Code:</strong> More organized and maintainable</li>
          </ul>
        `,
        learningObjectives: [
          "Understand the purpose and benefits of semantic HTML",
          "Use semantic elements to structure web content properly",
          "Create accessible and well-organized web pages",
          "Apply semantic HTML best practices"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Semantic Blog</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        nav ul {
            list-style-type: none;
            padding: 0;
            display: flex;
            gap: 20px;
        }
        
        nav a {
            color: white;
            text-decoration: none;
            font-weight: bold;
        }
        
        main {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        
        article {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        aside {
            background-color: #e8f5e8;
            padding: 20px;
            border-radius: 10px;
            height: fit-content;
        }
        
        footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <h1>My Learning Journey Blog</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="blog-posts">
            <article>
                <header>
                    <h2>Learning HTML Semantic Elements</h2>
                    <p><time datetime="2024-01-15">January 15, 2024</time> by <strong>Student</strong></p>
                </header>
                
                <p>Today I learned about semantic HTML elements and how they make websites more meaningful and accessible!</p>
                
                <section>
                    <h3>What I Discovered</h3>
                    <p>Semantic elements like &lt;article&gt;, &lt;section&gt;, and &lt;header&gt; help organize content in a way that both humans and computers can understand.</p>
                </section>
                
                <footer>
                    <p>Tags: <span>HTML, Web Development, Learning</span></p>
                </footer>
            </article>
            
            <article>
                <header>
                    <h2>My First Web Page</h2>
                    <p><time datetime="2024-01-10">January 10, 2024</time> by <strong>Student</strong></p>
                </header>
                
                <p>Creating my first web page was exciting! I learned about HTML tags and how they structure content.</p>
                
                <section>
                    <h3>Key Takeaways</h3>
                    <ul>
                        <li>HTML tags are like containers</li>
                        <li>Every tag has a purpose</li>
                        <li>Proper structure makes websites accessible</li>
                    </ul>
                </section>
                
                <footer>
                    <p>Tags: <span>Beginner, HTML, First Steps</span></p>
                </footer>
            </article>
        </section>
        
        <aside>
            <h3>About This Blog</h3>
            <p>This blog documents my journey learning web development. I share what I learn and the projects I create!</p>
            
            <section>
                <h4>Recent Topics</h4>
                <ul>
                    <li>Semantic HTML</li>
                    <li>CSS Styling</li>
                    <li>Web Accessibility</li>
                    <li>Forms and Inputs</li>
                </ul>
            </section>
        </aside>
    </main>
    
    <footer>
        <p>&copy; 2024 My Learning Journey. Built with semantic HTML!</p>
        <p>Contact: <a href="mailto:student@school.com" style="color: #4CAF50;">student@school.com</a></p>
    </footer>
</body>
</html>`,
          css: `/* Semantic HTML Layout Styles */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    background-color: #4CAF50;
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

nav ul {
    list-style-type: none;
    padding: 0;
    display: flex;
    gap: 20px;
}

nav a {
    color: white;
    text-decoration: none;
    font-weight: bold;
    transition: opacity 0.3s;
}

nav a:hover {
    opacity: 0.8;
}

main {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
}

article {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    border-left: 4px solid #4CAF50;
}

aside {
    background-color: #e8f5e8;
    padding: 20px;
    border-radius: 10px;
    height: fit-content;
}

footer {
    background-color: #333;
    color: white;
    text-align: center;
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
}`,
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What is semantic HTML?",
            options: ["HTML that looks pretty", "HTML that describes meaning and structure", "HTML with colors", "HTML for mobile only"],
            correctAnswer: 1,
            explanation: "Semantic HTML uses elements that clearly describe the meaning and structure of content, not just appearance."
          },
          {
            id: 2,
            question: "What should go in the &lt;header&gt; element?",
            options: ["Footer information", "Main content", "Navigation and page titles", "Random text"],
            correctAnswer: 2,
            explanation: "The &lt;header&gt; element typically contains navigation menus, page titles, and introductory content."
          },
          {
            id: 3,
            question: "What's the difference between &lt;section&gt; and &lt;article&gt;?",
            options: ["No difference", "&lt;article&gt; is for independent content, &lt;section&gt; is for thematic groups", "Only the spelling", "&lt;section&gt; is newer"],
            correctAnswer: 1,
            explanation: "&lt;article&gt; is for standalone content that could exist independently, while &lt;section&gt; groups related content thematically."
          },
          {
            id: 4,
            question: "What belongs in the &lt;nav&gt; element?",
            options: ["Images", "Navigation links and menus", "Contact information", "Random content"],
            correctAnswer: 1,
            explanation: "The &lt;nav&gt; element is specifically for navigation links and menus that help users move around the site."
          },
          {
            id: 5,
            question: "Why is semantic HTML important for accessibility?",
            options: ["It makes sites colorful", "Screen readers can understand page structure better", "It loads faster", "It's not important"],
            correctAnswer: 1,
            explanation: "Semantic HTML helps screen readers and assistive technologies understand page structure and navigate more effectively."
          },
          {
            id: 6,
            question: "What should go in the &lt;main&gt; element?",
            options: ["Navigation menus", "The primary content of the page", "Footer links", "Advertisement"],
            correctAnswer: 1,
            explanation: "The &lt;main&gt; element contains the primary, central content of the page that's unique to that page."
          },
          {
            id: 7,
            question: "What is &lt;aside&gt; used for?",
            options: ["Main content", "Content related to but separate from main content", "Navigation", "Headers"],
            correctAnswer: 1,
            explanation: "&lt;aside&gt; is for content that's related to the main content but can stand alone, like sidebars or related links."
          },
          {
            id: 8,
            question: "How does semantic HTML help with SEO?",
            options: ["It doesn't help", "Search engines understand content structure better", "It makes sites load faster", "It adds colors"],
            correctAnswer: 1,
            explanation: "Search engines can better understand and index content when it's marked up with meaningful semantic elements."
          },
          {
            id: 9,
            question: "What goes in the &lt;footer&gt; element?",
            options: ["Main page content", "Contact info, copyright, and secondary links", "Navigation menus only", "Large headings"],
            correctAnswer: 1,
            explanation: "The &lt;footer&gt; typically contains contact information, copyright notices, and secondary navigation links."
          },
          {
            id: 10,
            question: "Should every page have a &lt;main&gt; element?",
            options: ["No, it's optional", "Yes, but only one per page", "Yes, as many as needed", "Only on the homepage"],
            correctAnswer: 1,
            explanation: "Every page should have exactly one &lt;main&gt; element that contains the primary content unique to that page."
          }
        ],
        practiceTask: "Create a blog-style page using proper semantic HTML structure with header, nav, main, article, aside, and footer elements.",
        difficulty: "Beginner"
      },
      {
        id: 10,
        title: "HTML Best Practices and Accessibility",
        description: "Learn professional HTML practices and how to make websites accessible to everyone",
        duration: "50 minutes",
        content: `
          <h2>Writing Professional, Accessible HTML</h2>
          <p>Great web developers write HTML that works for everyone, follows best practices, and is easy to maintain. Let's learn how to create websites that are inclusive and professional!</p>
          
          <h3>HTML Best Practices</h3>
          <ul>
            <li>🏗️ <strong>Valid HTML:</strong> Use proper syntax and structure</li>
            <li>📱 <strong>Responsive Design:</strong> Works on all devices</li>
            <li>⚡ <strong>Performance:</strong> Fast loading and efficient code</li>
            <li>🎯 <strong>Semantic Markup:</strong> Use the right elements for content</li>
            <li>🧹 <strong>Clean Code:</strong> Well-organized and commented</li>
          </ul>
          
          <h3>Web Accessibility (a11y)</h3>
          <p>Accessibility means making websites usable by people with disabilities. This includes:</p>
          <ul>
            <li>👁️ <strong>Visual:</strong> Blind or low vision users</li>
            <li>👂 <strong>Auditory:</strong> Deaf or hard of hearing users</li>
            <li>🖱️ <strong>Motor:</strong> Users who can't use a mouse</li>
            <li>🧠 <strong>Cognitive:</strong> Users with learning differences</li>
          </ul>
          
          <h3>Key Accessibility Practices</h3>
          <ul>
            <li>Use descriptive alt text for images</li>
            <li>Provide proper heading hierarchy</li>
            <li>Ensure good color contrast</li>
            <li>Make all functionality keyboard accessible</li>
            <li>Use ARIA attributes when needed</li>
            <li>Write clear, simple language</li>
          </ul>
          
          <h3>Testing Your HTML</h3>
          <p>Always test your websites with:</p>
          <ul>
            <li>HTML validators</li>
            <li>Different browsers</li>
            <li>Various devices and screen sizes</li>
            <li>Keyboard navigation</li>
            <li>Screen reader software</li>
          </ul>
        `,
        learningObjectives: [
          "Apply HTML best practices for professional development",
          "Understand web accessibility principles and implementation",
          "Create inclusive websites that work for all users",
          "Validate and test HTML code effectively"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Learn about web accessibility and HTML best practices">
    <title>Accessible Web Design - HTML Best Practices</title>
    
    <style>
        /* Accessible design principles */
        :root {
            --primary-color: #2c5aa0;
            --secondary-color: #4CAF50;
            --text-color: #333;
            --bg-color: #ffffff;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 18px;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Skip link for keyboard users */
        .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
        }
        
        .skip-link:focus {
            top: 6px;
        }
        
        /* High contrast focus styles */
        button:focus, 
        a:focus, 
        input:focus {
            outline: 3px solid #005fcc;
            outline-offset: 2px;
        }
        
        /* Accessible button styling */
        .btn {
            background-color: var(--secondary-color);
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .btn:hover, .btn:focus {
            background-color: #45a049;
        }
        
        /* Responsive images */
        img {
            max-width: 100%;
            height: auto;
        }
        
        /* High contrast for better readability */
        .highlight {
            background-color: #fffbf0;
            border-left: 4px solid var(--secondary-color);
            padding: 16px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <header role="banner">
        <h1>Web Accessibility Guide</h1>
        <nav role="navigation" aria-label="Main navigation">
            <ul>
                <li><a href="#introduction">Introduction</a></li>
                <li><a href="#principles">Principles</a></li>
                <li><a href="#examples">Examples</a></li>
                <li><a href="#resources">Resources</a></li>
            </ul>
        </nav>
    </header>
    
    <main id="main-content" role="main">
        <section id="introduction" aria-labelledby="intro-heading">
            <h2 id="intro-heading">What is Web Accessibility?</h2>
            <p>Web accessibility means making websites usable by people with disabilities. This includes visual, auditory, motor, and cognitive disabilities.</p>
            
            <div class="highlight" role="region" aria-labelledby="key-point">
                <h3 id="key-point">Key Point</h3>
                <p>Accessible design benefits everyone, not just people with disabilities!</p>
            </div>
        </section>
        
        <section id="principles" aria-labelledby="principles-heading">
            <h2 id="principles-heading">WCAG Principles</h2>
            <p>The Web Content Accessibility Guidelines are based on four principles:</p>
            
            <dl>
                <dt><strong>Perceivable</strong></dt>
                <dd>Information must be presentable in ways users can perceive</dd>
                
                <dt><strong>Operable</strong></dt>
                <dd>User interface components must be operable</dd>
                
                <dt><strong>Understandable</strong></dt>
                <dd>Information and UI operation must be understandable</dd>
                
                <dt><strong>Robust</strong></dt>
                <dd>Content must be robust enough for various assistive technologies</dd>
            </dl>
        </section>
        
        <section id="examples" aria-labelledby="examples-heading">
            <h2 id="examples-heading">Accessible HTML Examples</h2>
            
            <h3>Images with Alt Text</h3>
            <figure>
                <img src="accessibility-icon.jpg" 
                     alt="Universal accessibility icon showing a stylized person in a wheelchair" 
                     width="100" height="100">
                <figcaption>The universal symbol for accessibility</figcaption>
            </figure>
            
            <h3>Accessible Form</h3>
            <form aria-labelledby="contact-form-title">
                <h4 id="contact-form-title">Contact Us</h4>
                
                <label for="full-name">Full Name (required)</label>
                <input type="text" id="full-name" name="fullName" required aria-describedby="name-help">
                <small id="name-help">Enter your first and last name</small>
                
                <label for="email-address">Email (required)</label>
                <input type="email" id="email-address" name="email" required aria-describedby="email-help">
                <small id="email-help">We'll never share your email address</small>
                
                <fieldset>
                    <legend>How did you hear about us?</legend>
                    <input type="radio" id="search-engine" name="source" value="search">
                    <label for="search-engine">Search Engine</label>
                    
                    <input type="radio" id="social-media" name="source" value="social">
                    <label for="social-media">Social Media</label>
                    
                    <input type="radio" id="friend" name="source" value="friend">
                    <label for="friend">Friend</label>
                </fieldset>
                
                <label for="message-text">Message</label>
                <textarea id="message-text" name="message" rows="4" 
                         aria-describedby="message-help"></textarea>
                <small id="message-help">Tell us how we can help you</small>
                
                <button type="submit" class="btn">Send Message</button>
            </form>
            
            <h3>Data Table with Headers</h3>
            <table role="table" aria-labelledby="schedule-caption">
                <caption id="schedule-caption">Weekly Class Schedule</caption>
                <thead>
                    <tr>
                        <th scope="col">Time</th>
                        <th scope="col">Monday</th>
                        <th scope="col">Tuesday</th>
                        <th scope="col">Wednesday</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">9:00 AM</th>
                        <td>Math</td>
                        <td>Science</td>
                        <td>English</td>
                    </tr>
                    <tr>
                        <th scope="row">10:00 AM</th>
                        <td>English</td>
                        <td>Math</td>
                        <td>Science</td>
                    </tr>
                </tbody>
            </table>
        </section>
        
        <section id="resources" aria-labelledby="resources-heading">
            <h2 id="resources-heading">Additional Resources</h2>
            <ul>
                <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       aria-describedby="external-link-warning">
                    WCAG 2.1 Quick Reference</a></li>
                <li><a href="https://webaim.org/" 
                       target="_blank" 
                       rel="noopener noreferrer">
                    WebAIM - Web Accessibility Resources</a></li>
            </ul>
            <p id="external-link-warning">
                <small>External links open in a new window</small>
            </p>
        </section>
    </main>
    
    <footer role="contentinfo">
        <p>&copy; 2024 Web Accessibility Guide. 
           <a href="mailto:accessibility@school.com">Contact us about accessibility</a></p>
    </footer>
</body>
</html>`,
          css: `/* Accessibility-focused CSS */
:root {
    --primary-color: #2c5aa0;
    --secondary-color: #4CAF50;
    --text-color: #333;
    --bg-color: #ffffff;
    --error-color: #d32f2f;
    --success-color: #2e7d32;
}

/* Base styles for accessibility */
body {
    font-family: 'Arial', sans-serif;
    font-size: 18px; /* Larger base font size */
    line-height: 1.6; /* Good line spacing */
    color: var(--text-color);
    background-color: var(--bg-color);
}

/* Skip link for keyboard users */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary-color);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
}

.skip-link:focus {
    top: 6px;
}

/* High contrast focus indicators */
*:focus {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
}

/* Accessible button styling */
button, .btn {
    min-height: 44px; /* Touch target size */
    min-width: 44px;
    padding: 12px 24px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Error and success states */
.error {
    color: var(--error-color);
    border: 2px solid var(--error-color);
}

.success {
    color: var(--success-color);
    border: 2px solid var(--success-color);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --text-color: #000000;
        --bg-color: #ffffff;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}`,
          javascript: `// Accessible JavaScript practices

// Announce dynamic content changes to screen readers
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Visually hidden but available to screen readers
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Keyboard navigation for custom components
function handleKeyboardNavigation(event) {
    switch(event.key) {
        case 'Enter':
        case ' ': // Space key
            event.preventDefault();
            // Trigger button action
            event.target.click();
            break;
        case 'Escape':
            // Close modal or cancel action
            closeModal();
            break;
        case 'Tab':
            // Let browser handle tab navigation
            break;
    }
}

// Focus management for modals
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    modal.style.display = 'block';
    
    // Focus first element
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
    
    // Trap focus within modal
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            trapFocus(e, focusableElements);
        }
    });
}

function trapFocus(event, focusableElements) {
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
        }
    }
}

// Form validation with accessible error messages
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showFieldError(input, \`\${input.labels[0].textContent} is required\`);
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    return isValid;
}

function showFieldError(input, message) {
    let errorElement = document.getElementById(\`\${input.id}-error\`);
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = \`\${input.id}-error\`;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    input.setAttribute('aria-describedby', errorElement.id);
    input.setAttribute('aria-invalid', 'true');
    
    announceToScreenReader(message);
}`
        },
        quiz: [
          {
            id: 1,
            question: "What does 'a11y' stand for?",
            options: ["Always 11 Years", "Accessibility (a + 11 letters + y)", "All 11 Years", "Application 11 Years"],
            correctAnswer: 1,
            explanation: "'a11y' is a numeronym for accessibility - 'a' + 11 letters + 'y' = accessibility."
          },
          {
            id: 2,
            question: "Why is alt text important for images?",
            options: ["It makes images load faster", "It helps screen readers describe images to blind users", "It changes image colors", "It's required by law"],
            correctAnswer: 1,
            explanation: "Alt text provides a text description of images for screen readers and when images fail to load."
          },
          {
            id: 3,
            question: "What is the minimum color contrast ratio for normal text?",
            options: ["2:1", "3:1", "4.5:1", "7:1"],
            correctAnswer: 2,
            explanation: "WCAG guidelines require a minimum contrast ratio of 4.5:1 for normal text to ensure readability."
          },
          {
            id: 4,
            question: "What is a skip link?",
            options: ["A broken link", "A link that allows keyboard users to skip to main content", "A link to another website", "A decorative element"],
            correctAnswer: 1,
            explanation: "Skip links allow keyboard and screen reader users to quickly jump to the main content, bypassing navigation."
          },
          {
            id: 5,
            question: "Which attribute helps screen readers understand form inputs?",
            options: ["title", "label", "for", "All of the above"],
            correctAnswer: 3,
            explanation: "Labels (via <label> tags and 'for' attributes) and 'title' attributes all help screen readers understand form inputs."
          },
          {
            id: 6,
            question: "What is the purpose of heading hierarchy (h1, h2, h3, etc.)?",
            options: ["Just for styling", "To create a logical document structure", "To make text bigger", "No purpose"],
            correctAnswer: 1,
            explanation: "Proper heading hierarchy creates a logical document outline that helps all users, especially screen reader users, navigate content."
          },
          {
            id: 7,
            question: "What does ARIA stand for?",
            options: ["Advanced Rich Internet Applications", "Accessible Rich Internet Applications", "Automated Rich Internet Applications", "Active Rich Internet Applications"],
            correctAnswer: 1,
            explanation: "ARIA stands for Accessible Rich Internet Applications - a set of attributes that make web content more accessible."
          },
          {
            id: 8,
            question: "Which is NOT a WCAG principle?",
            options: ["Perceivable", "Operable", "Beautiful", "Robust"],
            correctAnswer: 2,
            explanation: "The four WCAG principles are Perceivable, Operable, Understandable, and Robust. Beauty is not a WCAG principle."
          },
          {
            id: 9,
            question: "What is keyboard accessibility?",
            options: ["Using fancy keyboards", "Making all website functions work with keyboard alone", "Typing faster", "Keyboard shortcuts only"],
            correctAnswer: 1,
            explanation: "Keyboard accessibility ensures all website functionality can be accessed using only a keyboard, without requiring a mouse."
          },
          {
            id: 10,
            question: "Why should you test your website with a screen reader?",
            options: ["It's fun", "To understand how blind users experience your site", "It makes sites faster", "It's required by law"],
            correctAnswer: 1,
            explanation: "Testing with screen readers helps you understand how blind and visually impaired users experience your website, revealing accessibility issues."
          }
        ],
        practiceTask: "Create a fully accessible contact page including proper headings, form labels, alt text for images, and keyboard navigation. Test it with tab navigation only.",
        difficulty: "Beginner"
      }
    ]
  },
  
  {
    id: 2,
    title: "Colorful Web Pages with CSS",
    description: "Learn to make beautiful, colorful websites using CSS styling",
    gradeLevel: "Grade 3-4", 
    duration: "6 weeks",
    difficulty: "Beginner",
    learningOutcomes: [
      "Understand how CSS works with HTML to style webpages",
      "Apply colors, fonts, and sizes to web content",
      "Create visually appealing and organized layouts",
      "Develop design thinking and creativity skills"
    ],
    prerequisites: ["Basic HTML knowledge", "Understanding of HTML tags"],
    technologies: ["HTML", "CSS"],
    lessons: [
      {
        id: 1,
        title: "What is CSS? - Making Websites Beautiful",
        description: "Introduction to CSS and how it makes websites colorful and stylish",
        duration: "45 minutes",
        content: `
          <h2>Welcome to CSS - The Art of Web Design!</h2>
          <p>CSS stands for Cascading Style Sheets. Think of it as the clothes and makeup for your website!</p>
          
          <h3>What does CSS do?</h3>
          <ul>
            <li>🎨 Adds colors to text and backgrounds</li>
            <li>✨ Changes fonts and text sizes</li>
            <li>📐 Controls spacing and layout</li>
            <li>🖼️ Adds borders and shadows</li>
            <li>🎭 Makes websites look professional and fun</li>
          </ul>
          
          <h3>HTML vs CSS</h3>
          <p><strong>HTML</strong> = The skeleton and content of your website<br>
          <strong>CSS</strong> = The skin, clothes, and style of your website</p>
          
          <h3>How CSS Works</h3>
          <p>CSS uses selectors to find HTML elements and then applies styles to them. It's like telling the computer: "Find all the headings and make them blue!"</p>
        `,
        learningObjectives: [
          "Understand what CSS is and its purpose",
          "Learn the difference between HTML content and CSS styling",
          "Recognize how CSS makes websites visually appealing",
          "Identify basic CSS syntax and structure"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My Colorful Page</title>
    <style>
        h1 {
            color: blue;
            font-size: 36px;
        }
        p {
            color: green;
            font-family: Arial;
        }
    </style>
</head>
<body>
    <h1>Welcome to My Colorful Website!</h1>
    <p>This paragraph is styled with CSS to be green and use Arial font.</p>
    <p>CSS makes websites beautiful and fun to look at!</p>
</body>
</html>`,
          css: `h1 {
    color: blue;
    font-size: 36px;
    text-align: center;
}

p {
    color: green;
    font-family: Arial, sans-serif;
    font-size: 18px;
}`,
          javascript: ""
        },
        quiz: [
          {
            id: 1,
            question: "What does CSS stand for?",
            options: ["Computer Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets", "Creative Style Sheets"],
            correctAnswer: 1,
            explanation: "CSS stands for Cascading Style Sheets, which is used to style HTML elements."
          },
          {
            id: 2,
            question: "What is CSS like for a website?",
            options: ["The bones", "The clothes and makeup", "The food", "The wheels"],
            correctAnswer: 1,
            explanation: "CSS is like clothes and makeup for a website - it makes it look beautiful and styled."
          },
          {
            id: 3,
            question: "What can CSS change?",
            options: ["Only colors", "Only fonts", "Colors, fonts, sizes, and layout", "Nothing"],
            correctAnswer: 2,
            explanation: "CSS can change many visual aspects including colors, fonts, sizes, spacing, and layout."
          },
          {
            id: 4,
            question: "What does HTML provide for a website?",
            options: ["The colors", "The content and structure", "The fonts", "The music"],
            correctAnswer: 1,
            explanation: "HTML provides the content and structure of a website, like the skeleton."
          },
          {
            id: 5,
            question: "Can you have HTML without CSS?",
            options: ["Yes, but it looks plain", "No, never", "Only on computers", "Only for games"],
            correctAnswer: 0,
            explanation: "You can have HTML without CSS, but the website will look very plain and unstyled."
          },
          {
            id: 6,
            question: "Where do you write CSS code?",
            options: ["In a separate file or in the HTML head", "Only in the body", "Only in images", "Nowhere"],
            correctAnswer: 0,
            explanation: "CSS can be written in a separate file or within the &lt;style&gt; tags in the HTML head."
          },
          {
            id: 7,
            question: "What makes websites look professional?",
            options: ["Only big text", "Good CSS styling", "Only pictures", "Only videos"],
            correctAnswer: 1,
            explanation: "Good CSS styling makes websites look professional, organized, and visually appealing."
          },
          {
            id: 8,
            question: "CSS selectors are used to:",
            options: ["Delete content", "Find and style HTML elements", "Add new pages", "Remove colors"],
            correctAnswer: 1,
            explanation: "CSS selectors find specific HTML elements so you can apply styles to them."
          },
          {
            id: 9,
            question: "What happens when you change CSS?",
            options: ["The content changes", "The visual appearance changes", "Nothing happens", "The website breaks"],
            correctAnswer: 1,
            explanation: "Changing CSS changes how the website looks visually, not the actual content."
          },
          {
            id: 10,
            question: "Why is CSS important for websites?",
            options: ["It makes them load faster", "It makes them look attractive and user-friendly", "It adds more content", "It's not important"],
            correctAnswer: 1,
            explanation: "CSS is important because it makes websites attractive, user-friendly, and professional-looking."
          }
        ],
        practiceTask: "Create an HTML page about your school and add CSS to make the title blue and paragraphs green.",
        difficulty: "Beginner"
      }
      // Add more lessons for CSS course...
    ]
  },

  // Continue with more courses for different grade levels...
  {
    id: 3,
    title: "Interactive Web Games with JavaScript",
    description: "Create fun, interactive games and activities using JavaScript programming",
    gradeLevel: "Grade 5-6",
    duration: "8 weeks", 
    difficulty: "Intermediate",
    learningOutcomes: [
      "Understand basic programming concepts through JavaScript",
      "Create interactive web elements and simple games",
      "Learn problem-solving and logical thinking skills",
      "Apply event handling and user interaction techniques"
    ],
    prerequisites: ["HTML and CSS knowledge", "Basic computer skills"],
    technologies: ["HTML", "CSS", "JavaScript"],
    lessons: [
      {
        id: 1,
        title: "JavaScript Magic - Making Websites Interactive",
        description: "Introduction to JavaScript and how it makes websites come alive",
        duration: "50 minutes",
        content: `
          <h2>JavaScript - The Magic Behind Interactive Websites!</h2>
          <p>JavaScript is like the brain of a website. While HTML is the skeleton and CSS is the clothes, JavaScript makes everything move and respond to what you do!</p>
          
          <h3>What can JavaScript do?</h3>
          <ul>
            <li>🎮 Create games and interactive activities</li>
            <li>🖱️ Respond when you click buttons</li>
            <li>✨ Show and hide content</li>
            <li>🧮 Do calculations and math</li>
            <li>🎲 Generate random numbers for games</li>
            <li>💬 Show messages and alerts</li>
          </ul>
          
          <h3>Programming Concepts</h3>
          <p><strong>Variables:</strong> Like boxes that store information<br>
          <strong>Functions:</strong> Like recipes that do specific tasks<br>
          <strong>Events:</strong> Things that happen (like clicking a button)</p>
          
          <h3>Your First JavaScript</h3>
          <p>Let's start with simple commands that make things happen on your webpage!</p>
        `,
        learningObjectives: [
          "Understand what JavaScript is and its role in web development",
          "Learn basic programming concepts like variables and functions",
          "Create simple interactive elements",
          "Write your first JavaScript code"
        ],
        codeExamples: {
          html: `<!DOCTYPE html>
<html>
<head>
    <title>My First JavaScript</title>
</head>
<body>
    <h1>Welcome to JavaScript!</h1>
    <button onclick="sayHello()">Click Me!</button>
    <button onclick="changeColor()">Change Background Color</button>
    
    <p id="message">Hello! Click the button above.</p>
    
    <script>
        function sayHello() {
            document.getElementById("message").innerHTML = "Hello from JavaScript!";
        }
        
        function changeColor() {
            document.body.style.backgroundColor = "lightblue";
        }
    </script>
</body>
</html>`,
          css: `button {
    background-color: #4CAF50;
    color: white;
    padding: 15px 32px;
    text-align: center;
    font-size: 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin: 10px;
}

button:hover {
    background-color: #45a049;
}`,
          javascript: `// Variables - like boxes that store information
let playerName = "Alex";
let score = 0;

// Functions - like recipes that do tasks
function sayHello() {
    alert("Hello, " + playerName + "!");
}

function addPoint() {
    score = score + 1;
    console.log("Score is now: " + score);
}

// Event handling - responding to user actions
function buttonClick() {
    sayHello();
    addPoint();
}`
        },
        quiz: [
          {
            id: 1,
            question: "What does JavaScript do for websites?",
            options: ["Makes them look pretty", "Makes them interactive and responsive", "Adds only colors", "Makes them smaller"],
            correctAnswer: 1,
            explanation: "JavaScript makes websites interactive by responding to user actions and creating dynamic content."
          },
          {
            id: 2,
            question: "If HTML is the skeleton and CSS is the clothes, what is JavaScript?",
            options: ["The shoes", "The brain", "The hat", "The food"],
            correctAnswer: 1,
            explanation: "JavaScript is like the brain because it controls behavior and makes the website think and respond."
          },
          {
            id: 3,
            question: "What is a variable in programming?",
            options: ["A type of color", "A box that stores information", "A kind of font", "A website address"],
            correctAnswer: 1,
            explanation: "A variable is like a labeled box that stores information you can use later in your program."
          },
          {
            id: 4,
            question: "What is a function in JavaScript?",
            options: ["A recipe that does a specific task", "A type of website", "A color code", "A font style"],
            correctAnswer: 0,
            explanation: "A function is like a recipe - it's a set of instructions that performs a specific task when called."
          },
          {
            id: 5,
            question: "What happens when you click a button with JavaScript?",
            options: ["Nothing", "It can trigger actions and events", "The computer breaks", "Only colors change"],
            correctAnswer: 1,
            explanation: "JavaScript can detect button clicks and trigger actions or events in response."
          },
          {
            id: 6,
            question: "Can JavaScript do math calculations?",
            options: ["No, never", "Yes, it's great at math", "Only addition", "Only on calculators"],
            correctAnswer: 1,
            explanation: "JavaScript is excellent at doing math calculations and can handle complex mathematical operations."
          },
          {
            id: 7,
            question: "What are events in JavaScript?",
            options: ["Parties", "Things that happen like clicks or key presses", "Only mouse movements", "Website addresses"],
            correctAnswer: 1,
            explanation: "Events are things that happen in the browser, like clicks, key presses, or page loading."
          },
          {
            id: 8,
            question: "Can JavaScript create games?",
            options: ["No, impossible", "Yes, it can create interactive games", "Only board games", "Only video games"],
            correctAnswer: 1,
            explanation: "JavaScript is commonly used to create interactive web games and activities."
          },
          {
            id: 9,
            question: "Where do you write JavaScript code?",
            options: ["Only in separate files", "In HTML using &lt;script&gt; tags or separate files", "Only in CSS", "Nowhere"],
            correctAnswer: 1,
            explanation: "JavaScript can be written in &lt;script&gt; tags within HTML or in separate .js files."
          },
          {
            id: 10,
            question: "What makes JavaScript different from HTML and CSS?",
            options: ["It only works on phones", "It can respond to user actions and create dynamic behavior", "It only changes colors", "It's exactly the same"],
            correctAnswer: 1,
            explanation: "JavaScript is different because it can create dynamic behavior and respond to user interactions in real-time."
          }
        ],
        practiceTask: "Create a webpage with a button that changes the text of a paragraph when clicked. Use an alert to greet the user.",
        difficulty: "Intermediate"
      }
      // Add more JavaScript lessons...
    ]
  }

  // Continue adding more courses for grades 7-12 with increasingly advanced topics...
];

export const getCourseById = (id: number): WebDevCourse | undefined => {
  return webDevCourses.find(course => course.id === id);
};

export const getLessonById = (courseId: number, lessonId: number): WebDevLesson | undefined => {
  const course = getCourseById(courseId);
  return course?.lessons.find(lesson => lesson.id === lessonId);
};

export const getCoursesByGradeLevel = (gradeLevel: string): WebDevCourse[] => {
  return webDevCourses.filter(course => course.gradeLevel.includes(gradeLevel));
};