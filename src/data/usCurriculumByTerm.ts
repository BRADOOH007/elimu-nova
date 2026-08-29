/**
 * Comprehensive US Curriculum Data — K-12
 * CCSS Mathematics, CCSS ELA, NGSS Science, C3 Social Studies
 * 52 grade-subject combos
 */

export interface USSubstrand { name: string; description?: string; outcomes: string[] }
export interface USStrand { name: string; description?: string; substrands: USSubstrand[] }
export interface USCurriculumDef { grade: string; subject: string; description: string; strands: USStrand[] }

function mg(num: number, strands: USStrand[]): USCurriculumDef {
  const g = num === 0 ? 'Kindergarten' : `Grade ${num}`
  return { grade: g, subject: 'Mathematics', description: `${g} Mathematics — Common Core State Standards (CCSS)`, strands }
}
function eg(num: number, strands: USStrand[]): USCurriculumDef {
  const g = num === 0 ? 'Kindergarten' : `Grade ${num}`
  return { grade: g, subject: 'English Language Arts', description: `${g} English Language Arts — Common Core State Standards (CCSS)`, strands }
}
function sg(num: number, strands: USStrand[]): USCurriculumDef {
  const g = num === 0 ? 'Kindergarten' : `Grade ${num}`
  return { grade: g, subject: 'Science', description: `${g} Science — Next Generation Science Standards (NGSS)`, strands }
}
function ss(num: number, strands: USStrand[]): USCurriculumDef {
  const g = num === 0 ? 'Kindergarten' : `Grade ${num}`
  return { grade: g, subject: 'Social Studies', description: `${g} Social Studies — C3 Framework for Social Studies State Standards`, strands }
}

// ═══════════════════════════════════════════════════════════════
// MATHEMATICS — CCSS
// ═══════════════════════════════════════════════════════════════

const MATH_K = mg(0, [
  { name: 'Counting and Cardinality', substrands: [
    { name: 'Know number names and the count sequence', outcomes: ['K.CC.A.1: Count to 100 by ones and by tens.', 'K.CC.A.2: Count forward from a given number.', 'K.CC.A.3: Write numbers from 0 to 20.'] },
    { name: 'Count to tell the number of objects', outcomes: ['K.CC.B.4: Understand the relationship between numbers and quantities.', 'K.CC.B.5: Count to answer how many questions up to 20.'] },
    { name: 'Compare numbers', outcomes: ['K.CC.C.6: Identify whether one group has greater, less, or equal number.', 'K.CC.C.7: Compare two numbers between 1 and 10.'] },
  ] },
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Understand addition and subtraction', outcomes: ['K.OA.A.1: Represent addition and subtraction with objects, fingers, drawings.', 'K.OA.A.2: Solve addition and subtraction word problems within 10.', 'K.OA.A.3: Decompose numbers up to 10 into pairs.', 'K.OA.A.5: Fluently add and subtract within 5.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Work with numbers 11-19', outcomes: ['K.NBT.A.1: Compose and decompose numbers from 11 to 19 into ten ones and some further ones.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Describe and compare measurable attributes', outcomes: ['K.MD.A.1: Describe measurable attributes of objects.', 'K.MD.A.2: Directly compare two objects with a measurable attribute.'] },
    { name: 'Classify objects and count', outcomes: ['K.MD.B.3: Classify objects into given categories; count the numbers in each.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Identify and describe shapes', outcomes: ['K.G.A.1: Describe objects using names of shapes.', 'K.G.A.2: Correctly name shapes regardless of orientation or size.', 'K.G.A.3: Identify shapes as 2D or 3D.'] },
    { name: 'Analyze and compose shapes', outcomes: ['K.G.B.4: Analyze and compare 2D and 3D shapes.', 'K.G.B.5: Model shapes by building and drawing.'] },
  ] },
])

