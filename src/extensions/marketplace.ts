import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { getFloorPrices } from '../lib/common'
import { consumables, marketPlace } from '../lib/contracts'
import { ConsumableFloorPrices, Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print } = toolbox

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listItem = async (recruit: Recruit, item: any): Promise<number> => {
    if (recruit.loot[item.shortName] > 0) {
      try {
        const floorPrices: ConsumableFloorPrices = await getFloorPrices()
        const listing = await marketPlace.listings(
          consumables.address,
          item.id,
          recruit.address
        )

        const qtyListed = listing[0].toNumber()

        const qtyToList = recruit.loot[item.shortName]

        if (qtyToList === qtyListed) return 0

        const basePrice = floorPrices[item.shortName]
        const tenPercent = basePrice.mul(10).div(100)
        const listPrice = basePrice.add(tenPercent)

        let tx
        if (qtyToList > qtyListed && qtyListed > 0) {
          tx = await marketPlace
            .connect(recruit.wallet)
            .updateListing(
              consumables.address,
              item.id,
              qtyToList,
              listPrice,
              moment().add(3, 'months').unix()
            )
          await tx.wait()
        } else {
          tx = await marketPlace
            .connect(recruit.wallet)
            .createListing(
              consumables.address,
              item.id,
              qtyToList,
              listPrice,
              moment().add(3, 'months').unix()
            )
          await tx.wait()
        }
        return qtyToList
      } catch (e) {
        print.error(`Error: ${e.code}`)
        throw e
      }
    }
    return 0
  }

  toolbox.marketplace = {
    listItems: async (recruit: Recruit): Promise<string[]> => {
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
          throw e
        }
      }

      const msgs: string[] = []
      for (const i of ITEMS) {
        const qty = await listItem(recruit, i)
        if (qty === 0) continue
        msgs.push(`Listed ${qty} ${i.emoji} ${i.name} for ${recruit.id}`)
      }

      return msgs
    },
  }
}
