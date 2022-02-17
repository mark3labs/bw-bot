import { Client, Intents } from 'discord.js'
import { ethers, utils } from 'ethers'
import { GluegunToolbox } from 'gluegun'
import { magicToken, barracks, consumables } from '../lib/contracts'
import { Recruit, Balances, BWConfig } from '../types'
import * as os from 'os'
import * as path from 'path'
import { BRIDGEWORLD_SUBGRAPH_URL } from '../lib/constants'

module.exports = (toolbox: GluegunToolbox) => {
  const {
    print,
    http,
    config: { loadConfig },
  } = toolbox

  const homedir = os.homedir()
  const CONFIG_DIR = path.join(homedir, '.config', 'bwbot')
  const bwCfg: BWConfig = loadConfig('bwbot', CONFIG_DIR)

  const provider = new ethers.providers.JsonRpcProvider(bwCfg.rpc_url)
  const loadRecruits = async (amount: number): Promise<Recruit[]> => {
    const recruits: Recruit[] = []

    for (let i = 0; i < amount; i++) {
      recruits.push(await loadRecruit(i))
    }

    return recruits
  }

  // Load multiple recruits
  const loadRecruit = async (account: number): Promise<Recruit> => {
    let wallet
    if (bwCfg[`account_${account}`]) {
      wallet = new ethers.Wallet(bwCfg[`account_${account}`])
    } else {
      wallet = ethers.Wallet.fromMnemonic(
        bwCfg.mnemonic,
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
  const showRecruits = (recruits: Recruit[]): void => {
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

  // Fetch recruit ID
  const getRecruitId = async (address: string): Promise<number> => {
    const client = http.create({
      baseURL: BRIDGEWORLD_SUBGRAPH_URL,
    })

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

  const sendNotification = async (msg: string): Promise<void> => {
    const discord = new Client({ intents: Intents.FLAGS.GUILDS })
    await discord.login(bwCfg.discord_token)
    const user = await discord.users.fetch(bwCfg.discord_id)
    await user.send(msg)
  }

  const getBalances = async (address: string): Promise<Balances> => {
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

  const sleep = (ms: number): Promise<unknown> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  const shortAddr = (addr: string): string => {
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 5)
  }

  toolbox.utils = {
    loadRecruit,
    loadRecruits,
    showRecruits,
    getRecruitId,
    sendNotification,
    getBalances,
    sleep,
    shortAddr,
  }
}
