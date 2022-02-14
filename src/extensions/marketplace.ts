import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { consumables, marketPlace } from '../lib/contracts'
import { getFloorPrices, sendNotification } from '../lib/utils'
import { ConsumableFloorPrices, Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print } = toolbox

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listItem = async (recruit: Recruit, item: any): Promise<void> => {
    if (recruit.loot[item.shortName] > 0) {
      try {
        const floorPrices: ConsumableFloorPrices = await getFloorPrices()
        const tx = await marketPlace
          .connect(recruit.wallet)
          .createListing(
            consumables.address,
            item.id,
            recruit.loot[item.shortName],
            floorPrices[item.shortName],
            moment().add(3, 'months').unix()
          )
        await tx.wait()
        print.info(
          `Listed ${recruit.loot[item.shortName]} ${item.emoji} ${
            item.name
          } for sale for ${recruit.address} - ${recruit.id}`
        )
        sendNotification(
          `Listed ${recruit.loot[item.shortName]} ${item.emoji} ${
            item.name
          } for sale for ${recruit.address} - ${recruit.id}`
        )
      } catch (e) {
        print.error(`Error: ${e.code}`)
      }
    }
  }

  toolbox.marketplace = {
    listItems: async (recruit: Recruit): Promise<void> => {
      const ITEMS = [
        {
          id: 8,
          name: 'Essence of Starlight',
          emoji: '🌟',
          shortName: 'starlight',
        },
        { id: 9, name: 'Prism Shards', emoji: '💎', shortName: 'shards' },
        { id: 10, name: 'Universal Locks', emoji: '🔒', shortName: 'locks' },
      ]

      const isApproved = await consumables.isApprovedForAll(
        recruit.address,
        marketPlace.address
      )

      let tx
      if (!isApproved) {
        try {
          print.info('Setting marketplace approval...')
          tx = await consumables
            .connect(recruit.wallet)
            .setApprovalForAll(marketPlace.address, true)
          await tx.wait()
          print.info('Approved!')
        } catch (e) {
          print.error(`Error: ${e.code}`)
        }
      }

      for (const i of ITEMS) {
        await listItem(recruit, i)
      }
    },
  }
}
