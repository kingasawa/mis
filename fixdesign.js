const { Client } = require('pg')
const restore_client = new Client({
  user: 'postgres',
  host: '35.194.11.123',
  database: 'nodeshopis',
  password: '',
})
const beta_client = new Client({
  user: 'postgres',
  host: '104.154.140.232',
  database: 'nodeshopis',
  password: '',
})

beta_client.connect()
restore_client.connect()

const INSERT = parseInt(process.env.INSERT) || false;

const START = parseInt(process.env.START) || false;
const END = parseInt(process.env.END) || false;

if (!START || !END) {
  return console.log('START or END is missing')
}

console.log('START', START);
console.log('END', END);
// return;
//setval('design_design_id_seq', 707666, true)
// beta=2260, restore=705406
// 705406+2260
restore_client.query(`SELECT * from design where design_id>${START} AND design_id<=${END}  order by design_id asc`,
  (err, res) => {

    if (err) {
      return console.log('Query err', err);
    }

    res.rows.map((row,i) => {
      console.log('r-i', i);
      let { id, design_id, thumbUrl, owner, createdAt, updatedAt } = row;

      if (INSERT) {
        const query = {
          text: 'INSERT INTO design(id, design_id, "thumbUrl", owner, "createdAt", "updatedAt") VALUES($1,$2,$3,$4,$5,$6)',
          values: [id, design_id, thumbUrl, owner, createdAt, updatedAt],
        }

        beta_client.query(query, (err, res) => {
          if (err) {
            return console.log('Insert err', err.stack)
          }
        })
      }
      // console.log('res', res.rows);
    })

    // console.log(err ? err.stack : res.rows[0].message) // Hello World!
    // restore_client.end()
  })
// beta_client.end()

// Check Count
// setInterval(()=>{
//   beta_client.query('select count(*) from design where design_id<705407', (err, res) => {
//     if (err) {
//       return console.log('Insert err', err.stack)
//     }
//     console.log('res', res.rows[0].count);
//   })
// }, 2000)
