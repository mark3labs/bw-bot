import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    arbitrumOne: {
      legionToken: '0xfE8c1ac365bA6780AEc5a985D989b327C27670A1',
      marketPlace: '0x2E3b85F85628301a0Bce300Dee3A6B04195A15Ee',
      quest: '0xDA3caD5e4F40062CECa6c1B979766BC0BAed8e33',
      barracks: '0x1bb7fBda942eB19be66b5DcB32fC5a69C2bA053D',
      consumables: '0xF3d00A2559d84De7aC093443bcaAdA5f4eE4165C',
      sushi: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    },
  },
  rpc: {
    arbitrumOne: 'https://arb1.arbitrum.io/rpc',
  },
})
