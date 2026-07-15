import { PrismaClient, ResourceType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding resources...')

  // Find the student
  const student = await prisma.student.findFirst({
    where: {
      user: {
        firstName: 'Rael',
        lastName: 'Wanjiku'
      }
    },
    include: {
      teacher: true
    }
  })

  if (!student) {
    console.log('❌ Student not found. Please run the main seed script first.')
    return
  }

  // Create sample AI-generated resources
  const resources = [
    {
      title: 'Introduction to Algebra - Basic Concepts',
      content: `# Introduction to Algebra - Basic Concepts

## What is Algebra?
Algebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.

## Key Concepts

### Variables
Variables are symbols (usually letters) that represent unknown numbers.
- Example: In the equation x + 5 = 10, x is a variable

### Constants
Constants are fixed values that don't change.
- Example: In the equation x + 5 = 10, 5 and 10 are constants

### Expressions
An algebraic expression is a combination of variables, constants, and operations.
- Example: 3x + 2y - 7

### Equations
An equation is a statement that two expressions are equal.
- Example: 2x + 3 = 11

## Basic Operations

### Addition and Subtraction
- 3x + 2x = 5x
- 7y - 4y = 3y

### Multiplication
- 3 × 2x = 6x
- 4 × (x + 2) = 4x + 8

### Division
- 6x ÷ 2 = 3x
- (8x + 4) ÷ 4 = 2x + 1

## Practice Problems
1. Simplify: 3x + 2x + 5
2. Solve: x + 7 = 15
3. Evaluate: 2x + 3 when x = 4

## Summary
Algebra helps us solve problems with unknown quantities using variables and equations.`,
      type: 'NOTE',
      subject: 'Mathematics',
      grade: '8',
      tags: ['algebra', 'variables', 'equations', 'mathematics'],
      metadata: {
        difficulty: 'beginner',
        duration: '45 minutes',
        learningObjectives: [
          'Understand what algebra is and why it\'s important',
          'Identify variables, constants, expressions, and equations',
          'Perform basic algebraic operations',
          'Solve simple algebraic equations'
        ],
        prerequisites: ['Basic arithmetic operations', 'Understanding of number properties'],
        keyPoints: [
          'Variables represent unknown numbers',
          'Constants are fixed values',
          'Expressions combine variables and constants with operations',
          'Equations state that two expressions are equal'
        ],
        examples: [
          'x + 5 = 10 (equation with variable x)',
          '3y + 2 (expression with variable y)',
          '2x + 3x = 5x (combining like terms)'
        ],
        practiceQuestions: [
          'What is a variable in algebra?',
          'Simplify: 4x + 3x - 2x',
          'Solve: x - 5 = 12',
          'Evaluate 2x + 1 when x = 3'
        ],
        summary: 'This resource introduces the fundamental concepts of algebra including variables, constants, expressions, and equations, with practical examples and exercises.'
      }
    },
    {
      title: 'Photosynthesis Process - Complete Guide',
      content: `# Photosynthesis Process - Complete Guide

## What is Photosynthesis?
Photosynthesis is the process by which plants convert light energy into chemical energy, producing glucose and oxygen.

## The Process

### Light-Dependent Reactions
1. **Light Absorption**: Chlorophyll absorbs light energy
2. **Water Splitting**: Water molecules are split into hydrogen and oxygen
3. **ATP Formation**: Energy is stored in ATP molecules
4. **NADPH Formation**: Hydrogen combines with NADP+ to form NADPH

### Light-Independent Reactions (Calvin Cycle)
1. **Carbon Fixation**: CO₂ is captured and combined with RuBP
2. **Reduction**: ATP and NADPH provide energy to form glucose
3. **Regeneration**: RuBP is regenerated to continue the cycle

## Chemical Equation
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

## Factors Affecting Photosynthesis

### Light Intensity
- More light = faster photosynthesis (up to a point)
- Too much light can damage chlorophyll

### Carbon Dioxide Concentration
- Higher CO₂ levels increase photosynthesis rate
- Important for greenhouse farming

### Temperature
- Optimal temperature: 20-30°C
- Too hot or too cold slows down the process

### Water Availability
- Essential for the light-dependent reactions
- Water stress reduces photosynthesis

## Importance of Photosynthesis
- Produces oxygen for respiration
- Forms the base of most food chains
- Removes CO₂ from the atmosphere
- Provides energy for life on Earth

## Practice Questions
1. What are the two main stages of photosynthesis?
2. Write the chemical equation for photosynthesis
3. How does light intensity affect photosynthesis?
4. Why is photosynthesis important for life on Earth?`,
      type: 'GUIDE',
      subject: 'Biology',
      grade: '8',
      tags: ['photosynthesis', 'plants', 'biology', 'energy', 'oxygen'],
      metadata: {
        difficulty: 'intermediate',
        duration: '60 minutes',
        learningObjectives: [
          'Explain the process of photosynthesis',
          'Identify the reactants and products',
          'Describe factors affecting photosynthesis',
          'Understand the importance of photosynthesis'
        ],
        prerequisites: ['Basic understanding of plant structure', 'Knowledge of chemical equations'],
        keyPoints: [
          'Photosynthesis converts light energy to chemical energy',
          'Two main stages: light-dependent and light-independent reactions',
          'Produces glucose and oxygen from CO₂ and water',
          'Essential for life on Earth'
        ],
        examples: [
          'Green leaves in sunlight produce oxygen',
          'Plants grow faster with more CO₂',
          'Desert plants adapted to conserve water'
        ],
        practiceQuestions: [
          'What is the main purpose of photosynthesis?',
          'Name the two stages of photosynthesis',
          'What happens to water during photosynthesis?',
          'How does temperature affect photosynthesis?'
        ],
        summary: 'A comprehensive guide to photosynthesis covering the process, chemical equation, factors affecting it, and its importance for life on Earth.'
      }
    },
    {
      title: 'World War II Timeline - Key Events',
      content: `# World War II Timeline - Key Events

## 1939
- **September 1**: Germany invades Poland
- **September 3**: Britain and France declare war on Germany
- **November 30**: Soviet Union invades Finland

## 1940
- **April 9**: Germany invades Denmark and Norway
- **May 10**: Germany invades Netherlands, Belgium, and Luxembourg
- **May 26-June 4**: Dunkirk evacuation
- **June 22**: France surrenders to Germany
- **July 10-October 31**: Battle of Britain
- **September 7**: London Blitz begins

## 1941
- **June 22**: Germany invades Soviet Union (Operation Barbarossa)
- **December 7**: Japan attacks Pearl Harbor
- **December 8**: United States enters the war

## 1942
- **February 15**: Singapore falls to Japan
- **June 4-7**: Battle of Midway
- **August 23**: Battle of Stalingrad begins
- **November 8**: Operation Torch (Allied invasion of North Africa)

## 1943
- **February 2**: German surrender at Stalingrad
- **July 10**: Allied invasion of Sicily
- **September 8**: Italy surrenders

## 1944
- **June 6**: D-Day (Operation Overlord)
- **August 25**: Liberation of Paris
- **December 16**: Battle of the Bulge begins

## 1945
- **February 4-11**: Yalta Conference
- **April 30**: Hitler commits suicide
- **May 8**: Victory in Europe (V-E Day)
- **August 6**: Atomic bomb dropped on Hiroshima
- **August 9**: Atomic bomb dropped on Nagasaki
- **September 2**: Japan surrenders (V-J Day)

## Major Consequences
- Over 70 million people killed
- Holocaust: 6 million Jews murdered
- Cold War begins
- United Nations established
- Decolonization begins
- Nuclear age begins

## Key Figures
- **Adolf Hitler**: German dictator
- **Winston Churchill**: British Prime Minister
- **Franklin D. Roosevelt**: US President
- **Joseph Stalin**: Soviet leader
- **Benito Mussolini**: Italian dictator`,
      type: 'TIMELINE',
      subject: 'History',
      grade: '8',
      tags: ['world war ii', 'timeline', 'history', 'war', 'events'],
      metadata: {
        difficulty: 'intermediate',
        duration: '40 minutes',
        learningObjectives: [
          'Chronologically order major WWII events',
          'Identify key battles and turning points',
          'Understand the global scope of the war',
          'Recognize the consequences of WWII'
        ],
        prerequisites: ['Basic knowledge of 20th century history', 'Understanding of cause and effect'],
        keyPoints: [
          'War lasted from 1939-1945',
          'Global conflict involving most world powers',
          'Major turning points: Pearl Harbor, Stalingrad, D-Day',
          'Ended with atomic bombings of Japan'
        ],
        examples: [
          'D-Day marked the beginning of the end for Nazi Germany',
          'Battle of Stalingrad was a major turning point',
          'Pearl Harbor brought the US into the war'
        ],
        practiceQuestions: [
          'When did WWII begin and end?',
          'What was the significance of D-Day?',
          'Which event brought the US into WWII?',
          'What were the consequences of WWII?'
        ],
        summary: 'A comprehensive timeline of World War II covering major events, battles, and consequences from 1939-1945.'
      }
    }
  ]

  for (const resourceData of resources) {
    await prisma.resource.create({
      data: {
        ...resourceData,
        isPublic: true,
        isAIGenerated: true,
        studentId: student.id,
        teacherId: student.teacherId ?? "",
        type: resourceData.type as ResourceType
      }
    })
  }

  console.log('✅ Resources seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding resources:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
