'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Code2, Globe, Gamepad2, Brain, Terminal, Send, Loader2, ExternalLink,
  ArrowLeft, Sparkles, Lightbulb, RefreshCw, CheckCircle,
  BookOpen, Target, Zap, ChevronRight, X
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { CodePlayground } from '@/components/coding/code-playground'
import { ScratchEmbed } from '@/components/coding/scratch-embed'
import { AICodingTutorDrawer, type CodingTrackId } from '@/components/ai/ai-coding-tutor-drawer'

/* ─────────────────────────── Types ─────────────────────────── */
type Track = 'scratch' | 'web' | 'ai-kids' | 'advanced'

interface Message { role: 'user' | 'assistant'; content: string }

interface Lesson {
  id: number; title: string; description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  practiceUrl?: string; content: string
  starterCode?: { html?: string; css?: string; js?: string }
}

/* ─────────────────────────── Lesson data ───────────────────── */
const SCRATCH_LESSONS: Lesson[] = [
  { id: 1, title: 'Moving Sprites', description: 'Learn to move characters on screen', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use the **move 10 steps** block inside a **when green flag clicked** event. Change the number to move faster or slower. Try adding a **forever** loop to keep the sprite moving!' },
  { id: 2, title: 'Events & Inputs', description: 'React to keyboard and mouse input', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **when [space] key pressed** blocks to respond to keyboard input. Each key can trigger a different action for your sprite.' },
  { id: 3, title: 'Loops & Repetition', description: 'Use loops to repeat actions', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'The **repeat 10** block runs code a fixed number of times. The **forever** block runs code continuously. Use **repeat until** to loop until a condition is true.' },
  { id: 4, title: 'Conditionals & Logic', description: 'Make decisions with if/else', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **if <condition> then** to run code only when something is true. Add **else** for an alternative path. Conditions can check touching a color, key pressed, or variable values.' },
  { id: 5, title: 'Variables & Score', description: 'Store and use data', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Create a variable called **score**. Use **set score to 0** at the start, then **change score by 1** each time the player succeeds. Display it on screen with the checkbox in the variables panel.' },
  { id: 6, title: 'Build a Game', description: 'Combine everything to make a game', difficulty: 'Advanced', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Combine sprites, events, loops, conditionals and variables to build a complete game. Plan your game first: What is the goal? What are the rules? How does the player win or lose?' },
]

const WEB_LESSONS: Lesson[] = [
  { id: 1, title: 'Your First HTML Page', description: 'Build a webpage from scratch', difficulty: 'Beginner',
    starterCode: { html: '<h1>Hello, World!</h1>\n<p>This is my first webpage.</p>\n<button onclick="sayHello()">Click me</button>', css: 'body {\n  font-family: Arial, sans-serif;\n  background: #f0f8ff;\n  padding: 40px;\n  text-align: center;\n}\nh1 {\n  color: #0066cc;\n}\nbutton {\n  background: #0066cc;\n  color: white;\n  border: none;\n  padding: 10px 24px;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 16px;\n}\nbutton:hover {\n  background: #004999;\n}', js: 'function sayHello() {\n  alert("Hello from JavaScript!");\n}' },
    content: '```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>This is my first webpage.</p>\n</body>\n</html>\n```\nSave this as `index.html` and open it in a browser!' },
  { id: 2, title: 'Styling with CSS', description: 'Make your page look great', difficulty: 'Beginner',
    starterCode: { html: '<h1>Welcome to My Styled Page</h1>\n<p>This paragraph has custom styling.</p>\n<div class="card">\n  <h2>A Card Component</h2>\n  <p>Cards are great for organizing content.</p>\n</div>', css: 'body {\n  font-family: "Segoe UI", Tahoma, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  min-height: 100vh;\n  padding: 40px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n}\nh1 {\n  color: white;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n  margin-bottom: 20px;\n}\np {\n  color: #e0e0e0;\n  font-size: 18px;\n}\n.card {\n  background: white;\n  border-radius: 16px;\n  padding: 30px;\n  box-shadow: 0 10px 30px rgba(0,0,0,0.2);\n  max-width: 400px;\n  margin-top: 20px;\n}\n.card h2 {\n  color: #333;\n  margin-bottom: 10px;\n}\n.card p {\n  color: #666;\n}' },
    content: '```css\nbody { font-family: Arial; background: #f0f8ff; }\nh1   { color: #0066cc; }\np    { font-size: 18px; }\n```\nAdd this inside a `<style>` tag in your `<head>` section.' },
  { id: 3, title: 'JavaScript Basics', description: 'Make your page interactive', difficulty: 'Beginner',
    starterCode: { html: '<h1>JavaScript Interactive Demo</h1>\n<p id="output">Click the button to see magic!</p>\n<button onclick="doMagic()">✨ Click Me</button>\n<button onclick="resetColor()">↩ Reset</button>', css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 40px;\n  text-align: center;\n  background: #1a1a2e;\n  color: #eee;\n}\nbutton {\n  margin: 8px;\n  padding: 12px 24px;\n  font-size: 16px;\n  border: none;\n  border-radius: 8px;\n  background: #e94560;\n  color: white;\n  cursor: pointer;\n  transition: transform 0.2s;\n}\nbutton:hover {\n  transform: scale(1.05);\n}\n#output {\n  font-size: 20px;\n  margin: 20px 0;\n  padding: 20px;\n  background: #16213e;\n  border-radius: 12px;\n}', js: 'let clicks = 0;\nfunction doMagic() {\n  clicks++;\n  const out = document.getElementById("output");\n  if (clicks === 1) {\n    out.textContent = "🎉 You clicked the button!";\n    out.style.color = "#ffd700";\n  } else if (clicks === 2) {\n    out.textContent = "⭐ Double the fun!";\n    out.style.color = "#00ff88";\n  } else {\n    out.textContent = "🔥 You\\\'re on fire! " + clicks + " clicks!";\n    out.style.color = "#ff6b6b";\n  }\n}\nfunction resetColor() {\n  clicks = 0;\n  const out = document.getElementById("output");\n  out.textContent = "Click the button to see magic!";\n  out.style.color = "#eee";\n}' },
    content: '```javascript\n// Show a message when button is clicked\nfunction sayHello() {\n  alert("Hello from JavaScript!");\n}\n```\nAdd a button: `<button onclick="sayHello()">Click me</button>`' },
  { id: 4, title: 'Variables & Functions', description: 'Store data and reuse code', difficulty: 'Intermediate',
    starterCode: { html: '<h1>JS Variables & Functions</h1>\n<div id="demo">\n  <p>Player: <span id="playerName">Loading...</span></p>\n  <p>Score: <span id="playerScore">0</span></p>\n</div>\n<button onclick="updateScore(10)">+10 Points</button>\n<button onclick="resetGame()">Reset</button>', css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 40px;\n  text-align: center;\n  background: #0f0f23;\n  color: #ccc;\n}\nh1 { color: #00d4ff; }\n#demo {\n  background: #1a1a3e;\n  padding: 24px;\n  border-radius: 12px;\n  margin: 20px auto;\n  max-width: 350px;\n}\n#playerName { color: #ffd700; font-weight: bold; }\n#playerScore { color: #00ff88; font-weight: bold; font-size: 24px; }\nbutton {\n  margin: 8px;\n  padding: 10px 20px;\n  border: none;\n  border-radius: 8px;\n  background: #00d4ff;\n  color: #0f0f23;\n  font-weight: bold;\n  cursor: pointer;\n}\nbutton:hover { opacity: 0.8; }', js: 'let playerName = "Alex";\nlet score = 0;\n\nfunction updateScore(points) {\n  score += points;\n  document.getElementById("playerScore").textContent = score;\n}\n\nfunction resetGame() {\n  score = 0;\n  document.getElementById("playerScore").textContent = score;\n}\n\ndocument.getElementById("playerName").textContent = playerName;\n\n// Bonus: greet function\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\nconsole.log(greet(playerName));' },
    content: '```javascript\nlet name = "Alice";\nlet age  = 12;\n\nfunction greet(person) {\n  return "Hello, " + person + "!";\n}\n\nconsole.log(greet(name)); // Hello, Alice!\n```' },
  { id: 5, title: 'DOM Manipulation', description: 'Change the page with JavaScript', difficulty: 'Intermediate',
    starterCode: { html: '<h1>DOM Playground</h1>\n<div id="box" class="box">\n  Hover over me!\n</div>\n<div class="controls">\n  <button onclick="changeText()">Change Text</button>\n  <button onclick="toggleColor()">Toggle Color</button>\n  <button onclick="addElement()">Add Element</button>\n  <button onclick="resetAll()">Reset</button>\n</div>\n<div id="container"></div>', css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 40px;\n  text-align: center;\n  background: #1e1e2e;\n  color: #cdd6f4;\n}\nh1 { color: #cba6f7; }\n.box {\n  width: 200px;\n  height: 100px;\n  background: #45475a;\n  border-radius: 12px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin: 20px auto;\n  transition: all 0.3s;\n  cursor: pointer;\n}\n.box:hover {\n  transform: scale(1.05);\n  background: #585b70;\n}\n.controls { margin: 16px 0; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }\nbutton {\n  padding: 8px 16px;\n  border: none;\n  border-radius: 8px;\n  background: #89b4fa;\n  color: #1e1e2e;\n  font-weight: 600;\n  cursor: pointer;\n  transition: transform 0.2s;\n}\nbutton:hover { transform: scale(1.05); }\n#container { margin-top: 20px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }', js: 'function changeText() {\n  const box = document.getElementById("box");\n  box.textContent = "Text changed! 🎉";\n}\n\nfunction toggleColor() {\n  const box = document.getElementById("box");\n  if (box.style.background === "rgb(137, 180, 250)") {\n    box.style.background = "";\n  } else {\n    box.style.background = "#89b4fa";\n    box.style.color = "#1e1e2e";\n  }\n}\n\nlet count = 0;\nfunction addElement() {\n  count++;\n  const container = document.getElementById("container");\n  const el = document.createElement("div");\n  el.textContent = "Item " + count;\n  el.style.cssText = "padding: 8px 16px; background: #45475a; border-radius: 8px; font-size: 14px;";\n  container.appendChild(el);\n}\n\nfunction resetAll() {\n  const box = document.getElementById("box");\n  box.textContent = "Hover over me!";\n  box.style.background = "";\n  box.style.color = "";\n  document.getElementById("container").innerHTML = "";\n  count = 0;\n}' },
    content: '```javascript\n// Change text content\ndocument.getElementById("myText").innerText = "Updated!";\n\n// Change style\ndocument.getElementById("myBox").style.backgroundColor = "red";\n```' },
  { id: 6, title: 'Build a Calculator', description: 'A complete mini-project', difficulty: 'Advanced',
    starterCode: { html: '<h1>🧮 Calculator</h1>\n<div class="calc">\n  <div class="display" id="display">0</div>\n  <div class="buttons">\n    <button class="clear" onclick="clearDisplay()">C</button>\n    <button onclick="append(\'%\')">%</button>\n    <button onclick="backspace()">⌫</button>\n    <button class="op" onclick="append(\'/\')">÷</button>\n    <button onclick="append(\'7\')">7</button>\n    <button onclick="append(\'8\')">8</button>\n    <button onclick="append(\'9\')">9</button>\n    <button class="op" onclick="append(\'*\')">×</button>\n    <button onclick="append(\'4\')">4</button>\n    <button onclick="append(\'5\')">5</button>\n    <button onclick="append(\'6\')">6</button>\n    <button class="op" onclick="append(\'-\')">−</button>\n    <button onclick="append(\'1\')">1</button>\n    <button onclick="append(\'2\')">2</button>\n    <button onclick="append(\'3\')">3</button>\n    <button class="op" onclick="append(\'+\')">+</button>\n    <button class="zero" onclick="append(\'0\')">0</button>\n    <button onclick="append(\'.\')">.</button>\n    <button class="equals" onclick="calculate()">=</button>\n  </div>\n</div>', css: '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  background: #1e1e2e;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\nh1 {\n  color: #cdd6f4;\n  text-align: center;\n  margin-bottom: 16px;\n  font-size: 24px;\n}\n.calc {\n  background: #313244;\n  padding: 24px;\n  border-radius: 20px;\n  box-shadow: 0 20px 60px rgba(0,0,0,0.5);\n  width: 340px;\n}\n.display {\n  background: #1e1e2e;\n  color: #cdd6f4;\n  font-size: 36px;\n  font-weight: bold;\n  padding: 20px 16px;\n  text-align: right;\n  border-radius: 12px;\n  margin-bottom: 16px;\n  min-height: 80px;\n  word-break: break-all;\n  font-family: "Courier New", monospace;\n}\n.buttons {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 8px;\n}\nbutton {\n  padding: 16px;\n  font-size: 20px;\n  border: none;\n  border-radius: 12px;\n  background: #45475a;\n  color: #cdd6f4;\n  cursor: pointer;\n  transition: all 0.15s;\n  font-weight: 600;\n}\nbutton:hover { background: #585b70; transform: scale(0.95); }\nbutton:active { transform: scale(0.9); }\n.op { background: #f9e2af; color: #1e1e2e; }\n.op:hover { background: #f9e2af; opacity: 0.8; }\n.equals { background: #89b4fa; color: #1e1e2e; }\n.equals:hover { background: #89b4fa; opacity: 0.8; }\n.clear { background: #f38ba8; color: #1e1e2e; }\n.clear:hover { background: #f38ba8; opacity: 0.8; }\n.zero { grid-column: span 2; }', js: 'let expression = "";\n\nfunction append(value) {\n  expression += value;\n  document.getElementById("display").textContent = expression || "0";\n}\n\nfunction clearDisplay() {\n  expression = "";\n  document.getElementById("display").textContent = "0";\n}\n\nfunction backspace() {\n  expression = expression.slice(0, -1);\n  document.getElementById("display").textContent = expression || "0";\n}\n\nfunction calculate() {\n  try {\n    const result = Function(\'"use strict"; return (\' + expression + \')\')();\n    document.getElementById("display").textContent = result;\n    expression = String(result);\n  } catch {\n    document.getElementById("display").textContent = "Error";\n    expression = "";\n  }\n}' },
    content: 'Combine HTML forms, CSS styling, and JavaScript math functions to build a working calculator. Use `parseInt()` to convert text to numbers and display results in real time.' },
]

const AI_LESSONS: Lesson[] = [
  { id: 1, title: 'What is AI?', description: 'Understand artificial intelligence', difficulty: 'Beginner', content: 'AI is a computer program that can learn from examples and make decisions. Just like you learned to recognise cats by seeing many cats, an AI can too — but it needs thousands of examples!' },
  { id: 2, title: 'How Machines Learn', description: 'Training and patterns', difficulty: 'Beginner', content: 'Machines learn by looking at lots of examples and finding patterns. A spam filter learns which emails are spam by studying thousands of examples of spam and non-spam emails.' },
  { id: 3, title: 'Image Recognition', description: 'Teaching AI to see', difficulty: 'Intermediate', content: 'Tools like Teachable Machine (teachablemachine.withgoogle.com) let you train an AI to recognise images using your webcam — no code needed! Try training it to recognise hand gestures.' },
  { id: 4, title: 'Natural Language', description: 'AI that understands text', difficulty: 'Intermediate', content: 'AI can understand and generate human language. This is how chatbots, translation apps, and voice assistants work. They are trained on millions of sentences from books and websites.' },
  { id: 5, title: 'AI & Ethics', description: 'Using AI responsibly', difficulty: 'Advanced', content: 'AI can have biases if it is trained on biased data. It is important to ask: Is this fair? Is it accurate? Who benefits and who might be harmed? AI is a tool — humans must use it wisely.' },
  { id: 6, title: 'Build an AI Project', description: 'Create with AI tools', difficulty: 'Advanced', content: 'Use Teachable Machine, MIT App Inventor, or Scratch AI extensions to build a real project — a sign-language translator, a plant identifier, or an AI storyteller.' },
]

// ── Advanced Programming (Python, DSA, APIs) ──
const ADVANCED_LESSONS: Lesson[] = [
  { id: 1, title: 'Python Basics', description: 'Variables, data types & input/output', difficulty: 'Beginner',
    content: '```python\n# Variables hold data\nname = "Alice"\nage = 12\nheight = 1.45\n\n# Print to console\nprint(f"{name} is {age} years old")\n\n# Get user input\nname = input("What\\\'s your name? ")\nprint(f"Hello, {name}!")\n```\nPython uses `print()` to output text and `input()` to get user input. Variables don\'t need a type declaration.' },
  { id: 2, title: 'Conditionals & Loops', description: 'If/else logic and for/while loops', difficulty: 'Beginner',
    content: '```python\n# Conditional statements\nscore = 85\nif score >= 80:\n    grade = "A"\nelif score >= 60:\n    grade = "B"\nelse:\n    grade = "C"\n\n# For loop — repeat for each item\nfor i in range(1, 6):\n    print(f"Step {i}")\n\n# While loop — repeat until condition\ncount = 5\nwhile count > 0:\n    print(f"{count}...")\n    count -= 1\nprint("Go!")\n```' },
  { id: 3, title: 'Lists & Dictionaries', description: 'Store collections of data', difficulty: 'Intermediate',
    content: '```python\n# Lists — ordered collections\nfruits = ["apple", "banana", "cherry"]\nfruits.append("orange")\nfor fruit in fruits:\n    print(fruit)\n\n# Dictionaries — key-value pairs\nstudent = {\n    "name": "Alice",\n    "age": 12,\n    "subjects": ["Math", "Science"]\n}\nprint(student["name"])\nprint(student["subjects"][0])\n\n# List comprehension — concise loops\nsquares = [x**2 for x in range(10)]\nprint(squares)\n```\nLists use `[]`, dictionaries use `{}` with key:value pairs. Both are mutable.' },
  { id: 4, title: 'Functions & Modules', description: 'Reusable code and imports', difficulty: 'Intermediate',
    content: '```python\n# Define a function\ndef greet(name):\n    """Return a greeting message"""\n    return f"Hello, {name}!"\n\n# Call the function\nmessage = greet("Alice")\nprint(message)\n\n# Function with default parameter\ndef power(base, exp=2):\n    return base ** exp\n\nprint(power(5))    # 25\nprint(power(5, 3)) # 125\n\n# Import modules\nimport math\nprint(math.sqrt(16))    # 4.0\nprint(math.pi)          # 3.14159...\n\nfrom random import randint\nprint(randint(1, 10))   # Random number 1-10\n```\nFunctions let you reuse code. Modules add extra functionality.' },
  { id: 5, title: 'Data Structures', description: 'Stacks, queues, sorting & searching', difficulty: 'Advanced',
    content: '```python\n# Stack (LIFO) using a list\nstack = []\nstack.append("A")   # push\nstack.append("B")\nstack.append("C")\ntop = stack.pop()   # -> "C"\nprint(f"Stack: {stack}, Popped: {top}")\n\n# Queue (FIFO) using collections\nfrom collections import deque\nqueue = deque(["A", "B", "C"])\nfirst = queue.popleft()  # -> "A"\nprint(f"Queue: {queue}, Removed: {first}")\n\n# Bubble sort\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nprint(bubble_sort([64, 34, 25, 12, 22, 11, 90]))\n\n# Binary search\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9, 11], 7))  # -> 3\n```' },
  { id: 6, title: 'APIs & Real-World Projects', description: 'Fetch data, build a calculator with file I/O', difficulty: 'Advanced',
    content: '```python\n# Fetch data from an API\nimport requests\n\nresponse = requests.get("https://api.example.com/data")\nif response.status_code == 200:\n    data = response.json()\n    print(data)\n\n# Build a simple calculator\ndef calculator():\n    ops = {"+": lambda a,b: a+b, "-": lambda a,b: a-b,\n           "*": lambda a,b: a*b, "/": lambda a,b: a/b}\n    \n    a = float(input("Enter first number: "))\n    op = input("Enter operator (+,-,*,/): ")\n    b = float(input("Enter second number: "))\n    \n    if op in ops:\n        print(f"Result: {ops[op](a, b)}")\n    else:\n        print("Invalid operator")\n\ncalculator()\n\n# File I/O\nwith open("notes.txt", "w") as f:\n    f.write("Hello from Python!\\n")\n\nwith open("notes.txt", "r") as f:\n    content = f.read()\n    print(content)\n```\nAPIs let your code talk to other services. File I/O persists data between runs.' },
]

const TRACKS = [
  {
    id: 'scratch' as Track,
    title: 'Scratch Programming',
    subtitle: 'Block-based coding · Grades 1–12',
    desc: 'Build games and animations using colourful blocks — no typing needed.',
    icon: Gamepad2,
    grad: 'from-blue-600 to-indigo-600',
    bg:   'bg-blue-50',
    lessons: SCRATCH_LESSONS,
  },
  {
    id: 'web' as Track,
    title: 'Web Development',
    subtitle: 'HTML, CSS & JavaScript',
    desc: 'Create real websites from scratch and make them interactive with code.',
    icon: Globe,
    grad: 'from-green-600 to-emerald-600',
    bg:   'bg-green-50',
    lessons: WEB_LESSONS,
  },
  {
    id: 'ai-kids' as Track,
    title: 'AI for Kids',
    subtitle: 'Understand & create with AI',
    desc: 'Learn how artificial intelligence works and build your own AI projects.',
    icon: Brain,
    grad: 'from-purple-600 to-pink-600',
    bg:   'bg-purple-50',
    lessons: AI_LESSONS,
  },
  {
    id: 'advanced' as Track,
    title: 'Advanced Programming',
    subtitle: 'Python · Data Structures · APIs',
    desc: 'Level up with real programming languages, algorithms, and real-world projects.',
    icon: Terminal,
    grad: 'from-cyan-600 to-teal-600',
    bg:   'bg-cyan-50',
    lessons: ADVANCED_LESSONS,
  },
]

/* ─────────────────────────── AI Tutor Drawer wiring ─────────────────── */
// The old inline ChatContainer-based AITutorPanel has been replaced by the reusable
// <AICodingTutorDrawer /> so the coding tutor is persistent, context-aware, and shared
// across every track. The mapping below reconciles the page's track ids
// ("scratch" | "web" | "ai-kids" | "advanced") with the drawer's track taxonomy
// ("scratch" | "web-dev" | "ai-for-kids" | "python").
const DRAWER_TRACK: Record<Track, CodingTrackId> = {
  scratch: 'scratch',
  web: 'web-dev',
  'ai-kids': 'ai-for-kids',
  advanced: 'python',
}

const trackBadge: Record<string, string> = {
  scratch: 'bg-blue-100 text-blue-700',
  web: 'bg-emerald-100 text-emerald-700',
  'ai-kids': 'bg-purple-100 text-purple-700',
  advanced: 'bg-cyan-100 text-cyan-700',
}

function AITutorDrawer({ track, lesson, activeCode, errorLogs }: { track: Track; lesson: Lesson; activeCode: string; errorLogs: string[] }) {
  return (
    <AICodingTutorDrawer
      trackId={DRAWER_TRACK[track]}
      lessonId={lesson.title}
      activeCode={activeCode}
      errorLogs={errorLogs}
    />
  )
}

/* ─────────────────────────── Lesson View ───────────────────── */
function LessonView({ lesson, track, onBack }: { lesson: Lesson; track: typeof TRACKS[0]; onBack: () => void }) {
  const Icon = track.icon

  const showPlayground = track.id === 'web' && lesson.starterCode
  const showScratch = track.id === 'scratch'

  // Live code + preview errors shared with the persistent coding tutor.
  const [activeCode, setActiveCode] = useState('')
  const [previewErrors, setPreviewErrors] = useState<string[]>([])

  const drawer = (
    <AITutorDrawer
      track={track.id}
      lesson={lesson}
      activeCode={activeCode}
      errorLogs={previewErrors}
    />
  )

  if (showPlayground) {
    return (
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className={`p-5 bg-gradient-to-r ${track.grad} rounded-2xl`}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to lessons
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trackBadge[track.id]}`}>{lesson.difficulty}</span>
                </div>
                <p className="text-white/80 text-sm">{lesson.description}</p>
              </div>
            </div>
          </div>

          {lesson.starterCode && (
            <CodePlayground
              title={lesson.title}
              files={[
                { name: 'index.html', language: 'html', content: lesson.starterCode.html ?? '' },
                { name: 'style.css', language: 'css', content: lesson.starterCode.css ?? '' },
                { name: 'script.js', language: 'javascript', content: lesson.starterCode.js ?? '' },
              ]}
              onCodeChange={(files) => setActiveCode(files.map(f => `// ---- ${f.name} ----\n${f.content}`).join('\n\n'))}
              onPreviewError={(err) => setPreviewErrors(prev => [...prev.slice(-4), err])}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <MarkdownRenderer content={lesson.content} />
          </div>
        </div>

        {drawer}
      </div>
    )
  }

  if (showScratch) {
    return (
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto">
          <div className={`p-5 bg-gradient-to-r ${track.grad} rounded-2xl`}>
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to lessons
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trackBadge[track.id]}`}>{lesson.difficulty}</span>
                </div>
                <p className="text-white/80 text-sm">{lesson.description}</p>
              </div>
            </div>
          </div>

          <ScratchEmbed title={`Practice: ${lesson.title}`} />

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <MarkdownRenderer content={lesson.content} />
          </div>
        </div>

        {drawer}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="min-w-0 flex-1 bg-white rounded-2xl border border-slate-200 overflow-y-auto">
        <div className={`p-5 bg-gradient-to-r ${track.grad} rounded-t-2xl`}>
          <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to lessons
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trackBadge[track.id]}`}>{lesson.difficulty}</span>
              </div>
              <p className="text-white/80 text-sm">{lesson.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <MarkdownRenderer content={lesson.content} />

          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">Pro Tip</p>
            </div>
            <p className="text-amber-700 text-sm">
              Stuck? Use the AI tutor on the right — ask it to explain anything step by step, or send it your code for a bug check.
            </p>
          </div>
        </div>
      </div>

      {drawer}
    </div>
  )
}

/* ─────────────────────────── Track View ───────────────────── */
function TrackView({ track, onBack }: { track: typeof TRACKS[0]; onBack: () => void }) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const Icon = track.icon

  if (activeLesson) {
    return <LessonView lesson={activeLesson} track={track} onBack={() => setActiveLesson(null)} />
  }

  const diffColor = (d: string) => {
    if (d === 'Beginner')     return 'bg-green-100 text-green-700'
    if (d === 'Intermediate') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.grad} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-lg">{track.title}</h2>
          <p className="text-slate-500 text-sm">{track.subtitle}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {track.lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            onClick={() => setActiveLesson(lesson)}
            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${diffColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">{lesson.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-3">{lesson.description}</p>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              Start lesson <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Main Page ─────────────────────── */
export default function CodingStudioPage() {
  const { data: session } = useSession()
  const [activeTrack, setActiveTrack] = useState<typeof TRACKS[0] | null>(null)

  if (activeTrack) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <TrackView track={activeTrack} onBack={() => setActiveTrack(null)} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Code2 className="h-3 w-3" /> AI Coding Studio
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Learn to Code with{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Guidance
          </span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Pick a track, work through hands-on lessons, and get instant help from your AI coding tutor at every step.
        </p>
      </div>

      {/* Track cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TRACKS.map(track => {
          const Icon = track.icon
          return (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${track.grad} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg mb-1">{track.title}</h2>
              <p className="text-xs text-slate-400 font-medium mb-2">{track.subtitle}</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{track.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{track.lessons.length} lessons</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Start <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feature highlights */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: 'AI Pair Programmer',   desc: 'Get step-by-step guidance without being given the answer' },
          { icon: Target,   title: 'Curriculum-Aligned',   desc: 'Covers CBC, Cambridge and STEM coding standards'         },
          { icon: Zap,      title: 'Learn by Doing',       desc: 'Every lesson includes a live practice environment'       },
        ].map(f => (
          <div key={f.title} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
              <f.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{f.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
