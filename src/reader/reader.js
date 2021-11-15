import React, {Component} from "react"
import {withRouter} from "react-router"
import ScriptLoader from "../interpreter/script-loader"
import Links from "../home/links/links"
import {scripts} from "../resources/generated/scene-index"
import {PathToID} from "../resources/lookup"
import Animation from "./animation/animation"
import Choice from "./choice/choice"
import {withOptions} from "./debug"
import "./reader.css"
import {ScrollWatcher} from "./scroll/watcher"

class Reader extends Component {
  constructor(props) {
    super(props)

    this.state = {ready: false}
  }

  render() {
    const options = this.props.options
    return (
      <ScrollWatcher key={options.lang}
                     isOnTop={!options.showMenu && options.canAutoplay}>
        <Animation freezeFrame={!options.canAutoplay}/>

        <div className="text-area" hide={!options.canAutoplay ? "" : undefined}>
          {options.tick}
          <div className="text text-shadow resizable-text">
            <ScriptLoader storage={this.props.match.params.script || scripts[PathToID(this.props.match.params)]}
                          onPageReady={() => this.setState({ready: true})}/>
            {this.state.ready && <Choice scriptID={PathToID(this.props.match.params)}/>}
          </div>
        </div>

        <div className="click-to-start resizable-text"
             hide={options.canAutoplay ? "" : undefined}
             onClick={options.setAutoplay}>
          <Links/>
          <div>
            <div>Click to start</div>
            Press &lt;ESC&gt; to adjust settings
          </div>
          <div>
            <div>Tap to start</div>
            Press tick to adjust settings
          </div>
        </div>
      </ScrollWatcher>
    )
  }
}

Reader = withOptions(withRouter(Reader))
export default Reader
