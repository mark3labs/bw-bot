import { GluegunCommand } from 'gluegun'
import { exit } from 'process'

const command: GluegunCommand = {
  name: 'list-items',
  description: 'List all items from an account for sale on the marketplace',
  run: async (toolbox) => {
    const {
      banner,
      parameters,
      marketplace,
      print,
      utils: { loadRecruit, sendNotification },
    } = toolbox

    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = print.spin('Loading recruit...').start()
    const recruit = await loadRecruit(account)
    spinner.succeed('Loaded!')

    spinner.start('Listing items...')
    try {
      const messages = await marketplace.listItems(recruit)
      for (const m of messages) {
        print.info(m)
        print.newline()
        await sendNotification(m)
      }
      spinner.succeed('Done!')
      exit(0)
    } catch (e) {
      spinner.fail('Failed to list items')
      exit(1)
    }
  },
}

module.exports = command
