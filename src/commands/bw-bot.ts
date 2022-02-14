import { GluegunCommand } from 'gluegun'
import {
  collectLoot,
  listAllItems,
  loadRecruits,
  restartQuest,
  sellMagic,
  showRecruits,
} from '../lib/utils'

const command: GluegunCommand = {
  name: 'bw-bot',
  run: async (toolbox) => {
    const { print } = toolbox

    const spinner = print.spin('Loading wallets...\n\n').start()

    let recruits = await loadRecruits(3)

    showRecruits(recruits)

    spinner.succeed(`Accounts loaded!`)

    spinner.start('Questing! ⚔️')

    setInterval(async () => {
      const dateTime = new Date()

      if (dateTime.getMinutes() === 0 || dateTime.getMinutes() === 30) {
        recruits = await loadRecruits(3)
        print.info('\n📝 Current stats:\n')
        showRecruits(recruits)
      }

      spinner.text = 'Checking on recruits...'
      for (const r of recruits) {
        if (dateTime.getMinutes() === 6 || dateTime.getMinutes() === 0) {
          await sellMagic(r)
        }
        await collectLoot(r)
        await restartQuest(r)
        await listAllItems(r)
      }
      spinner.text = 'Questing! ⚔️'
    }, 60000)
  },
}

module.exports = command
