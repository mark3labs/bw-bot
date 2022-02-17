import { ContractTransaction, utils } from 'ethers'
import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { barracks, magicToken, quest } from '../lib/contracts'
import { Recruit } from '../types'

const command: GluegunCommand = {
  name: 'start',
  description: 'Start a recruit on first quest. (Requires 10 $MAGIC)',
  run: async (toolbox) => {
    const {
      banner,
      print,
      parameters,
      utils: { loadRecruit, getRecruitId, sleep },
    } = toolbox
    banner()

    const account = parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    const spinner = toolbox.print.spin(`Loading recruit...`).start()
    const recruit: Recruit = await loadRecruit(account)

    try {
      let tx: ContractTransaction
      if (!recruit.isReady) {
        // Train recruit
        spinner.text = 'Training recruit...'
        tx = await magicToken
          .connect(recruit.wallet)
          .approve(barracks.address, utils.parseEther('10'))
        await tx.wait()
        tx = await barracks.connect(recruit.wallet).trainRecruit()
        await tx.wait()
        await sleep(20000) // Wait for indexer to catch up
        recruit.id = await getRecruitId(recruit.address)
      }

      // Start Quest
      spinner.text = 'Starting first quest...'
      tx = await quest
        .connect(recruit.wallet)
        .startQuests([recruit.id], [0], [1])
      await tx.wait()
      spinner.succeed('Done!')
      exit(0)
    } catch (e) {
      spinner.fail(`Error: ${e.code}`)
      exit(1)
    }
  },
}

module.exports = command
