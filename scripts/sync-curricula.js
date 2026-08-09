#!/usr/bin/env node
/**
 * Curriculum Sync — populates strand/substrand for ALL non-CBC curricula via AI.
 * Run: node scripts/sync-curricula.js
 */
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const CURRICULA = [
  { id: "8-4-4", name: "8-4-4 System", grades: ["Form 1","Form 2","Form 3","Form 4"], subjects: ["Mathematics","English","Kiswahili","Biology","Chemistry","Physics"] },
  { id: "common-core", name: "Common Core", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"], subjects: ["Mathematics","English Language Arts","Science","Social Studies"] },
  { id: "ngss", name: "NGSS", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"], subjects: ["Physical Science","Life Science","Earth & Space Science","Engineering Design"] },
  { id: "teks", name: "TEKS Texas", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"], subjects: ["Mathematics","English Language Arts & Reading","Science","Social Studies"] },
  { id: "florida-best", name: "Florida BEST", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"], subjects: ["English Language Arts","Mathematics","Science"] },
  { id: "california", name: "California", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"], subjects: ["English Language Arts","Mathematics","Science"] },
  { id: "ny-state", name: "New York State", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"], subjects: ["English Language Arts","Mathematics","Science"] },
  { id: "ap", name: "Advanced Placement", grades: ["Grade 10","Grade 11","Grade 12"], subjects: ["AP Biology","AP Chemistry","AP Calculus AB","AP English Language & Composition","AP United States History"] },
  { id: "us-homeschool", name: "US Homeschool", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"], subjects: ["Mathematics","English Language Arts","Science","Social Studies"] },
  { id: "cambridge", name: "Cambridge International", grades: ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"], subjects: ["Mathematics","English","Science","History","Geography"] },
  { id: "gcse", name: "GCSE", grades: ["Year 9","Year 10","Year 11"], subjects: ["Mathematics","English Language","Biology","Chemistry","Physics","History","Geography"] },
  { id: "a-level", name: "A-Levels", grades: ["Year 12","Year 13"], subjects: ["Mathematics","Biology","Chemistry","Physics","Economics","Psychology","History"] },
  { id: "caps", name: "CAPS", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"], subjects: ["Mathematics","English","Natural Sciences","Social Sciences","Life Sciences","Physical Sciences"] },
  { id: "ieb", name: "IEB", grades: ["Grade 10","Grade 11","Grade 12"], subjects: ["Mathematics","English","Physical Sciences","Life Sciences","Geography","History"] },
  { id: "nerdc", name: "NERDC / UBE", grades: ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6"], subjects: ["Mathematics","English","Basic Science","Social Studies"] },
  { id: "cbse", name: "CBSE", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"], subjects: ["Mathematics","English","Science","Social Science"] },
  { id: "icse", name: "ICSE", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"], subjects: ["Mathematics","English","Science","History & Civics","Geography"] },
  { id: "igcse", name: "IGCSE", grades: ["Year 10","Year 11"], subjects: ["Mathematics","English","Biology","Chemistry","Physics","Economics","History"] },
  { id: "ib", name: "IB Diploma", grades: ["Year 1","Year 2"], subjects: ["Mathematics","Biology","Chemistry","Physics","History","Economics","English"] },
];

async function genAI(prompt) {
  const models = ["llama-3.3-70b-versatile","llama-3.1-8b-instant"];
  for (const m of models) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":"Bearer "+process.env.GROQ_API_KEY },
        body: JSON.stringify({ model:m, messages:[{role:"user",content:prompt}], temperature:0.1, max_tokens:1200 }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      const txt = d?.choices?.[0]?.message?.content || "";
      const j = txt.match(/\[[\s\S]*\]/)?.[0];
      if (j) return JSON.parse(j);
    } catch(e) {}
  }
  throw new Error("All AI providers failed");
}

let count = 0, skipped = 0;

async function sync() {
  for (const c of CURRICULA) {
    console.log(`\n${"=".repeat(40)}`);
    console.log(`${c.name} — ${c.grades.length} grades × ${c.subjects.length} subjects`);
    for (const subject of c.subjects) {
      for (const grade of c.grades) {
        const existing = await p.curriculumStrand.findFirst({
          where: { curriculum: { type: "OTHER", grade, subject } },
        });
        if (existing) { skipped++; continue; }
        try {
          const strands = await genAI(
            `You are a curriculum database. Output ONLY valid JSON for ${subject} in the ${c.name} curriculum for ${grade}. Use the ACTUAL official ${c.name} standards. Include 3-4 strands with 2-3 substrands each:\n` +
            `[{"name":"1.0 Strand Name","order":1,"substrands":[{"name":"1.1 Sub-strand Name","order":1,"outcomes":["By the end of this substrand, the learner should be able to..."]}]}]`
          );
          if (!strands?.length) continue;
          let cur = await p.curriculum.findFirst({ where: { type: "OTHER", grade, subject } });
          if (!cur) {
            cur = await p.curriculum.create({
              data: { name: `${c.name} ${grade} ${subject}`, type: "OTHER", grade, subject, isActive: true },
            });
          }
          for (const s of strands) {
            const strand = await p.curriculumStrand.create({
              data: { curriculumId: cur.id, name: s.name, order: s.order },
            });
            for (const sub of s.substrands || []) {
              await p.curriculumSubstrand.create({
                data: { strandId: strand.id, name: sub.name, order: sub.order, learningOutcomes: sub.outcomes || [], activities: [] },
              });
            }
          }
          count++;
          process.stdout.write(".");
        } catch(e) { process.stdout.write("x"); }
      }
    }
  }
  console.log(`\n\n✅ ${count} new entries · ${skipped} skipped`);
  await p.$disconnect();
}

sync().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
