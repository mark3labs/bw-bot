import { ethers } from 'ethers'
import { http } from 'gluegun'
import { Balances, ConsumableFloorPrices } from '../types'
import { TREASURE_SUBGRAPH_URL } from './constants'
import { consumables } from './contracts'

export const getBalances = async (address: string): Promise<Balances> => {
  enum Consumables {
    Starlight = 8,
    Shards = 9,
    Locks = 10,
  }
  const starlight = parseInt(
    (await consumables.balanceOf(address, Consumables.Starlight)).toString()
  )
  const shards = parseInt(
    (await consumables.balanceOf(address, Consumables.Shards)).toString()
  )
  const locks = parseInt(
    (await consumables.balanceOf(address, Consumables.Locks)).toString()
  )

  return {
    starlight,
    shards,
    locks,
  }
}

export const getFloorPrices =
  async (): Promise<ConsumableFloorPrices | null> => {
    const client = http.create({ baseURL: TREASURE_SUBGRAPH_URL })

    const { data, ok } = await client.post('', {
      query: `{
	      starlight: tokens(where: { name: "Essence of Starlight" }) {
          name
          id
          floorPrice
          tokenId
        }
        shards: tokens(where: { name: "Prism Shards" }) {
          name
          id
          floorPrice
          tokenId
        }
	      locks: tokens(where: { name: "Universal Lock" }) {
          name
          id
          floorPrice
          tokenId
        }
    }`,
    })

    if (ok) {
      return {
        starlight: ethers.BigNumber.from(
          data['data']['starlight'][0].floorPrice
        ),
        shards: ethers.BigNumber.from(data['data']['shards'][0].floorPrice),
        locks: ethers.BigNumber.from(data['data']['locks'][0].floorPrice),
      }
    }
    return null
  }
