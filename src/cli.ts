import * as dotenv from 'dotenv'
import { build } from 'gluegun'
dotenv.config()

/**
 * Create the cli and kick it off
 */
async function run(argv) {
  try {
    // create a CLI runtime
    const cli = build()
      .brand('bw-bot')
      .src(__dirname)
      .plugins('./node_modules', { matching: 'bw-bot-*', hidden: true })
      .help() // provides default for help, h, --help, -h
      .version(() => console.log('1.0')) // provides default for version, v, --version, -v
      .exclude([
        'meta',
        'strings',
        'filesystem',
        'semver',
        'system',
        'prompt',
        'template',
        'patching',
        'package-manager',
      ])
      .create()
    // enable the following method if you'd like to skip loading one of these core extensions
    // this can improve performance if they're not necessary for your project:

    // and run it
    const toolbox = await cli.run(argv)

    // send it back (for testing, mostly)
    return toolbox
  } catch (e) {
    // Abort via CTRL-C
    if (!e) {
      console.log('Goodbye ✌️')
    } else {
      // Throw error
      throw e
    }
  }
}

module.exports = { run }
