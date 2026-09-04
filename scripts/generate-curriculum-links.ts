import { writeFileSync } from 'fs'
import { resolve } from 'path'

interface LinkEntry {
  url: string
  grade: string
  subject: string
  term: null
  name: string
}

const links: LinkEntry[] = []

function add(grade: string, subject: string, fileId: string) {
  links.push({
    url: `https://drive.google.com/file/d/${fileId}/view`,
    grade,
    subject,
    term: null,
    name: `KICD ${grade} ${subject}`,
  })
}

// Grade 1-3: 8 subjects (same PDFs shared across all 3 grades)
const lowerPrimarySubjects: [string, string][] = [
  ['Creative Activities', '1vrC5cJO2MpDm9v4u3-qwCze9yPa9HcEZ'],
  ['CRE', '1YSXfOr81O2bn5t0ILvqDYkz3GchE9M3i'],
  ['English Activities', '10KIOCSmh7CyDbjElisPQeeMTLu8AJI9z'],
  ['Environmental Activities', '1aw6VOZadfc1cFTa0x4o4ztzdorLY8xUS'],
  ['HRE', '1iLmA5Hxzgscln94VzP0n5EhrH4I12iDQ'],
  ['IRE', '1toUw1LJYL23CAdEl-tUJwjqn7wu89JIb'],
  ['Kiswahili', '1xVa-cvQ3jSlfR4yNEL3DIXGmU-U7tHXk'],
  ['Mathematics', '1YlwoCFAVxhjUo_V1A-89GRcho0r0Gq1u'],
]
for (const g of ['Grade 1', 'Grade 2', 'Grade 3']) {
  for (const [subj, id] of lowerPrimarySubjects) add(g, subj, id)
}

// Grade 4: 15 subjects
const grade4: [string, string][] = [
  ['Agriculture', '1xfUKusjuRlNi22arhYCWy3IS_obPhcvL'],
  ['Arabic', '1rYeB-zhF68YnNBlozbm9qhwPnPI_i0UF'],
  ['Creative Arts', '1NhyGe8EsZLgubbxwEvva-sNUPxDHR8r1'],
  ['CRE', '1vW3aipLZDPSkl2z29W7RbBEEUrCdEbt7'],
  ['English', '1o3j3bJwiqJyerdZIFPDJaSprYdTp3Eu1'],
  ['French', '18qVRdnMqrdBkf6eGuIDdxHfoAwydu-wv'],
  ['German', '1YtlkH6n9skVQqt1g15twi54mx8ZUGlDV'],
  ['HRE', '15TMyiOpDL71sr6ZLCn-M-w30XHksCdTy'],
  ['Indigenous Language', '1687tUM9DvYbjUIryPMDU2Ve4cF--otB6'],
  ['IRE', '1ifDV-yVjmntZvnU-7WPLxLLDuborohUh'],
  ['Kiswahili', '1MO1ddc7tFvcpKYy7Trr4VBhllBmwKntW'],
  ['Mandarin', '1zOfFS4neSdP_8LguOc1FaGPc5DUy80Oj'],
  ['Mathematics', '1o5tDq16yC0Jj1h6zb9mo3dsxtjqXUk4G'],
  ['Science and Technology', '1jbAvVAWmif-toAfPShQm9UujN7bZ0luX'],
  ['Social Studies', '1I81sEkJJz7zj2rp4thpUN3MOlHPK5-mG'],
]
for (const [subj, id] of grade4) add('Grade 4', subj, id)

