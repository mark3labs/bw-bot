import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { loadRecruit, showRecruits, sleep } from '../lib/utils'

const command: GluegunCommand = {
  name: 'quest',
  run: async (toolbox) => {
    const { banner, parameters, print, quest } = toolbox

    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = print.spin('Loading recruit...').start()
    const recruit = await loadRecruit(account)
    print.newline()
    print.newline()
    showRecruits([recruit])
    spinner.succeed('Loaded!')

    spinner.start()
    while (true) {
      spinner.text = 'Checking on recruit...'
      await quest.restartQuest(recruit)
      await quest.collectLoot(recruit)
      spinner.text = 'Questing! ⚔️'
      await sleep(60000)
    }
  },
}

module.exports = command
