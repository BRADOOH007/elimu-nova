/* eslint-disable */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding lesson plans and shared content...')

  // Find a teacher to create lesson plans
  const teacher = await prisma.teacher.findFirst({
    include: { user: true }
  })

  if (!teacher) {
    console.log('❌ No teacher found. Please seed users first.')
    return
  }

  // Find a student to share lesson plans with
  const student = await prisma.student.findFirst({
    include: { user: true }
  })

  if (!student) {
    console.log('❌ No student found. Please seed users first.')
    return
  }

  // Create sample lesson plans
  const lessonPlans = [
    {
      title: 'Introduction to Algebra',
      subject: 'Mathematics',
      grade: 'Grade 8',
      content: JSON.stringify({
        generatedContent: `# Introduction to Algebra

## Learning Objectives
- Understand what variables are and how they work
- Learn to solve simple linear equations
- Apply algebraic thinking to word problems

## What is Algebra?
Algebra is a branch of mathematics that uses symbols (usually letters) to represent numbers in equations and formulas. These symbols are called variables.

### Key Concepts
1. **Variables**: Letters that represent unknown numbers (x, y, z)
2. **Constants**: Fixed numbers (5, 10, -3)
3. **Expressions**: Combinations of variables and constants (x + 5, 2y - 3)
4. **Equations**: Mathematical statements with an equals sign (x + 5 = 10)

## Solving Simple Equations
To solve an equation, we need to find the value of the variable that makes the equation true.

### Example 1: x + 5 = 10
- Subtract 5 from both sides: x + 5 - 5 = 10 - 5
- Simplify: x = 5
- Check: 5 + 5 = 10 ✓

### Example 2: 2x = 8
- Divide both sides by 2: 2x ÷ 2 = 8 ÷ 2
- Simplify: x = 4
- Check: 2 × 4 = 8 ✓

## Practice Problems
1. Solve: x + 3 = 7
2. Solve: 3x = 15
3. Solve: x - 4 = 9

## Word Problems
Algebra helps us solve real-world problems by translating them into equations.

**Example**: Sarah has 12 apples. She gives some to her friends and has 7 left. How many did she give away?

- Let x = number of apples given away
- Equation: 12 - x = 7
- Solve: x = 5
- Answer: Sarah gave away 5 apples

## Summary
Algebra is a powerful tool for solving problems with unknown numbers. By using variables and following systematic steps, we can find solutions to complex problems.`
      }),
      teacherId: teacher.id
    },
    {
      title: 'Photosynthesis Process',
      subject: 'Science',
      grade: 'Grade 8',
      content: JSON.stringify({
        generatedContent: `# Photosynthesis Process

## Learning Objectives
- Explain what photosynthesis is and why it's important
- Identify the reactants and products of photosynthesis
- Understand the role of chlorophyll in the process
- Describe the two main stages of photosynthesis

## What is Photosynthesis?
Photosynthesis is the process by which plants convert light energy from the sun into chemical energy in the form of glucose (sugar). This process is essential for life on Earth.

### The Photosynthesis Equation
**6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂**

- **Reactants**: Carbon dioxide (CO₂) and Water (H₂O)
- **Products**: Glucose (C₆H₁₂O₆) and Oxygen (O₂)
- **Energy Source**: Sunlight

## The Two Stages of Photosynthesis

### Stage 1: Light-Dependent Reactions
- Occurs in the thylakoids of chloroplasts
- Chlorophyll absorbs light energy
- Water molecules are split (photolysis)
- Oxygen is released as a byproduct
- ATP and NADPH are produced

### Stage 2: Light-Independent Reactions (Calvin Cycle)
- Occurs in the stroma of chloroplasts
- Uses ATP and NADPH from Stage 1
- Carbon dioxide is fixed into glucose
- No light required (but needs products from Stage 1)

## The Role of Chlorophyll
Chlorophyll is the green pigment in plant leaves that:
- Absorbs light energy from the sun
- Is located in chloroplasts
- Gives plants their green color
- Is essential for photosynthesis

## Factors Affecting Photosynthesis
1. **Light Intensity**: More light = more photosynthesis (up to a point)
2. **Carbon Dioxide**: More CO₂ = more photosynthesis
3. **Temperature**: Optimal temperature for enzyme activity
4. **Water**: Essential for the process

## Importance of Photosynthesis
- Produces oxygen for respiration
- Removes carbon dioxide from atmosphere
- Forms the base of most food chains
- Provides energy for almost all life on Earth

## Summary
Photosynthesis is a vital process that converts light energy into chemical energy, producing oxygen and glucose while removing carbon dioxide from the atmosphere.`
      }),
      teacherId: teacher.id
    },
    {
      title: 'Creative Writing Techniques',
      subject: 'English',
      grade: 'Grade 8',
      content: JSON.stringify({
        generatedContent: `# Creative Writing Techniques

## Learning Objectives
- Identify and apply various creative writing techniques
- Develop compelling characters and settings
- Create engaging dialogue and narrative structure
- Use literary devices effectively

## Essential Creative Writing Techniques

### 1. Show, Don't Tell
Instead of telling readers what's happening, show them through actions, dialogue, and sensory details.

**Telling**: "Sarah was angry."
**Showing**: "Sarah's hands clenched into fists, her face turned red, and she slammed the door behind her."

### 2. Character Development
Create believable, three-dimensional characters with:
- **Physical Description**: What they look like
- **Personality Traits**: How they behave
- **Background**: Their history and experiences
- **Motivations**: What drives them
- **Flaws**: Imperfections that make them human

### 3. Setting and Atmosphere
- Use all five senses to describe the environment
- Create mood through weather, lighting, and details
- Make the setting integral to the story

### 4. Dialogue
- Make each character's voice unique
- Use dialogue to reveal character and advance plot
- Keep it natural and purposeful
- Use tags and action beats effectively

### 5. Plot Structure
**Three-Act Structure**:
- **Act 1**: Setup and inciting incident
- **Act 2**: Rising action and complications
- **Act 3**: Climax and resolution

### 6. Literary Devices
- **Metaphors and Similes**: Compare unlike things
- **Foreshadowing**: Hint at future events
- **Flashbacks**: Reveal past events
- **Symbolism**: Use objects to represent ideas
- **Irony**: Contrast between expectation and reality

## Writing Exercises

### Exercise 1: Character Creation
Create a character by answering these questions:
- What is their greatest fear?
- What do they want most in the world?
- What is their biggest secret?
- How do they react under pressure?

### Exercise 2: Setting Description
Describe a place using all five senses:
- What do you see, hear, smell, taste, and feel?

### Exercise 3: Dialogue Practice
Write a conversation between two characters where:
- One character is trying to hide something
- The other character is trying to find out the truth
- Use only dialogue (no tags)

## Common Mistakes to Avoid
1. **Overusing adjectives and adverbs**
2. **Writing in passive voice**
3. **Creating perfect characters**
4. **Info-dumping background information**
5. **Using clichés and predictable plots**

## Tips for Improvement
- Read widely in your genre
- Write regularly, even if it's just a little
- Get feedback from others
- Revise and edit your work
- Study the craft of writing

## Summary
Creative writing is about using various techniques to tell compelling stories. Focus on showing rather than telling, developing strong characters, and using literary devices effectively to engage your readers.`
      }),
      teacherId: teacher.id
    }
  ]

  // Create lesson plans
  const createdLessonPlans = []
  for (const lessonPlan of lessonPlans) {
    const created = await prisma.lessonPlan.create({
      data: lessonPlan
    })
    createdLessonPlans.push(created)
    console.log(`✅ Created lesson plan: ${created.title}`)
  }

  // Share lesson plans with the student
  for (const lessonPlan of createdLessonPlans) {
    await prisma.sharedLessonPlan.create({
      data: {
        lessonPlanId: lessonPlan.id,
        studentId: student.id,
        teacherId: teacher.id,
        sharedAt: new Date(),
        isActive: true
      }
    })
    console.log(`✅ Shared lesson plan "${lessonPlan.title}" with student`)
  }

  console.log('🎉 Lesson plans seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding lesson plans:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
