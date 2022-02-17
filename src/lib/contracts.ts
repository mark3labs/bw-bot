import { getArbitrumOneSdk } from '@dethcrypto/eth-sdk-client'
import { ethers } from 'ethers'
import { RPC_URL } from './constants'

export const MAGIC_CONTRACT_ADDR = '0x539bde0d7dbd336b79148aa742883198bbf60342'
export const LEGION_CONTRACT_ADDR = '0xfE8c1ac365bA6780AEc5a985D989b327C27670A1'
export const BARRACKS_CONTRACT_ADDR =
  '0x1bb7fBda942eB19be66b5DcB32fC5a69C2bA053D'
export const QUEST_CONTRACT_ADDR = '0xDA3caD5e4F40062CECa6c1B979766BC0BAed8e33'
export const MARKETPLACE_CONTRACT_ADDR =
  '0x2E3b85F85628301a0Bce300Dee3A6B04195A15Ee'

const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const defaultSigner = ethers.Wallet.createRandom().connect(provider)
const sdk = getArbitrumOneSdk(defaultSigner)

// Setup MAGIC Contract
export const magicToken = new ethers.Contract(
  MAGIC_CONTRACT_ADDR,
  [
    'function balanceOf(address) external view returns (uint256)',
    'function approve(address,uint256) external',
  ],
  provider
)

export const legionToken = sdk.legionToken

export const barracks = sdk.barracks

export const quest = sdk.quest

export const marketPlace = sdk.marketPlace

export const consumables = sdk.consumables

export const sushi = sdk.sushi
