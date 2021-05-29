import React from "react"
import {withRouter} from "react-router"
import {scripts} from "../graph/scene-index"
import ScriptLoader from "../interpreter/script-loader"
import Animation from "./animation/animation"
import {withOptions} from "./debug"
import "./reader.css"
import {ScrollWatcher} from "./scroll/watcher"

const pathToID = (params) => {
  let r = {
    "prologue": "プ",
    "プロローグ": "プ",
    "saber": "セ",
    "セイバ": "セ",
    "rin": "凛",
    "凛": "凛",
    "sakura": "桜",
    "桜": "桜",
  }[params.route]
  const match = /^(\d+)\D*$/.exec(params.day)
  if (match) {
    r += match[1]
  }
  return r + "-" + params.chapter
}

let Reader = (props) =>
  <ScrollWatcher key={props.options.lang}
                 isOnTop={!props.options.showMenu && props.options.canAutoplay}>
    <Animation freezeFrame={!props.options.canAutoplay}/>

    <div className="text-area" hide={!props.options.canAutoplay ? "" : undefined}>
      {props.options.tick}
      <div className="text resizable-text">
        <ScriptLoader storage={props.match.params.script || scripts[pathToID(props.match.params)]}/>
      </div>
    </div>

    <div className="click-to-start resizable-text"
         hide={props.options.canAutoplay ? "" : undefined}
         onClick={props.options.setAutoplay}>
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

Reader = withOptions(withRouter(Reader))
export default Reader
