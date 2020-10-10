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

    let response = await fetch("game/patch_lang_english/" + this.props.storage)
    let file = await response.text()
    if (!response.ok || file.startsWith("<!DOCTYPE html>")) {
      response = await fetch("game/patch/" + this.props.storage) // data/scenario/
      file = await response.text()
    }

    this.setState({displayText: file})
  }

  render() {
    const lines = this.state.displayText.split("\r\n")
    const stackFrame = {storage: this.props.storage, lines: lines, lineIndex: 0, returnFrame: this.props.returnFrame}


    return <div>
      <div>--- start of {this.props.storage} {this.props.target} ---</div>
      <Parse gameState={this.props.gameState || {macros: {}}}
             storage={this.props.storage}
             target={this.props.target}
             stackFrame={stackFrame}/>
    </div>
  }
}

export default Interpreter