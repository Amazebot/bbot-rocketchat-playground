const addr = require('email-addresses')
const randomWords = require('random-words')
const generator = require('generate-password')

const botUserPostfix = 'bot'

/**
 * Using class for submitted details allows the credentials instance to be
 * accumulated from a sequence of prompts, performing field validation and even
 * returning specific errors from the class in conversation.
 * @todo check username exists on server (error message response => branch loop)
 * @todo check room exists on server (error message response => branch loop)
 */
class Credentials {
  constructor () {
    this.user = {}
    this.bot = {}
    this.room = {}
  }

  setEmail (address) {
    this.user.email = address
    this.bot.email = address
    return this
  }

  setUsername (name) {
    this.user.username = name + Math.random().toString(36).substring(4, 7)
    this.bot.username = this.user.username + botUserPostfix
    return this
  }

  setPassword (password) {
    this.user.password = password
    this.bot.password = password
    return this
  }
  
  setFramework (framework) {
    this.user.framework = framework
    this.bot.framework = framework
    return this
  }

  setRoom (name) {
    this.room.name = name
    return this
  }

  generateUsername () {
    if (!this.user.email) throw new Error('username generation requires email')
    return this.setUsername(addr.parseOneAddress(this.user.email).local)
  }

  generatePassword () {
    return this.setPassword(generator.generate({ length: 10, numbers: true }))
  }

  generateRoom () {
    return this.setRoom(randomWords({ exactly: 2, maxLength: 6, join: '-' }))
  }

  toObject () {
    const { user, bot, room } = this
    return { user, bot, room }
  }

  toJSON () {
    return JSON.stringify(this.toObject())
  }
}

/** Store the collection of gathered credentials by the user's ID */
const collection = {}

/** Get a credential from the collection by ID if exists, otherwise create */
module.exports = (userId) => {
  if (userId === 'RESET') Object.keys(collection).forEach((i) => delete collection[i])
  if (collection[userId]) return collection[userId]
  collection[userId] = new Credentials()
  return collection[userId]
}
