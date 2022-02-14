import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { loadRecruit } from '../lib/utils'

const command: GluegunCommand = {
  name: 'list-items',
  run: async (toolbox) => {
    const { parameters, marketplace, print } = toolbox

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = print.spin('Loading recruit...').start()
    const recruit = await loadRecruit(account)
    spinner.succeed('Loaded!')

    spinner.start('Listing items...')
    await marketplace.listItems(recruit)
    spinner.succeed('Done!')
  },
}

module.exports = command
