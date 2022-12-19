//import { user } from 'App/Models/User'
//import { UserFactory } from './../../database/factories/index'
import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'
import Hash from '@ioc:Adonis/Core/Hash'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

/**
 {
  "users":{
  "id: number",
  "email": string,
  "username": string,
  "password": string,
  "avatar": string,
}
}
 */

test.group('User', (group) => {
  test('it should create an user', async (assert) => {
    const userPayload = {
      email: 'test@test.com',
      username: 'test',
      password: 'test',
      avatar: 'http://images.com/image/ops',
    }
    const { body } = await supertest(BASE_URL).post('/users').send(userPayload).expect(201)
    console.log(body)
    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.id, 'Id undefined')
    assert.equal(body.user.email, userPayload.email)
    assert.equal(body.user.username, userPayload.username)
    assert.notExists(body.user.password, 'Password defined')
  })

  test('it should return 409 when email already exists', async (assert) => {
    const { email } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ username: 'teste', email, password: 'teste' })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)

    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 409 when usename already exists', async (assert) => {
    const { username } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ username, email: 'teste@gmail.com', password: 'teste' })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)

    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('It should return 422 eher requeired data is not provided', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/users').send({}).expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid email', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'test@', password: 'test', username: 'test' })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid password', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'test@gmail.com', password: 'tst', username: 'test' })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('It should update an user', async (assert) => {
    const { id, password } = await UserFactory.create()
    const email = 'test@gmail.com'
    const avatar = 'http://github.com/carvalhodaniel.png'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, avatar, password })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.email, email)
    assert.equal(body.user.avatar, avatar)
    assert.equal(body.user.id, id)
  })

  test('it should update the password of the user', async (assert) => {
    const user = await UserFactory.create()
    const password = 'asdf'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({ email: user.email, avatar: user.avatar, password })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.id, user.id)

    await user.refresh()
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test.only('it should return 422 when data is not provided', async (assert) => {
    const { id } = await UserFactory.create()
    const { body } = await supertest(BASE_URL).put(`/users/${id}`).send({}).expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
