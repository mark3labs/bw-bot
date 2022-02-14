import { ethers, utils } from 'ethers'
import { GluegunCommand } from 'gluegun'
import { exit } from 'process'
import { barracks, magicToken } from '../lib/contracts'

const command: GluegunCommand = {
  name: 'init',
  run: async (toolbox) => {
    const { print, banner } = toolbox

    banner()

    const account = toolbox.parameters.first

    if (typeof account !== 'number') {
      print.error('Invalid account number!')
      exit(1)
    }

    // Setup wallets
    let wallet = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC,
      `m/44'/60'/0'/0/${account}`
    )

    // Setup provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    wallet = wallet.connect(provider)

    const address = await wallet.getAddress()

    const isReady = await barracks.addressToHasTrained(address)

    if (isReady) {
      print.error('Account already initialized!')
      exit(1)
    }

    const spinner = toolbox.print.spin(`Initializing ${address}...`).start()
    try {
      let tx = await magicToken.approve(
        barracks.address,
        utils.parseEther('10')
      )
      spinner.text = 'Approving $MAGIC...'
      await tx.wait()
      tx = await barracks.trainRecruit()
      spinner.text = 'Training recruit...'
      await tx.wait()
      spinner.succeed('Account is ready for questing! ⚔️')
    } catch (e) {
      spinner.fail('Unable to initialize account!')
      exit(1)
    }
  },
}

module.exports = command
