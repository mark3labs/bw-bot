import { utils } from 'ethers'
import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { quest } from '../lib/contracts'
import { getBalances, sendNotification, shortAddr } from '../lib/utils'
import { Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print, http } = toolbox

  const getEndtime = async (id: number): Promise<number> => {
    const client = http.create({
      baseURL: process.env.BRIDGEWORLD_SUBGRAPH_URL,
    })

    const { data, ok } = await client.post('', {
      query: `{
        quest(id: "0xda3cad5e4f40062ceca6c1b979766bc0baed8e33-0x${id.toString(
          16
        )}") {
          endTimestamp
        }
      }`,
    })

    if (ok) {
      return parseInt(data['data']['quest']['endTimestamp']) / 1000
    }
    return null
  }

  toolbox.quest = {
    // Restart Quest
    restartQuest: async (recruit: Recruit): Promise<void> => {
      try {
        const endTime = moment.unix(await getEndtime(recruit.id))
        if (moment().isAfter(endTime)) {
          print.info(
            `Restarting quest for ${shortAddr(recruit.address)} - ${recruit.id}`
          )
          const tx = await quest
            .connect(recruit.wallet)
            .restartTokenQuests([recruit.id], [0], [1])
          await tx.wait()
          print.success(
            `🔃 Restarted quest for ${shortAddr(recruit.address)} - ${
              recruit.id
            }`
          )
          await sendNotification(
            `🔃 Restarted quest for \`${shortAddr(recruit.address)}\` - \`${
              recruit.id
            }\``
          )
        }
      } catch (e) {
        print.error(`Error: ${e.code}`)
      }
    },

    // Collect Loot
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
            `💰 Collected loot for ${shortAddr(recruit.address)} - ${
              recruit.id
            }`
          )
          print.success(
            `🔷 = ${utils.formatEther(
              recruit.ethBalance
            )} 🪄= ${utils.formatEther(recruit.magicBalance)} 🌟 = ${
              recruit.loot.starlight
            } 💎 = ${recruit.loot.shards} 🔒 = ${recruit.loot.locks}`
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
        } catch (e) {
          print.error(`Error: ${e.code}`)
        }
      }
    },
  }
}
