import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { loadRecruit, showRecruits } from '../lib/utils'

const command: GluegunCommand = {
  name: 'info',
  run: async (toolbox) => {
    const { banner, print, parameters } = toolbox

    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = toolbox.print.spin(`Loading recruit...\n`).start()
    const recruit = await loadRecruit(account)

    showRecruits([recruit])
    spinner.succeed('Recruit loaded!')
    exit(0)
  },
}

module.exports = command
