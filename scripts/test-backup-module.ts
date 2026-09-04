import { runDbBackup } from 'C:/Users/Home/Desktop/Elimu Nova/EduGeniusnAI/src/lib/db-backup'
runDbBackup().then(s => console.log('RESULT', JSON.stringify(s))).catch(e => { console.error('FATAL', e); process.exit(1) })
