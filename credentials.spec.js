const { expect } = require('chai')
const credentials = require('./credentials')

describe('credentials', () => {
  beforeEach(() => credentials('RESET'))
  it('module exports function to create new credentials', () => {
    const credential = credentials('111')
    expect(credential.constructor.name).to.equal('Credentials')
  })
  it('returns existing credential instance if given same ID', () => {
    const credentialA = credentials('111')
    credentialA.test = 'test'
    const credentialB = credentials('111')
    expect(credentialB.test).to.equal('test')
  })
  it('giving RESET as ID will remove existing credentials', () => {
    const credentialA = credentials('111')
    credentialA.test = 'test'
    credentials('RESET')
    const credentialB = credentials('111')
    expect(typeof credentialB.test).to.equal('undefined')
  })
  describe('.setEmail', () => {
    it('sets the email in user and bot', () => {
      credentials('111').setEmail('test@test.com')
      expect(credentials('111').user.email).to.equal('test@test.com')
      expect(credentials('111').bot.email).to.equal('test@test.com')
    })
  })
  describe('.setUsername', () => {
    it('sets the name in user and bot with random chars appended', () => {
      credentials('111').setUsername('test')
      expect(credentials('111').user.username).to.match(/test.{3}/)
      expect(credentials('111').bot.username).to.match(/test.{3}Bot/)
    })
  })
  describe('.setPassword', () => {
    it('sets the pass in user and bot with random chars appended', () => {
      credentials('111').setPassword('pass')
      expect(credentials('111').user.password).to.equal('pass')
      expect(credentials('111').bot.password).to.equal('pass')
    })
  })
  describe('.setRoom', () => {
    it('sets the room name', () => {
      credentials('111').setRoom('testing')
      expect(credentials('111').room.name).to.equal('testing')
    })
  })
  describe('.generateUsername', () => {
    it('throws if no username set', () => {
      expect(() => credentials('111').generateUsername()).to.throw()
    })
    it('sets the name from user email', () => {
      credentials('111').setEmail('foo@bar.baz')
      credentials('111').generateUsername()
      expect(credentials('111').user.username).to.match(/foo.{3}/)
      expect(credentials('111').bot.username).to.match(/foo.{3}Bot/)
    })
  })
  describe('.generatePassword', () => {
    it('sets the password from generated pattern', () => {
      credentials('111').generatePassword()
      expect(credentials('111').user.password).to.match(/\w{10}/)
      expect(credentials('111').bot.password).to.equal(credentials('111').user.password)
    })
  })
  describe('.generateRoom', () => {
    it('set the room name from two random words', () => {
      credentials('111').generateRoom()
      expect(credentials('111').room.name).to.match(/[a-z]{1,6}-[a-z]{1,6}/)
    })
  })
  describe('.toObject', () => {
    it('returns plain object with credential fields', () => {
      expect(credentials('111').toObject()).to.have.keys('user', 'bot', 'room')
    })
  })
  describe('.toJSON', () => {
    it('returns stringified object', () => {
      expect(credentials('111').toJSON()).to.be.a('string')
      expect(JSON.parse(credentials('111').toJSON())).to.eql({
        user: {}, bot: {}, room: {}
      })
    })
  })
})
