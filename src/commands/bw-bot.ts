import { GluegunCommand } from 'gluegun'

const command: GluegunCommand = {
  name: 'bw-bot',
  run: async (toolbox) => {
    const { banner } = toolbox
    banner()
  },
}

module.exports = command
