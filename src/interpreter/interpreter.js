import React, {Component} from "react"
import Parse from "./parse/parse"

const repeated = {}

class Interpreter extends Component {
  constructor(props) {
    super(props)

    this.state = {displayText: ""}
  }

  componentDidMount() {
    this.load()
  }

  async load() {
    let current = (repeated[this.props.storage + "-" + this.props.target] || 0)
    if (current > 2) {
      return
    }
    repeated[this.props.storage + "-" + this.props.target] = current + 1

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
    const stackFrame = {storage: this.props.storage, lines: lines, lineIndex: 0, returnFrame: this.props.returnFrame}


    return <>
      <div>--- start of {this.props.storage} {this.props.target} ---</div>
      <Parse gameState={this.props.gameState}
             storage={this.props.storage}
             target={this.props.target}
             stackFrame={stackFrame}/>
    </>
  }
}

export default Interpreter