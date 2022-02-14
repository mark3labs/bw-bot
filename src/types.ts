import { ethers } from 'ethers'

// export types
export interface Recruit {
  id: number
  address: string
  wallet: ethers.Wallet
  ethBalance: ethers.BigNumber
  magicBalance: ethers.BigNumber
  isReady: boolean
  loot: Balances
}

export interface ArbResult {
  status: string
  message: string
  result: Array<Record<string, string>>
}

export interface Balances {
  starlight: number
  shards: number
  locks: number
}

export interface ConsumableFloorPrices {
  starlight: ethers.BigNumber
  shards: ethers.BigNumber
  locks: ethers.BigNumber
}
