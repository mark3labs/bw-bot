import { GluegunCommand, GluegunToolbox } from 'gluegun'
import { Client, Message } from 'discord.js'
import { ethers, utils } from 'ethers'
import * as os from 'os'
import * as path from 'path'
import { BWConfig } from '../types'

const command: GluegunCommand = {
  name: 'listen',
  description: 'Start the Discord bot listener',
  run: async (toolbox) => {
    const {
      banner,
      print,
      utils: { loadRecruit, loadRecruits, shortAddr },
      config: { loadConfig },
    } = toolbox

    const homedir = os.homedir()
    const CONFIG_DIR = path.join(homedir, '.config', 'bwbot')
    const bwCfg: BWConfig = loadConfig('bwbot', CONFIG_DIR)

    banner()

    const parseCommand = async (message: Message, toolbox: GluegunToolbox) => {
      try {
        if (message.content.startsWith('!ping')) {
          message.channel.sendTyping()
          print.info(`PING: ${new Date().toUTCString()}`)
          message.reply('pong!')
          return
        }

        if (message.content.startsWith('!info')) {
          message.channel.sendTyping()
          const id = message.content.split(' ')[1]
          const recruit = await loadRecruit(parseInt(id))
          message.reply(`
      \`${shortAddr(recruit.address)}\` - \`${recruit.id}\`
      ETH: \`${utils.formatEther(recruit.ethBalance)}\`
      MAGIC: \`${utils.formatEther(recruit.magicBalance)}\`
      🌟: \`${recruit.loot.starlight}\` | 💎: \`${
            recruit.loot.shards
          }\` | 🔒: \`${recruit.loot.locks}\`
      `)
        }

        if (message.content.startsWith('!list')) {
          message.channel.sendTyping()
          const id = message.content.split(' ')[1]
          const recruit = await loadRecruit(parseInt(id))
          toolbox.marketplace.listItems(recruit)
        }

        if (message.content.startsWith('!sell')) {
          message.channel.sendTyping()
          const id = message.content.split(' ')[1]
          const recruit = await loadRecruit(parseInt(id))
          toolbox.magic.sell(recruit)
        }

        if (message.content.startsWith('!eth')) {
          message.channel.sendTyping()
          const count = parseInt(message.content.split(' ')[1]) || 5
          const recruits = await loadRecruits(count)
          let total = ethers.BigNumber.from('0')
          for (const r of recruits) {
            total = total.add(r.ethBalance)
          }
          message.reply(`Total ETH: ${utils.formatEther(total)}`)
        }

        if (message.content.startsWith('!magic')) {
          message.channel.sendTyping()
          const count = parseInt(message.content.split(' ')[1]) || 5
          const recruits = await loadRecruits(count)
          let total = ethers.BigNumber.from('0')
          for (const r of recruits) {
            total = total.add(r.magicBalance)
          }
          message.reply(`Total $MAGIC: ${utils.formatEther(total)}`)
        }
      } catch (e) {
        message.reply('Error running command...')
      }
    }

    const discord = new Client({
      intents: ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'],
      partials: ['MESSAGE', 'CHANNEL'],
    })

    discord.on('messageCreate', async (message) => {
      parseCommand(message, toolbox)
    })

    discord.on('ready', () => {
      print.spin('Waiting for commands...')
    })

    discord.login(bwCfg.discord_token)
  },
}

module.exports = command
