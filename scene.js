/**
 * A preview of conversational utilities in bBot.
 * bBot's beta will provide more feature rich and user-friendly handling of
 * conversational branching, so this code will soon be superseded.
 */
class Scene {
  /**
   * Add middleware to route input from engaged users to listener sub-sets.
   * Clones the current state to re-receive within isolated thought process.
   * The new receive happens at the end of Node's event loop so the first one
   * can resolve first.
   */
  setup (bot) {
    this.bot = bot
    this.engaged = {}
    bot.hearMiddleware(async (b, next, done) => {
      const uId = b.message.user.id
      if (this.isEngaged(uId) && b.scope === 'global') {
        b.ignore()
        bot.logger.debug(`[scene] entering ${b.message.user.name} into scene.`)
        await bot.receive(b.message, this.path(uId))
        done()
      } else {
        next()
      }
    })
  }

  /** Check if a user ID has an open scene. */
  isEngaged (userId) {
    return (Object.keys(this.engaged).indexOf(userId) > -1)
  }

  /** Add listeners as branches in a scene path for a user. */
  path (userId) {
    if (this.isEngaged(userId)) return this.engaged[userId]
    this.engaged[userId] = new this.bot.Path({ scope: 'scene' })
    return this.engaged[userId]
  }

  /** Remove user from engaged, returning them to global scope */
  exit (userId) {
    if (this.isEngaged(userId)) delete this.engaged[userId]
  }
}

const scene = new Scene()

module.exports = scene
