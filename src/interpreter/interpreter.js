import React, {Component} from "react"
import Parse from "./parse/parse"
import "./interpreter.css"

class Interpreter extends Component {
  constructor(props) {
    super(props)

    this.state = {displayText: "", macroText: ""}
  }

  componentDidMount() {
    this.load()
  }

  async load() {
    if (!this.props.gameState) {
      let response = await fetch("/static/game/patch/マクロ.ks")
      if (!response.ok) {
        const file = await response.text()
        this.setState({macroText: "failed to load: " + file})
        return
      }
      const buffer = await response.arrayBuffer()
      const file = new TextDecoder("utf-16le").decode(buffer)
      this.setState({macroText: file})
    }

    let response = await fetch("/static/game/patch_lang_english/" + this.props.storage)
    if (!response.ok) {
      response = await fetch("/static/game/patch/" + this.props.storage) // data/scenario/
      if (!response.ok) {
        const file = await response.text()
        this.setState({displayText: "failed to load: " + file})
        return
      }
    }
    const buffer = await response.arrayBuffer()
    const file = new TextDecoder("utf-16le").decode(buffer)
    this.setState({displayText: file})
  }

  render() {
    const lines = this.state.displayText.split("\r\n")
    let stackFrame = {storage: this.props.storage, lines: lines, lineIndex: 0, returnFrame: this.props.returnFrame}

    let gameState = this.props.gameState
    if (!gameState) {
      gameState = {macros: {}}
      // call macro first, and "return" to the specified storage
      stackFrame = {storage: "マクロ.ks", lines: this.state.macroText.split("\r\n"), lineIndex: 0, returnFrame: stackFrame}
    }

    return <>
      <Parse gameState={gameState}
             target={this.props.target}
             stackFrame={stackFrame}/>
    </>
  }
}

export default Interpreter