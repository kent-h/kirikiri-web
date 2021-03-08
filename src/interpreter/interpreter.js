import {Component} from "react"
import "./interpreter.css"
import {LocateScript} from "./parse/lookup/lookup"
import Render from "./parse/render"
import Tokenize from "./parse/tokenize"

class Interpreter extends Component {
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

  preRender(displayText, macroText) {
    const stackFrame = (this.props.gameState && this.props.gameState.stackFrame) || {}
    stackFrame.storage = this.props.storage
    stackFrame.lines = displayText.split("\r\n")
    stackFrame.lineIndex = 0

    let gameState = this.props.gameState

    if (gameState) {
      gameState.stackFrame = stackFrame
    }

    if (!gameState) {
      // call macro first, and "return" to the specified storage
      gameState = {
        macros: {},
        stackFrame: {storage: "マクロ.ks", lines: macroText.split("\r\n"), lineIndex: 0, returnFrame: stackFrame},
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

export default Interpreter
