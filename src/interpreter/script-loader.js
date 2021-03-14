import {Component} from "react"
import {LocateScript} from "./parse/lookup/lookup"
import Render from "./parse/render"
import Tokenize from "./parse/tokenize"
import "./script-loader.css"

class ScriptLoader extends Component {
  constructor(props) {
    super(props)
    this.preRender = this.preRender.bind(this)

    this.state = {display: []}
  }

  componentDidMount() {
    this.load()
  }

  async load() {
    const scriptFetchPromise = fetch(LocateScript(this.props.storage))

    let macroFile
    if (!this.props.gameState) {
      const response = await fetch("/static/scripts/マクロ.ks.gz")
      macroFile = await response.text()
      if (!response.ok) {
        this.setState({display: "failed to load: " + macroFile})
        return
      }
    }

    const response = await scriptFetchPromise
    const file = await response.text()
    if (!response.ok) {
      this.setState({display: "failed to load: " + file})
      return
    }

    this.preRender(file, macroFile)
  }

  preRender(file, macroFile) {
    const stackFrame = (this.props.gameState && this.props.gameState.stackFrame) || {}
    stackFrame.storage = this.props.storage
    stackFrame.file = file
    stackFrame.fileIndex = 0

    let gameState = this.props.gameState

    if (gameState) {
      gameState.stackFrame = stackFrame
    }

    if (!gameState) {
      // call macro first, and "return" to the specified storage
      gameState = {
        macros: {},
        stackFrame: {storage: "マクロ.ks", file: macroFile, fileIndex: 0, returnFrame: stackFrame},
      }
    }

    let tokens = []
    Tokenize(tokens, gameState, this.props.target)
    this.setState({display: Render(tokens, this.props.renderState)})
  }

  render() {
    return this.state.display
  }
}

export default ScriptLoader
