import { runDbBackup } from '../src/lib/db-backup'

runDbBackup()
  .then((s) => {
    if (s.failures.length) {
      console.error(`BACKUP FINISHED WITH ${s.failures.length} FAILURES: ${s.failures.join(', ')}`)
      process.exit(1)
    }
    console.log(`BACKUP OK — ${s.totalRows} rows across ${s.tablesWithData} tables in ${s.durationMs}ms`)
    process.exit(0)
  })
  .catch((e) => {
    console.error('BACKUP FATAL:', e)
    process.exit(1)
  })
