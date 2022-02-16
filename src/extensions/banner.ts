import { GluegunToolbox } from 'gluegun'

// add your CLI-specific functionality here, which will then be accessible
// to your commands
module.exports = (toolbox: GluegunToolbox) => {
  const { print } = toolbox
  toolbox.banner = () => {
    print.info(
      print.colors.bgBlue(' BridgeWorld Bot ') + print.colors.bgCyan(' 1.0 ')
    )
    print.newline()
  }
}
