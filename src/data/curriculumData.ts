import { grades1to9CurriculumByTerm, getLearningAreasForTermAndGrade, normalizeLearningAreaName, type GradeLevel } from '@/data/grades1-9CurriculumByTerm';
import { getSeniorSecondaryCurriculumAsStrands } from '@/data/seniorSecondaryCurriculum';

// Senior School (Grade 10-12) Learning Areas — KICD Senior School Curriculum Design
// Structure: Core Learning Areas (compulsory for all) + 3 Pathways (STEM / Social Sciences / Arts & Sports Science)
// Each pathway is organised into Tracks. Learners take ALL Core areas plus a minimum of subjects
// from ONE pathway (typically 3 subjects from a single track plus complementary areas).
export const seniorSecondaryCategories = {
  // Compulsory for every Senior School learner regardless of pathway
  'Core Learning Areas': [
    'English',
    'Kiswahili',
    'Kenya Sign Language',
    'Community Service Learning',
    'Physical Education',
    'ICT'
  ],

  // ============================================================
  // STEM PATHWAY
  // ============================================================
  'STEM – Pure Sciences': [
    'Mathematics',                 // Core Mathematics (compulsory for STEM)
    'Biology',
    'Chemistry',
    'Physics'
  ],
  'STEM – Applied Sciences': [
    'Agriculture',
    'Computer Studies',
    'Home Science',
    'Aviation Technology'
  ],
  'STEM – Technical & Engineering': [
    'Building Construction',
    'Electrical Technology',
    'Metal Technology',
    'Power Mechanics',
    'Wood Technology',
    'Media Technology',
    'Marine and Fisheries Technology'
  ],

  // ============================================================
  // SOCIAL SCIENCES PATHWAY
  // ============================================================
  'Social Sciences – Humanities & Business Studies': [
    'Essential Mathematics',       // taken in place of Core Mathematics
    'Advanced English',
    'Literature in English',
    'Kiswahili Kipevu',
    'Fasihi ya Kiswahili',
    'History and Citizenship',
    'Geography',
    'Christian Religious Education',
    'Islamic Religious Education',
    'Hindu Religious Education',
    'Business Studies'
  ],
  'Social Sciences – Languages': [
    'Indigenous Languages',
    'Arabic',
    'French',
    'German',
    'Mandarin Chinese'
  ],

  // ============================================================
  // ARTS & SPORTS SCIENCE PATHWAY
  // ============================================================
  'Arts & Sports Science': [
    'Essential Mathematics',       // taken in place of Core Mathematics
    'Sports and Recreation',
    'Music and Dance',
    'Theatre and Film',
    'Fine Arts'
  ]
};

// Flat de-duplicated list of all senior secondary learning areas (for backward compatibility)
export const seniorSecondaryLearningAreas = Array.from(new Set([
  ...seniorSecondaryCategories['Core Learning Areas'],
  ...seniorSecondaryCategories['STEM – Pure Sciences'],
  ...seniorSecondaryCategories['STEM – Applied Sciences'],
  ...seniorSecondaryCategories['STEM – Technical & Engineering'],
  ...seniorSecondaryCategories['Social Sciences – Humanities & Business Studies'],
  ...seniorSecondaryCategories['Social Sciences – Languages'],
  ...seniorSecondaryCategories['Arts & Sports Science']
]));

