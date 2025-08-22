import { createCodamaConfig } from 'gill'

export default createCodamaConfig({
  idl: './src/lib/daily_journal.json',
  clientJs: 'clients/js/src/generated',
})
