import request from 'supertest'
import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run migrate:rollback --all')
    execSync('npm run migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    expect.assertions(1)

    const response = await request(app.server)
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    expect(response.status).equal(201)
  })

  it('should be able to list all transactions', async () => {
    expect.assertions(2)

    const initResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    expect(initResponse.status).equal(201)

    const cookies = initResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies as string[])

    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const initResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    const cookies = initResponse.get('Set-Cookie')

    const listTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies as string[])

    const firstTransaction = listTransactions.body.transactions[0]

    const response = await request(app.server)
      .get(`/transactions/${firstTransaction.id}`)
      .set('Cookie', cookies as string[])

    expect(response.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get transactions summary', async () => {
    const initResponse = await request(app.server)
      .post('/transactions')
      .send({ title: 'New transaction', amount: 5000, type: 'credit' })

    const cookies = initResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies as string[])
      .send({ title: 'New transaction', amount: 2000, type: 'debit' })

    const response = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies as string[])

    expect(response.body.summary).toEqual(
      expect.objectContaining({
        amount: 3000,
      }),
    )
  })
})