// Grade 5: 15 subjects
const grade5: [string, string][] = [
  ['Agriculture', '1jlMN272UeRa-FbyB5es488O5jI9llekn'],
  ['Arabic', '12KOvt5WY9acj1wMbNox_dGYIKLY1eg-G'],
  ['Creative Arts', '1euaxMgHyMqSm4qVSzOeJ_-9LXYgj6jyS'],
  ['CRE', '1unhtcU1tzdsPceoadKCovjFIkPTF1wP4'],
  ['English', '1ctDo-PB4W6AKbKV0Lb-1OobOC2-L3_e_'],
  ['French', '1nM2fBafwuozVi1LsceBT54HIcya9KEuP'],
  ['German', '1w0-eB6lY90dYvmfn-g5dAK2vGvghkGeC'],
  ['HRE', '1O7MWGBaA5Iwl5HKmKrEw6XmI-qzFgU1c'],
  ['Indigenous Language', '1PGfkAZOvmQxvE76gxDRReZDl5YFMfcXr'],
  ['IRE', '10RolK-hE8ylrhuNbq3fN6ZnPlgNM_VuB'],
  ['Kiswahili', '1aGnwbMdfKkwTBtVOcliEiyge6qAHpHhd'],
  ['Mandarin', '1tpuL_OmDaPJ-54-hRqb8OLLMdZ1jV_4q'],
  ['Mathematics', '1ShOUex4qEQosDCvkKdaXIRvteOILPHTP'],
  ['Science and Technology', '1CituzlfluxqVvjExx7xHiV_j_ZDXwpja'],
  ['Social Studies', '1uOCVkljUKcfMkRs1gwAbDZMj_p9cjbut'],
]
for (const [subj, id] of grade5) add('Grade 5', subj, id)

// Grade 6: 15 subjects
const grade6: [string, string][] = [
  ['Agriculture', '18PxeRHiqXx4I3uj71kxqspQn8za43YLO'],
  ['Arabic', '1o9VR546EOuq70ULiLGmN1FJzYX6ylbOP'],
  ['Creative Arts', '1ar14Jn_EMuxsqbJ_evfZCNoHg66r4Fvv'],
  ['CRE', '11IpqIrMdTmPcoFRKhELKaUliB3IQw6oP'],
  ['English', '1QR9nW3baakrHLIIpv-9UfQyMbOoDTcDX'],
  ['French', '1JNkK1WNt85B6lxbHFBI4_TaLdDBZNyz4'],
  ['German', '1r5mCofdUnDCDRh_PZS16bpgpm0GEF_p3'],
  ['HRE', '1DkJ_S-CX54BWOBbunQNSvL4htQkXHdcz'],
  ['Indigenous Language', '1EKntVjIlVnU37rMPP5ya60TVLPGv9Asl'],
  ['IRE', '1EXqXIKZMzOu7GYtgNS6XB_Aoyv7Isncs'],
  ['Kiswahili', '1p4DSwvmGPzn3ZHCZhRTN88Zvju3XtgYf'],
  ['Mandarin', '1NS6XW6s9aZS5iSxo_52BGj1A2A20T8V2'],
  ['Mathematics', '1ki1N1YnslIpZomG-0IoYogkzek7CKx0j'],
  ['Science and Technology', '1Cqoxx-afRo1d3DdjdCY8l5STD1lXJhJI'],
  ['Social Studies', '1H1QZ6wgFPsEL6S4A7dFdjukr2jEG8sS2'],
]
for (const [subj, id] of grade6) add('Grade 6', subj, id)

// Grade 7: 16 subjects
const grade7: [string, string][] = [
  ['Agriculture', '1ShQA3XZmu_X2jKolAA_rGzbvFVHNe-FA'],
  ['Arabic', '1numDrwyg0qgWR0HOMNxwzZLN1WJcQyLf'],
  ['Creative Arts', '13vhFpDNHHufpz__VRZ5lZUkARfIUra7L'],
  ['CRE', '1Vx6Y8lWUiSpWO-MBO58nEOtPlFDM7JA3'],
  ['English', '1HAU_WMYmdmfWmr4kAvZxjcgG0lizPHZv'],
  ['French', '1XyzWUEmjBQ7h3rAWF2_plaSdVa5Mslxh'],
  ['German', '1I2zlbTmFwaLjIzkLHHEPegCwi4QxWYtq'],
  ['HRE', '1kdOYtnA1cJVgipZI2i8soM00d0jVW4io'],
  ['Indigenous Language', '1yh_xr49uwn0ohXThoIDuyHh9J2lpUnh2'],
  ['Integrated Science', '1jbicj1qkLFEV_ZXwO8Kmlw7KzGhZD2ri'],
  ['IRE', '1Po_NF_oEsMMYXukVcM82nVEqXS7yY2Zu'],
  ['Kiswahili', '1pZ3Q6EwKhyBSfpmbYCjF8yTDrJifUrJJ'],
  ['Mandarin', '1DEYhWOkEzMRq78C-jAnFj1VzCh9efb-7'],
  ['Mathematics', '12Vb6W1_Vzn9BEH2MsM2WmUwWL5OKoucK'],
  ['Pre-Technical Studies', '1vBIF-5Z0-hpYxr2YWJIrg1ATzO9f4YRH'],
  ['Social Studies', '1nr9z0Z11ue76h2odpYQJNeUU4jFJWbbB'],
]
for (const [subj, id] of grade7) add('Grade 7', subj, id)

