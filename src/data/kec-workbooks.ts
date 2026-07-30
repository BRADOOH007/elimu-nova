export interface KECSubject {
  name: string
  courseUrl?: string
  pageUrl?: string
  iframeUrl?: string
}

export interface KECGrade {
  grade: string
  label: string
  categoryUrl: string
  subjects: KECSubject[]
}

export const KEC_WORKBOOKS: KECGrade[] = [
  {
    grade: 'PP1',
    label: 'Pre-Primary 1',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=70',
    subjects: [
      { name: 'Language Activities' },
      { name: 'Mathematics' },
      { name: 'Environmental Activities' },
      { name: 'Psychomotor Activities' },
    ],
  },
  {
    grade: 'PP2',
    label: 'Pre-Primary 2',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=71',
    subjects: [
      { name: 'Language Activities' },
      { name: 'Mathematics' },
      { name: 'Environmental Activities' },
      { name: 'Psychomotor Activities' },
    ],
  },
  {
    grade: 'Grade 1',
    label: 'Grade 1',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=74',
    subjects: [
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1562' },
    ],
  },
  {
    grade: 'Grade 2',
    label: 'Grade 2',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=80',
    subjects: [
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1563' },
    ],
  },
  {
    grade: 'Grade 3',
    label: 'Grade 3',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=90',
    subjects: [
      { name: 'Mathematics', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=602' },
      { name: 'English', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=600' },
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=601' },
      { name: 'CRE', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=599' },
      { name: 'Hygiene and Nutrition', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=629' },
      { name: 'Environmental Activities', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=630' },
      { name: 'Music', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=598' },
      { name: 'Creative Arts', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=597' },
      { name: 'Literacy', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=628' },
    ],
  },
  {
    grade: 'Grade 4',
    label: 'Grade 4',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=92',
    subjects: [
      { name: 'Mathematics', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=753' },
      { name: 'English', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=751' },
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=752' },
      { name: 'Science and Technology', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=750' },
      { name: 'Social Studies', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=748' },
      { name: 'Home Science', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=747' },
      { name: 'Agriculture', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=803' },
      { name: 'CRE', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=749' },
    ],
  },
  {
    grade: 'Grade 5',
    label: 'Grade 5',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=475',
    subjects: [
      { name: 'Mathematics', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1278' },
      { name: 'English', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1280' },
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1282' },
      { name: 'Science and Technology', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1277' },
      { name: 'Social Studies', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1286' },
      { name: 'Agriculture', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1276' },
      { name: 'Home Science', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1281' },
      { name: 'Music', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1284' },
      { name: 'Physical and Health Education', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1285' },
      { name: 'Christian Religious Education', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1279' },
      { name: 'Islamic Religious Education', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1283' },
    ],
  },
  {
    grade: 'Grade 6',
    label: 'Grade 6',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=526',
    subjects: [
      {
        name: 'Mathematics',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1526',
        pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1513',
        iframeUrl: 'https://content.kec.ac.ke/Grade_6_RL/Dals%20Learning%20Grade%206%20Mathematics%20eWorkbook',
      },
      {
        name: 'English',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1530',
        pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1517',
      },
      {
        name: 'Kiswahili',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1531',
        pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1518',
      },
      {
        name: 'Science and Technology',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1528',
      },
      {
        name: 'Social Studies',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1529',
      },
      {
        name: 'Christian Religious Education',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1544',
        pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1530',
      },
      {
        name: 'Islamic Religious Education',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1525',
      },
      {
        name: 'Agriculture and Nutrition',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1543',
      },
      {
        name: 'Creative Arts',
        courseUrl: 'https://lms.kec.ac.ke/course/view.php?id=1545',
      },
    ],
  },
  {
    grade: 'Grade 7',
    label: 'Grade 7 (Junior School)',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=102',
    subjects: [
      { name: 'Mathematics', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1796' },
      { name: 'English', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1792' },
      { name: 'Kiswahili', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1794' },
      { name: 'Integrated Science', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1795' },
      { name: 'Agriculture', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1789' },
      { name: 'Pre-Technical Studies', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1790' },
      { name: 'Christian Religious Education', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1791' },
      { name: 'Islamic Religious Education', pageUrl: 'https://lms.kec.ac.ke/mod/page/view.php?id=1793' },
    ],
  },
  {
    grade: 'Grade 8',
    label: 'Grade 8 (Junior School)',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=107',
    subjects: [
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Mathematics' },
      { name: 'Integrated Science' },
      { name: 'Pre-Technical Studies' },
      { name: 'Social Studies' },
      { name: 'Creative Arts and Sports' },
      { name: 'Christian Religious Education' },
      { name: 'Islamic Religious Education' },
      { name: 'Hindu Religious Education' },
    ],
  },
  {
    grade: 'Grade 9',
    label: 'Grade 9 (Junior School)',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=653',
    subjects: [
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Mathematics' },
    ],
  },
  {
    grade: 'Form 1',
    label: 'Form 1',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=113',
    subjects: [
      { name: 'Mathematics' },
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' },
      { name: 'History and Government' },
      { name: 'Geography' },
      { name: 'Business Studies' },
      { name: 'Christian Religious Education' },
      { name: 'Islamic Religious Education' },
    ],
  },
  {
    grade: 'Form 2',
    label: 'Form 2',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=114',
    subjects: [
      { name: 'Mathematics' },
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' },
      { name: 'History and Government' },
      { name: 'Geography' },
      { name: 'Business Studies' },
      { name: 'Christian Religious Education' },
      { name: 'Islamic Religious Education' },
    ],
  },
  {
    grade: 'Form 3',
    label: 'Form 3',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=115',
    subjects: [
      { name: 'Mathematics' },
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' },
      { name: 'History and Government' },
      { name: 'Geography' },
      { name: 'Business Studies' },
      { name: 'Christian Religious Education' },
      { name: 'Islamic Religious Education' },
    ],
  },
  {
    grade: 'Form 4',
    label: 'Form 4',
    categoryUrl: 'https://lms.kec.ac.ke/course/index.php?categoryid=116',
    subjects: [
      { name: 'Mathematics' },
      { name: 'English' },
      { name: 'Kiswahili' },
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' },
      { name: 'History and Government' },
      { name: 'Geography' },
      { name: 'Business Studies' },
      { name: 'Christian Religious Education' },
      { name: 'Islamic Religious Education' },
    ],
  },
]

export function getKECWorkbook(grade: string, subject: string): KECSubject | undefined {
  const gradeEntry = KEC_WORKBOOKS.find(g => g.grade === grade)
  if (!gradeEntry) return undefined
  return gradeEntry.subjects.find(s =>
    s.name.toLowerCase() === subject.toLowerCase() ||
    s.name.toLowerCase().includes(subject.toLowerCase()) ||
    subject.toLowerCase().includes(s.name.toLowerCase().split('(')[0].trim())
  )
}

export function getKECCategoryUrl(grade: string): string | undefined {
  return KEC_WORKBOOKS.find(g => g.grade === grade)?.categoryUrl
}
