import { utils } from 'ethers'
import { GluegunCommand } from 'gluegun'
import { exit } from 'process'

const command: GluegunCommand = {
  name: 'sell',
  alias: 's',
  description: 'Sell all $MAGIC from an account for ETH',
  run: async (toolbox) => {
    const {
      banner,
      parameters,
      print,
      magic,
      utils: { loadRecruit, sendNotification, shortAddr },
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

    spinner.start('Selling $MAGIC...')
    try {
      await magic.sell(recruit)
      print.success(
        `${shortAddr(recruit.address)} - ${recruit.id} sold ${utils.formatEther(
          recruit.magicBalance
        )} $MAGIC!`
      )
      await sendNotification(
        `\`${shortAddr(recruit.address)}\` - \`${
          recruit.id
        }\` sold \`${utils.formatEther(recruit.magicBalance)}\` $MAGIC!`
      )
      spinner.succeed('Done!')
      exit(0)
    } catch (e) {
      spinner.fail('Failed to sell $MAGIC')
      exit(1)
    }
  },
}

module.exports = command
