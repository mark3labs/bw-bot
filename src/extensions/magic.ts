import { constants, utils } from 'ethers'
import { GluegunToolbox } from 'gluegun'
import moment = require('moment')
import { shortAddr, sendNotification } from '../lib/common'
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
        let tx = await magicToken
          .connect(recruit.wallet)
          .approve(sushi.address, constants.MaxUint256)
        await tx.wait()
        tx = await sushi
          .connect(recruit.wallet)
          .swapExactTokensForETH(
            recruit.magicBalance,
            utils.parseEther('0.0001'),
            [magicToken.address, '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'],
            recruit.address,
            moment().add(1, 'minute').unix()
          )
        await tx.wait()
        print.success(
          `${shortAddr(recruit.address)} - ${
            recruit.id
          } sold ${utils.formatEther(recruit.magicBalance)} $MAGIC!`
        )
        await sendNotification(
          `\`${shortAddr(recruit.address)}\` - \`${
            recruit.id
          }\` sold \`${utils.formatEther(recruit.magicBalance)}\` $MAGIC!`
        )
      } catch (e) {
        print.error(`Error: ${e.code}`)
        if (parameters.options.debug) {
          print.info(e)
        }
      }
    },
  }
}
