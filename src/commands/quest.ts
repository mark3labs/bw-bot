import { utils } from 'ethers'
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
      utils: { loadRecruit, showRecruits, sleep, shortAddr, sendNotification },
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
      try {
        print.info(
          `Restarting quest for ${shortAddr(recruit.address)} - ${recruit.id}`
        )
        await quest.restartQuest(recruit)
        print.success(
          `🔃 Restarted quest for ${shortAddr(recruit.address)} - ${recruit.id}`
        )
        await sendNotification(
          `🔃 Restarted quest for \`${shortAddr(recruit.address)}\` - \`${
            recruit.id
          }\``
        )
      } catch (e) {}

      try {
        await quest.collectLoot(recruit)
        recruit = await loadRecruit(account)
        print.success(
          `💰 Collected loot for ${shortAddr(recruit.address)} - ${recruit.id}`
        )
        print.success(
          `🔷 = ${utils.formatEther(recruit.ethBalance)} 🪄= ${utils.formatEther(
            recruit.magicBalance
          )} 🌟 = ${recruit.loot.starlight} 💎 = ${recruit.loot.shards} 🔒 = ${
            recruit.loot.locks
          }`
        )
        await sendNotification(
          `💰 Collected loot for \`${shortAddr(recruit.address)}\` - \`${
            recruit.id
          }\``
        )
        await sendNotification(
          `🔷 = \`${utils.formatEther(
            recruit.ethBalance
          )}\` 🪄= \`${utils.formatEther(recruit.magicBalance)}\` 🌟 = \`${
            recruit.loot.starlight
          }\` 💎 = \`${recruit.loot.shards}\` 🔒 = \`${recruit.loot.locks}\``
        )
      } catch (e) {}

      spinner.text = 'Questing! ⚔️'
      await sleep(60000)
    }
  },
}

module.exports = command
