import React, {Component} from "react"
import "./interpreter.css"
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
    let macroFile
    if (!this.props.gameState) {
      const response = await fetch("/static/scripts/マクロ.ks.gz")
      macroFile = await response.text()
      if (!response.ok) {
        this.setState({macroText: "failed to load: " + macroFile})
        return
      }
      this.setState({macroText: macroFile})
    }

    let response = await fetch("/static/scripts/eng/" + this.props.storage + ".gz")
    let file = await response.text()
    if (!response.ok) {
      let response = await fetch("/static/scripts/" + this.props.storage + ".gz")
      file = await response.text()
      if (!response.ok) {
        this.setState({displayText: "failed to load: " + file})
        return
      }
    }

    this.preRender(file, macroFile)
  }

  preRender(displayText, macroText) {
    const lines = displayText.split("\r\n")
    let stackFrame = {storage: this.props.storage, lines: lines, lineIndex: 0, returnFrame: this.props.returnFrame}

    let gameState = this.props.gameState
    if (!gameState) {
      gameState = {macros: {}}
      // call macro first, and "return" to the specified storage
      stackFrame = {storage: "マクロ.ks", lines: macroText.split("\r\n"), lineIndex: 0, returnFrame: stackFrame}
    }

    let tokens = []
    Tokenize(tokens, gameState, stackFrame, this.props.target)
    this.setState({display: Render(tokens)})
  }

  render() {
    return this.state.display
  }
}

export default Interpreter