import { ethers, utils } from 'ethers'
import { GluegunCommand } from 'gluegun'
import { exit } from 'process'

const command: GluegunCommand = {
  name: 'roster',
  run: async (toolbox) => {
    const {
      banner,
      print,
      utils: { loadRecruits, showRecruits, sendNotification },
    } = toolbox

    banner()

    const amount = toolbox.parameters.first

    if (amount && typeof amount !== 'number') {
      print.error('Invalid number')
      exit(1)
    }

    const spinner = toolbox.print.spin(`Loading roster...\n`).start()
    const recruits = await loadRecruits(parseInt(amount) || 5)

    showRecruits(recruits)
    let ethTotal = ethers.BigNumber.from('0')
    for (const r of recruits) {
      ethTotal = ethTotal.add(r.ethBalance)
    }
    let magicTotal = ethers.BigNumber.from('0')
    for (const r of recruits) {
      magicTotal = magicTotal.add(r.magicBalance)
    }
    print.info(`ETH Total: ${utils.formatEther(ethTotal)}`)
    print.info(`$MAGIC Total: ${utils.formatEther(magicTotal)}`)
    print.newline()
    await sendNotification(`ETH Total: ${utils.formatEther(ethTotal)}`)
    await sendNotification(`$MAGIC Total: ${utils.formatEther(magicTotal)}`)
    spinner.succeed('Roster loaded!')
    exit(0)
  },
}

module.exports = command
