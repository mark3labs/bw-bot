import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { loadRecruit } from '../lib/utils'

const command: GluegunCommand = {
  name: 'sell',
  run: async (toolbox) => {
    const { banner, parameters, print, magic } = toolbox

    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = print.spin('Loading recruit...').start()
    const recruit = await loadRecruit(account)
    spinner.succeed('Loaded!')

    spinner.start('Selling $MAGIC...')
    await magic.sell(recruit)
    spinner.succeed('Done!')
    exit(0)
  },
}

module.exports = command
