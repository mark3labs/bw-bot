import { GluegunCommand } from 'gluegun'
import { exit } from 'process'

const command: GluegunCommand = {
  name: 'quest',
  alias: 'q',
  description: 'Monitor and restart quests for an account',
  run: async (toolbox) => {
    const {
      banner,
      parameters,
      print,
      quest,
      utils: { loadRecruit, showRecruits, sleep },
    } = toolbox

    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = print.spin('Loading recruit...').start()
    let recruit = await loadRecruit(account)
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
      recruit = await loadRecruit(account)
      await sleep(60000)
    }
  },
}

module.exports = command