// Grade 8: 16 subjects
const grade8: [string, string][] = [
  ['Agriculture', '1MzOFhLc8kbRwvjg03q7oeDrbbvux75Wy'],
  ['Arabic', '1NfGYxAz5-4jS_uwouuhwT40ieEgQRs98'],
  ['Creative Arts', '1ji89ZIdF9ZA5d6rkchqJJYa2G5ZQO5zP'],
  ['CRE', '1ZVqaVImBDLeGVUbLwA54C8zqWZMsr3V8'],
  ['English', '1WmQXD4FTiFrInrCQMu1w-cjmPPaLEvw5'],
  ['French', '1wLw_tfQGzPV-uu8Ept6eg8onLSoJAYyP'],
  ['German', '1irJwC6GArXWf934-_xCDiaGQYJQZHv5m'],
  ['HRE', '17tep-A_DwMx7ZHQ_JTtCm6wH6HLISdIW'],
  ['Indigenous Language', '1WEG5wJplprPae9blpB9oVyI1UaVrq-xj'],
  ['Integrated Science', '1RpqZRmeMywbc1Tya0_x-tNJBs75Gy0-v'],
  ['IRE', '10HXITblf3E9bwYFABlcbv_qA9ZGSSod1'],
  ['Kiswahili', '1l-TPHn7cSCasqwb7auMUX2Cbtcu2cWoI'],
  ['Mandarin', '1KxyvR6lreOFJQ8LcdFuWCQteJvSUGJrI'],
  ['Mathematics', '1ttNvzuQbHUnABVcP-TAoix8-TVmehYph'],
  ['Pre-Technical Studies', '1Cvh2JSBlrHU4z4FKt7uVMgTMXEWq9jdu'],
  ['Social Studies', '1yx30v28nVLKYSByRB9G2Omalh76-ZL6h'],
]
for (const [subj, id] of grade8) add('Grade 8', subj, id)

// Grade 9: 16 subjects
const grade9: [string, string][] = [
  ['Agriculture', '14lKcmhXxEMYRHLISkK8j-ZzcCmLE59hf'],
  ['Arabic', '14N6beLZiLrDRAxvHQE-w7e7rf-2xaCkq'],
  ['Creative Arts', '1XONxUP98Z6I85bPKx7CYIsAkEucl_dm-'],
  ['CRE', '1FBMLUxBo1q4dHUkXLidZeqCiZWDzRBNI'],
  ['English', '1ehe01q4q8G-ft1PsA0r7skcz6grZfiNQ'],
  ['French', '1KM4ezz3BKbm3l3kdb9O6XWb-jDscdl4n'],
  ['German', '1MDKVJH-QW5Qv7KcDzWU9VCCKD_CDCIrd'],
  ['HRE', '1ePaw7pIrLG3AjX2mbTXIEimXTRnkdfuC'],
  ['Indigenous Language', '1CS2EzUFDl3wJ_zJKWI302GsAkRF3KfP6'],
  ['Integrated Science', '18QAC1qZzTWQv4vso-y1c5qaY9YxeSaUp'],
  ['IRE', '1QAtDW4Pq0enTVPOb32TlfQzge2au4RRC'],
  ['Kiswahili', '14r0D5u2jy79nZdcixJ2Gu3qTattpY0_Y'],
  ['Mandarin', '1Qn8CsuytmDlsnmfaf89KAZ3Fg2y-bYe2'],
  ['Mathematics', '1HgntYl8nS1zydy8k00KrjEt_zJiMqISL'],
  ['Pre-Technical Studies', '1sHIe4eN9oE8ojrjBPojqHj7YIdYdFWzP'],
  ['Social Studies', '1gMXIzQnV-F1a7n_dJ82QU2-BTtw3B-NW'],
]
for (const [subj, id] of grade9) add('Grade 9', subj, id)

const manifest = { links }
const outPath = resolve(__dirname, '..', 'curriculum-links.json')
writeFileSync(outPath, JSON.stringify(manifest, null, 2))
console.log(`Written ${links.length} links to curriculum-links.json`)