// Helper function to get all grade levels
export const getAllGradeLevels = () => {
  return ["Play Group", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
};

// Helper function to get learning areas for a specific grade
export const getLearningAreasByLevel = (gradeLevel: string) => {
  // Handle Senior Secondary (Grade 10-12)
  if (["Grade 10", "Grade 11", "Grade 12"].includes(gradeLevel)) {
    return seniorSecondaryLearningAreas;
  }
  // For Grades 1-9, return Term 1 learning areas as default
  return getLearningAreasForTermAndGrade(1, gradeLevel as GradeLevel);
};

// Helper function to get all learning areas for a grade
export const getAllLearningAreasForGrade = (gradeLevel: string) => {
  return getLearningAreasByLevel(gradeLevel);
};

// Helper function to determine school level category
export const getSchoolLevelCategory = (gradeLevel: string) => {
  if (gradeLevel === "Play Group") return "Play Group";
  if (["PP1", "PP2"].includes(gradeLevel)) return "Pre-Primary";
  if (["Grade 1", "Grade 2", "Grade 3"].includes(gradeLevel)) return "Lower Primary";
  if (["Grade 4", "Grade 5", "Grade 6"].includes(gradeLevel)) return "Upper Primary";
  if (["Grade 7", "Grade 8", "Grade 9"].includes(gradeLevel)) return "Junior School";
  if (["Grade 10", "Grade 11", "Grade 12"].includes(gradeLevel)) return "Senior Secondary";
  return "Unknown";
};

// Legacy export for backward compatibility - maps to new structure
export const LearningAreasByLevel = {
  "Play Group": {
    levels: ["Play Group"],
    learningAreas: ["Play-Based Learning", "Simple Language Activities", "Basic Mathematical Activities", "Environmental Awareness", "Creative Play", "Physical Movement"]
  },
  "Pre-Primary": {
    levels: ["PP1", "PP2"],
    learningAreas: ["Language Activities", "Mathematical Activities", "Environmental Activities", "Psychomotor and Creative Activities", "Religious Education"]
  },
  "Lower Primary": {
    levels: ["Grade 1", "Grade 2", "Grade 3"],
    learningAreas: ["Mathematics Activities", "English Language Activities", "Kiswahili/Lugha ya Ishara ya Kenya", "Environmental Activities", "Hygiene and Nutrition Activities", "Religious Education Activities", "Movement and Creative Activities"]
  },
  "Upper Primary": {
    levels: ["Grade 4", "Grade 5", "Grade 6"],
    learningAreas: ["Mathematics", "English Language", "Kiswahili/Lugha ya Ishara ya Kenya", "Science and Technology", "Social Studies", "Religious Education", "Agriculture", "Creative Arts and Physical Education"]
  },
  "Junior School": {
    levels: ["Grade 7", "Grade 8", "Grade 9"],
    learningAreas: ["English Language", "Kiswahili/Lugha ya Ishara ya Kenya", "Mathematics", "Integrated Science", "Health Education", "Agriculture and Nutrition", "Social Studies", "Religious Education", "Pre-Technical and Pre-Career Education", "Creative Arts and Sports"]
  },
  "Senior Secondary": {
    levels: ["Grade 10", "Grade 11", "Grade 12"],
    learningAreas: seniorSecondaryLearningAreas
  }
};

// Custom learning areas interface
export interface CustomLearningArea {
  id: string;
  name: string;
  schoolLevel: string;
  gradeLevel: string;
  isDefault: boolean;
  createdBy?: string;
  createdAt?: string;
}

// CBC Curriculum structure (simplified for backward compatibility)
export const CBCCurriculumData: any = {};

// Get curriculum data function - returns strands and substrands structure
export function getCurriculumData(curriculum: string, level: string, subject: string, term?: number) {
  // For CBC Senior Secondary (Grade 10-12), check senior secondary curriculum data first
  if (curriculum === 'CBC' && ["Grade 10", "Grade 11", "Grade 12"].includes(level)) {
    const seniorData = getSeniorSecondaryCurriculumAsStrands(level, subject);
    if (Object.keys(seniorData).length > 0) return seniorData;
    return {};
  }
  
  // For CBC curriculum grades 1-9, use grades1-9 data
  if (curriculum === 'CBC' && level.startsWith('Grade')) {
    const gradeLevel = level as GradeLevel;
    const termNumber = term || 1; // Default to Term 1 if not specified
    
    // Get all learning areas for this term/grade to handle multiple instances
    const termData = grades1to9CurriculumByTerm.find(t => t.term === termNumber && t.grade === gradeLevel);
    if (!termData) return {};
    
    // Use the shared normalization function for consistent fuzzy matching
    const normalizedSubject = normalizeLearningAreaName(subject);
    
    // Find learning areas using fuzzy matching
    let learningAreaInstances = termData.learningAreas.filter(
      la => normalizeLearningAreaName(la.name) === normalizedSubject
    );
    
    // If no exact match, try partial matching
    if (learningAreaInstances.length === 0) {
      learningAreaInstances = termData.learningAreas.filter(la => {
        const normalizedName = normalizeLearningAreaName(la.name);
        return normalizedName.includes(normalizedSubject) || normalizedSubject.includes(normalizedName);
      });
    }
    
    // If still no match, try word-based matching
    if (learningAreaInstances.length === 0) {
      const searchWords = normalizedSubject.split(' ').filter(w => w.length > 2);
      learningAreaInstances = termData.learningAreas.filter(la => {
        const nameWords = normalizeLearningAreaName(la.name).split(' ');
        const matchCount = searchWords.filter(sw => 
          nameWords.some(nw => nw.includes(sw) || sw.includes(nw))
        ).length;
        return matchCount >= Math.min(2, searchWords.length);
      });
    }
    
    if (learningAreaInstances.length === 0) return {};
    
    // Merge all strands from all instances into one structure
    const result: Record<string, string[]> = {};
    
    learningAreaInstances.forEach(area => {
      area.strands.forEach(strand => {
        const subStrandNames = strand.subStrands.map(ss => ss.name);
        
        // If strand already exists, merge substrands
        if (result[strand.name]) {
          result[strand.name] = [...new Set([...result[strand.name], ...subStrandNames])];
        } else {
          result[strand.name] = subStrandNames;
        }
      });
    });
    
    return result;
  }
  
  return {};
}

// CBC Core Values
export const getCBCCoreValuesForArea = (learningArea: string) => {
  return [
    "Respect",
    "Integrity",
    "Responsibility",
    "Unity",
    "Peace",
    "Patriotism",
    "Social Justice"
  ];
};

// CBC Competences
export const getCBCCompetencesForArea = (learningArea: string) => {
  return [
    "Communication and Collaboration",
    "Self-Efficacy",
    "Critical Thinking and Problem Solving",
    "Imagination and Creativity",
    "Citizenship",
    "Digital Literacy",
    "Learning to Learn"
  ];
};

// Interactive Learning Activities
export const getInteractiveLearningActivities = (learningArea: string) => {
  return [
    "Hands-on Experiments",
    "Group Projects",
    "Interactive Discussions",
    "Role-Playing",
    "Problem-Solving Tasks",
    "Creative Activities",
    "Field Trips",
    "Peer Teaching",
    "Real-World Applications"
  ];
};

// Assessment Methods
export const getAssessmentMethods = (learningArea: string) => {
  return [
    "Formative Assessment",
    "Observation Rubrics",
    "Portfolio Assessment",
    "Peer Assessment",
    "Self-Assessment",
    "Performance Tasks",
    "Oral Presentations",
    "Practical Demonstrations"
  ];
};

// Learning objectives function (simplified)
export function getLearningObjectives(
  curriculum: string,
  level: string,
  subject: string,
  strand?: string,
  substrand?: string,
  topic?: string,
  subtopic?: string
) {
  return [];
}

// Cambridge curriculum placeholder
export const CambridgeCurriculumData: any = {};

