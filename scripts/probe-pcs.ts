import * as pcs from 'pg-copy-streams'
console.log(Object.keys(pcs))
console.log(JSON.stringify(Object.fromEntries(Object.entries(pcs).map(([k,v]) => [k, typeof v])), null, 1))
