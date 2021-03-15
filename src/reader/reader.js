import React, {Component} from "react"
import {withRouter} from "react-router"
import ScriptLoader from "../interpreter/script-loader"
import Animation from "./animation/animation"
import {Provider} from "./debug"
import Menu from "./menu/menu"
import "./reader.css"
import {ScrollWatcher} from "./scroll/watcher"

class Reader extends Component {
  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)

    this.state = {showMenu: false, debugLevel: 0}
  }

  componentDidMount() {
    // document.addEventListener("click", this._handleDocumentClick, false)
    document.addEventListener("keydown", this.onKeyDown)
  }

  componentWillUnmount() {
    // document.removeEventListener("click", this._handleDocumentClick, false)
    document.removeEventListener("keydown", this.onKeyDown)
  }

  onKeyDown(e) {
    if (e.keyCode === 27) { // escape
      this.setState({showMenu: !this.state.showMenu})
    } else if (e.keyCode === 192) { // tilda / back-tick
      this.setState(prevState => ({debugLevel: (prevState.debugLevel + 1) % 3}))
    }
  }

  render() {
    return <Provider value={this.state.debugLevel}>
      <ScrollWatcher>
        <Animation/>

        <Menu visible={this.state.showMenu}/>

        <div className="text-area">
          <div className="text">
            <ScriptLoader storage={this.props.match.params.script + ".ks"}/>
            {/*// プロローグ1日目.ks プロローグ.ks first.ks*/}
          </div>
        </div>
      </ScrollWatcher>
    </Provider>
  }
}

Reader = withRouter(Reader)
export default Reader