const MATH_1 = mg(1, [
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Represent and solve problems', outcomes: ['1.OA.A.1: Use addition and subtraction within 20 to solve word problems.', '1.OA.A.2: Solve problems calling for addition of three numbers within 20.'] },
    { name: 'Properties of operations', outcomes: ['1.OA.B.3: Apply properties of operations as strategies to add and subtract.', '1.OA.B.4: Understand subtraction as an unknown-addend problem.'] },
    { name: 'Add and subtract within 20', outcomes: ['1.OA.C.5: Relate counting to addition and subtraction.', '1.OA.C.6: Add and subtract within 20, fluently within 10.'] },
    { name: 'Equations', outcomes: ['1.OA.D.7: Understand the meaning of the equal sign.', '1.OA.D.8: Determine the unknown number in an equation.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Extend counting and place value', outcomes: ['1.NBT.A.1: Count to 120, starting at any number.', '1.NBT.A.2: Understand tens and ones in a two-digit number.', '1.NBT.B.3: Compare two two-digit numbers.', '1.NBT.C.4: Add within 100 using place value strategies.', '1.NBT.C.5: Find 10 more or 10 less mentally.', '1.NBT.C.6: Subtract multiples of 10.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Measure lengths', outcomes: ['1.MD.A.1: Order three objects by length.', '1.MD.A.2: Express length as a whole number of length units.'] },
    { name: 'Tell and write time', outcomes: ['1.MD.B.3: Tell and write time in hours and half-hours.'] },
    { name: 'Represent and interpret data', outcomes: ['1.MD.C.4: Organize, represent, and interpret data with up to three categories.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Reason with shapes', outcomes: ['1.G.A.1: Distinguish defining vs non-defining attributes.', '1.G.A.2: Compose 2D or 3D shapes into composite shapes.', '1.G.A.3: Partition circles and rectangles into equal shares.'] },
  ] },
])

const MATH_2 = mg(2, [
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Represent and solve problems', outcomes: ['2.OA.A.1: Use addition and subtraction within 100 to solve 1- and 2-step problems.', '2.OA.B.2: Fluently add and subtract within 20 using mental strategies.'] },
    { name: 'Work with equal groups', outcomes: ['2.OA.C.3: Determine odd or even number of objects.', '2.OA.C.4: Use addition to find total in rectangular arrays.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Understand place value', outcomes: ['2.NBT.A.1: Understand hundreds, tens, and ones.', '2.NBT.A.2: Count within 1000; skip-count by 5s, 10s, 100s.', '2.NBT.A.3: Read and write numbers to 1000.', '2.NBT.A.4: Compare two three-digit numbers.'] },
    { name: 'Use place value and properties', outcomes: ['2.NBT.B.5: Add and subtract within 100 using place value.', '2.NBT.B.6: Add up to four two-digit numbers.', '2.NBT.B.7: Add and subtract within 1000.', '2.NBT.B.8: Mentally add 10 or 100.', '2.NBT.B.9: Explain why strategies work.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Measure and estimate lengths', outcomes: ['2.MD.A.1: Measure length using appropriate tools.', '2.MD.A.2: Measure with different units.', '2.MD.A.3: Estimate lengths.', '2.MD.A.4: Determine difference in lengths.'] },
    { name: 'Relate addition/subtraction to length', outcomes: ['2.MD.B.5: Solve length word problems within 100.', '2.MD.B.6: Represent numbers on a number line.'] },
    { name: 'Work with time and money', outcomes: ['2.MD.C.7: Tell time to nearest 5 minutes.', '2.MD.C.8: Solve money word problems.'] },
    { name: 'Represent and interpret data', outcomes: ['2.MD.D.9: Generate measurement data.', '2.MD.D.10: Draw picture and bar graphs.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Reason with shapes', outcomes: ['2.G.A.1: Recognize and draw shapes with specified attributes.', '2.G.A.2: Partition rectangles into rows and columns.', '2.G.A.3: Partition circles and rectangles into equal shares.'] },
  ] },
])

const MATH_3 = mg(3, [
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Multiply and divide within 100', outcomes: ['3.OA.A.1: Interpret products of whole numbers.', '3.OA.A.2: Interpret quotients of whole numbers.', '3.OA.A.3: Use multiplication and division within 100 to solve problems.', '3.OA.A.4: Determine unknown number in multiplication/division equation.', '3.OA.B.5: Apply properties of operations.', '3.OA.B.6: Division as unknown-factor problem.', '3.OA.C.7: Fluently multiply and divide within 100.'] },
    { name: 'Solve problems with four operations', outcomes: ['3.OA.D.8: Solve two-step problems using four operations.', '3.OA.D.9: Identify arithmetic patterns.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Use place value for multi-digit arithmetic', outcomes: ['3.NBT.A.1: Round to nearest 10 or 100.', '3.NBT.A.2: Fluently add and subtract within 1000.', '3.NBT.A.3: Multiply one-digit numbers by multiples of 10.'] },
  ] },
  { name: 'Number and Operations—Fractions', substrands: [
    { name: 'Understand fractions as numbers', outcomes: ['3.NF.A.1: Understand fraction 1/b.', '3.NF.A.2: Represent fractions on a number line.', '3.NF.A.3: Explain equivalence and compare fractions.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Solve measurement problems', outcomes: ['3.MD.A.1: Tell time to nearest minute; measure time intervals.', '3.MD.A.2: Measure and estimate liquid volumes and masses.', '3.MD.B.3: Draw scaled picture and bar graphs.', '3.MD.B.4: Generate measurement data on line plots.', '3.MD.C.5: Understand concepts of area.', '3.MD.C.6: Measure areas by counting unit squares.', '3.MD.C.7: Relate area to multiplication and addition.', '3.MD.D.8: Solve perimeter problems.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Reason with shapes', outcomes: ['3.G.A.1: Shapes in different categories may share attributes.', '3.G.A.2: Partition shapes into equal areas.'] },
  ] },
])

const MATH_4 = mg(4, [
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Use the four operations', outcomes: ['4.OA.A.1: Interpret multiplication as comparison.', '4.OA.A.2: Solve multiplicative comparison problems.', '4.OA.A.3: Solve multistep word problems.', '4.OA.B.4: Find factor pairs for numbers 1-100.', '4.OA.C.5: Generate and analyze patterns.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Generalize place value', outcomes: ['4.NBT.A.1: Digit represents ten times the place to its right.', '4.NBT.A.2: Read, write, and compare multi-digit numbers.', '4.NBT.A.3: Round multi-digit numbers.', '4.NBT.B.4: Fluently add and subtract multi-digit numbers.', '4.NBT.B.5: Multiply up to four digits by one digit.', '4.NBT.B.6: Find quotients with remainders.'] },
  ] },
  { name: 'Number and Operations—Fractions', substrands: [
    { name: 'Fraction equivalence and ordering', outcomes: ['4.NF.A.1: Explain fraction equivalence.', '4.NF.A.2: Compare fractions with different numerators/denominators.', '4.NF.B.3: Understand fractions greater than 1 as sums of unit fractions.', '4.NF.B.4: Multiply fraction by whole number.', '4.NF.C.5: Express fractions with denominator 10 as equivalent to 100.', '4.NF.C.6: Use decimal notation for fractions.', '4.NF.C.7: Compare decimals to hundredths.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Measurement and data', outcomes: ['4.MD.A.1: Know relative sizes of measurement units.', '4.MD.A.2: Solve measurement word problems.', '4.MD.A.3: Apply area and perimeter formulas.', '4.MD.B.4: Make line plots with fraction data.', '4.MD.C.5: Recognize angles as geometric shapes.', '4.MD.C.6: Measure angles with protractor.', '4.MD.C.7: Recognize angle measure as additive.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Lines, angles, and shapes', outcomes: ['4.G.A.1: Draw points, lines, rays, angles, perpendicular/parallel lines.', '4.G.A.2: Classify 2D figures.', '4.G.A.3: Recognize lines of symmetry.'] },
  ] },
])

const MATH_5 = mg(5, [
  { name: 'Operations and Algebraic Thinking', substrands: [
    { name: 'Expressions and patterns', outcomes: ['5.OA.A.1: Use parentheses in expressions.', '5.OA.A.2: Write simple expressions.', '5.OA.B.3: Generate numerical patterns and identify relationships.'] },
  ] },
  { name: 'Number and Operations in Base Ten', substrands: [
    { name: 'Place value system', outcomes: ['5.NBT.A.1: Digit represents 10x the place to its right.', '5.NBT.A.2: Patterns in zeros when multiplying by powers of 10.', '5.NBT.A.3: Read, write, compare decimals to thousandths.', '5.NBT.A.4: Round decimals.', '5.NBT.B.5: Fluently multiply multi-digit numbers.', '5.NBT.B.6: Find whole-number quotients.', '5.NBT.B.7: Operate with decimals to hundredths.'] },
  ] },
  { name: 'Number and Operations—Fractions', substrands: [
    { name: 'Fraction operations', outcomes: ['5.NF.A.1: Add/subtract fractions with unlike denominators.', '5.NF.A.2: Solve fraction word problems.', '5.NF.B.3: Interpret fraction as division.', '5.NF.B.4: Multiply fractions.', '5.NF.B.5: Interpret multiplication as scaling.', '5.NF.B.6: Solve real-world fraction multiplication problems.', '5.NF.B.7: Divide unit fractions.'] },
  ] },
  { name: 'Measurement and Data', substrands: [
    { name: 'Volume and data', outcomes: ['5.MD.A.1: Convert measurement units.', '5.MD.B.2: Make line plots with fractions.', '5.MD.C.3: Recognize volume as an attribute.', '5.MD.C.4: Measure volumes by counting unit cubes.', '5.MD.C.5: Relate volume to multiplication and addition.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Coordinate plane and classification', outcomes: ['5.G.A.1: Define a coordinate system.', '5.G.A.2: Graph points in the first quadrant.', '5.G.B.3: Attributes of categories and subcategories.', '5.G.B.4: Classify figures in a hierarchy.'] },
  ] },
])

const MATH_6 = mg(6, [
  { name: 'Ratios and Proportional Relationships', substrands: [
    { name: 'Ratio concepts', outcomes: ['6.RP.A.1: Understand and use ratio language.', '6.RP.A.2: Understand unit rate.', '6.RP.A.3: Use ratio reasoning to solve problems.'] },
  ] },
  { name: 'The Number System', substrands: [
    { name: 'Rational numbers', outcomes: ['6.NS.A.1: Interpret and compute quotients of fractions.', '6.NS.B.2: Fluently divide multi-digit numbers.', '6.NS.B.3: Fluently operate with multi-digit decimals.', '6.NS.B.4: Find GCF and LCM.', '6.NS.C.5: Understand positive and negative numbers.', '6.NS.C.6: Understand rational numbers on the number line.', '6.NS.C.7: Order and absolute value of rational numbers.', '6.NS.C.8: Graph points in all four quadrants.'] },
  ] },
  { name: 'Expressions and Equations', substrands: [
    { name: 'Algebraic expressions and equations', outcomes: ['6.EE.A.1: Evaluate expressions with whole-number exponents.', '6.EE.A.2: Write, read, and evaluate expressions.', '6.EE.A.3: Apply properties to generate equivalent expressions.', '6.EE.A.4: Identify equivalent expressions.', '6.EE.B.5: Understand solving as answering a question.', '6.EE.B.6: Use variables to represent numbers.', '6.EE.B.7: Solve equations of the form x + p = q.', '6.EE.B.8: Write inequalities.', '6.EE.C.9: Use variables to represent two quantities in a real-world problem.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Area, surface area, and volume', outcomes: ['6.G.A.1: Find area of triangles, trapezoids, and other polygons.', '6.G.A.2: Find volume of right rectangular prisms with fractional edges.', '6.G.A.3: Draw polygons in the coordinate plane.', '6.G.A.4: Represent 3D figures using nets.'] },
  ] },
  { name: 'Statistics and Probability', substrands: [
    { name: 'Statistical variability', outcomes: ['6.SP.A.1: Recognize a statistical question.', '6.SP.A.2: Understand data distribution.', '6.SP.A.3: Recognize measures of center and variation.', '6.SP.B.4: Display data on number line, dot plots, histograms, box plots.', '6.SP.B.5: Summarize numerical data sets.'] },
  ] },
])

const MATH_7 = mg(7, [
  { name: 'Ratios and Proportional Relationships', substrands: [
    { name: 'Proportional relationships', outcomes: ['7.RP.A.1: Compute unit rates associated with ratios of fractions.', '7.RP.A.2: Recognize and represent proportional relationships.', '7.RP.A.3: Use proportional relationships to solve multistep ratio and percent problems.'] },
  ] },
  { name: 'The Number System', substrands: [
    { name: 'Operations with rational numbers', outcomes: ['7.NS.A.1: Add, subtract, multiply, and divide rational numbers.', '7.NS.A.2: Apply properties of operations with rational numbers.', '7.NS.A.3: Solve real-world problems with the four operations on rational numbers.'] },
  ] },
  { name: 'Expressions and Equations', substrands: [
    { name: 'Use properties of operations', outcomes: ['7.EE.A.1: Apply properties of operations to add, subtract, factor, and expand linear expressions.', '7.EE.A.2: Rewrite expressions in different forms.', '7.EE.B.3: Solve multi-step real-life problems with positive and negative rational numbers.', '7.EE.B.4: Use variables to represent quantities and construct equations and inequalities.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Scale drawings and cross-sections', outcomes: ['7.G.A.1: Solve problems involving scale drawings.', '7.G.A.2: Draw geometric shapes with given conditions.', '7.G.A.3: Describe 2D figures from slices of 3D figures.', '7.G.B.4: Know and use formulas for area and circumference of a circle.', '7.G.B.5: Use facts about complementary, supplementary, vertical, and adjacent angles.', '7.G.B.6: Solve real-world problems involving area, volume, and surface area.'] },
  ] },
  { name: 'Statistics and Probability', substrands: [
    { name: 'Use random sampling', outcomes: ['7.SP.A.1: Understand statistics as a process for making inferences about populations.', '7.SP.A.2: Use data from a random sample to draw inferences.', '7.SP.B.3: Draw informal comparative inferences about two populations.', '7.SP.B.4: Use measures of center and variability for comparative inferences.', '7.SP.C.5: Understand probability as a number between 0 and 1.', '7.SP.C.6: Approximate probability by collecting data.', '7.SP.C.7: Develop probability models.', '7.SP.C.8: Find probabilities of compound events.'] },
  ] },
])

const MATH_8 = mg(8, [
  { name: 'The Number System', substrands: [
    { name: 'Irrational numbers', outcomes: ['8.NS.A.1: Know that numbers that are not rational are called irrational.', '8.NS.A.2: Use rational approximations of irrational numbers.'] },
  ] },
  { name: 'Expressions and Equations', substrands: [
    { name: 'Expressions and equations', outcomes: ['8.EE.A.1: Know and apply properties of integer exponents.', '8.EE.A.2: Use square and cube roots.', '8.EE.A.3: Use numbers expressed in the form of a single digit times a power of 10.', '8.EE.A.4: Perform operations with numbers in scientific notation.', '8.EE.B.5: Graph proportional relationships and compute unit rate.', '8.EE.B.6: Use similar triangles to explain slope.', '8.EE.C.7: Solve linear equations.', '8.EE.C.8: Analyze and solve pairs of linear equations.'] },
  ] },
  { name: 'Functions', substrands: [
    { name: 'Understand functions', outcomes: ['8.F.A.1: Understand that a function assigns exactly one output to each input.', '8.F.A.2: Compare properties of functions.', '8.F.A.3: Interpret y = mx + b as defining a linear function.', '8.F.B.4: Construct a function to model a linear relationship.', '8.F.B.5: Describe qualitatively the functional relationship between two quantities.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Congruence, similarity, and the Pythagorean theorem', outcomes: ['8.G.A.1: Verify experimentally properties of rotations, reflections, and translations.', '8.G.A.2: Understand congruence in terms of rigid motions.', '8.G.A.3: Describe the effect of dilations, translations, rotations, and reflections.', '8.G.A.4: Understand similarity in terms of transformations.', '8.G.A.5: Establish facts about angle relationships.', '8.G.B.6: Explain the Pythagorean Theorem.', '8.G.B.7: Apply the Pythagorean Theorem to determine unknown side lengths.', '8.G.B.8: Apply the Pythagorean Theorem to find distance on the coordinate plane.', '8.G.C.9: Know formulas for volumes of cones, cylinders, and spheres.'] },
  ] },
  { name: 'Statistics and Probability', substrands: [
    { name: 'Scatter plots and bivariate data', outcomes: ['8.SP.A.1: Construct and interpret scatter plots.', '8.SP.A.2: Informally assess the model fit.', '8.SP.A.3: Use the equation of a linear model to solve problems.', '8.SP.A.4: Construct and interpret two-way tables.'] },
  ] },
])

const MATH_HS = mg(9, [
  { name: 'Number and Quantity', substrands: [
    { name: 'The Real Number System', outcomes: ['HSN-RN.A.1: Explain how the definition of rational exponents follows from integer exponents.', 'HSN-RN.A.2: Rewrite expressions involving radicals and rational exponents.', 'HSN-RN.B.3: Explain why sums and products of rationals are rational, products of a rational and irrational are irrational, sums of a rational and irrational are irrational.'] },
    { name: 'Quantities', outcomes: ['HSN-Q.A.1: Use units to understand problems and guide solutions.', 'HSN-Q.A.2: Define appropriate quantities for descriptive modeling.', 'HSN-Q.A.3: Choose a level of accuracy appropriate to limitations on measurement.'] },
  ] },
  { name: 'Algebra', substrands: [
    { name: 'Seeing Structure in Expressions', outcomes: ['HS-SSE.A.1: Interpret expressions that represent a quantity in context.', 'HS-SSE.A.2: Use the structure of an expression to rewrite it.', 'HS-SSE.B.3: Choose and produce equivalent forms of an expression.', 'HS-SSE.B.4: Derive the formula for the sum of a finite geometric series.'] },
    { name: 'Creating Equations', outcomes: ['HS-A-CED.A.1: Create equations and inequalities in one variable.', 'HS-A-CED.A.2: Create equations in two or more variables.', 'HS-A-CED.A.3: Represent constraints by systems of equations or inequalities.', 'HS-A-CED.A.4: Rearrange formulas to highlight a quantity of interest.'] },
    { name: 'Reasoning with Equations and Inequalities', outcomes: ['HS-A-REI.A.1: Explain each step in solving an equation.', 'HS-A-REI.B.3: Solve linear equations and inequalities in one variable.', 'HS-A-REI.B.4: Solve quadratic equations in one variable.', 'HS-A-REI.C.6: Solve systems of linear equations exactly and approximately.', 'HS-A-REI.D.10: Understand that the graph of an equation in two variables is the set of all its solutions.', 'HS-A-REI.D.12: Graph solutions to a linear inequality in two variables.'] },
  ] },
  { name: 'Functions', substrands: [
    { name: 'Interpreting Functions', outcomes: ['HS-F-IF.A.1: Understand that a function assigns one output to each input.', 'HS-F-IF.A.2: Use function notation, evaluate functions, and interpret statements.', 'HS-F-IF.B.4: Interpret key features of graphs and tables.', 'HS-F-IF.B.5: Relate the domain of a function to its graph and context.', 'HS-F-IF.B.6: Calculate and interpret the average rate of change.', 'HS-F-IF.C.7: Graph functions and show key features.', 'HS-F-IF.C.8: Write functions in different forms to reveal properties.', 'HS-F-IF.C.9: Compare properties of functions represented differently.'] },
    { name: 'Building Functions', outcomes: ['HS-F-BF.A.1: Write a function that describes a relationship.', 'HS-F-BF.A.2: Write arithmetic and geometric sequences.', 'HS-F-BF.B.3: Identify the effect of transformations on graphs.', 'HS-F-BF.B.4: Find inverse functions.'] },
    { name: 'Linear, Quadratic, and Exponential Models', outcomes: ['HS-F-LE.A.1: Distinguish between linear, quadratic, and exponential growth.', 'HS-F-LE.A.2: Construct linear and exponential functions.', 'HS-F-LE.A.3: Observe that a quantity increasing exponentially eventually exceeds linear or polynomial.', 'HS-F-LE.B.5: Interpret parameters in a linear or exponential function.'] },
  ] },
  { name: 'Geometry', substrands: [
    { name: 'Congruence', outcomes: ['HS-G-CO.A.1: Know precise definitions of angle, perpendicular line, line segment, ray, circle.', 'HS-G-CO.A.2: Represent transformations in the plane.', 'HS-G-CO.A.3: Describe rotations and reflections that carry a figure onto itself.', 'HS-G-CO.B.6: Use geometric descriptions of rigid motions to transform figures.', 'HS-G-CO.B.7: Show that two triangles are congruent if and only if corresponding pairs of sides and angles are congruent.', 'HS-G-CO.C.9: Prove theorems about lines and angles.', 'HS-G-CO.C.10: Prove theorems about triangles.', 'HS-G-CO.C.11: Prove theorems about parallelograms.', 'HS-G-CO.D.12: Make formal geometric constructions.'] },
    { name: 'Similarity, Right Triangles, and Trigonometry', outcomes: ['HS-G-SRT.A.1: Verify experimentally the properties of dilations.', 'HS-G-SRT.A.2: Use similarity to decide if two figures are similar.', 'HS-G-SRT.A.3: Establish AA similarity criterion.', 'HS-G-SRT.B.5: Use congruence and similarity criteria for triangles to solve problems.', 'HS-G-SRT.C.6: Understand that trig ratios are side ratios in right triangles.', 'HS-G-SRT.C.8: Use trigonometric ratios to solve right triangles.', 'HS-G-SRT.D.10: Prove the Laws of Sines and Cosines and use them to solve problems.'] },
    { name: 'Expressing Geometric Properties with Equations', outcomes: ['HS-G-GPE.A.1: Derive the equation of a circle.', 'HS-G-GPE.A.2: Derive the equation of a parabola.', 'HS-G-GPE.B.4: Use coordinates to prove simple geometric theorems.', 'HS-G-GPE.B.5: Prove the slope criteria for parallel and perpendicular lines.', 'HS-G-GPE.B.6: Find the point on a directed line segment between two given points.', 'HS-G-GPE.B.7: Use coordinates to compute perimeters and areas.'] },
  ] },
  { name: 'Statistics and Probability', substrands: [
    { name: 'Interpreting Categorical and Quantitative Data', outcomes: ['HS-S-ID.A.1: Represent data with plots on the real number line.', 'HS-S-ID.A.2: Use statistics appropriate to the shape of the data distribution.', 'HS-S-ID.A.3: Interpret differences in shape, center, and spread.', 'HS-S-ID.B.5: Summarize categorical data in two-way frequency tables.', 'HS-S-ID.B.6: Represent data on two quantitative variables.', 'HS-S-ID.C.7: Interpret slope and intercept of a linear model.', 'HS-S-ID.C.8: Compute and interpret the correlation coefficient.', 'HS-S-ID.C.9: Distinguish between correlation and causation.'] },
    { name: 'Making Inferences and Justifying Conclusions', outcomes: ['HS-S-IC.A.1: Understand statistics as a process for making inferences about population parameters.', 'HS-S-IC.A.2: Decide if a specified model is consistent with results from a given data-generating process.', 'HS-S-IC.B.3: Recognize the purposes of and differences among sample surveys, experiments, and observational studies.', 'HS-S-IC.B.4: Use data from a sample survey to estimate a population proportion.', 'HS-S-IC.B.5: Use data from a randomized experiment to compare treatments.', 'HS-S-IC.B.6: Evaluate reports based on data.'] },
  ] },
])

// ═══════════════════════════════════════════════════════════════
// ENGLISH LANGUAGE ARTS — CCSS
// ═══════════════════════════════════════════════════════════════

const ELA_K = eg(0, [
  { name: 'Reading: Literature', substrands: [
    { name: 'Key Ideas and Details', outcomes: ['K.RL.1: Ask and answer questions about key details in a text.', 'K.RL.2: Retell familiar stories including key details.', 'K.RL.3: Identify characters, settings, and major events.'] },
    { name: 'Craft and Structure', outcomes: ['K.RL.4: Ask about unknown words.', 'K.RL.5: Recognize common types of texts.', 'K.RL.6: Name the author and illustrator.'] },
  ] },
  { name: 'Reading: Informational Text', substrands: [
    { name: 'Key Ideas and Details', outcomes: ['K.RI.1: Ask and answer questions about key details.', 'K.RI.2: Identify the main topic and retell key details.', 'K.RI.3: Describe connections between individuals, events, or ideas.'] },
    { name: 'Craft and Structure', outcomes: ['K.RI.4: Ask about unknown words.', 'K.RI.5: Identify the front cover, back cover, and title page.', 'K.RI.6: Name the author and illustrator.'] },
  ] },
  { name: 'Reading: Foundational Skills', substrands: [
    { name: 'Print Concepts and Phonological Awareness', outcomes: ['K.RF.1: Demonstrate understanding of print organization.', 'K.RF.2: Understand spoken words, syllables, and sounds.', 'K.RF.3: Know and apply grade-level phonics and word analysis skills.'] },
  ] },
  { name: 'Writing', substrands: [
    { name: 'Text Types and Purposes', outcomes: ['K.W.1: Use drawing, dictating, and writing for opinion pieces.', 'K.W.2: Use drawing, dictating, and writing for informative texts.', 'K.W.3: Use drawing, dictating, and writing to narrate events.'] },
  ] },
  { name: 'Speaking and Listening', substrands: [
    { name: 'Comprehension and Collaboration', outcomes: ['K.SL.1: Participate in collaborative conversations.', 'K.SL.2: Confirm understanding of text read aloud.', 'K.SL.3: Ask and answer questions to seek help or clarify.'] },
  ] },
  { name: 'Language', substrands: [
    { name: 'Conventions and Vocabulary', outcomes: ['K.L.1: Demonstrate command of standard English grammar.', 'K.L.2: Demonstrate command of capitalization, punctuation, and spelling.', 'K.L.4: Determine or clarify meaning of unknown words.', 'K.L.5: Explore word relationships and nuances.'] },
  ] },
])

function elaGrades(): USCurriculumDef[] {
  const results: USCurriculumDef[] = []
  for (let g = 1; g <= 12; g++) {
    const gradeName = `Grade ${g}`
    const isK2 = g <= 2
    const is35 = g >= 3 && g <= 5
    const is68 = g >= 6 && g <= 8
    const is912 = g >= 9

    const strands: USStrand[] = [
      { name: 'Reading: Literature', substrands: [
        { name: 'Key Ideas and Details', outcomes: [
          `${g}.RL.1: Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for answers.`,
          `${g}.RL.2: Recount or describe the central ideas or key details in a text.`,
          `${g}.RL.3: Describe how characters respond to major events and challenges${is912 ? ' and analyze how complex characters develop over the course of a text' : ''}.`,
        ] },
        { name: 'Craft and Structure', outcomes: [
          `${g}.RL.4: Determine the meaning of words and phrases in context${is912 ? ', including figurative and connotative meanings' : ''}.`,
          `${g}.RL.5: Analyze the overall structure of events, ideas, or information in a text.`,
          `${g}.RL.6: Describe how a narrator's or speaker's point of view influences how events are described.${is912 ? ' Analyze how an author develops and contrasts points of view.' : ''}`,
        ] },
        { name: 'Integration of Knowledge and Ideas', outcomes: [
          `${g}.RL.7: Use information gained from illustrations and words to demonstrate understanding.`,
          `${g}.RL.8: ${isK2 ? 'Identify who is telling the story.' : is912 ? 'Analyze a particular point of view or cultural experience in a work outside the US.' : 'Analyze how and why authors develop and contrast points of view.'}`,
          `${g}.RL.9: Compare and contrast${is912 ? ' the treatment of similar themes and topics' : ' and distinguish their point of view from that of the narrator'} across stories.`,
        ] },
        { name: 'Range of Reading and Level of Text Complexity', outcomes: [
          `${g}.RL.10: Read and comprehend literature in the ${gradeName} text complexity band proficiently with scaffolding as needed.`,
        ] },
      ] },
      { name: 'Reading: Informational Text', substrands: [
        { name: 'Key Ideas and Details', outcomes: [
          `${g}.RI.1: Ask and answer questions to demonstrate understanding of a text.`,
          `${g}.RI.2: Determine the main idea and summarize key details.`,
          `${g}.RI.3: Explain relationships between individuals, events, or ideas.${is912 ? ' Analyze how a text builds on prior knowledge.' : ''}`,
        ] },
        { name: 'Craft and Structure', outcomes: [
          `${g}.RI.4: Determine the meaning of general academic and domain-specific words.`,
          `${g}.RI.5: Analyze the overall structure of events, ideas, concepts, or information.`,
          `${g}.RI.6: Determine author's point of view or purpose${is912 ? ' and distinguish it from other points of view' : ' and explain how it is conveyed in the text'}.`,
        ] },
        { name: 'Integration of Knowledge and Ideas', outcomes: [
          `${g}.RI.7: Use information from illustrations and text.`,
          `${is912 ? `${g}.RI.8: Evaluate the reasoning and evidence in a text.` : `${g}.RI.7: Explain how specific actions contribute to ideas and events.`}`,
          `${g}.RI.9: Compare and contrast similar topics${is912 ? ' across two or more texts' : ' found in two texts'}.`,
        ] },
        { name: 'Range of Reading', outcomes: [
          `${g}.RI.10: Read and comprehend informational texts in the ${gradeName} text complexity band.`,
        ] },
      ] },
    ]

    if (g <= 5) {
      strands.push({ name: 'Reading: Foundational Skills', substrands: [
        { name: 'Phonics and Word Recognition', outcomes: [
          `${g}.RF.3: Know and apply grade-level phonics and word analysis skills in decoding words.`,
          `${g}.RF.4: Read with sufficient accuracy and fluency to support comprehension.`,
        ] },
      ] })
    }

    strands.push(
      { name: 'Writing', substrands: [
        { name: 'Text Types and Purposes', outcomes: [
          `${g}.W.1: Write opinion pieces${is912 ? ' on topics or texts, supporting a point of view with reasons and information' : isK2 ? ' using drawing and writing' : ' introducing the topic, stating an opinion, and supplying reasons'}.`,
          `${g}.W.2: Write informative/explanatory texts${is912 ? ' to examine and convey complex ideas' : isK2 ? ' using drawing and writing' : ' introducing the topic, using facts and definitions'}.`,
          `${g}.W.3: Write narratives${is912 ? ' using effective technique, relevant details, and well-structured sequences' : isK2 ? ' using drawing and writing' : ' describing events with details about actions, thoughts, and feelings'}.`,
        ] },
        { name: 'Production and Distribution of Writing', outcomes: [
          `${g}.W.4: Produce clear and coherent writing appropriate to task, purpose, and audience.`,
          `${g}.W.5: Develop and strengthen writing through planning, revising, editing, rewriting, or trying a new approach.`,
          `${g}.W.6: Use technology to produce and publish writing ${is912 ? 'and to interact and collaborate with others' : 'and to interact with others'}.`,
        ] },
        { name: 'Research to Build and Present Knowledge', outcomes: [
          `${g}.W.7: Conduct short research projects ${is912 ? 'to answer a question, drawing on several sources' : 'drawing on both print and digital sources'}.`,
          `${g}.W.8: Recall relevant information from experiences or gather relevant information from print and digital sources, take notes, and categorize information.`,
          `${g}.W.9: ${is912 ? 'Draw evidence from informational texts to support analysis, reflection, and research.' : 'Draw evidence from literary or informational texts to support analysis.'}`,
        ] },
      ] },
      { name: 'Speaking and Listening', substrands: [
        { name: 'Comprehension and Collaboration', outcomes: [
          `${g}.SL.1: Engage effectively in collaborative conversations with diverse partners.`,
          `${g}.SL.2: Determine or clarify meaning of unknown and multiple-meaning words and phrases.`,
          `${g}.SL.3: ${isK2 ? 'Ask and answer questions to seek help or clarify.' : 'Analyze the purpose of information presented in diverse media and formats.'}`,
        ] },
        { name: 'Presentation of Knowledge and Ideas', outcomes: [
          `${g}.SL.4: Report on a topic or text, ${isK2 ? 'describing a familiar topic' : 'presenting findings and evidence clearly'}.`,
          `${g}.SL.5: ${isK2 ? 'Add drawings or visual displays to descriptions.' : 'Include multimedia components and visual displays in presentations.'}`,
          `${g}.SL.6: ${isK2 ? 'Speak audibly.' : 'Speak clearly and at an understandable pace; adapt speech to various contexts.'}`,
        ] },
      ] },
      { name: 'Language', substrands: [
        { name: 'Conventions of Standard English', outcomes: [
          `${g}.L.1: Demonstrate command of the conventions of standard English grammar and usage when writing or speaking.`,
          `${g}.L.2: Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling when writing.`,
        ] },
        { name: 'Knowledge of Language', outcomes: [
          `${g}.L.3: ${is912 ? 'Apply knowledge of language to understand how language functions in different contexts.' : isK2 ? 'Use words learned through conversations, reading, and being read to.' : 'Choose words and phrases to convey ideas precisely.'}`,
        ] },
        { name: 'Vocabulary Acquisition and Use', outcomes: [
          `${g}.L.4: Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade-level reading.`,
          `${g}.L.5: Understand word relationships and nuances in word meanings.`,
          `${g}.L.6: Acquire and use accurately grade-appropriate conversational, general, and academic vocabulary.`,
        ] },
      ] },
    )

    results.push(eg(g, strands))
  }
  return results
}

// ═══════════════════════════════════════════════════════════════
// SCIENCE — NGSS
// ═══════════════════════════════════════════════════════════════

const SCIENCE_K = sg(0, [
  { name: 'Physical Science', substrands: [
    { name: 'Forces and Motion', outcomes: ['K-PS2-1: Compare effects of different strengths or directions of pushes and pulls.', 'K-PS2-2: Analyze data to determine if a design solution works as intended.'] },
    { name: 'Energy', outcomes: ['K-PS3-1: Determine the effect of sunlight on Earth\'s surface.', 'K-PS3-2: Design and build a structure that reduces warming effect of sunlight.'] },
  ] },
  { name: 'Life Science', substrands: [
    { name: 'From Molecules to Organisms', outcomes: ['K-LS1-1: Describe patterns of what plants and animals need to survive.'] },
  ] },
  { name: 'Earth and Space Science', substrands: [
    { name: 'Earth\'s Systems', outcomes: ['K-ESS2-1: Describe local weather patterns over time.', 'K-ESS2-2: Construct argument for how plants and animals change the environment.'] },
    { name: 'Earth and Human Activity', outcomes: ['K-ESS3-1: Represent relationship between needs of plants/animals and their habitats.', 'K-ESS3-2: Obtain information about weather forecasting.', 'K-ESS3-3: Communicate solutions to reduce human impact on land, water, air.'] },
  ] },
  { name: 'Engineering Design', substrands: [
    { name: 'Engineering Design', outcomes: ['K-2-ETS1-1: Ask questions and gather information about a situation to change.', 'K-2-ETS1-2: Develop a simple model to illustrate how shape helps function.', 'K-2-ETS1-3: Analyze data from tests of two objects solving the same problem.'] },
  ] },
])

const SCIENCE_1 = sg(1, [
  { name: 'Physical Science', substrands: [
    { name: 'Waves', outcomes: ['1-PS4-1: Plan investigations to provide evidence that vibrating objects can make sound.', '1-PS4-2: Make a device to convert one form of energy into another.', '1-PS4-3: Plan investigation to determine effect of different materials on sound.', '1-PS4-4: Use tools and materials to design and build a device that uses light or sound to solve a problem.'] },
  ] },
  { name: 'Life Science', substrands: [
    { name: 'From Molecules to Organisms', outcomes: ['1-LS1-1: Use materials to design a model of an animal that functions.', '1-LS1-2: Read texts to determine patterns in behavior of parents and offspring.'] },
    { name: 'Heredity: Inheritance and Variation of Traits', outcomes: ['1-LS3-1: Make observations to distinguish that some characteristics of plants and animals are inherited.', '1-LS3-2: Use observations to describe patterns of what plants and animals need to survive.'] },
  ] },
  { name: 'Earth and Space Science', substrands: [
    { name: 'Earth\'s Systems', outcomes: ['1-ESS1-1: Use observations of the Sun, Moon, and stars to describe patterns.', '1-ESS1-2: Develop a model to represent the shape of the Moon.', '1-ESS2-1: Describe patterns of water on Earth.', '1-ESS2-2: Compare solutions to slow or prevent wind or water from changing the shape of land.'] },
  ] },
  { name: 'Engineering Design', substrands: [
    { name: 'Engineering Design', outcomes: ['K-2-ETS1-1: Ask questions and gather information.', 'K-2-ETS1-2: Develop a simple model.', 'K-2-ETS1-3: Analyze data from tests.'] },
  ] },
])

const SCIENCE_2 = sg(2, [
  { name: 'Physical Science', substrands: [
    { name: 'Matter and Its Interactions', outcomes: ['2-PS1-1: Plan and conduct investigation to describe and classify materials by observable properties.', '2-PS1-2: Analyze data from testing different materials.', '2-PS1-3: Construct account of how an object can be disassembled and made into a new object.', '2-PS1-4: Construct argument about changes caused by heating or cooling.'] },
  ] },
  { name: 'Life Science', substrands: [
    { name: 'Interdependent Relationships in Ecosystems', outcomes: ['2-LS2-1: Investigate if plants need sunlight and water to grow.', '2-LS2-2: Develop a simple model for seed dispersal or pollination.', '2-LS4-1: Compare diversity of life in different habitats.'] },
  ] },
  { name: 'Earth and Space Science', substrands: [
    { name: 'Earth\'s Place and Systems', outcomes: ['2-ESS1-1: Provide evidence that Earth events can occur quickly or slowly.', '2-ESS2-1: Compare solutions to slow or prevent wind/water from changing land.', '2-ESS2-2: Develop a model of land and water shapes.', '2-ESS2-3: Identify where water is found on Earth.'] },
  ] },
  { name: 'Engineering Design', substrands: [
    { name: 'Engineering Design', outcomes: ['K-2-ETS1-1: Ask questions and gather information.', 'K-2-ETS1-2: Develop a simple model.', 'K-2-ETS1-3: Analyze data from tests.'] },
  ] },
])

function scienceGrades3to8(): USCurriculumDef[] {
  const results: USCurriculumDef[] = []
  for (let g = 3; g <= 8; g++) {
    const strands: USStrand[] = [
      { name: 'Physical Science', substrands: [
        { name: g <= 5 ? 'Matter and Its Interactions' : 'Structure and Properties of Matter', outcomes: g <= 5 ? [
          `${g}-PS1-1: Develop a model to describe that matter is made of particles too small to be seen.`,
          `${g}-PS1-2: Measure and graph quantities to show conservation of matter.`,
          `${g}-PS1-3: Make observations and measurements to identify materials based on properties.`,
          `${g}-PS1-4: Use model to describe how energy may be transferred between matter and its surroundings.`,
          `${g}-PS1-5: Apply scientific ideas to design, construct, and evaluate a device that minimizes energy transfer.`,
          `${g}-PS1-6: Construct explanation of the relationship between energy and the motion of interacting objects.`,
          `${g}-PS1-7: Conduct an investigation to determine the types of interactions that can occur between objects.`,
        ] : [
          `${g}-PS1-1: Develop models to describe atomic composition of simple molecules and extended structures.`,
          `${g}-PS1-2: Analyze and interpret data on properties of substances before and after interaction to determine if a chemical reaction has occurred.`,
          `${g}-PS1-3: Plan and conduct an investigation to gather evidence to compare the structure of substances at the bulk scale.`,
          `${g}-PS1-4: Develop a model that illustrates how energy flows in chemical processes.`,
          `${g}-PS1-5: Develop and use a model to illustrate the role of heating and cooling in chemical processes.`,
          `${g}-PS1-6: Construct explanation for the role of the sun in chemical reactions.`,
        ] },
        { name: g <= 5 ? 'Forces and Motion' : 'Forces and Interactions', outcomes: g <= 5 ? [
          `${g}-PS2-1: Plan and conduct investigation to compare effects of strength/direction of pushes and pulls.`,
          `${g}-PS2-2: Make observations of an object's motion to determine patterns.`,
          `${g}-PS2-3: Gather evidence that electric and magnetic forces between objects act at a distance.`,
          `${g}-PS2-4: Construct argument that changes in speed or direction are caused by forces.`,
          `${g}-PS2-5: Ask questions and conduct investigation about how magnetic forces can cause objects to attract or repel.`,
        ] : [
          `${g}-PS2-1: Apply Newton's Third Law to design a solution to a problem involving the motion of two colliding objects.`,
          `${g}-PS2-2: Plan an investigation to provide evidence that the change in an object's motion depends on the sum of forces and the mass of the object.`,
          `${g}-PS2-3: Ask questions about data to determine the factors that affect the strength of electric and magnetic forces.`,
          `${g}-PS2-4: Construct and present arguments using evidence that electric and magnetic forces act at a distance.`,
          `${g}-PS2-5: Conduct investigation and use model to determine the relationship between electric current, potential difference, and resistance.`,
          `${g}-PS2-6: Design solution by constructing a device using electric circuits.`,
        ] },
      ] },
      { name: 'Life Science', substrands: [
        { name: 'From Molecules to Organisms', outcomes: g <= 5 ? [
          `${g}-LS1-1: Construct explanation that plants get materials needed for growth from air and water.`,
          `${g}-LS1-2: Develop model to describe how food is rearranged through chemical reactions.`,
          `${g}-LS1-3: Plan and conduct investigation of environmental and genetic impacts on plant growth.`,
          `${g}-LS1-4: Use model to describe how animals receive different types of information through senses.`,
          `${g}-LS1-6: Construct explanation for role of body parts in plant and animal functions.`,
          `${g}-LS1-7: Develop model to describe how food is rearranged through chemical reactions forming new molecules.`,
        ] : [
          `${g}-LS1-1: Construct explanation based on evidence for how body is a system of interacting subsystems.`,
          `${g}-LS1-2: Develop and use a model to illustrate the role of cellular division and differentiation.`,
          `${g}-LS1-3: Plan and conduct investigation to provide evidence that feedback mechanisms maintain homeostasis.`,
          `${g}-LS1-4: Use model to illustrate the role of cellular division and differentiation.`,
          `${g}-LS1-5: Construct explanation based on evidence about simultaneous cycling of matter and flow of energy.`,
          `${g}-LS1-6: Construct explanation based on evidence for how body is a system of interacting subsystems.`,
          `${g}-LS1-7: Develop a model to illustrate how photosynthesis transforms light energy into stored chemical energy.`,
          `${g}-LS1-8: Gather and make sense of information to refute that matter and energy are not recycled in ecosystems.`,
        ] },
        { name: 'Heredity', outcomes: [
          `${g}-LS3-1: Develop and use model to describe why structural variations arise from DNA combinations.`,
          `${g <= 5 ? `${g}-LS3-2: Use evidence to support explanation that traits can be influenced by environment.` : `${g}-LS3-2: Use model to demonstrate why asexual reproduction results in identical offspring and sexual reproduction results in genetic variation.`}`,
        ] },
        { name: 'Ecosystems', outcomes: g <= 5 ? [
          `${g}-LS2-1: Make claim that some animals form groups to help survival.`,
          `${g}-LS2-2: Construct argument that plants get materials from air and water for growth.`,
          `${g}-LS2-3: Develop model to describe the flow of matter among organisms.`,
          `${g}-LS2-4: Construct argument that changes to physical or biological components affect populations.`,
        ] : [
          `${g}-LS2-1: Analyze and interpret data to provide evidence for effects of resource availability on organisms.`,
          `${g}-LS2-2: Construct explanation for patterns of interactions among organisms.`,
          `${g}-LS2-3: Construct scientific explanation based on evidence for cycling of matter and flow of energy.`,
          `${g}-LS2-4: Construct argument supported by evidence that changes to physical or biological components of an ecosystem affect populations.`,
          `${g}-LS2-5: Evaluate competing design solutions for maintaining biodiversity and ecosystem services.`,
        ] },
      ] },
      { name: 'Earth and Space Science', substrands: [
        { name: 'Earth\'s Systems', outcomes: g <= 5 ? [
          `${g}-ESS2-1: Develop model to describe ways the geosphere, biosphere, hydrosphere, and atmosphere interact.`,
          `${g}-ESS2-2: Construct model to describe the cycling of water through Earth's systems.`,
          `${g}-ESS2-3: Obtain information to identify where water is found on Earth.`,
          `${g}-ESS2-4: Develop model to describe the cycling of water through Earth's systems driven by energy from the sun.`,
          `${g}-ESS2-5: Develop model to describe ways the geosphere, biosphere, hydrosphere, and atmosphere interact.`,
        ] : [
          `${g}-ESS2-1: Develop model to describe cycling of matter and flow of energy among living and nonliving parts of an ecosystem.`,
          `${g}-ESS2-2: Construct an explanation based on evidence for how geoscience processes have changed Earth's surface.`,
          `${g}-ESS2-3: Analyze and interpret data on distribution of fossils and rocks to provide evidence of plate motions.`,
          `${g}-ESS2-4: Develop model to describe the cycling of water through Earth's systems.`,
          `${g}-ESS2-5: Plan investigation of ways Earth's internal and surface processes operate at different spatial and temporal scales.`,
        ] },
        { name: 'Earth and Human Activity', outcomes: [
          `${g}-ESS3-1: ${g <= 5 ? 'Make observation of natural objects to identify patterns.' : 'Construct explanation based on evidence for how availability of natural resources has influenced human activity.'}`,
          `${g}-ESS3-2: ${g <= 5 ? 'Ask questions to obtain information about purpose of weather forecasting.' : 'Evaluate competing design solutions for developing, managing, and utilizing energy and mineral resources.'}`,
          `${g}-ESS3-3: ${g <= 5 ? 'Communicate solutions to reduce human impact on land, water, and air.' : 'Apply scientific principles to design a method for monitoring and minimizing human impact on the environment.'}`,
          `${g}-ESS3-4: ${g >= 6 ? 'Construct an argument supported by evidence for how increases in human population and per-capita consumption impact natural resources.' : 'Generate and compare multiple possible solutions to a problem.'}`,
          `${g}-ESS3-5: ${g >= 6 ? 'Ask questions to clarify evidence of factors that have caused the rise in global temperatures over the past century.' : ''}`,
        ] },
      ] },
      { name: 'Engineering Design', substrands: [
        { name: 'Engineering Design', outcomes: [
          `${g}-ETS1-1: Define the criteria and constraints of a design problem.`,
          `${g}-ETS1-2: Evaluate competing design solutions using a systematic process.`,
          `${g}-ETS1-3: Analyze data from tests to determine similarities and differences among several design solutions.`,
          `${g >= 6 ? `${g}-ETS1-4: Use a model to illustrate the relationship among the management of natural resources, the sustainability of human populations, and biodiversity.` : ''}`,
        ] },
      ] },
    ]
    results.push(sg(g, strands))
  }
  return results
}

const SCIENCE_HS = sg(9, [
  { name: 'Physical Science', substrands: [
    { name: 'Structure and Properties of Matter', outcomes: ['HS-PS1-1: Use the periodic table as a model to predict relative properties of elements.', 'HS-PS1-2: Construct explanation for the structure of an atom based on evidence.', 'HS-PS1-3: Plan and conduct investigation to gather evidence to compare interactions at the molecular level.', 'HS-PS1-6: Refine design of a chemical system by specifying changes to reduce energy input.', 'HS-PS1-7: Use model to illustrate energy transferred during chemical reaction.', 'HS-PS1-8: Develop model to illustrate transfer of electron energy during chemical reactions.'] },
    { name: 'Chemical Reactions', outcomes: ['HS-PS1-1 through HS-PS1-8 above.', 'HS-PS1-9: Apply scientific principles and evidence to provide an explanation of chemical process rates.', 'HS-PS1-10: Use mathematical representations to support the claim that atoms are conserved in chemical reactions.', 'HS-PS1-11: Construct explanation of a process for how the engineering design process takes into account scientific principles.'] },
    { name: 'Forces and Motion', outcomes: ['HS-PS2-1: Analyze data to support the claim that Newton\'s second law describes mathematical relationship.', 'HS-PS2-3: Apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes force on a macroscopic object.', 'HS-PS2-6: Communicate scientific and technical information about why molecular-level structure is important.', 'HS-PS2-7: Plan investigation to provide evidence that electric current produces magnetic fields.', 'HS-PS2-8: Plan investigation to demonstrate charging by friction, conduction, and induction.'] },
    { name: 'Energy', outcomes: ['HS-PS3-1: Create a computational model to calculate change in energy of a system.', 'HS-PS3-2: Develop model to illustrate energy changes in a system.', 'HS-PS3-3: Design, build, and evaluate a device that converts energy from one form to another.', 'HS-PS3-4: Plan investigation to demonstrate energy transfer via thermal energy.', 'HS-PS3-5: Develop a model to illustrate energy stored in chemical bonds.', 'HS-PS3-6: Communicate scientific and technical information about energy transfer.'] },
    { name: 'Waves and Electromagnetic Radiation', outcomes: ['HS-PS4-1: Use mathematical representations to support a claim regarding relationships among frequency, wavelength, and speed of waves.', 'HS-PS4-2: Evaluate questions about the advantages of using a digital transmission and storage of information.', 'HS-PS4-3: Evaluate the claims, evidence, and reasoning behind the idea that electromagnetic radiation can be described by a wave model.', 'HS-PS4-4: Evaluate the claims, evidence, and reasoning behind the idea that electromagnetic radiation can be described by a particle model.', 'HS-PS4-5: Communicate technical information about how some technological devices use the principles of wave behavior and wave interactions.', 'HS-PS4-6: Plan investigation about interaction of electromagnetic radiation with matter.', 'HS-PS4-7: Use mathematical representations to support a claim about probability of interactions.'] },
  ] },
  { name: 'Life Science', substrands: [
    { name: 'From Molecules to Organisms', outcomes: ['HS-LS1-1: Construct explanation based on evidence for how the structure of DNA determines the structure of proteins.', 'HS-LS1-2: Develop and use model to illustrate the hierarchical organization of interacting systems.', 'HS-LS1-3: Plan and conduct investigation to provide evidence that feedback mechanisms maintain homeostasis.', 'HS-LS1-4: Use model to illustrate how photosynthesis transforms light energy.', 'HS-LS1-5: Use model to illustrate role of cellular division and differentiation.', 'HS-LS1-6: Construct explanation based on evidence that the body is a system of interacting subsystems.', 'HS-LS1-7: Use model to illustrate how cellular respiration transforms chemical energy.', 'HS-LS1-8: Gather and make sense of information about how matter and energy cycle in ecosystems.'] },
    { name: 'Heredity and Evolution', outcomes: ['HS-LS3-1: Ask questions to clarify relationships about role of DNA and chromosomes in coding instructions.', 'HS-LS3-2: Make and defend claim based on evidence that inheritable genetic variations may result from new combinations of existing DNA or mutation.', 'HS-LS3-3: Apply concepts of statistics and probability to explain variation and distribution of expressed traits.', 'HS-LS4-1: Communicate scientific information that biological evolution is supported by multiple lines of empirical evidence.', 'HS-LS4-2: Construct explanation based on evidence that biological diversity is influenced by natural processes.', 'HS-LS4-3: Apply concepts of statistics and probability to support explanation that biological evolution is driven by natural selection.', 'HS-LS4-4: Construct explanation based on evidence for how natural selection leads to adaptation.', 'HS-LS4-5: Evaluate evidence for the role of group behavior on individual and species\' chances to survive and reproduce.', 'HS-LS4-6: Create or revise a simulation to test a solution to mitigate adverse impacts of human activity on biodiversity.'] },
    { name: 'Ecosystems', outcomes: ['HS-LS2-1: Use mathematical and computational representations to support explanations of factors affecting biodiversity.', 'HS-LS2-2: Use mathematical representations to support explanations of biotic and abiotic factors.', 'HS-LS2-3: Construct explanation based on evidence for cycling of matter and flow of energy in aerobic and anaerobic conditions.', 'HS-LS2-4: Use mathematical representations to support claims for cycling of matter and flow of energy in ecosystems.', 'HS-LS2-6: Evaluate claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms.', 'HS-LS2-7: Design, evaluate, and refine a solution for reducing the impacts of human activities on the environment and biodiversity.', 'HS-LS2-8: Evaluate evidence for the role of group behavior on survival.'] },
  ] },
  { name: 'Earth and Space Science', substrands: [
    { name: 'Earth\'s Systems', outcomes: ['HS-ESS1-1: Develop model based on evidence to illustrate life spans of the Sun and Earth.', 'HS-ESS1-2: Construct explanation of the Big Bang theory based on evidence.', 'HS-ESS1-4: Use mathematical representation to support the claim that Earth\'s orbital and rotational motions.', 'HS-ESS2-1: Develop model to illustrate how Earth\'s internal and surface processes operate at different spatial and temporal scales.', 'HS-ESS2-2: Analyze geoscience data to make claim that one change to Earth\'s surface can create feedback that changes other Earth systems.', 'HS-ESS2-3: Construct explanation based on evidence for how geoscience processes have changed Earth\'s surface.', 'HS-ESS2-4: Use model to describe how cycling of water through Earth\'s systems is driven by energy from the sun.', 'HS-ESS2-5: Plan investigation of the role of interactions between Earth\'s systems.', 'HS-ESS2-6: Develop quantitative model to describe cycling of carbon among geosphere, biosphere, atmosphere, and hydrosphere.', 'HS-ESS3-1: Construct explanation based on evidence that availability of natural resources has influenced human activity.', 'HS-ESS3-2: Evaluate competing design solutions for developing, managing, and utilizing energy and mineral resources.', 'HS-ESS3-3: Apply scientific principles to design method for monitoring and minimizing human impact.', 'HS-ESS3-4: Evaluate or refine technological solution that reduces impacts of human activities on natural systems.', 'HS-ESS3-5: Analyze geoscience data and the results from global climate models to make evidence-based forecast of current rate of global or regional climate change.', 'HS-ESS3-6: Use computational representation to illustrate relationships among management of natural resources, sustainability of human populations, and biodiversity.'] },
  ] },
  { name: 'Engineering, Technology, and Applications of Science', substrands: [
    { name: 'Engineering Design', outcomes: ['HS-ETS1-1: Analyze a major global challenge to specify qualitative and quantitative criteria and constraints for solutions.', 'HS-ETS1-2: Design a solution to a complex real-world problem by breaking it down into smaller, more manageable problems.', 'HS-ETS1-3: Evaluate a solution to a complex real-world problem based on prioritized criteria and trade-offs.', 'HS-ETS1-4: Use computer simulation to model the impact of proposed solutions to a complex real-world problem.'] },
  ] },
])

// ═══════════════════════════════════════════════════════════════
// SOCIAL STUDIES — C3 Framework
// ═══════════════════════════════════════════════════════════════

const SS_K = ss(0, [
  { name: 'Culture and Identity', substrands: [
    { name: 'Myself and My Family', outcomes: ['Identify self as individual and family member.', 'Describe family roles and responsibilities.', 'Share personal and family traditions.'] },
    { name: 'My Community', outcomes: ['Identify community helpers.', 'Describe roles of community helpers.'] },
  ] },
  { name: 'Geography', substrands: [
    { name: 'Maps and Places', outcomes: ['Identify land and water on maps and globes.', 'Recognize a map as representation of a place.', 'Use directional words.'] },
  ] },
  { name: 'Civics and Government', substrands: [
    { name: 'Symbols and Rules', outcomes: ['Identify the American flag and Pledge of Allegiance.', 'Recognize national holidays.', 'Explain importance of classroom rules.'] },
  ] },
  { name: 'History', substrands: [
    { name: 'Past and Present', outcomes: ['Distinguish between past and present.', 'Identify how daily life has changed.'] },
  ] },
])

function socialStudiesGrades(): USCurriculumDef[] {
  const results: USCurriculumDef[] = [SS_K]
  for (let g = 1; g <= 12; g++) {
    const strands: USStrand[] = [
      { name: 'Civics and Government', substrands: [
        { name: g <= 5 ? 'Rules, Roles, and Rights' : g <= 8 ? 'Civic Principles and Practices' : 'Civic and Political Institutions', outcomes: g <= 2 ? [
          `${g}.Civics: Explain how rules and laws help people live together safely.`,
          `${g}.Civics: Identify roles of people in the school and community.`,
          `${g}.Civics: Describe how citizens participate in their community.`,
        ] : g <= 5 ? [
          `${g}.Civics: Distinguish the roles and powers of local, state, and national governments.`,
          `${g}.Civics: Explain the purpose of the Constitution and Bill of Rights.`,
          `${g}.Civics: Describe the rights and responsibilities of citizenship.`,
          `${g}.Civics: Analyze how rules and laws are created and enforced.`,
        ] : g <= 8 ? [
          `${g}.Civics: Analyze the structure and functions of the three branches of government.`,
          `${g}.Civics: Explain the process by which the U.S. Constitution is amended.`,
          `${g}.Civics: Evaluate the effectiveness of civic actions to promote the common good.`,
          `${g}.Civics: Analyze the roles of political parties and elections.`,
        ] : [
          `${g}.Civics: Evaluate how the U.S. Constitution establishes a system of limited government.`,
          `${g}.Civics: Analyze the impact of landmark Supreme Court decisions.`,
          `${g}.Civics: Evaluate the effectiveness of public policies in addressing social issues.`,
          `${g}.Civics: Analyze the role of media and public opinion in a democratic society.`,
          `${g}.Civics: Compare civic institutions and practices across nations.`,
        ] },
      ] },
      { name: 'Economics', substrands: [
        { name: g <= 5 ? 'Basic Economic Concepts' : g <= 8 ? 'Economic Decision Making' : 'Economic Systems and Markets', outcomes: g <= 2 ? [
          `${g}.Econ: Identify goods and services.`,
          `${g}.Econ: Describe the concept of scarcity.`,
          `${g}.Econ: Explain how people make economic decisions about spending.`,
        ] : g <= 5 ? [
          `${g}.Econ: Explain how producers and consumers interact in markets.`,
          `${g}.Econ: Describe how money is used as a medium of exchange.`,
          `${g}.Econ: Explain the role of savings and banks in the economy.`,
        ] : g <= 8 ? [
          `${g}.Econ: Analyze how supply and demand determine prices.`,
          `${g}.Econ: Explain the role of competition in a market economy.`,
          `${g}.Econ: Evaluate the costs and benefits of different economic choices.`,
          `${g}.Econ: Describe the role of government in the economy.`,
        ] : [
          `${g}.Econ: Analyze how different economic systems allocate resources.`,
          `${g}.Econ: Evaluate the effects of government fiscal and monetary policy.`,
          `${g}.Econ: Analyze the impact of globalization on domestic economies.`,
          `${g}.Econ: Evaluate trade-offs and opportunity costs in economic decision-making.`,
        ] },
      ] },
      { name: 'Geography', substrands: [
        { name: g <= 5 ? 'Places and Regions' : g <= 8 ? 'Human-Environment Interaction' : 'Global Connections', outcomes: g <= 2 ? [
          `${g}.Geo: Identify physical features of the local community.`,
          `${g}.Geo: Use maps and globes to locate places.`,
          `${g}.Geo: Describe how people adapt to their environment.`,
        ] : g <= 5 ? [
          `${g}.Geo: Use maps to analyze the distribution of natural resources.`,
          `${g}.Geo: Explain how human activities affect the physical environment.`,
          `${g}.Geo: Describe how climate affects human activities.`,
        ] : g <= 8 ? [
          `${g}.Geo: Analyze how human populations migrate and settle.`,
          `${g}.Geo: Evaluate the impact of economic development on the environment.`,
          `${g}.Geo: Analyze patterns of global trade and resource distribution.`,
          `${g}.Geo: Explain the causes and consequences of global climate change.`,
        ] : [
          `${g}.Geo: Analyze the geopolitical implications of global resource distribution.`,
          `${g}.Geo: Evaluate the impact of migration on cultural and economic landscapes.`,
          `${g}.Geo: Analyze the role of international organizations in addressing global challenges.`,
          `${g}.Geo: Evaluate the effectiveness of sustainable development strategies.`,
        ] },
      ] },
      { name: 'History', substrands: [
        { name: g <= 5 ? 'Past Events and People' : g <= 8 ? 'U.S. History' : 'World and U.S. History', outcomes: g <= 2 ? [
          `${g}.Hist: Distinguish between past, present, and future.`,
          `${g}.Hist: Describe how people and events from the past have influenced the present.`,
          `${g}.Hist: Use historical sources to learn about the past.`,
        ] : g <= 5 ? [
          `${g}.Hist: Describe the historical significance of key events in U.S. history.`,
          `${g}.Hist: Explain the causes and consequences of westward expansion.`,
          `${g}.Hist: Describe the contributions of diverse groups in American history.`,
          `${g}.Hist: Use primary and secondary sources to investigate historical questions.`,
        ] : g <= 8 ? [
          `${g}.Hist: Analyze the causes and consequences of the American Revolution.`,
          `${g}.Hist: Evaluate the impact of the Civil War and Reconstruction.`,
          `${g}.Hist: Analyze the causes and effects of the Industrial Revolution in the U.S.`,
          `${g}.Hist: Evaluate the impact of the Civil Rights Movement.`,
          `${g}.Hist: Analyze the role of the U.S. in global conflicts.`,
        ] : [
          `${g}.Hist: Analyze the causes and consequences of major world events.`,
          `${g}.Hist: Evaluate the impact of industrialization and imperialism.`,
          `${g}.Hist: Analyze the causes and consequences of world wars and the Cold War.`,
          `${g}.Hist: Evaluate the impact of decolonization and globalization.`,
          `${g}.Hist: Analyze the causes and consequences of the Civil Rights Movement in comparative perspective.`,
          `${g}.Hist: Evaluate the impact of technology on society and governance.`,
        ] },
      ] },
    ]
    results.push(ss(g, strands))
  }
  return results
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export const usCurriculumData: USCurriculumDef[] = [
  // Mathematics (K-12)
  MATH_K, MATH_1, MATH_2, MATH_3, MATH_4, MATH_5, MATH_6, MATH_7, MATH_8, MATH_HS,
  // English Language Arts (K-12)
  ELA_K, ...elaGrades(),
  // Science (K-12)
  SCIENCE_K, SCIENCE_1, SCIENCE_2, ...scienceGrades3to8(), SCIENCE_HS,
  // Social Studies (K-12)
  ...socialStudiesGrades(),
]
