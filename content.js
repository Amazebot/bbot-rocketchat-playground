const scene = require('./scene')
const credentials = require('./credentials')
const admin = require('./admin')

// Shortcut to path handlers for user ID
const path = (b) => scene.path(b.message.user.id)

// Keep patterns separated for cleaner conversation logic
const patterns = {
  welcome: /\b(hi|hello|hey)\b$/i,
  email: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
  frameworks: /\b(bbot|botkit|botpress|hubot|rasa|none)\b$/i, 
  username: /(\w*)$/i,
  password: /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  set: /set$/i,
  skip: /skip$/i,
  confirm: /confirm$/i,
  start: /(start|new|begin)$/i,
  exit: /\b(quit|exit|cancel)\b$/i,
}

/**
 * Path callbacks object keeps listener handling DRY and allows routing multiple
 * interactions toward shared handlers, or even circular for catching errors.
 * Paths that add additional path/s (via `scene.path`) adds the user to
 * an array of 'engaged' users, so their responses will be evaluated against
 * only those additional paths, not the global listeners.
 * To return the user to the global listener scope, use `scene.exit()`
 * @todo Enable mongo adapter, store credentials and resume / re-create after
 *       server reset - changing branches on welcome for known user.
 */
const paths = {
  welcome: async (b) => {
    await b.respond(
      `Hi I'm Faldo, I manage bot accounts for Rocket.Chat's bot playground.`
    )
    await paths.start(b)
  },
  start: async (b) => {
    await b.respond(
      `To start, I need your email so I can setup your user credentials.`
    )
    path(b).reset()
    path(b).text(patterns.email, paths.email)
    path(b).text(patterns.exit, paths.exit)
    path(b).catchAll((b) => b.respond(
      `Sorry, that doesn't look like a valid email address.`,
      `Please try again, or reply \`quit\` if you want to try later.`
    ))
  },
  email: async(b) => {
    const address = b.match[0]
    b.bot.logger.info(`[faldo] creating new credentials for email ${address}`)
    credentials(b.message.user.id).setEmail(address)    
    await b.respond(
      "Perfect. Now, which bot framework you are using?  Do you use `bbot`, `botpress`, `botkit`, `hubot`, `rasa`, or `none`?"
    )
    path(b).reset()
    path(b).text(patterns.frameworks, paths.framework)
    path(b).text(patterns.exit, paths.exit)
    path(b).catchAll((b) => {
      b.respond(
      `Sorry, I don't know how to setup for framework named ${b.match}.`, 
      `Please try again, or reply \`quit\` if you want to try later.`)
    })
    
  },
  framework: async (b) => {
    // const framework = b.match[0]
    const framework = 'bbot'
    b.bot.logger.info(`[faldo] storing framework information  ${framework}`)
    credentials(b.message.user.id).setFramework(framework)
    
    const matched = b.match[0]
    if (matched != 'bbot') {
    await b.respond(
      'Alright, it seems you want ${matched}.',
      'I really recommend bBot from Amazebot though :slight_smile:',
      'And that is all that I can do at this time :stuck_out_tongue:',
       'I will go ahead and setup bbot for you')
      }
  
    await b.respond(
      `Thanks, I'll send you the credentials when we're done. :thumbsup:`,
      `Would you like to set other attributes, or skip to use generated?`,
      `Reply \`set\` or \`skip\``
    )
    path(b).reset()
    path(b).text(patterns.set, paths.set)
    path(b).text(patterns.skip, paths.skip)
    path(b).text(patterns.exit, paths.exit)
    path(b).catchAll((b) => b.respond(
      `Sorry that's not an option right now.`,
      `Reply with either \`set\` to define attributes or \`skip\` to generate.`
    ))
  },
  set: async (b) => {
    await b.respond(
      `OK, what would you like as a username?`
    )
    path(b).reset()
    path(b).text(patterns.username, paths.username)
    path(b).catchAll((b) => b.respond(
      `Sorry, that wasn't a valid username. :thinking:`,
      `Enter only regular letters (numbers and underscores ok).`
    ))
  },
  username: async (b) => {
    b.bot.logger.info(`[faldo] setting username from input: ${b.match[0]}`)
    const { user, bot } = credentials(b.message.user.id).setUsername(b.match[0])
    await b.respond(
      `Thanks, we'll call you @${user.username} and your bot @${bot.username}.`,
      `Now provide a password for both accounts. Min 6 chars, include a number.`
    )
    path(b).reset()
    path(b).text(patterns.password, paths.password)
    path(b).catchAll((b) => b.respond(
      `Sorry, that wasn't a valid password. :thinking:`,
      `Your reply must be minimum six characters with at least one number.`
    ))
  },
  password: async (b) => {
    b.bot.logger.info(`[faldo] setting password from input.`)
    credentials(b.message.user.id).setPassword(b.match[0])
    await b.respond(
      `Thanks, we've saved the password. That's everything we need. :ok_hand:`
    )
    await paths.confirm(b)
  },
  skip: async (b) => {
    b.bot.logger.info(`[faldo] taking skip option.`)
    const credential = credentials(b.message.user.id)
    credential.generateUsername()
    credential.generatePassword()
    b.bot.logger.info(`[faldo] generated credentials: ${credential.user.username}, ${credential.bot.username}`)
    await paths.confirm(b)
  },
  confirm: async (b) => {
    const credential = credentials(b.message.user.id).generateRoom()
    b.bot.logger.info(`[faldo] generated room name: ${credential.room.name}`)
    const { user, bot, room } = credentials(b.message.user.id).toObject()
    await b.respond(
      `Now we can create both accounts and a room for you to chat: #${room.name}`,
      `You'll log in with username **${user.username}** and password **${user.password}**`,
      `Your bot will need the following environment settings:`,
      `\`\`\`
ROCKETCHAT_USERNAME="${bot.username}"
ROCKETCHAT_PASSWORD="${bot.password}"
ROCKETCHAT_ROOM="${room.name}"\`\`\``,
      `Your will code your bot using the ${credential.bot.framework} framework.`,
      `Reply \`confirm\` to go ahead and I'll email you the details.`
    )
    path(b).reset()
    path(b).text(patterns.confirm, paths.finish)
    path(b).text(patterns.start, paths.start)
    path(b).text(patterns.exit, paths.exit)
    path(b).catchAll((b) => b.respond(
      `You just need to reply \`confirm\` and I'll setup the accounts and room.`,
      `If you want to start again, reply \`start\` or \`quit\` if you want to try later.`
    ))
  },
  finish: async (b) => {
    await b.respond(`Amazing, I'll just set that up...`)
    try {
      await admin.createAccounts(credentials(b.message.user.id).toObject())

      await b.respond(`Done and done, check your email.`)
      const botsplaygroundurl = 'https://bots.rocket.chat'
      const cred = credentials(b.message.user.id)
      const envvars = {
        'ROCKETCHAT_URL' : botsplaygroundurl,
        'ROCKETCHAT_USER' : cred.bot.username,
        'ROCKETCHAT_PASSWORD' : cred.bot.password,
        'ROCKETCHAT_ROOM' : cred.room.name,
        'ROCKETCHAT_USE_SSL' : true
      }
      const remixurl = admin.getRemix(cred.bot.framework, envvars)
      b.bot.logger.info(remixurl)
      const roomurl = botsplaygroundurl + '/group/' + cred.room.name
      await b.respond(`I have created a bot project for you. Click [**this glitch remix link**](${remixurl}) to code your bot right now:`)
      await b.respond(`You can also click [**this Rocket.Chat bots playground link**](${roomurl})  (login with username **${cred.user.username}** and password **${cred.user.password}**) and test your bot on Rocket.Chat's BOTs Playground:`)
      await b.respond(`Happy chatbotting! :tada:`)
    } catch (err) {
      await b.respond(`Oh no :see_no_evil: I ${err.message}`)
      await b.respond(`Sorry, but we'll have to try later, reply \`start\` when you want to start again.`)
    }
    scene.exit(b.message.user.id)
  },
  exit: async (b) => {
    await b.respond(
      `No problem, just say \`hi\` when you want to try again. :wave:`
    )
    scene.exit(b.message.user.id)
  }
}

module.exports = { patterns, paths }
