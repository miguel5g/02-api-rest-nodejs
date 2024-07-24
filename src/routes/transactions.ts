import crypto from 'node:crypto'
import z from 'zod'

import { FastifyInstance } from 'fastify'
import { connection } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  // app.addHook('preHandler', checkSessionIdExists)

  app.post('/', async (request, reply) => {
    const transactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = transactionSchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      })
    }

    await connection('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send({ message: 'Transação criada' })
  })

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const summary = await connection('transactions')
        .sum('amount', { as: 'amount' })
        .where({ session_id: sessionId })
        .first()

      return reply.send({ summary })
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const transactions = await connection('transactions')
        .select('*')
        .where({ session_id: sessionId })

      return reply.send({ transactions })
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(request.params)

      const transaction = await connection('transactions')
        .select('*')
        .where({ id, session_id: sessionId })
        .first()

      if (!transaction) {
        return reply
          .status(404)
          .send({ message: 'Transação não foi encontrada' })
      }

      return reply.send({ transaction })
    },
  )
}
