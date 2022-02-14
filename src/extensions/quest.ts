import { utils } from 'ethers'
import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { quest } from '../lib/contracts'
import { getBalances, sendNotification } from '../lib/utils'
import { Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print } = toolbox
  toolbox.quest = {
    restartQuest: async (recruit: Recruit): Promise<void> => {
      try {
        const questStartTime = await quest.tokenIdToQuestStartTime(recruit.id)
        const startTime = moment.unix(parseInt(questStartTime.toString()))
        if (moment().isAfter(startTime.add(8, 'hours'))) {
          print.info(`Restarting quest for ${recruit.address} - ${recruit.id}`)
          const tx = await quest
            .connect(recruit.wallet)
            .restartTokenQuests([recruit.id], [0], [1])
          await tx.wait()
          print.success(
            `🔃 Restarted quest for ${recruit.address} - ${recruit.id}`
          )
          await sendNotification(
            `🔃 Restarted quest for ${recruit.address} - ${recruit.id}`
          )
        }
      } catch (e) {
        print.error(`Error: ${e.code}`)
      }
    },
    collectLoot: async (recruit: Recruit): Promise<void> => {
      let readyToReveal
      try {
        readyToReveal = await quest.isQuestReadyToReveal(recruit.id)
      } catch (e) {
        readyToReveal = false
      }
      if (readyToReveal) {
        try {
          const tx = await quest
            .connect(recruit.wallet)
            .revealTokensQuests([recruit.id])
          await tx.wait()
          recruit.loot = await getBalances(recruit.address)
          print.success(
            `💰 Collected loot for ${recruit.address} - ${recruit.id}`
          )
          print.success(
            `🔷 = ${utils.formatEther(
              recruit.ethBalance
            )} 🪄= ${utils.formatEther(recruit.magicBalance)} 🌟 = ${
              recruit.loot.starlight
            } 💎 = ${recruit.loot.shards} 🔒 = ${recruit.loot.locks}`
          )
          await sendNotification(
            `💰 Collected loot for ${recruit.address} - ${recruit.id}`
          )
          await sendNotification(
            `🔷 = ${utils.formatEther(
              recruit.ethBalance
            )} 🪄= ${utils.formatEther(recruit.magicBalance)} 🌟 = ${
              recruit.loot.starlight
            } 💎 = ${recruit.loot.shards} 🔒 = ${recruit.loot.locks}`
          )
        } catch (e) {
          print.error(`Error: ${e.code}`)
        }
      }
    },
  }
}
