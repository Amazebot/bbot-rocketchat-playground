const bBot = require('bbot')
const tp = require('turbproxy')
const gm = require('glitchmagic')


/** Setup accounts for user and bot, first creating room for joining them in. */
async function createAccounts (credentials) {
  const { user, bot, room } = credentials
  if (!!user && !!bot && !!room) {
    bBot.logger.info(`[admin] calling createAccounts...`)
    try {
      if (user.username.match(/fail/)) throw new Error('forced fail for demo')
      // turbproxy createaccounts method signature
      // {e: email, g: group, u: uname, p: passwords}
      // uname is basename for two users:  uname + 'bot'  and uname 
      // passwords is an array of 2 passwords, first one for bot
      const passwords = [];
      passwords[0] = bot.password;
      passwords[1] = user.password;
      let result = {}
      
      result = await tp.createaccounts({
         e: user.email,
         g: room.name,
         u: user.username,
         p: passwords
      })
      bBot.logger.info(`[admin] calling with USER ${JSON.stringify(user)}`)
      bBot.logger.info(`[admin] calling with BOT ${JSON.stringify(bot)}`)
      bBot.logger.info(`[admin] calling with ROOM ${JSON.stringify(room)}`)
      bBot.logger.info(`[admin] calling with PASSOWRDS ${JSON.stringify(passwords)}`)
      bBot.logger.info(`[admin] createAccounts returned ${JSON.stringify(result)}`)
    } catch (err) {
      bBot.logger.error(`[admin] createAccounts failed: ${err.message}`)
      throw new Error('could not create accounts due to a playground server error.')
    }
  } else {
    bBot.logger.error('[admin] createAccounts called without all attributes.')
    if (!user) throw new Error('could not create accounts, missing user attributes.')
    if (!bot) throw new Error('could not create accounts, missing bot attributes.')
    if (!room) throw new Error('could not create accounts, missing room attributes.')
  }
}

let projects = { 'bbot': { 'name': 'bbot-rocketchat-boilerplate'    },
                 'hubot' : { 'name':  'rocketchat-hubot-rocketchat-boilerplate'  },
                 'botkit' : {'name' :  'sing-li-botkit-starter-rocketchat-1'  } }
                            

function getRemix(framework, envvars) {
  const proj = { 'name': projects[framework].name }
  return gm.getRemixURL(proj, envvars)
}
module.exports = {
  createAccounts,
  getRemix
}
