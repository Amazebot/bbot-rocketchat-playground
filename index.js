const bot = require('bbot')
const scene = require('./scene')
const { paths, patterns } = require('./content')

/**
 * Some usage requires waiting on bot load, so it's best to wrap in async.
 * Here we initialise the bot and our custom conversation branching (scene).
 * Adding "global" listeners that our outside any scene's context.
 * It will enter the 'welcome' path on room enter, or when greeted.
 */
async function start () {
  await bot.load()
  scene.setup(bot)
  bot.global.enter(paths.welcome)
  bot.global.text(patterns.welcome, paths.welcome)
  bot.global.text(patterns.start, paths.start)
  await bot.start().catch((err) => {
    console.error(err)
  })
}

start()
