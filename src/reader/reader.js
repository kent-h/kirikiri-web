import React, {Component} from "react"
import {withRouter} from "react-router"
import ScriptLoader from "../interpreter/script-loader"
import {ScrollWatcher} from "./scroll/watcher"
import Animation from "./animation/animation"
import Menu from "./menu/menu"
import "./reader.css"

class Reader extends Component {
  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)

    this.state = {showMenu: false}
  }

  onKeyDown(e) {
    console.log(e)
    if (e.key === "Escape") {
      this.setState({showMenu: !this.state.showMenu})
    }
    console.log(this.state.showMenu)
  }

  render() {
    return <ScrollWatcher>
      <div tabIndex={-1} onKeyDown={this.onKeyDown}>
        <Animation/>

        <Menu visible={this.state.showMenu}/>

        <div className="text-area">
          <div className="text">
            <ScriptLoader storage={this.props.match.params.script + ".ks"}/>
            {/*// プロローグ1日目.ks プロローグ.ks first.ks*/}
          </div>
        </div>
      </div>
    </ScrollWatcher>
  }
}

Reader = withRouter(Reader)
export default Reader
