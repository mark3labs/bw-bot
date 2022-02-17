import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'bw-bot',
  description: 'Bridgeworld Bot',
  run: async (toolbox) => {
    const { banner, print } = toolbox
    banner()

    print.printCommands(toolbox)
  },
}

module.exports = command
