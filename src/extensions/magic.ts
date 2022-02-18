import { constants, utils } from 'ethers'
import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { WETH_ADDRESS } from '../lib/constants'
import { magicToken, sushi } from '../lib/contracts'
import { Recruit } from '../types'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print, parameters } = toolbox

  toolbox.magic = {
    sell: async (recruit: Recruit): Promise<void> => {
      if (recruit.magicBalance.isZero()) {
        print.warning('Nothing to sell.')
        return
      }
      try {
        let tx

        // Check allowance
        const allowance = await magicToken.allowance(
          recruit.address,
          sushi.address
        )
        if (allowance.lt(recruit.magicBalance)) {
          tx = await magicToken
            .connect(recruit.wallet)
            .approve(sushi.address, constants.MaxUint256)
          await tx.wait()
        }

        // Calculate slippage
        const amountsOut = await sushi.getAmountsOut(utils.parseEther('10'), [
          magicToken.address,
          WETH_ADDRESS,
        ])
        const slippage = amountsOut[1].mul(5).div(1000) // 0.5% slippage
        const amountOutMin = amountsOut[1].sub(slippage)

        // Sell $MAGIC
        tx = await sushi
          .connect(recruit.wallet)
          .swapExactTokensForETH(
            recruit.magicBalance,
            amountOutMin,
            [magicToken.address, WETH_ADDRESS],
            recruit.address,
            moment().add(1, 'minute').unix()
          )
        await tx.wait()
      } catch (e) {
        print.error(`Error: ${e.code}`)
        if (parameters.options.debug) {
          print.info(e)
        }
        throw e
      }
    },
  }
}
