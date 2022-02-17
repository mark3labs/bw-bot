import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { BRIDGEWORLD_SUBGRAPH_URL } from '../lib/constants'
import { quest } from '../lib/contracts'
import { Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print, http } = toolbox

  const getEndtime = async (id: number): Promise<number> => {
    const client = http.create({
      baseURL: BRIDGEWORLD_SUBGRAPH_URL,
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
    restartQuest: async (recruit: Recruit): Promise<boolean> => {
      try {
        const endTime = moment.unix(await getEndtime(recruit.id))
        if (moment().isAfter(endTime)) {
          const tx = await quest
            .connect(recruit.wallet)
            .restartTokenQuests([recruit.id], [0], [1])
          await tx.wait()
          return true
        }
        return false
      } catch (e) {
        print.error(`Error: ${e.code}`)
        throw e
      }
    },

    // Collect Loot
    collectLoot: async (recruit: Recruit): Promise<boolean> => {
      let readyToReveal
      try {
        readyToReveal = await quest.isQuestReadyToReveal(recruit.id)
      } catch (e) {
        readyToReveal = false
        return false
      }
      if (readyToReveal) {
        try {
          const tx = await quest
            .connect(recruit.wallet)
            .revealTokensQuests([recruit.id])
          await tx.wait()
          return true
        } catch (e) {
          print.error(`Error: ${e.code}`)
          throw e
        }
      }
    },
  }
}
