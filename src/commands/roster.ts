import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { loadRecruits, showRecruits } from '../lib/utils'

const command: GluegunCommand = {
  name: 'roster',
  run: async (toolbox) => {
    const { banner, print } = toolbox

    banner()

    const amount = toolbox.parameters.first

    if (amount && typeof amount !== 'number') {
      print.error('Invalid number')
      exit(1)
    }

    const spinner = toolbox.print.spin(`Loading roster...\n`).start()
    const recruits = await loadRecruits(parseInt(amount) || 3)

    showRecruits(recruits)
    spinner.succeed('Roster loaded!')
    exit(0)
  },
}

module.exports = command
