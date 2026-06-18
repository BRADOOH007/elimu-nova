// Comprehensive CBC Curriculum Data for Grades 1-9, organized by Term
// Based on Kenya CBC Assessment Report Books (Revised Version)

import { Term, GradeLevel, SubStrand, Strand, LearningAreaData, TermCurriculum } from '@/types/curriculum';
import { getSeniorSecondaryStrands, getSeniorSecondarySubStrands } from '@/data/seniorSecondaryCurriculum';

// Re-export types for backward compatibility
export type { Term, GradeLevel, SubStrand, Strand, LearningAreaData, TermCurriculum };

export const grades1to9CurriculumByTerm: TermCurriculum[] = [
  // ==================== GRADE 1 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 1",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Pre-number activities" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "WELCOME AND GREETINGS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SCHOOL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "FAMILY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HOME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TIME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Kiswahili/Lugha ya Ishara ya Kenya",
        strands: [
          {
            name: "DARASANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "FAMILIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "TARAKIMU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "SIKU ZA WIKI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "THE HOME",
            subStrands: [
              { name: "Listening and speaking (Instruction)" },
              { name: "Reading (Picture reading)" },
              { name: "Writing (Letters of alphabet)" }
            ]
          },
          {
            name: "THE SCHOOL",
            subStrands: [
              { name: "Listening and speaking (Word formation)" },
              { name: "Reading (reading words)" },
              { name: "Writing – handwriting" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Cleaning my body" },
              { name: "Our home" },
              { name: "Family needs" }
            ]
          }
        ]
      },
      {
        name: "Christian Religious Education Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Self-awareness" },
              { name: "My family" },
              { name: "Creation of plants and animals" }
            ]
          },
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "The word of God" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATING AND EXECUTING",
            subStrands: [
              { name: "Jumping" },
              { name: "Rhythm and beat" },
              { name: "Drawing" },
              { name: "Stretching" },
              { name: "Painting and coloring" },
              { name: "Melody" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 1 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 1",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Pre-number activities" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "WEATHER & OUR ENVIRONMENT",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HYGIENE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "MYSELF (PARTS OF THE BODY)",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "MY FRIENDS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SAFETY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "COMMUNITY LEADERS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MIMI NA WENZANGU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "MWILI WANGU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "USAFI WA MWILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "VYAKULA VYETU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "JIKONI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "GOOD MANNERS",
            subStrands: [
              { name: "Listening and speaking (Stories)" },
              { name: "Reading – words & sentences" },
              { name: "Writing - spelling" }
            ]
          },
          {
            name: "PERSONAL HYGIENE",
            subStrands: [
              { name: "Listening and speaking - songs" },
              { name: "Reading – simple texts" },
              { name: "Writing – creative writing" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Our School" },
              { name: "Our market" }
            ]
          },
          {
            name: "NATURAL ENVIRONMENT",
            subStrands: [
              { name: "Weather and the sky" },
              { name: "Soil" },
              { name: "Sound" }
            ]
          }
        ]
      },
      {
        name: "Religious Activities",
        strands: [
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "Bible stories" }
            ]
          },
          {
            name: "THE EARLY LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The birth of Jesus Christ" },
              { name: "Jesus Christ in the temple" },
              { name: "Baptism of Jesus Christ" },
              { name: "Wedding at Cana of Galilee" },
              { name: "Healing of Simon's Mother-in-Law" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATING AND EXECUTING",
            subStrands: [
              { name: "Pattern making" },
              { name: "Throwing and catching" },
              { name: "Paper craft" },
              { name: "Log roll and T balance" }
            ]
          },
          {
            name: "PERFORMING AND DISPLAYING",
            subStrands: [
              { name: "Singing Games – Kenyan Style" },
              { name: "Props" },
              { name: "Song (Action songs)" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 1 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 1",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Pre-number activities" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "LIVING TOGETHER",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TECHNOLOGY (MOBILE PHONE)",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CONSERVING RESOURCES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MICHEZO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "DARASANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "TIME AND SEASONS",
            subStrands: [
              { name: "Listening and speaking - Responding to information" },
              { name: "Reading – for understanding" },
              { name: "Writing – descriptive writing" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "RESOURCES IN THE ENVIRONMENT",
            subStrands: [
              { name: "Water" },
              { name: "Plants" },
              { name: "Animals" }
            ]
          }
        ]
      },
      {
        name: "CRE Activities",
        strands: [
          {
            name: "CHRISTIAN VALUES",
            subStrands: [
              { name: "Sharing" },
              { name: "Obedience" },
              { name: "Honesty" },
              { name: "Thankfulness" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "A house of God" },
              { name: "A house of prayer" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMING AND DISPLAY",
            subStrands: [
              { name: "Modelling" },
              { name: "Percussion Musical Instrument" }
            ]
          },
          {
            name: "APPRECIATION",
            subStrands: [
              { name: "Musical Sounds" },
              { name: "Element of music" },
              { name: "Water safety awareness" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 2 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 2",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "SCHOOL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ACTIVITIES IN THE HOME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TRANSPORT",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TIMES AND MONTHS OF THE YEAR",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SHOPPING",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "SHULENI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "HAKI ZANGU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "LISHE BORA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "USAFIRI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "THINGS FOUND IN SCHOOL",
            subStrands: [
              { name: "Listening and speaking (Instruction)" },
              { name: "Reading (Picture reading)" },
              { name: "Writing (names of items)" }
            ]
          },
          {
            name: "ACTIVITIES AT SCHOOL",
            subStrands: [
              { name: "Listening and speaking (riddles)" },
              { name: "Reading (picture stories)" },
              { name: "Writing – Simple sentences" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Our Home" },
              { name: "Family needs and wants" },
              { name: "Our school" },
              { name: "Our national flag" },
              { name: "Our rights & responsibilities" }
            ]
          }
        ]
      },
      {
        name: "Christian Religious Education Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Self-awareness" },
              { name: "My family" },
              { name: "Creation of the sky, sun, moon & stars" }
            ]
          },
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "The Bible as a guide" },
              { name: "Divisions of the bible" },
              { name: "Bible Stories" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATING AND EXECUTING",
            subStrands: [
              { name: "Hopping" },
              { name: "Drawing and painting" },
              { name: "Rhythm and pattern making" },
              { name: "Turning" },
              { name: "Mosaic" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 2 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 2",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "GARDEN",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ACCIDENTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CLASSROOM",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "POSITIONS AND DIRECTIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENT",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MNYAMA NIMPENDAYE",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "UKOO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "SEBULENI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "USALAM WANGU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "DOMESTIC ANIMALS",
            subStrands: [
              { name: "Listening and speaking (stories)" },
              { name: "Reading – loud reading" },
              { name: "Writing – spelling words" }
            ]
          },
          {
            name: "PERSONAL HYGIENE",
            subStrands: [
              { name: "Listening and speaking – self expression" },
              { name: "Reading – loud reading" },
              { name: "Writing – hand writing" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Our market" }
            ]
          },
          {
            name: "NATURAL ENVIRONMENT",
            subStrands: [
              { name: "Weather" },
              { name: "Soil" },
              { name: "Light" }
            ]
          }
        ]
      },
      {
        name: "CRE Activities",
        strands: [
          {
            name: "THE EARLY LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The birth of Jesus Christ" },
              { name: "Joseph and his brothers" },
              { name: "The kindness of the wisemen" },
              { name: "Miracles of Jesus Christs" },
              { name: "Easter" }
            ]
          },
          {
            name: "CHRISTIAN VALUES",
            subStrands: [
              { name: "Sharing" },
              { name: "Obedience" },
              { name: "Honesty" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Melody" },
              { name: "Singing games in western style" },
              { name: "Kicking" },
              { name: "Plaited ornament (single stranded)" },
              { name: "Flutes" },
              { name: "Eggs roll and swan balance" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 2 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 2",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "TECHNOLOGY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CULTURAL ACTIVITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CHILD LABOUR",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CARING FOR OTHERS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "HOSPITALINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "HALI YA ANGA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "SAFETY AT HOME",
            subStrands: [
              { name: "Listening and speaking- Instructions" },
              { name: "Reading – simple text" },
              { name: "Writing – creative writing" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "NATURAL ENVIRONMENT",
            subStrands: [
              { name: "Water" },
              { name: "Plants" },
              { name: "Animals" }
            ]
          }
        ]
      },
      {
        name: "CRE Activities",
        strands: [
          {
            name: "CHRISTIAN VALUES",
            subStrands: [
              { name: "Thankfulness" },
              { name: "Forgiveness" },
              { name: "Responsibility" },
              { name: "Work" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "Prayer" },
              { name: "The Holy spirit" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAYING",
            subStrands: [
              { name: "Wind musical instruments" },
              { name: "Modelling (coiling technique)" },
              { name: "Songs (Topical songs)" },
              { name: "Singing games western style" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 3 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 3",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "ACTIVITIES AT HOME & SCHOOL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SHARING DUTIES & RESPONSIBILITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ETIQUETTE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CHILD RIGHTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "OCCUPATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "UZALENDO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "SHAMBANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "MIEZI YA MWAKA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "KAZI MBALIMBALI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "INTRODUCING SELF & OTHERS",
            subStrands: [
              { name: "Listening and speaking (Imitating expression)" },
              { name: "Reading (Independent reading)" },
              { name: "Writing (sentence formation)" }
            ]
          },
          {
            name: "THE COMMUNITY",
            subStrands: [
              { name: "Listening and speaking (stories)" },
              { name: "Reading (reading aloud)" },
              { name: "Writing – Simple sentences" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Our living Environment" },
              { name: "Family needs" },
              { name: "Foods in our environment" },
              { name: "Our community" },
              { name: "Cultural events" }
            ]
          }
        ]
      },
      {
        name: "Christian Religious Education Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Self-awareness" },
              { name: "My family" },
              { name: "Adam & Eve" }
            ]
          },
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "The Bible as the word of Gods" },
              { name: "Bible Stories" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION AND EXECUTING",
            subStrands: [
              { name: "Pushing and pulling" },
              { name: "Drawing and painting" },
              { name: "Rhythm and pattern making" },
              { name: "Skipping" },
              { name: "College" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 3 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 3",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "OCCUPATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "GENDER",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "FRIENDSHIP",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "PLACES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HYGIENE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USALAMA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "USAFI WA MAZINGIRA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "DUKANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "NDEGE NIMPENDAYE",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "WILD ANIMALS",
            subStrands: [
              { name: "Listening and speaking (Presentation skills)" },
              { name: "Reading – comprehension" },
              { name: "Writing – spelling instruction" }
            ]
          },
          {
            name: "ROAD SAFETY",
            subStrands: [
              { name: "Listening and speaking (Active listening)" },
              { name: "Reading – for fluency" },
              { name: "Writing – to give information" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "SOCIAL ENVIRONMENT",
            subStrands: [
              { name: "Cultural events" }
            ]
          },
          {
            name: "NATURAL ENVIRONMENT",
            subStrands: [
              { name: "Weather" },
              { name: "Soil" },
              { name: "Heat" }
            ]
          }
        ]
      },
      {
        name: "CRE Activities",
        strands: [
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "The three Hebrew men" },
              { name: "Elisha and the boys" }
            ]
          },
          {
            name: "THE EARLY LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The birth of Jesus Christ" },
              { name: "The Good Samaritan" },
              { name: "The little boy with five loaves & two fish" },
              { name: "Jesus Christ walks on water" },
              { name: "Raising Jairus's daughter" },
              { name: "Easter" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Rounds (Melody)" },
              { name: "Weaving" },
              { name: "Galloping" },
              { name: "Sculpture (Assemblage)" },
              { name: "Forward roll and V- balance" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 3 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 3",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Number concept" },
              { name: "Whole Numbers" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Mass" },
              { name: "Capacity" },
              { name: "Time" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Shapes" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "FOOD WE EAT AND DISEASES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SAVING",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TALENTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENT (THINGS AROUND US)",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Language use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "SOKONI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          },
          {
            name: "TECHNOLOJIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Sarufi" },
              { name: "Kuandika" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "SEASONS OF THE YEAR",
            subStrands: [
              { name: "Listening and speaking - Expressing self creatively" },
              { name: "Reading – to acquire information" },
              { name: "Writing – creative writing" }
            ]
          }
        ]
      },
      {
        name: "Environmental Activities",
        strands: [
          {
            name: "RESOURCES IN OUR ENVIRONMENT",
            subStrands: [
              { name: "Water" },
              { name: "Plants" },
              { name: "Animals" },
              { name: "Waste material" }
            ]
          }
        ]
      },
      {
        name: "CRE Activities",
        strands: [
          {
            name: "CHRISTIAN VALUES",
            subStrands: [
              { name: "Honesty" },
              { name: "Thankfulness" },
              { name: "Forgiveness" },
              { name: "Trust" },
              { name: "Responsibility" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "Prayer" },
              { name: "The Holy spirit" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMING AND DISPLAY",
            subStrands: [
              { name: "Modelling and Ornaments" },
              { name: "The Kenya national anthem" }
            ]
          },
          {
            name: "APPRECIATION",
            subStrands: [
              { name: "Water safety awareness" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 4 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 4",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Whole Numbers - Place value" },
              { name: "Whole Numbers - Reading and writing numbers" },
              { name: "Whole Numbers - Ordering numbers" },
              { name: "Whole Numbers - Rounding numbers" },
              { name: "Whole Numbers - Factors of numbers" },
              { name: "Whole Numbers - Using even and odd numbers" },
              { name: "Whole Numbers - Rep. Hindu Arabic numbers using roman numbers" },
              { name: "Whole Numbers - Making patterns" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "THE FAMILY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "FAMILY CELEBRATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ETIQUETTE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ACCIDENTS: FIRST AID",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NUTRITION - BALANCED DIET",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "NYUMBANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "NIDHAMU MEZANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAVAZI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "DIRA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "CULTURAL FOODS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing (Letters of alphabet)" }
            ]
          },
          {
            name: "WEATHER",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "NATURAL & BUILT ENVIRONMENTS",
            subStrands: [
              { name: "Compass direction" },
              { name: "Location & size of the county" },
              { name: "Physical features in the county" },
              { name: "Seasons in the county" },
              { name: "Historic built environments in the county" }
            ]
          },
          {
            name: "PEOPLE AND POPULATION",
            subStrands: [
              { name: "Interdependence of people" },
              { name: "Population distribution" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Plants - Characteristics of plants as living things" },
              { name: "Plants - Functions of external parts of plants" },
              { name: "Animals - Characteristics of animals as living things" },
              { name: "Animals - Vertebrates and invertebrates" },
              { name: "Human digestive system - Parts of the human digestive system" },
              { name: "Human digestive system - Healthy digestive system" },
              { name: "Human digestive system - Symptoms of unhealthy digestive system" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION OF RESOURCES",
            subStrands: [
              { name: "Soil conservation - Materials for making compost manure" },
              { name: "Soil conservation - Preparing compost manure" },
              { name: "Water conservation - Drip irrigation" },
              { name: "Fuel conservation - Types of fuels used at home" },
              { name: "Fuel conservation - Using and conserving fuels in cooking" },
              { name: "Conserving wild animals - Small wild animals that destroy crops" },
              { name: "Conserving wild animals - Constructing a scarecrow" }
            ]
          },
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Direct sowing of tiny seeds - Crops grown through direct sowing" },
              { name: "Sowing tiny seeds" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTING",
            subStrands: [
              { name: "Percussion Musical instruments - Identifying: name, community, method of playing" },
              { name: "Percussion Musical instruments - Parts of percussion" },
              { name: "Percussion Musical instruments - Classifying melodic, non-melodic" },
              { name: "Percussion Musical instruments - Improvised rhythmic pattern" },
              { name: "Percussion Musical instruments - Making sticks" },
              { name: "Percussion Musical instruments - Tonal value – smudge technique" },
              { name: "Netball - Passes" },
              { name: "Netball - Catching (double handed)" },
              { name: "Macramé technique (overhand knot)" },
              { name: "Painting and Montage - Colour classification" },
              { name: "Painting and Montage - Colour value" },
              { name: "Painting and Montage - Montage – subject matter, overlapping, neatness" },
              { name: "Rhythm - Note values: crotchet, pair of quavers and their rests" },
              { name: "Rhythm - French rhythm names" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Self-awareness" },
              { name: "Thoughts and feelings" },
              { name: "Making choices" },
              { name: "Family members" },
              { name: "Relationship within the family" }
            ]
          },
          {
            name: "ATTRIBUTES OF GOD",
            subStrands: []
          },
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "Respect for the bible" },
              { name: "Bible stories" },
              { name: "Zacchaeus the tax collector" },
              { name: "Balaam's donkey" },
              { name: "Samson kills a lion" },
              { name: "Joseph interprets a dream" },
              { name: "Bible patriarchs - Abraham" }
            ]
          },
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The birth of Jesus Christ - Annunciation" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 4 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 4",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Decimals" },
              { name: "Use of letters" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Area" },
              { name: "Volume" },
              { name: "Capacity" },
              { name: "Mass" },
              { name: "Time" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "INTERNET - EMAIL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TECHNOLOGY – CYBER SAFETY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "THE FARM",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HIV AND AIDS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HYGIENE AND SANITATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USHAURI - NASAHA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "BENDERA YA TAIFA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUNDA NA MIMEA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "WANYAMA WA PORINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "SCHOOL RULES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "MONEY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "ANIMAL WELFARE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "LEISURE ACTIVITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "SOCIAL ORGANISATIONS",
            subStrands: [
              { name: "Our School" },
              { name: "Aspects of tradition culture in the county - Dressing" },
              { name: "Aspects of tradition culture in the county - Food" },
              { name: "Aspects of tradition culture in the county - Artifacts" },
              { name: "Aspects of tradition culture in the county - Sports and games" },
              { name: "Festivals and ceremonies" },
              { name: "The school" }
            ]
          },
          {
            name: "RESOURCES & ECONOMIC ACTIVITIES",
            subStrands: [
              { name: "Economic activities in the county" },
              { name: "Industry in the county" },
              { name: "Enterprise project at school" }
            ]
          },
          {
            name: "CITIZENSHIP AND GOOD GOVERNANCE IN KENYA",
            subStrands: [
              { name: "Good citizenship in the school" }
            ]
          }
        ]
      },
      {
        name: "Science and Technology Activities",
        strands: [
          {
            name: "MATTER",
            subStrands: [
              { name: "Properties of matter - Meaning of matter" },
              { name: "Properties of matter - States of matter" },
              { name: "Properties of matter - Properties of matter" },
              { name: "Properties of matter - Importance of different states of matter" },
              { name: "Management of solid waste - Types of solid wastes" },
              { name: "Management of solid waste - Dangers of solid wastes" },
              { name: "Management of solid waste - Managing wastes in places" },
              { name: "Management of solid waste - Methods of managing solid wastes" },
              { name: "Management of solid waste - Safety measures during solid waste mgt." },
              { name: "Water conservation - Meaning of water conservation" },
              { name: "Water conservation - Methods of water conservation" },
              { name: "Water conservation - Importance of water conservation" }
            ]
          },
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Force and its effects" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Uses of domestic animals - Types of domestic animals" },
              { name: "Uses of domestic animals - Domestic animals and their uses" },
              { name: "Balanced diet - Importance of eating a balanced diet" },
              { name: "Balanced diet - Eating balanced diet" },
              { name: "Boiling & shallow frying method - Describing boiling & shallow frying method" },
              { name: "Boiling & shallow frying method - Cooking food using boiling & shallow method" }
            ]
          },
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Personal hygiene" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTION",
            subStrands: [
              { name: "Composing melody - Solfa syllables d, r & m" },
              { name: "Composing melody - Interpreting hand signs for solfa syllables" },
              { name: "Composing melody - Qualities of a good melody" },
              { name: "Composing melody - Creating melodies" }
            ]
          },
          {
            name: "PERFORMANCE & DISPLAY",
            subStrands: [
              { name: "Athletics - Performances of skill of sprint stars & sprinting techniques" },
              { name: "Athletics - Performing medium & elongated sprint starts & sprinting techniques" },
              { name: "Athletics - Singing Kenya national anthem" },
              { name: "Athletics - Painting Kenyan Flag" },
              { name: "Gymnastics - Balances and rolls" },
              { name: "Gymnastics - Singing patriotic songs" },
              { name: "Gymnastics - Performing the crab balance and side roll" },
              { name: "Descant recorder - Parts of a descant recorder" },
              { name: "Descant recorder - Care & maintenance of descant recorder" },
              { name: "Descant recorder - Playing notes G A B on descant recorder" },
              { name: "Descant recorder - Making decorated case for descant recorder" },
              { name: "Descant recorder - Playing simple melodies on notes G A B" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "Birth of John the Baptist" },
              { name: "Healing of the blind Bartimaeus" },
              { name: "Healing of the 10 leapers" },
              { name: "Jesus raises a widow son" },
              { name: "Forgiveness" },
              { name: "Helping the needy" },
              { name: "The parable of the lost coin" },
              { name: "Parable of the mustard seed" },
              { name: "Nicodemus encounter with Jesus Christ" }
            ]
          },
          {
            name: "CHRISTIANS",
            subStrands: [
              { name: "Trust" },
              { name: "Truthfulness" },
              { name: "Obedience at home and school" },
              { name: "Jesus Loves little children" },
              { name: "Responsibility (personal & school property)" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 4 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 4",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Position & direction" },
              { name: "Angles" },
              { name: "Plane figures" }
            ]
          },
          {
            name: "DATA HANDLING",
            subStrands: [
              { name: "Data" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "SPORTS: MY FAVOURITE GAME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CLEAN ENVIRONMENT",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "MONEY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "AFYA BORA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUKABILIANA NA UHALIFU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAPATO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "TECHNOLOGY - DIGITAL DEVICES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "LEADERSHIP",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "CITIZENSHIP AND GOVERNANCE IN KENYA",
            subStrands: [
              { name: "Peace" },
              { name: "Child Rights" },
              { name: "Early and force marriage" },
              { name: "Female genital mutilations" },
              { name: "Slavery" },
              { name: "Child trafficking" },
              { name: "Child and forced labour" },
              { name: "Sexual abuse" },
              { name: "Unauthorized school transport" },
              { name: "Abuse of children with special needs" },
              { name: "Human rights" },
              { name: "Democracy in school" },
              { name: "Children's government in school" },
              { name: "Community leadership" },
              { name: "The county government in Kenya" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Light - Sources of light" },
              { name: "Light - Ways of lighting a house" },
              { name: "Light - Uses of light" },
              { name: "Heat - Sources of heat" },
              { name: "Heat - Uses of heat" },
              { name: "Heat - Safety measures when handling heat" },
              { name: "Heat - Importance of heat in daily life" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Personal Hygiene - Methods used in maintaining personal hygiene" },
              { name: "Personal Hygiene - Practicing personal hygiene using various methods" },
              { name: "Domestic Hygiene - Various methods used to clean home" },
              { name: "Domestic Hygiene - Methods used to clean home environment" },
              { name: "Domestic Hygiene - Cleaning Personal Protective Equipment" }
            ]
          },
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Making tacking stitches - Types of tacking stitches" },
              { name: "Making tacking stitches - Making items using tacking stitches" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Swimming - Skills in crouch & standing surfaces dives" },
              { name: "Swimming - Performing the skills of crouch & standing surface dives" },
              { name: "Swimming - Taking photographs" },
              { name: "Songs - Types of songs" },
              { name: "Songs - Types of folk songs" },
              { name: "Songs - Decorating a costume for a folk song" },
              { name: "Songs - Performing indigenous Kenyan folk song" }
            ]
          },
          {
            name: "APPRECIATION IN CREATIVE ARTS",
            subStrands: [
              { name: "Analysis of creative Arts Works" },
              { name: "Concept of appreciating creative arts - Displaying artworks" },
              { name: "Concept of appreciating creative arts - Describing a Kenyan folk song" }
            ]
          },
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Making tacking stitches - Types of tacking stitches" },
              { name: "Making tacking stitches - Making items using tacking stitches" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "House of God" },
              { name: "The early church" },
              { name: "Standing firm in the faith" },
              { name: "The Lord's prayer" },
              { name: "Fruits of the Holy spirit" },
              { name: "Self-control" }
            ]
          },
          {
            name: "MORALITY AND SOCIAL MEDIA",
            subStrands: [
              { name: "Uses of social media" },
              { name: "Appropriate ways of using social media" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 5 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 5",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Whole Numbers - Use of total & place value" },
              { name: "Whole Numbers - Number symbols" },
              { name: "Whole Numbers - Reading and writing numbers" },
              { name: "Whole Numbers - Ordering numbers" },
              { name: "Whole Numbers - Rounding off numbers" },
              { name: "Whole Numbers - Divisibility test" },
              { name: "Whole Numbers - HCF, GCD & LCM" },
              { name: "Addition" },
              { name: "Subtraction" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fractions" },
              { name: "Decimals" },
              { name: "Simple equations" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "CHILD RIGHTS & RESPONSIBILITY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NATIONAL CELEBRATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ETIQUETTE - TABLE MANNERS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" }
            ]
          },
          {
            name: "ROAD ACCIDENTS - PREVENTION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TRADITIONAL FOODS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MAPISHI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "HUDUMA YA KWANZA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAPAMBO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "SAA NA MAJIRA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "MY CULTURE - ATTIRE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing (Letters of alphabet)" }
            ]
          },
          {
            name: "ENVIRONMENTAL AWARENESS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "NATURAL & BUILT ENVIRONMENTS",
            subStrands: [
              { name: "Elements of a map" },
              { name: "Location, position & size of Kenya" },
              { name: "Main physical features in Kenya" },
              { name: "Weather and climate" },
              { name: "The built environments" }
            ]
          },
          {
            name: "PEOPLE AND POPULATION",
            subStrands: [
              { name: "Language groups in Kenya" },
              { name: "Population distribution in Kenya" },
              { name: "Culture & social organization of the ATS" },
              { name: "The school administration" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Classification of Plants - Classification of plants" },
              { name: "Classification of Plants - Parts and functions of flowers" },
              { name: "Vertebrates - Characteristics of vertebrates" },
              { name: "Vertebrates - Groups of vertebrates" },
              { name: "Human breathing system - Healthy digestive system" },
              { name: "Human breathing system - Symptoms & prevention of common conditions & diseases of the breathing system" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION OF RESOURCES",
            subStrands: [
              { name: "Soil conservation - Sites for soil improvement" },
              { name: "Soil conservation - Constructing organic waste pit" },
              { name: "Water conservation - Ways of conserving water for household garden" },
              { name: "Water conservation - Practicing water conservation within the school or community" },
              { name: "Conserving wild animals - Ways of repelling wild animals" },
              { name: "Conserving wild animals - Repelling wild animals to avoid destruction of property" }
            ]
          },
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Growing vegetables - Gardening practices for vegetables" },
              { name: "Growing vegetables - Establishing a nursery bed for vegetables" },
              { name: "Growing vegetables - Growing vegetable crops" },
              { name: "Uses of domestic animals - Uses of various domestic animals in food production" },
              { name: "Uses of domestic animals - Relating various domestic animals to their uses" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTION",
            subStrands: [
              { name: "Indigenous Kenyan wind instruments - Wind instruments" },
              { name: "Indigenous Kenyan wind instruments - Roles of parts of a wind instrument" },
              { name: "Indigenous Kenyan wind instruments - Making a wind instrument" },
              { name: "Indigenous Kenyan wind instruments - Care for wind instruments" },
              { name: "Indigenous Kenyan wind instruments - Making crayons" },
              { name: "Indigenous Kenyan wind instruments - Drawing still life composition" },
              { name: "Indigenous Kenyan wind instruments - Mounting pictures" },
              { name: "Football - Skills in football" },
              { name: "Football - Making a cast marking using papier mache" },
              { name: "Football - Decorating t-shirts using tie and dye" },
              { name: "Football - Painting a still life composition" },
              { name: "Composing rhythm - Notes Values, symbol and their rests: minim crotchet and a pair of quavers" },
              { name: "Composing rhythm - French rhythm names taa-aa and ta-te" },
              { name: "Composing rhythm - Making a calligraphy pen" },
              { name: "Composing rhythm - Writing in calligraphy" },
              { name: "Painting and Mosaic - Color wheel" },
              { name: "Painting and Mosaic - Painting – wash techniques" },
              { name: "Painting and Mosaic - Materials for mosaic" },
              { name: "Painting and Mosaic - Making mosaic" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "My purpose" },
              { name: "Human beings a co-worker with God" },
              { name: "The fall of man" },
              { name: "Family unity" }
            ]
          },
          {
            name: "THE BIBLE",
            subStrands: [
              { name: "The bible as a guide" },
              { name: "Bible stories" },
              { name: "Courage: story of Peter & John" },
              { name: "Wisdom: story of King Solomon" },
              { name: "Respect for the elderly: the story of Noah and his sons" },
              { name: "God Loves humility: the hand writing on a wall" },
              { name: "Worship the true God: the Mt. Carmel contest" },
              { name: "Gods' protection: the story of Moses" },
              { name: "Service to God: the call of Moses" }
            ]
          },
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The birth of Jesus Christ - Annunciation" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 5 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 5",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Area" },
              { name: "Volume" },
              { name: "Capacity" },
              { name: "Mass" },
              { name: "Time" },
              { name: "Money" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "JOBS & OCCUPATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TECHNOLOGY – LEARNING THROUGH TECHNOLOGY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "THE FARM - CASH CROPS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HEALTH - COMMUNICABLE DISEASES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "LEISURE TIME ACTIVITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "KUKABILIANA NA UMASKINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAADILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "ELIMU NA MAZINGIRA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "NDEGE WA PORINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "LIVING TOGETHER",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "TRADE - MARKET",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "CARE FOR SPECIAL & VULNERABLE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "TALENTS AND GIFTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "RESOURCES & ECONOMIC ACTIVITIES",
            subStrands: [
              { name: "Resources in Kenya" },
              { name: "Mining in Kenya" },
              { name: "Fishing in Kenya" },
              { name: "Wildlife & tourism in Kenya" },
              { name: "Devpt. of Transport" },
              { name: "Devpt. Of communication" }
            ]
          },
          {
            name: "POLITICAL SYSTEMS AND GOVERNANCE",
            subStrands: [
              { name: "Traditional leaders in Kenya" }
            ]
          }
        ]
      },
      {
        name: "Science and Technology Activities",
        strands: [
          {
            name: "MATTER",
            subStrands: [
              { name: "Mixtures - Meaning of mixtures" },
              { name: "Mixtures - Types of mixtures" },
              { name: "Mixtures - Separating heterogenous mixtures" },
              { name: "Water pollution - Meaning of water pollution" },
              { name: "Water pollution - Common water pollutants" },
              { name: "Water pollution - Effects of polluted water" },
              { name: "Water pollution - Methods of reducing water pollution" },
              { name: "Water pollution - Basic methods of water treatment" }
            ]
          },
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Floating and sinking" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION",
            subStrands: [
              { name: "Preservation of cereals and pulses - Methods of preserving cereals & pulses" },
              { name: "Preservation of cereals and pulses - Preserving cereals and pulses" },
              { name: "Food nutrients - Functions of food nutrients in the body" },
              { name: "Food nutrients - Categorizing foods based on nutrients" },
              { name: "Drying fat frying & deep frying - Describing the methods of cooking" },
              { name: "Drying fat frying & deep frying - Cooking food using drying fat frying & deep frying" }
            ]
          },
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Good grooming practices" },
              { name: "Home hygiene" },
              { name: "Cleaning surfaces at home" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTION",
            subStrands: [
              { name: "Melody - Singing the solfa syllables" },
              { name: "Melody - Interpreting the hands signs" },
              { name: "Melody - Writing the solfa syllables" },
              { name: "Melody - Creating short melodies" },
              { name: "Melody - Making decorated cards" },
              { name: "Rounder's - Features of a rounders bat" },
              { name: "Rounder's - Carving a bat for playing" },
              { name: "Rounder's - Improvising a ball" },
              { name: "Rounder's - Executing batting & fielding skills" }
            ]
          },
          {
            name: "PERFORMANCE & DISPLAY",
            subStrands: [
              { name: "Athletics - Materials for plaiting a skipping rope & relay baton exchange" },
              { name: "Athletics - Plaiting skipping ropes" },
              { name: "Athletics - Making a baton for use in relay" },
              { name: "Athletics - Demonstrating the skill of visual & non-visual baton exchange in relay" },
              { name: "Athletics - Performing the E.A anthem" },
              { name: "Puppetry - Materials for making puppet" },
              { name: "Puppetry - Making a glove puppet" },
              { name: "Puppetry - Creating mosaic composition" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "John the Baptist" },
              { name: "The baptism of Jesus Christ" },
              { name: "God's power over nature" },
              { name: "Feeding the four thousand" },
              { name: "Healing the paralytic man" },
              { name: "Teachings of Jesus Christ: parable of the lost sheep" },
              { name: "Responsible living: sermon on the Mountain" },
              { name: "The rich young ruler" },
              { name: "Persistence in prayer" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "The early church" },
              { name: "The Lord's supper" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 5 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 5",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Angles" },
              { name: "3-D objects" }
            ]
          },
          {
            name: "DATA HANDLING",
            subStrands: [
              { name: "Data representation" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "SPORTS: APPRECIATING TALENTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENTAL POLLUTION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" }
            ]
          },
          {
            name: "MONEY - SAVINGS & BANKING",
            subStrands: []
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MAGONJWA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUDHIBITI ITIKADI ZA KIDINI NA ZA KIJAMII",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UWEKEZAJI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "TECHNOLOGY - CARE FOR DIGITAL DEVICES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "NATIONALISM - NATIONAL FLAG",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "POLITICAL SYSTEMS AND GOVERNANCE",
            subStrands: [
              { name: "Early forms of government in Kenya" },
              { name: "Citizenship in Kenya" },
              { name: "National Unity in Kenya" },
              { name: "Human rights" },
              { name: "Democracy in society" },
              { name: "National Government" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Sound energy - Sources of sound" },
              { name: "Sound energy - Movement of sound in nature" },
              { name: "Sound energy - Effects of loud sound" },
              { name: "Sound energy - Role of sound in daily life" },
              { name: "Heat transfer - Modes of heat transfer in nature" },
              { name: "Heat transfer - Classification of conductors of heat" },
              { name: "Heat transfer - Uses of heat transfer in daily life" },
              { name: "Heat transfer - Safety when handling heat" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Laundering cotton item - How to launder cotton item" },
              { name: "Laundering cotton item - Laundering cotton item" }
            ]
          },
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Repairing garments - Stitches used in repairing garments" },
              { name: "Repairing garments - Making samples of stitches" },
              { name: "Repairing garments - Using stitches in repairing gap seam" },
              { name: "Constructing vertical & horizontal garden - Difference between vertical & horizontal garden" },
              { name: "Constructing vertical & horizontal garden - Constructing vertical & horizontal gardens" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Swimming - Front crawl technique" },
              { name: "Swimming - Creating rhythm & tempo in front crawl" },
              { name: "Swimming - Creating a mosaic composition" },
              { name: "Performing a Kenyan folk Dance - Components of a folk dance" },
              { name: "Performing a Kenyan folk Dance - Roles of costumes, ornaments & body adornment in folk dance" },
              { name: "Performing a Kenyan folk Dance - Making ornaments" },
              { name: "Performing a Kenyan folk Dance - Performing a Kenyan folk song" },
              { name: "Playing the descant recorder - Playing notes and melody in G A B C' D'" },
              { name: "Playing the descant recorder - Creating random repeat patterns based on notes G A B C' D'" },
              { name: "Indigenous Kenyan games - Counting games" }
            ]
          },
          {
            name: "APPRECIATION IN CREATIVE ART",
            subStrands: [
              { name: "Analysis of creative arts work - Components of a folk dance" },
              { name: "East African Community Anthem - message" },
              { name: "East African Community Anthem - values" },
              { name: "East African Community Anthem - occasion and etiquette in performance" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "The role of the Holy spirit" },
              { name: "Intercessory prayer" }
            ]
          },
          {
            name: "CHRISTIAN LIVING",
            subStrands: [
              { name: "Friendship formation" },
              { name: "Human sexuality" },
              { name: "God the source of life" },
              { name: "Good health practices" },
              { name: "Appropriate use of social media" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 6 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 6",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Whole Numbers - Place value & Total value" },
              { name: "Whole Numbers - Number symbols" },
              { name: "Whole Numbers - Reading and writing numbers" },
              { name: "Whole Numbers - Ordering numbers" },
              { name: "Whole Numbers - Rounding off numbers" },
              { name: "Whole Numbers - Applying squares of whole numbers" },
              { name: "Whole Numbers - Applying square roots of perfect squares" },
              { name: "Multiplication" },
              { name: "Division" },
              { name: "Fraction" },
              { name: "Decimal" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "CHILD LABOUR",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CULTURAL & RELIGIOUS CELEBRATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ETIQUETTE - TELEPHONE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" }
            ]
          },
          {
            name: "EMERGENCY RESCUE SERVICES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "OUR TOURIST ATTRACTIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "VIUNGO VYA MWILI VYA NDANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MICHEZO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAHUSIANO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MISIMU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "CEREMONIES & FESTIVALS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENTAL CONSERVATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "DISASTER AWARENESS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "NATURAL & BUILT ENVIRONMENTS",
            subStrands: [
              { name: "Position and size of countries in E. A" },
              { name: "Main physical features in E. A" },
              { name: "Climatic regions in E. A" },
              { name: "Vegetation in E.A" },
              { name: "Historic built environments" }
            ]
          },
          {
            name: "PEOPLE, POPULATION & SOCIAL ORGANIZATION",
            subStrands: [
              { name: "Language groups in E. A" },
              { name: "Population distribution in E. A" },
              { name: "Culture and social Organizations" },
              { name: "School community" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Fungi - Common fungi" },
              { name: "Fungi - Importance of fungi" },
              { name: "Invertebrates - Common vertebrates" },
              { name: "Invertebrates - Importance of vertebrates" },
              { name: "Human Circulatory system - Parts of the human circulatory system" },
              { name: "Human Circulatory system - Parts of the heart & their functions" },
              { name: "Human Circulatory system - Major blood vessels & their functions" },
              { name: "Human Circulatory system - Symptoms & prevention of common health conditions of the circulatory system" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION OF RESOURCES",
            subStrands: [
              { name: "Controlling soil erosion - Types of soil erosion" },
              { name: "Controlling soil erosion - Control for soil erosion" },
              { name: "Conserving water: seedbeds - Types of seedbeds that conserve water" },
              { name: "Conserving water: seedbeds - Preparing different types of seedbeds" },
              { name: "Conserving wild animals using physical deterrents - Identifying deterrents" },
              { name: "Conserving wild animals using physical deterrents - Establishing deterrents" }
            ]
          },
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Rearing small domestic animals - Routine practices in rearing of small domestic animals" },
              { name: "Rearing small domestic animals - Rearing small domestic animals for food" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTION",
            subStrands: [
              { name: "String instruments and drawing - name, community, method of playing" },
              { name: "String instruments and drawing - Parts and functions" },
              { name: "String instruments and drawing - Care handling, cleaning, storage" },
              { name: "String instruments and drawing - Drawing (overlapping) texture and tone (stippling technique)" },
              { name: "Painting and College - Color classification" },
              { name: "Painting and College - Painting - brushstroke" },
              { name: "Painting and College - College" },
              { name: "Volleyball - Executing underarm service" },
              { name: "Volleyball - Labelling volleyball playing kit" },
              { name: "Volleyball - Dig pass" },
              { name: "Rhythm and pattern making - Note values: Crotchet, quiver, minim, dotter minim, semibreve and rests" },
              { name: "Rhythm and pattern making - French rhythm names: taa, tate, taa-aa, taaaa-aa-aa" },
              { name: "Rhythm and pattern making - Note symbols and their rests on monotone" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "My purpose" },
              { name: "Marriage and family" },
              { name: "God's rest- leisure" }
            ]
          },
          {
            name: "THE HOLY BIBLE",
            subStrands: [
              { name: "The bible as the inspired word of God" },
              { name: "The ten commandments" },
              { name: "Bible stories: God's power- Samson story" },
              { name: "Faith in God: Elisha and the axe" },
              { name: "Determination: story of Jacob" }
            ]
          },
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The call of the disciples" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 6 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 6",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Inequalities" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Length" },
              { name: "Area" },
              { name: "Capacity" },
              { name: "Mass" },
              { name: "Time" },
              { name: "Money" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "JOBS & OCCUPATION – WORK ETHICS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TECHNOLOGY – SCIENTIFIC INNOVATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "THE FARM - ANIMAL SAFETY & CARE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "LIFESTYLE DISEASES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "PROPER USE OF LEISURE TIME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MSHIKAMANO WA KITAIFA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "USAWA WA KIJINSIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAJANGA NA JINSI YA KUYAZUIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "WANYAMA WA MAJINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language",
        strands: [
          {
            name: "PEER INFLUENCE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "FARM TOOL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "HEALTH & DISEASES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          },
          {
            name: "CAREERS & PROFESSION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "RESOURCES & ECONOMIC ACTIVITIES",
            subStrands: [
              { name: "Beef farming" },
              { name: "Fishing in E. A" },
              { name: "Wild life & tourism" },
              { name: "Transport in E. A" },
              { name: "Communication in E.A" },
              { name: "Mining in E.A" }
            ]
          },
          {
            name: "POLITICAL SYSTEMS AND GOVERNANCE",
            subStrands: [
              { name: "Traditional forms of government" },
              { name: "Regional co-operation" },
              { name: "Good citizenship in the school" }
            ]
          }
        ]
      },
      {
        name: "Science and Technology Activities",
        strands: [
          {
            name: "MATTER",
            subStrands: [
              { name: "Change of state - Change of state of matter" },
              { name: "Change of state - Application of change of state of matter" },
              { name: "Composition of air - Composition of air in the atmosphere" },
              { name: "Composition of air - Uses of different composition of air" },
              { name: "Air pollution" }
            ]
          },
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Light - Movement of light through materials" },
              { name: "Light - Ray diagrams of images in plane mirror" },
              { name: "Light - Formation of shadows and eclipses" },
              { name: "Light - Reflection of light at plane surfaces" },
              { name: "Light - Image formation in plane mirrors" },
              { name: "Light - Rainbow formation" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Preserving crop products: fruits & vegetables - How to preserve & store fruits & vegetables at home" },
              { name: "Preserving crop products: fruits & vegetables - Preserving fruits and vegetables" },
              { name: "Stewing and baking food - Stewing & baking as methods of cooking" },
              { name: "Stewing and baking food - Cooking food using stewing and baking" }
            ]
          },
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Body cleanliness - Practices that enhance body cleanliness" },
              { name: "Body cleanliness - Practicing body cleanliness" },
              { name: "Laundry- stain removal - Common stains on clothing & household items" },
              { name: "Laundry- stain removal - Removing stains from clothing & household articles" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & EXECUTION",
            subStrands: [
              { name: "Weaving - Identify materials for weaving a gymnastic mat" },
              { name: "Weaving - Weaving a mat using 2/2 twill techniques" },
              { name: "Gymnastics - Cartwheel" },
              { name: "Gymnastics - 3- action sequence" },
              { name: "Gymnastics - Decorating gymnastics progression" },
              { name: "Gymnastics - Creating melodies" },
              { name: "Composing melody - Singing the solfa syllables (d-d')" },
              { name: "Composing melody - Performing major scale using Kodaly hand signs" },
              { name: "Composing melody - Composing short melodies" },
              { name: "Composing melody - Writing sol-fa syllables using calligraphy" },
              { name: "Composing melody - Creating newspaper collage" }
            ]
          },
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Athletic, long jump, high jump - Performing sail technique in long jump" },
              { name: "Athletic, long jump, high jump - Demonstrating scissors technique" },
              { name: "Athletic, long jump, high jump - Designing an invitation card" },
              { name: "Descant recorder - Playing note C D E F G A B C' D'" },
              { name: "Descant recorder - Playing melody within the range of C-D'" },
              { name: "Creating a décor for classroom interior using papercraft technique" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "The temptation of Jesus Christ" },
              { name: "Miracles of Jesus Christ: Roman servant" },
              { name: "Faith in God: bleeding woman" },
              { name: "Jesus power over death: raising Lazarus from the dead" },
              { name: "The Kingdom of God: the parable of the hidden treasure" },
              { name: "Attitude towards wealth: rich man Lazarus" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "Apostles' creed" },
              { name: "Christian suffering" },
              { name: "Church unity" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 6 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 6",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Lines" },
              { name: "Angles" },
              { name: "3-D objects" }
            ]
          },
          {
            name: "DATA HANDLING",
            subStrands: [
              { name: "Bar graphs" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "SPORTS: INDOOR GAMES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENTAL CONSERVATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "MONEY - TRADE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "AFYA YA AKILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUKABILIANA NA UGAIDI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "USHURU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Indigenous Language Activities",
        strands: [
          {
            name: "GENERAL TOPICS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "POLITICAL SYSTEMS AND GOVERNANCE",
            subStrands: [
              { name: "Traditional forms of government" },
              { name: "Human rights" },
              { name: "Peace and conflict resolution" },
              { name: "Government revenue & expenditure" },
              { name: "The preamble of the constitution of Kenya" }
            ]
          }
        ]
      },
      {
        name: "Science & Technology Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Levers as simple machines" },
              { name: "Examples of levers" },
              { name: "Parts of levers" },
              { name: "Classification of levers" },
              { name: "Uses of levers in day-to-day life" },
              { name: "Slopes - Types of slopes" },
              { name: "Slopes - Uses of slopes" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Constructing moist bed garden - Meaning of moist bed garden" },
              { name: "Constructing moist bed garden - Construction of moist bed garden" },
              { name: "Crocheting PPEs - Crocheting stitches in making household articles" },
              { name: "Crocheting PPEs - Using crocheting stitches" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Swimming - Inverted breast stroke" },
              { name: "Swimming - Demonstrating inverted breast stroke" },
              { name: "Swimming - Creating a pictorial composition using montage technique" },
              { name: "Indigenous Kenyan Instrumental ensembles - Categories of Indigenous Kenyan Instrumental ensemble" },
              { name: "Indigenous Kenyan Instrumental ensembles - Factors considered when playing an instrumental ensemble" },
              { name: "Indigenous Kenyan Instrumental ensembles - Playing selected instrument" },
              { name: "Indigenous Kenyan Instrumental ensembles - Making a decorated tote bag" }
            ]
          },
          {
            name: "APPRECIATION IN CREATIVE ARTS",
            subStrands: [
              { name: "Analysis of creative Arts Works - Interpreting various works" },
              { name: "Analysis of creative Arts Works - Creating a catalogue" },
              { name: "Analysis of creative Arts Works - Elements of music in songs" },
              { name: "Analysis of creative Arts Works - Relating songs to experiences" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "Good citizens" },
              { name: "Interpersonal relationships among Christians" }
            ]
          },
          {
            name: "CHRISTIAN LIVING",
            subStrands: [
              { name: "Friendship formation" },
              { name: "Human sexuality" },
              { name: "Sanctity of life" },
              { name: "Alcohol & substance abuse" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 7 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 7",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Whole Numbers - Place value and total value" },
              { name: "Whole Numbers - Reading and writing numbers" },
              { name: "Whole Numbers - Rounding off numbers" },
              { name: "Whole Numbers - Classifying numbers" },
              { name: "Whole Numbers - Number sequence" },
              { name: "Factors" },
              { name: "Fractions" },
              { name: "Decimals" },
              { name: "Squares and square root" }
            ]
          },
          {
            name: "ALGEBRA",
            subStrands: [
              { name: "Algebraic expressions" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "PERSONAL RESPONSIBILITY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SCIENCE & HEALTH EDUCATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HYGIENE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" }
            ]
          },
          {
            name: "LEADERSHIP",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "FAMILY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USAFI WA KIBINAFSI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "LISHE BORA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UHURU WA WANYAMA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "AINA ZA MALIASILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UNYANYASAJI WA KIJINSIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "SOCIAL STUDIES PERSONAL DEVELOPMENT",
            subStrands: [
              { name: "Self-exploration" },
              { name: "Entrepreneurial opportunities in SST" }
            ]
          },
          {
            name: "PEOPLE AND POPULATION",
            subStrands: [
              { name: "Human origin" },
              { name: "Early civilization" },
              { name: "Slavery and servitude" },
              { name: "Socio-economic org. of selected African communities" },
              { name: "Origin of money" },
              { name: "Human diversity & interpersonal relationships" },
              { name: "Peaceful conflict resolution" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "SCIENTIFIC INVESTIGATION",
            subStrands: [
              { name: "Introduction to integrated science" },
              { name: "Components on integrated science" },
              { name: "Importance of science in daily life" },
              { name: "Laboratory safety" },
              { name: "Common hazards & their symbols in the laboratory" },
              { name: "Common accidents in the laboratory" },
              { name: "Safety measures in the laboratory" },
              { name: "Laboratory apparatus & instruments" },
              { name: "Basic skills in science" },
              { name: "Laboratory instrument & apparatus" },
              { name: "S.I Units" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION OF RESOURCES",
            subStrands: [
              { name: "Controlling of soil pollution - Causes of soil pollution in gardening" },
              { name: "Controlling of soil pollution - Controlling soil pollution" },
              { name: "Constructing water retention structures - Surface run off in gardening" },
              { name: "Constructing water retention structures - Constructing water retention structures" },
              { name: "Conserving nutrients - Ways of conserving vitamins & mineral salts in vegetables" },
              { name: "Conserving nutrients - Conserve nutrients in vegetables" },
              { name: "Growing trees - Importance of trees in conserving the environment" },
              { name: "Growing trees - Planting trees" }
            ]
          },
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Preparing planting site & establishing crop - Preparing a suitable tilth" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "FOUNDATIONS OF CA&S",
            subStrands: [
              { name: "Introduction to CA&S - Categories of CA&S" },
              { name: "Introduction to CA&S - Relationship among categories of CA&S" },
              { name: "Introduction to CA&S - Creating a chart on categories of CA&S" },
              { name: "Components of CA&S - Elements & principles of art" },
              { name: "Components of CA&S - Elements of a story" },
              { name: "Components of CA&S - Coordination, strength & physical fitness" },
              { name: "Components of CA&S - Rhythm & pitch in music" }
            ]
          },
          {
            name: "CREATING & PERFORMING CA&S",
            subStrands: [
              { name: "Drawing and painting - Drawing lines, tone and balance" },
              { name: "Drawing and painting - Painting cool/warm colours" },
              { name: "Drawing and painting - Values and rests" },
              { name: "Drawing and painting - Variation of note" },
              { name: "Drawing and painting - Body movements" },
              { name: "Drawing and painting - French rhythm names" },
              { name: "Drawing and painting - Repetition of note" },
              { name: "Athletics - Javelin appearance" },
              { name: "Athletics - Carving a javelin" },
              { name: "Athletics - Javelin throw" },
              { name: "Athletics - Decorating javelin (sanding, texting and smoking)" },
              { name: "Melody - Qualities of a good melody" },
              { name: "Melody - Melodies in G major" },
              { name: "Melody - Melody in C major" },
              { name: "Handball - Passes" },
              { name: "Handball - Dribbling" },
              { name: "Handball - Jump shot" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "FOUNDATION OF PRETECH",
            subStrands: [
              { name: "Introduction to Pretech studies" },
              { name: "Components of Pretechnical studies" },
              { name: "Role of Pretechnical studies" },
              { name: "Safety in the work environment - Potential safety threat in a work Envi." },
              { name: "Safety in the work environment - Safety rules & regulations in the work environment" },
              { name: "Safety in the work environment - Safety in a work environment" },
              { name: "Computer concepts - Introduction" },
              { name: "Computer concepts - Characteristics of a computer" },
              { name: "Computer concepts - Classifying computers" },
              { name: "Computer concepts - Use of a computer to perform a task" },
              { name: "Computer concepts - ICT tools used in communication" },
              { name: "Introduction to drawing - Importance of drawing as a means of communication" },
              { name: "Introduction to drawing - Difference between artistic & technical drawings" },
              { name: "Introduction to drawing - Printing numbers and letter" },
              { name: "Introduction to drawing - Drawing types of lines" },
              { name: "Introduction to drawing - Symbols and abbreviations used in drawing" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "C.R.E",
            subStrands: [
              { name: "Importance of studying CRE" }
            ]
          },
          {
            name: "CREATION",
            subStrands: [
              { name: "Accounts of creation" },
              { name: "Stewardship over creation" },
              { name: "Responsibility over plants" },
              { name: "Uses of natural resources" }
            ]
          },
          {
            name: "THE BIBLE",
            subStrands: [
              { name: "Functions of the bible" },
              { name: "Divisions of the bible" },
              { name: "Bible translations" },
              { name: "Leadership in Israel: Moses" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 7 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 7",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "ALGEBRA",
            subStrands: [
              { name: "Linear equations" },
              { name: "Linear Inequalities" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Pythagorean relationship" },
              { name: "Length" },
              { name: "Area" },
              { name: "Volume and capacity" },
              { name: "Time, distance & speed" },
              { name: "Temperature" },
              { name: "Money" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "DRUG & SUBSTANCE ABUSE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NATURAL RESOURCES - FORESTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TRAVEL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HEROES & HEROINES - KENYA",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "MUSIC",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "PROFESSIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USALAMA SHULENI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUHUDUMIA JAMII SHULENI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "ULANGUZI WA BINADAMU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI YA VIFAA VYA KIDIJITALI KATIKA MAWASILIANO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUJITHAMINI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAJUKUMU YA WATOTO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "COMMUNITY SERVICE LEARNING",
            subStrands: [
              { name: "Meaning" },
              { name: "Steps in CSL Project" },
              { name: "Accomplishing a CSL project" }
            ]
          },
          {
            name: "NATURAL & HISTORIC BUILT ENVIRONMENTS IN AFRICA",
            subStrands: [
              { name: "Historical information" },
              { name: "Historical development of Agriculture" },
              { name: "Maps and map work" },
              { name: "Earth and solar system" },
              { name: "Weather" },
              { name: "Field work" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "MIXTURES, ELEMENTS & COMPONENTS",
            subStrands: [
              { name: "Mixtures" },
              { name: "Homogenous mixtures" },
              { name: "Separation of homogenous mixtures" },
              { name: "Applications of methods of separating mixtures in real life" },
              { name: "Acids, bases & Indicators" }
            ]
          },
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Human reproductive system" },
              { name: "Human excretory system - Components of the excretory system" },
              { name: "Human excretory system - Parts of the human skin & their functions" },
              { name: "Human excretory system - Parts of the urinary system & their functions" },
              { name: "Human excretory system - Commonly kidney disorders & their causes" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Selected crop management practices - Management practices carried on crops" },
              { name: "Selected crop management practices - Carrying out management practices" },
              { name: "Preparing animal products: eggs & honey - Explaining how to prepare animal products" },
              { name: "Preparing animal products: eggs & honey - Preparing animal products for various purposes" },
              { name: "Cooking: grilling, roasting & steaming - Methods of cooking different types of food" },
              { name: "Cooking: grilling, roasting & steaming - Cooking food using the methods" }
            ]
          },
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Hygiene in rearing animals - Hygiene practices in rearing animals" },
              { name: "Hygiene in rearing animals - Carrying out hygiene practices" },
              { name: "Laundering loose coloured items - How to launder loose coloured article" },
              { name: "Laundering loose coloured items - Laundering loose coloured article" }
            ]
          },
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Sewing skills: Knitting - Knitting stitches used in making household articles" },
              { name: "Sewing skills: Knitting - Knitting various articles" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "COMMUNICATION IN PRE TECHNICAL",
            subStrands: [
              { name: "ICT tools in communication - Importance of ICT tools used in communication" }
            ]
          },
          {
            name: "MATERIALS FOR PRODUCTION",
            subStrands: [
              { name: "Introduction to materials" },
              { name: "Identify materials used in production" },
              { name: "Metallic materials - Types of metallic materials" },
              { name: "Metallic materials - Physical properties of metallic materials" },
              { name: "Metallic materials - Relating metallic materials and their uses" },
              { name: "Non-metallic materials - Non-metallic materials in the environment" },
              { name: "Non-metallic materials - Categories of non-metallic materials" },
              { name: "Non-metallic materials - Physical properties of Non-metallic materials" },
              { name: "Non-metallic materials - Relating non-metallic materials & their uses" }
            ]
          },
          {
            name: "TOOLS & PRODUCTION",
            subStrands: [
              { name: "Measuring & making out tools - Measuring and making out tools in the environment" },
              { name: "Measuring & making out tools - Use measuring and marking tools to perform a task" },
              { name: "Measuring & making out tools - Care for measuring and marking tools" },
              { name: "Computer hardware - Classify computer hardware devices in a user environment" },
              { name: "Computer hardware - Uses of computer hardware" },
              { name: "Computer hardware - Various computer hardware tasks" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & PERFORMING OF CA&S",
            subStrands: [
              { name: "Descant recorder - Interpreting melodies of staff notation" },
              { name: "Descant recorder - Key signatures, time signatures and note values" },
              { name: "Descant recorder - Performance direction, dynamics (loud and soft) fast and slow" },
              { name: "Football - Shooting" },
              { name: "Football - Trapping" },
              { name: "Football - Crayon etching" },
              { name: "Football - Dribbling" },
              { name: "Storytelling - Storytelling techniques" },
              { name: "Storytelling - Composing a story" },
              { name: "Storytelling - Flip book animation" },
              { name: "Storytelling - Performing a story" },
              { name: "Swimming - Painting a human form" },
              { name: "Swimming - Pencil dive" },
              { name: "Swimming - Backstroke" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE EARLY LIFE OF JESUS CHRIST",
            subStrands: [
              { name: "Prophecies about the messiah" },
              { name: "The birth & childhood of Jesus Christ" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "Selected forms of worship" },
              { name: "Role of the church in education" },
              { name: "Role of the church in health" },
              { name: "Human sexuality" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 7 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 7",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Angles" },
              { name: "Geometrical constructions" }
            ]
          },
          {
            name: "DATA HANDLING",
            subStrands: [
              { name: "Data handling" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "TRADITIONAL FASHION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "LAND TRAVEL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SPORTS & OUTDOOR GAMES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TOURIST ATTRACTION SITES - KENYA",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MAGONJWA AMBUKIZI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UTATUZI WA MIZOZO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI YA PESA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAADILI YA MTU BINAFSI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "POLITICAL DEVELOPMENT & GOVERNANCE",
            subStrands: [
              { name: "Political development in Africa" },
              { name: "The constitution of Kenya" },
              { name: "Human rights" },
              { name: "African Diasporas" },
              { name: "Citizenship" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Electrical energy - Sources of electricity" },
              { name: "Electrical energy - Flow of electric current using simple electric circuits" },
              { name: "Electrical energy - Electrical appliances used in daily life" },
              { name: "Electrical energy - Safety measures when using electrical appliances" },
              { name: "Electrical energy - Uses of electricity in daily life" },
              { name: "Magnetism - Properties of a magnet" },
              { name: "Magnetism - Materials as magnetic or nonmagnetic" },
              { name: "Magnetism - Uses of magnets in daily life" },
              { name: "Magnetism - Applications of magnets in daily life" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Constructing framed suspended gardens - Describing framed suspended gardens" },
              { name: "Constructing framed suspended gardens - Constructing framed structure" },
              { name: "Adding value to crop produce - Ways of adding value on crop produce" },
              { name: "Adding value to crop produce - Add value to selected crop produce" },
              { name: "Making homemade soap - Forms of soap used at household level" },
              { name: "Making homemade soap - Making a homemade soap using material ingredients" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "ENTREPRENEURSHIP",
            subStrands: [
              { name: "Introduction to Entrepreneurship" },
              { name: "Importance of entrepreneurship" },
              { name: "Qualities of an entrepreneur" },
              { name: "Sources of business ideas" },
              { name: "Factors considered when evaluating the viability of a business opportunity" },
              { name: "Factors that enhance the sources of a business" },
              { name: "Production unit - Factors to consider when locating a production unit" },
              { name: "Production unit - Analyze factors to consider when locating a production unit" },
              { name: "Production unit - Value of importance of locating a production unit in a suitable area" },
              { name: "Financial goals - Importance of setting financial goals" },
              { name: "Financial goals - Factors considered when setting financial goals" },
              { name: "Financial goals - Formulating financial goals" },
              { name: "Financial discipline" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATING AND PERFORMING",
            subStrands: [
              { name: "Kenyan folk songs - Classification of folk songs" },
              { name: "Kenyan folk songs - Performing folk songs" },
              { name: "Indigenous Kenyan craft - Beadwork - Types of beads (plastics/clay, Shell/bone/wood)" }
            ]
          },
          {
            name: "APPRECIATION IN CA&S",
            subStrands: [
              { name: "Analysis of creative Arts & sports - Criteria for evaluation" },
              { name: "Analysis of creative Arts & sports - Analysis for each category" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CHRISTIAN LIVING",
            subStrands: [
              { name: "Human sexuality" },
              { name: "Christian marriage and family" },
              { name: "Alcohol, drug and substance abuse" },
              { name: "Gambling" },
              { name: "Social media" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 8 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 8",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Integers" },
              { name: "Integers in different situations" },
              { name: "Rep. integers in a number line" },
              { name: "Operations involving addition & subtraction of integers" },
              { name: "Fractions" },
              { name: "Decimals" },
              { name: "Squares and square roots" },
              { name: "Rate, ratio, proportions & percentages" }
            ]
          },
          {
            name: "ALGEBRA",
            subStrands: [
              { name: "Algebraic expressions" },
              { name: "Linear equations" }
            ]
          }
        ]
      },
      {
        name: "English Language Activities",
        strands: [
          {
            name: "THEME 1: HUMAN RIGHTS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Polite language" },
              { name: "- Telephone etiquette" },
              { name: "Reading" },
              { name: "Extensive reading : independent reading" },
              { name: "Grammar in use:" },
              { name: "Word clauses; compound nouns" },
              { name: "Reading:" },
              { name: "Intensive reading; short stories" },
              { name: "Writing" },
              { name: "Writing : - Writing legibly and neatly" }
            ]
          },
          {
            name: "SCIENTIFIC INNOVATIONS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Oral presentation: songs" },
              { name: "Reading (extensive & intensive)" },
              { name: "poem" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "POLLUTION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CONSUMER ROLES & RESPONSIBILITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "RELATIONSHIPS: PEERS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USAFI WA SEHEMU ZA UMMA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI YAFAAYO YA DAWA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "DHIKI ZINAZOKUMBA WANYAMA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI BORA YA MALIASILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAJUKUMU YA KIJINSIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "COMMUNITY SERVICE LEARNING",
            subStrands: [
              { name: "community service learning" }
            ]
          },
          {
            name: "PEOPLE AND RELATIONSHIP",
            subStrands: [
              { name: "Scientific theories about human origine" },
              { name: "Early civilization" },
              { name: "Trans Saharan slave trade" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "MIXTURES, ELEMENTS & COMPUNDS",
            subStrands: [
              { name: "Elements & compounds" },
              { name: "- Atoms, elements, molecules & compounds" },
              { name: "- Symbols of common elements" },
              { name: "- Word equations for reactions of elements to form compounds" },
              { name: "- Uses of some common elements in the society" },
              { name: "Physical and chemical changes" },
              { name: "- Kinetic theory of matter" },
              { name: "- Heating curve" },
              { name: "- Effects of impurities on Boiling point and melting point" },
              { name: "- Physical and chemical changes" },
              { name: "- Applications of physical & chemical changes in daily life" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION RESOURCES",
            subStrands: [
              { name: "Soil conservation" },
              { name: "Methods of soil conservation" },
              { name: "Carrying out soil conservation act." },
              { name: "Water harvesting and storage" },
              { name: "Ways of storing harvested water" },
              { name: "Participating in harvesting water" }
            ]
          },
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Kitchen & Backyard gardening" },
              { name: "Role of kitchen & backyard gardening" },
              { name: "Establishing kitchen & backyard garden" },
              { name: "Poultry rearing in a fold" },
              { name: "Describing fold in poultry rearing" },
              { name: "Constructing a fold" },
              { name: "Rearing poultry in a fold" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "FOUNDATIONS OF CA&S",
            subStrands: [
              { name: "Introduction to CA&S" },
              { name: "Roles of CA&S" },
              { name: "Creating a storyboard" },
              { name: "Painting background" },
              { name: "Components of CA&S" },
              { name: "Elements of a verse: character, theme, setting" },
              { name: "Pitch: bass staff, ledger lines, G major, piano keyboard, accidentals, middle C" },
              { name: "Rhythm: semibreve, minim, crotchet, a pair of quaver" },
              { name: "Elements of music and dance" }
            ]
          },
          {
            name: "CREATING & PERFORMIN CA&S",
            subStrands: [
              { name: "Drawing and Painting" },
              { name: "Drawing forms/shapes" },
              { name: "Dominance (size variation)" },
              { name: "Painting" },
              { name: "Rhythm" },
              { name: "Composing four bar rhythm" },
              { name: "Note values and their corresponding rests (semibreve, minim, crotchet and a pair of quiver)" },
              { name: "French rhythm names" },
              { name: "Middle distance Races and Montage" },
              { name: "Middle distance races" },
              { name: "Montage (subjects, posture, center of interest, finishing)" },
              { name: "Melody" },
              { name: "Question and answer phrases in a melody" },
              { name: "4-bar melodies in G Major and time." },
              { name: "Extending a melody using exact repetition, and varied repetition." }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "FOUNDATION OF PRETECH",
            subStrands: [
              { name: "Fire safety" },
              { name: "Data safety" }
            ]
          },
          {
            name: "COMMUNICATION",
            subStrands: [
              { name: "Plane geometry" },
              { name: "Dimensioning" },
              { name: "Plain scale drawing" },
              { name: "Visual programming" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Origin and consequence of sin" },
              { name: "God's plan for redemption" }
            ]
          },
          {
            name: "THE BIBLE",
            subStrands: [
              { name: "Faith & God's promises" },
              { name: "Abrahamic covenant" },
              { name: "Leadership in Israel: Saul" },
              { name: "Uses of natural resources" }
            ]
          },
          {
            name: "MIRACLES OF JESUS CHRIST",
            subStrands: [
              { name: "Healing of the blind Bartimaeus" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 8 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 8",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "MEASUREMENTS",
            subStrands: [
              { name: "Circles" },
              { name: "Area" },
              { name: "Money" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Geometrical constructions" },
              { name: "Coordinate and graphics" },
              { name: "Scale drawing" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "REHABILITATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NATURAL RESOURCES: WILDLIFE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TOURISM: DOMESTIC",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HEROES & HEROINES - AFRICA",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ART",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CHOOSING A CAREER",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USALAMA NYUMBANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUHUDUMIA WENYE MAHITAJI MAALUM",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UHALIFU MTANDAONI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAJUKUMU YA MNUNUZI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUKABILIANA NA HISIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAJUKUMU YA WATOTO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "PEOPLE AND POPULATION",
            subStrands: [
              { name: "Population in Africa" },
              { name: "Diversity and interpersonal skills" },
              { name: "Peaceful conflict resolutions" },
              { name: "Map reading and Interpretation" }
            ]
          },
          {
            name: "NATURAL & HISTORIC BUILT ENVIRONMENTS",
            subStrands: [
              { name: "Map reading and interpretation" },
              { name: "Weather and climate" },
              { name: "Vegetation in Africa" },
              { name: "Historical sites and monuments in Africa" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "MIXTURES, ELEMENTS & COMPONENTS",
            subStrands: [
              { name: "Classes of fires" },
              { name: "Causes of fire (classes of fire)" },
              { name: "- Fire triangle and fire control" },
              { name: "Breaking the fire triangle and use of fire extinguishers" },
              { name: "- dangers of fire" }
            ]
          },
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "The cell" },
              { name: "Cell structure as seen under a light microscope (plant and animal cells)" },
              { name: "Preparation of temporary slides of plant cells" },
              { name: "Magnification of cells seen under the light microscope" },
              { name: "Movement of materials in and out of the cell" },
              { name: "Diffusion and osmosis" },
              { name: "Demonstration of diffusion and osmosis" },
              { name: "Roles of diffusion and osmosis in Living things" },
              { name: "- Absorption of water, nutrient in the intestine, gases in the lungs" },
              { name: "Reproduction in human being" },
              { name: "the menstrual cycle in human beings" },
              { name: "Challenges related to the menstrual cycle" },
              { name: "- include irregular bleeding and pain" },
              { name: "Process of fertilization and implantation" },
              { name: "Symptoms and preventions of common STIs" },
              { name: "- HIV and Aids" },
              { name: "- gonorrhea" },
              { name: "- syphilis" },
              { name: "- Herpes" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Crop pest & disease control" },
              { name: "Vegetable crops attacked by disease" },
              { name: "Controlling pest & diseases on vegetables" },
              { name: "Preparation of animal products" },
              { name: "Importance of processing fish & dressing poultry carcass" },
              { name: "Processing fresh fish for various purposes" },
              { name: "Preserving milk and meat" },
              { name: "Importance of preserving milk" },
              { name: "Preserving milk and honey" },
              { name: "Cooking: preparing balanced meal" },
              { name: "Factors considered in preparing balanced meal" },
              { name: "- Preparing a balanced meal" },
              { name: "- Presenting a meal in various styles" }
            ]
          },
          {
            name: "HYGIEN PRACTICES",
            subStrands: [
              { name: "Cleaning the kitchen" },
              { name: "Routine practices of the kitchen" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "MATERIALS FOR PRODUCTION",
            subStrands: [
              { name: "Composite materials" },
              { name: "Ceramic materials" }
            ]
          },
          {
            name: "TOOLS & PRODUCTION",
            subStrands: [
              { name: "Cutting tools" },
              { name: "Selecting cutting tools" },
              { name: "Using cutting tools" },
              { name: "Care & maintenance of cutting tools" },
              { name: "Computer software" },
              { name: "Categories of computer software" },
              { name: "Functions of computer softwares" }
            ]
          },
          {
            name: "ENTREPRENEURSHIP",
            subStrands: [
              { name: "Bookkeeping" },
              { name: "Importance of bookkeeping" },
              { name: "Classifying business transactions" },
              { name: "Preparing simple financial statements" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & PERFORMING OF CA&S",
            subStrands: [
              { name: "Netball" },
              { name: "passes" },
              { name: "footwork" },
              { name: "dodging and marking" },
              { name: "Fabric decoration" },
              { name: "Tie and dye (marbling, pleating)" },
              { name: "stencil printing" },
              { name: "alternate pattern (motif layout)" },
              { name: "Descant recorder" },
              { name: "Techniques of playing a descant recorder" },
              { name: "- Fingering" },
              { name: "- Pinching" },
              { name: "- Slurring" },
              { name: "- Embouchure" },
              { name: "- Tonguing" },
              { name: "- Blowing" },
              { name: "Melodies in G Major" },
              { name: "Performance directions:" },
              { name: "- Repeat (da capo al fine, dal segno al fine)" },
              { name: "Technique poster" },
              { name: "Verse" },
              { name: "Writing a verse" },
              { name: "Performing a verse" },
              { name: "Volleyball" },
              { name: "- Service in volleyball" },
              { name: "- Volley Skills" },
              { name: "Kenyan Folk Dance" },
              { name: "Classification of folk dances:" },
              { name: "- Community, gender and age of participants" },
              { name: "Performing a folk dance" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "MIRACLE OF JESUS",
            subStrands: [
              { name: "Calming the storm" },
              { name: "Healing the paralytic" }
            ]
          },
          {
            name: "TEACHINGS OF JESUS CHRIST",
            subStrands: [
              { name: "Teachings on prayer" },
              { name: "The lost sheep" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "The Holy spirit" },
              { name: "Acts of Compassion" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 8 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 8",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Common solids" }
            ]
          },
          {
            name: "DATA HANDLING & PROBABILITY",
            subStrands: [
              { name: "Data presentation & interpretation" },
              { name: "Probability" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "MODERN FASHION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CONSUMER PROTECTION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SPORTS OLYMPICS",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TOURIST ATTRACTION SITES- AFRICA",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MAGONJWA YASIYOAMBUKIZA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "HESHIMA KWA TAMADUINI ZA WENGINE",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUWEKA AKIBA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAADILI YA KIJAMII",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "POLITICAL DEVELOPMENT & GOVERNANCE",
            subStrands: [
              { name: "The constitution of Kenya" },
              { name: "Human rights" },
              { name: "Citizenship" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Transformation of energy" },
              { name: "- Forms of energy in nature" },
              { name: "- Renewable & non-renewable energy sources" },
              { name: "- Energy transformation in nature" },
              { name: "- Safety measures associated with energy transformation" },
              { name: "- Application of energy transformation" },
              { name: "Pressure" },
              { name: "- Pressure In solids" },
              { name: "- Applications of pressure in solids and liquids" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "Sewing skills : constructing household items" },
              { name: "Types of seams used in making clothes" },
              { name: "Making samples of seams" },
              { name: "Constructing innovative animal waterer" },
              { name: "Challenges with animal waterers" },
              { name: "Designing and constructing a waterer" },
              { name: "ICT support services" },
              { name: "Support services that can be accessed through use of ICT" },
              { name: "- Access support services using ICT" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "ENTREPRENEURSHIP",
            subStrands: [
              { name: "Income and budgeting" },
              { name: "Sources of income" },
              { name: "Importance of budgeting" },
              { name: "Preparing a simple budget" },
              { name: "Ethic and unethical practices in budgeting" },
              { name: "Marketing of goods and services" },
              { name: "distribution of goods and services" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATING AND PERFORMANCE",
            subStrands: [
              { name: "Indigenous Kenyan Craft" },
              { name: "- Basketry" },
              { name: "Materials- sisal, banana fibre, raffia, recyclable synthetic fabric among others." },
              { name: "Swimming" },
              { name: "Inverted Breaststroke" },
              { name: "Water treading" },
              { name: "Kenyan indigenous Games" },
              { name: "Tagging" }
            ]
          },
          {
            name: "APPRECIATION IN CA&S",
            subStrands: [
              { name: "Analysis of creative Arts & sports" },
              { name: "- Artwork; drawing, painting and montage pictures, decorated fabric, basketry items" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CHRISTIAN LIVING",
            subStrands: [
              { name: "Family relationships" },
              { name: "Human sexuality" },
              { name: "Sacredness of life" },
              { name: "Bullying" },
              { name: "Work (talents & abilities)" },
              { name: "Leisure" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 9 - TERM 1 ====================
  {
    term: 1,
    grade: "Grade 9",
    learningAreas: [
      {
        name: "English Language Activities",
        strands: [
          {
            name: "CITIZENSHIP",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SCIENCE: FICTION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "ENVIRONMENTAL CONSERVATION",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "CONSUMER PROTECTION:",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "RELATIONSHIPS: COMMUNITY",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "NUMBERS",
            subStrands: [
              { name: "Integers" },
              { name: "Cubes and cube roots" },
              { name: "Indices and logarithms" },
              { name: "Compound proportions & rates of work" }
            ]
          },
          {
            name: "ALGEBRA",
            subStrands: [
              { name: "Matrices" },
              { name: "Equations of straight lines" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USAFI WA MAZINGIRA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAZOEZI YA VIOUNGO VYA MWILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UTUNZAJI WA WANYAMA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "UTUNZAJI WA MALIASILI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MITAZAMO HASI WA KIJINSIA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "SST & PERSONAL DEVELOPMENT",
            subStrands: [
              { name: "Career choices" },
              { name: "Entrepreneurial opportunities in SST" }
            ]
          },
          {
            name: "COMMUNITY SERVICE LEARNING",
            subStrands: [
              { name: "Identify a problem" },
              { name: "Designing a solution" },
              { name: "Plan to solve" },
              { name: "Implement the plan" },
              { name: "Write a report" }
            ]
          },
          {
            name: "PEOPLE, POPULATION & RELATIONSHIPS",
            subStrands: [
              { name: "Socio-economic practices of early humans" },
              { name: "Indigenous knowledge systems in African societies" },
              { name: "Poverty reduction" },
              { name: "Population structure" },
              { name: "Process & non-violent conflict resolution" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "MIXTURES, ELEMENTS & COMPOUNDS",
            subStrands: [
              { name: "Structure of the Atom" },
              { name: "- Structure of the atom" },
              { name: "- Atomic number and mass number of elements" },
              { name: "- Electron arrangement of elements" },
              { name: "- Energy level diagrams" },
              { name: "- Metals & non-metals" },
              { name: "Metals and Alloys" },
              { name: "- Physical properties of alloys" },
              { name: "- Composition of alloys" },
              { name: "- Uses of metals and alloys in daily life" },
              { name: "Water hardness" },
              { name: "- Physical properties of water" },
              { name: "- Hard and soft water" },
              { name: "- Methods of softening temporary hard water" }
            ]
          },
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Nutrition in plants" },
              { name: "- Parts of a leaf" },
              { name: "- Adaptation of the leaf to photosynthesis" },
              { name: "- Structure of chloroplasts" },
              { name: "- Process of photosynthesis" },
              { name: "- Conditions necessary for photosynthesis" }
            ]
          }
        ]
      },
      {
        name: "Agriculture & Nutrition Activities",
        strands: [
          {
            name: "CONSERVATION OF RESOURCES",
            subStrands: [
              { name: "Conserving Animal feed: Hay" },
              { name: "Methods of conserving forage in coping with drought Conserve forage" },
              { name: "Conserving leftover foods" },
              { name: "Importance of conserving left over foods at home Prepare leftover foods to avoid wastage" },
              { name: "Integrated farming" },
              { name: "Components of integrated farming Making a model of integrated farming" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "FOUNDATIONS OF CA&S",
            subStrands: [
              { name: "Careers in CA&S" },
              { name: "Components of CA&S" }
            ]
          },
          {
            name: "CREATING & PERFORMING CA&S",
            subStrands: [
              { name: "Composing rhythm" },
              { name: "athletics" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "FOUNDATION OF PRETECH",
            subStrands: [
              { name: "Safety on raised platforms" },
              { name: "Types of raised platforms" },
              { name: "Risks associated with raised platforms" },
              { name: "Self-exploration & career Development" },
              { name: "Ways of nurturing talents & abilities" },
              { name: "Elating careers and abilities" },
              { name: "Computer software" },
              { name: "Categories of computer software" },
              { name: "Functions of computer software" },
              { name: "Using computer software" }
            ]
          },
          {
            name: "COMMUNICATION",
            subStrands: [
              { name: "Oblique projection" },
              { name: "Visual programming" },
              { name: "Application characteristics of Visual programming" },
              { name: "Creating application in Visual Programming" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CREATION",
            subStrands: [
              { name: "Work: God worked" },
              { name: "Scriptures on works" },
              { name: "Virtues related to Christian work" },
              { name: "Choosing a career" }
            ]
          },
          {
            name: "THE BIBLE: SELECTED TEACHINGS",
            subStrands: [
              { name: "Christian values: sexual purity" },
              { name: "Woman judge: Deborah" },
              { name: "Kings David & Solomon" }
            ]
          },
          {
            name: "THE LIFE & MINISTRY OF JESUS CHRIST",
            subStrands: [
              { name: "Raising the widow's son" },
              { name: "Healing the 10 leapers" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 9 - TERM 2 ====================
  {
    term: 2,
    grade: "Grade 9",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "ALGEBRA",
            subStrands: [
              { name: "Linear Inequalities" }
            ]
          },
          {
            name: "MEASUREMENT",
            subStrands: [
              { name: "Area" },
              { name: "Volume of solids" },
              { name: "Mass, volume, weight & density" },
              { name: "Time, distance & speed" },
              { name: "Money" },
              { name: "Approximation and errors" }
            ]
          },
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Coordinates and graphs" },
              { name: "Scale drawing" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "LEISURE TIME",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "NATURAL RESOURCES: MARINE LIFE",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TOURISM: INTERNATIONAL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "HEROES & HEROINES - WORLD",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SOCIAL & MASS MEDIA",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "INCOME GENERATING ACTIVITIES",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "USALAMA BARABARANI",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "HUDUMA KATIKA ASASI ZA KIJAMII",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MISUKOSUKO YA KIJAMII",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI YA VIFAA VYA KIDIJITALI KATIKA BIASHARA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "KUKABILIANA NA MSONGO WA MAWAZO",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "HAKI ZA KIBINADAMU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "PEOPLE, POPULATION AND RELATIONSHIPS",
            subStrands: [
              { name: "Healthy relationships" }
            ]
          },
          {
            name: "NATURAL & HISTORIC BUILT ENVIRONMENTS",
            subStrands: [
              { name: "Topographical maps" },
              { name: "Internal land forming processes" },
              { name: "Multi-purpose river projects in Africa" },
              { name: "Management & conservation of the Environment" },
              { name: "World heritage sites in Africa" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "LIVING THINGS & THEIR ENVIRONMENT",
            subStrands: [
              { name: "Nutrition in animals" },
              { name: "- Modes of nutrition in animals" },
              { name: "- Dentition in animals" },
              { name: "- Types of teeth" },
              { name: "- Process of digestion in human beings" },
              { name: "Reproduction in plants" },
              { name: "- Functions of parts of a flower" },
              { name: "- Meaning and types of pollinations" },
              { name: "- Adaptations of flower to wind and insect pollination" },
              { name: "- Fertilization, seed and fruit formation in flowing plants" },
              { name: "- Fruit and seed dispersal in plants" },
              { name: "The Interdependence of life" },
              { name: "- Biotic components of the environment" },
              { name: "- Abiotic components of the environment" },
              { name: "- Energy flow in an ecosystem" },
              { name: "- Effects of human activities in the environment" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "FOOD PRODUCTION PROCESSES",
            subStrands: [
              { name: "Storage of crop produce" },
              { name: "- Ways of preparing storage structures before storing crop produce" },
              { name: "- Prepare existing structures" },
              { name: "Cooking using flour mixtures" },
              { name: "- Types flour mixtures" },
              { name: "- Preparing flour mixtures" },
              { name: "- Making products from mixtures of flours" }
            ]
          },
          {
            name: "HYGIENE PRACTICES",
            subStrands: [
              { name: "Cleaning waste disposal facilities" },
              { name: "Importance of cleaning waste disposal facilities" },
              { name: "Clean waste disposal facilities" },
              { name: "Disinfecting clothing & household articles" },
              { name: "Methods of disinfecting clothing & household articles" },
              { name: "Carrying out disinfection on clothes" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "MATERIALS FOR PRODUCTION",
            subStrands: [
              { name: "WOOD" },
              { name: "Classification of wood" },
              { name: "Preparation of wood" },
              { name: "Types of wood and their uses" }
            ]
          },
          {
            name: "TOOLS OF PRODUCTION",
            subStrands: [
              { name: "Holding tools" },
              { name: "Driving tools" },
              { name: "Distribution of goods and services" },
              { name: "Project" },
              { name: "Production of Goods and Services" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "CREATION & PERFORMING",
            subStrands: [
              { name: "Composing melody" },
              { name: "Rugby" },
              { name: "Descant recorder" },
              { name: "Basketball" },
              { name: "Play" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "THE LIFE & MINISTRY OF JESUS CHRIST",
            subStrands: [
              { name: "Parable of prayer- a friend at midnight" },
              { name: "Nicodemus encounter with Jesus Christ" },
              { name: "Jesus' ministry in Jerusalem" },
              { name: "Jesus, passion, death & resurrection" }
            ]
          },
          {
            name: "THE CHURCH",
            subStrands: [
              { name: "The early church" },
              { name: "The Gifts of the Holy spirit" }
            ]
          }
        ]
      }
    ]
  },

  // ==================== GRADE 9 - TERM 3 ====================
  {
    term: 3,
    grade: "Grade 9",
    learningAreas: [
      {
        name: "Mathematics Activities",
        strands: [
          {
            name: "GEOMETRY",
            subStrands: [
              { name: "Similarity and enlargement" },
              { name: "Trigonometry" }
            ]
          },
          {
            name: "DATA HANDLING & PROBABILITY",
            subStrands: [
              { name: "Data interpretation (grouped data)" },
              { name: "Probability" }
            ]
          }
        ]
      },
      {
        name: "English Activities",
        strands: [
          {
            name: "PERSONAL GROOMING",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SEA TRAVEL",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "SPORTS – WORLD CUP (FOOTBALL)",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          },
          {
            name: "TOURIST ATTRACTION SITES- WORLD",
            subStrands: [
              { name: "Listening and speaking" },
              { name: "Reading (extensive & intensive)" },
              { name: "Grammar in use" },
              { name: "Writing" }
            ]
          }
        ]
      },
      {
        name: "Shughuli za Kiswahili",
        strands: [
          {
            name: "MAGINJWA YANAYOTOKANA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MSHIKAMAO WA KIJAMII",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MATUMIZI YA USHURU",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          },
          {
            name: "MAADILI YA KITAIFA",
            subStrands: [
              { name: "Kusikiliza na kuzungumza" },
              { name: "Kusoma" },
              { name: "Kuandika" },
              { name: "Sarufi" }
            ]
          }
        ]
      },
      {
        name: "Social Studies Activities",
        strands: [
          {
            name: "POLITICAL DEVELOPMENT & GOVERNANCE",
            subStrands: [
              { name: "The constitution of Kenya" },
              { name: "Civic engagement in Governance" },
              { name: "Kenya's bill of rights" },
              { name: "Cultural globalization" }
            ]
          }
        ]
      },
      {
        name: "Integrated Science Activities",
        strands: [
          {
            name: "FORCE AND ENERGY",
            subStrands: [
              { name: "Curved mirrors" },
              { name: "- Types of curved mirrors" },
              { name: "- Image formed by concave & convex mirrors" },
              { name: "- Applications of curved mirrors in daily life" },
              { name: "Waves" },
              { name: "- Generation of waves" },
              { name: "- Classification of waves as longitudinal & traverse" },
              { name: "- Characteristics of waves" },
              { name: "- Remote sensing" },
              { name: "- Applications of waves in daily life" }
            ]
          }
        ]
      },
      {
        name: "Agriculture and Nutrition Activities",
        strands: [
          {
            name: "PRODUCTION TECHNIQUES",
            subStrands: [
              { name: "GRAFTING PLANTS" },
              { name: "- Describing Grafting as a method of plant propagation" },
              { name: "- Carrying out grafting for various purposes" },
              { name: "- Taking care of grafted plants" },
              { name: "HOMEMADE SUN DRYER" },
              { name: "How to make homemade sun dryer for vegetables" },
              { name: "Constructing a homemade sun dryer to preserve vegetables" }
            ]
          }
        ]
      },
      {
        name: "Pretechnical Studies Activities",
        strands: [
          {
            name: "ENTREPRENEURSHIP",
            subStrands: [
              { name: "Financial services" },
              { name: "Financial institutions in Kenya" },
              { name: "Classification of financial institutions" },
              { name: "Government and business" },
              { name: "Business plan" }
            ]
          }
        ]
      },
      {
        name: "Creative Arts Activities",
        strands: [
          {
            name: "PERFORMANCE AND DISPLAY",
            subStrands: [
              { name: "Cotemporary dance" },
              { name: "Swimming" }
            ]
          },
          {
            name: "APPRECIATION CA & S",
            subStrands: [
              { name: "Analysis for each category" }
            ]
          }
        ]
      },
      {
        name: "C.R.E Activities",
        strands: [
          {
            name: "CHRISTIAN LIVING TODAY",
            subStrands: [
              { name: "Courtship & marriage" },
              { name: "Responsible parenthood" },
              { name: "Leisure" },
              { name: "Wealth, money and poverty" }
            ]
          }
        ]
      }
    ]
  }
];

// Senior Secondary learning areas for Grade 10-12 organized by category
export const seniorSecondaryCategories = {
  'Core Subjects': [
    'English', 'Kiswahili/KSL', 'Core Mathematics/Essential Mathematics', 'Community Service Learning (CSL)'
  ],
  'Arts & Sports': [
    'Sports and Recreation', 'Music and Dance', 'Theatre and Film', 'Fine Arts'
  ],
  'Social Sciences': [
    'Literature in English', 'Indigenous Languages', 'Fasihi ya Kiswahili', 'Sign Language',
    'Arabic', 'French', 'German', 'Mandarin Chinese',
    'Christian Religious Education', 'Islamic Religious Education', 'Hindu Religious Education',
    'Business Studies', 'History and Citizenship', 'Geography'
  ],
  'Science': [
    'Biology', 'Chemistry', 'Physics', 'General Science'
  ],
  'Science, Technology, Engineering & Mathematics (STEM)': [
    'Agriculture', 'Computer Studies', 'Home Science', 'Aviation',
    'Building Construction', 'Electricity', 'Metalwork', 'Power Mechanics',
    'Wood Technology', 'Media Technology', 'Marine and Fisheries Technology'
  ]
};

// Flat list of all senior secondary learning areas (for backward compatibility)
const seniorSecondaryLearningAreas = [
  ...seniorSecondaryCategories['Core Subjects'],
  ...seniorSecondaryCategories['Arts & Sports'],
  ...seniorSecondaryCategories['Social Sciences'],
  ...seniorSecondaryCategories['Science'],
  ...seniorSecondaryCategories['Science, Technology, Engineering & Mathematics (STEM)']
];

// Helper function to check if grade is Senior Secondary
const isSeniorSecondary = (grade: GradeLevel): boolean => {
  return ['Grade 10', 'Grade 11', 'Grade 12'].includes(grade);
};

// Helper function to normalize learning area names for comparison
// This enables fuzzy matching between student profile subjects and curriculum data names
// Exported for use in other components
export const normalizeLearningAreaName = (name: string): string => {
  let normalized = name
    .replace(/\s*&\s*/g, ' and ')  // Replace & with and
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim()
    .toLowerCase();
  
  // Strip common suffixes to allow "Mathematics" to match "Mathematics Activities"
  normalized = normalized
    .replace(/\s*activities$/i, '')     // Remove "Activities" suffix
    .replace(/\s*activity$/i, '')       // Remove "Activity" suffix
    .trim();
  
  // Normalize common subject name variations
  const subjectMappings: Record<string, string> = {
    // Kiswahili variations
    'kiswahili': 'shughuli za kiswahili',
    'kiswahili language': 'shughuli za kiswahili',
    'lugha ya kiswahili': 'shughuli za kiswahili',
    
    // English variations
    'english': 'english language',
    
    // Science variations
    'science': 'science and technology',
    'science and technology': 'science and technology',
    
    // Social Studies
    'social studies': 'social studies',
    
    // CRE variations
    'cre': 'c.r.e',
    'c.r.e': 'c.r.e',
    'christian religious education': 'c.r.e',
    'religious education': 'c.r.e',
    
    // IRE variations
    'ire': 'i.r.e',
    'i.r.e': 'i.r.e',
    'islamic religious education': 'i.r.e',
    
    // HRE variations
    'hre': 'h.r.e',
    'h.r.e': 'h.r.e',
    'hindu religious education': 'h.r.e',
    
    // Creative Arts variations
    'creative arts': 'creative arts',
    'creative arts and sports': 'creative arts',
    
    // Agriculture variations (Grade 1-9 uses 'agriculture and nutrition', Grade 10+ uses 'agriculture')
    'agriculture and nutrition': 'agriculture and nutrition',
    
    // Physical Education variations
    'physical education': 'physical and health education',
    'pe': 'physical and health education',
    'phe': 'physical and health education',
    'physical health education': 'physical and health education',
    'physical and health education': 'physical and health education',
    
    // Maths variations
    'maths': 'mathematics',
    'math': 'mathematics',
  };
  
  // Apply mapping if exists
  if (subjectMappings[normalized]) {
    normalized = subjectMappings[normalized];
  }
  
  return normalized;
};

// Helper functions
export const getLearningAreasForTermAndGrade = (term: number, grade: GradeLevel): string[] => {
  // For Senior Secondary (Grade 10-12), return senior secondary subjects
  if (isSeniorSecondary(grade)) {
    return seniorSecondaryLearningAreas;
  }
  const termData = grades1to9CurriculumByTerm.find(t => t.term === term && t.grade === grade);
  return termData ? termData.learningAreas.map(la => la.name) : [];
};

export const getStrandsForLearningArea = (term: number, grade: GradeLevel, learningArea: string): string[] => {
  // For Senior Secondary, check senior secondary curriculum data
  if (isSeniorSecondary(grade)) {
    return getSeniorSecondaryStrands(grade, learningArea);
  }
  const termData = grades1to9CurriculumByTerm.find(t => t.term === term && t.grade === grade);
  if (!termData) return [];
  
  const normalizedSearch = normalizeLearningAreaName(learningArea);
  
  // Try exact normalized match first
  let area = termData.learningAreas.find(
    la => normalizeLearningAreaName(la.name) === normalizedSearch
  );
  
  // Try partial match (e.g., "Mathematics" matches "Mathematics Activities")
  if (!area) {
    area = termData.learningAreas.find(la => {
      const normalizedName = normalizeLearningAreaName(la.name);
      return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
    });
  }
  
  // Try word-based matching (at least 2 words match, or single word for short names)
  if (!area) {
    const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
    area = termData.learningAreas.find(la => {
      const nameWords = normalizeLearningAreaName(la.name).split(' ');
      const matchCount = searchWords.filter(sw => 
        nameWords.some(nw => nw.includes(sw) || sw.includes(nw))
      ).length;
      return matchCount >= Math.min(2, searchWords.length);
    });
  }
  
  return area ? area.strands.map(s => s.name) : [];
};

export const getSubStrandsForStrand = (term: number, grade: GradeLevel, learningArea: string, strand: string): string[] => {
  // For Senior Secondary, check senior secondary curriculum data
  if (isSeniorSecondary(grade)) {
    return getSeniorSecondarySubStrands(grade, learningArea, strand);
  }
  const termData = grades1to9CurriculumByTerm.find(t => t.term === term && t.grade === grade);
  if (!termData) return [];
  
  const normalizedSearch = normalizeLearningAreaName(learningArea);
  
  // Try exact normalized match first
  let area = termData.learningAreas.find(
    la => normalizeLearningAreaName(la.name) === normalizedSearch
  );
  
  // Try partial match
  if (!area) {
    area = termData.learningAreas.find(la => {
      const normalizedName = normalizeLearningAreaName(la.name);
      return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
    });
  }
  
  // Try word-based matching
  if (!area) {
    const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
    area = termData.learningAreas.find(la => {
      const nameWords = normalizeLearningAreaName(la.name).split(' ');
      const matchCount = searchWords.filter(sw => 
        nameWords.some(nw => nw.includes(sw) || sw.includes(nw))
      ).length;
      return matchCount >= Math.min(2, searchWords.length);
    });
  }
  
  const strandData = area?.strands.find(s => s.name === strand);
  return strandData ? strandData.subStrands.map(ss => ss.name) : [];
};

