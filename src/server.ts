import { app } from './app'
import { env } from './libs/env'

const port = env.PORT

app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`🚀 Server listen on http://localhost:${port}`)
})
