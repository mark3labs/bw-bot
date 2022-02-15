import { ethers, utils } from 'ethers'
import { http, print } from 'gluegun'
import * as moment from 'moment'
import { Balances, ConsumableFloorPrices, Recruit } from '../types'
import { barracks, consumables, magicToken, quest } from './contracts'
import { Client, Intents } from 'discord.js'

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)

// Load Recruits
export const loadRecruits = async (amount: number): Promise<Recruit[]> => {
  const recruits: Recruit[] = []

  for (let i = 0; i < amount; i++) {
    recruits.push(await loadRecruit(i))
  }

  return recruits
}

// Load multiple recruits
export const loadRecruit = async (account: number): Promise<Recruit> => {
  let wallet
  if (process.env[`CUSTOM_${account}`]) {
    wallet = new ethers.Wallet(process.env[`CUSTOM_${account}`])
  } else {
    wallet = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC,
      `m/44'/60'/0'/0/${account}`
    )
  }
  wallet = wallet.connect(provider)
  const address = await wallet.getAddress()
  const id = await getRecruitId(address)

  const ethBalance = await wallet.getBalance()
  const magicBalance = await magicToken.balanceOf(address)
  const isReady = await barracks.addressToHasTrained(address)
  const loot = await getBalances(address)

  return {
    id,
    address,
    wallet,
    ethBalance,
    magicBalance,
    isReady,
    loot,
  }
}

// Show Recruits
export const showRecruits = (recruits: Recruit[]): void => {
  // Load up accounts table
  const accounts = [
    ['#', 'Address', 'ETH', 'MAGIC', 'RECRUIT ID', 'READY', '🌟', '💎', '🔒'],
  ]
  let idx = 0
  for (const r of recruits) {
    accounts.push([
      recruits.length > 1 ? idx.toString() : '*',
      r.address,
      utils.formatEther(r.ethBalance),
      utils.formatEther(r.magicBalance),
      r.id.toString(),
      r.isReady ? '⚔️' : '😔',
      r.loot.starlight.toString(),
      r.loot.shards.toString(),
      r.loot.locks.toString(),
    ])
    idx++
  }
  print.table(accounts, { format: 'markdown' })
  print.newline()
}

// Restart Quest
export const restartQuest = async (recruit: Recruit): Promise<void> => {
  try {
    const questStartTime = await quest.tokenIdToQuestStartTime(recruit.id)
    const startTime = moment.unix(parseInt(questStartTime.toString()))
    if (moment().isAfter(startTime.add(8, 'hours'))) {
      print.info(`Restarting quest for ${recruit.address} - ${recruit.id}`)
      const tx = await quest
        .connect(recruit.wallet)
        .restartTokenQuests([recruit.id], [0], [1])
      await tx.wait()
      print.info(`🔃 Restarted quest for ${recruit.address} - ${recruit.id}`)
      await sendNotification(
        `🔃 Restarted quest for ${recruit.address} - ${recruit.id}`
      )
    }
  } catch (_) {}
}

// Collect Loot
export const collectLoot = async (recruit: Recruit): Promise<void> => {
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
      print.info(`💰 Collected loot for ${recruit.address} - ${recruit.id}`)
      print.info(
        `🔷 = ${utils.formatEther(recruit.ethBalance)} 🪄= ${utils.formatEther(
          recruit.magicBalance
        )} 🌟 = ${recruit.loot.starlight} 💎 = ${recruit.loot.shards} 🔒 = ${
          recruit.loot.locks
        }`
      )
      await sendNotification(
        `💰 Collected loot for ${recruit.address} - ${recruit.id}`
      )
      await sendNotification(
        `🔷 = ${utils.formatEther(recruit.ethBalance)} 🪄= ${utils.formatEther(
          recruit.magicBalance
        )} 🌟 = ${recruit.loot.starlight} 💎 = ${recruit.loot.shards} 🔒 = ${
          recruit.loot.locks
        }`
      )
    } catch (_) {}
  }
}

// Fetch recruit ID
const getRecruitId = async (address: string): Promise<number> => {
  const client = http.create({ baseURL: process.env.BRIDGEWORLD_SUBGRAPH_URL })

  const { data, ok } = await client.post('', {
    query: `{
      user(id: "${address.toLowerCase()}") {
        recruit {
          tokenId
        }
      } 
    }`,
  })

  if (ok && data['data']['user']) {
    return parseInt(data['data']['user']['recruit']['tokenId'])
  }
  return 0
}

export const sendNotification = async (msg: string): Promise<void> => {
  const discord = new Client({ intents: Intents.FLAGS.GUILDS })
  await discord.login(process.env.DISCORD_TOKEN)
  const user = await discord.users.fetch(process.env.DISCORD_ID)
  await user.send(msg)
}

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
    const client = http.create({ baseURL: process.env.TREASURE_SUBGRAPH_URL })

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

export const sleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const shortAddr = (addr: string): string => {
  return addr.substring(0, 6) + '...' + addr.substring(addr.length - 5)
}
