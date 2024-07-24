import { Knex, knex } from 'knex'
import { env } from './libs/env'

const config: Knex.Config = {
  client: 'sqlite',
  connection: {
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './database/migrations',
  },
}

const connection = knex(config)

export { connection, config }
