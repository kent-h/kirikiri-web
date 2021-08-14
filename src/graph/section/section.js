import React, {Component} from "react"
import {Link, withRouter} from "react-router-dom"
import {withOptions} from "../../reader/debug"
import {scripts} from "../../resources/generated/scene-index"
import "./section.css"

const idToPath = (id, lang) => {
  const match = /^(.)(\d*)-(\d*)/.exec(id)
  if (match) {
    const route = {
      "eng": {
        "プ": "prologue",
        "セ": "saber",
        "凛": "rin",
        "桜": "sakura",
      },
      "jp": {
        "プ": "プロローグ",
        "セ": "セイバ",
        "凛": "凛",
        "桜": "桜",
      },
    }[lang][match[1]]
    return route + "/" + (match[2] ? match[2] + (lang === "eng" ? ({
      "1": "st",
      "2": "nd",
      "3": "rd",
    }[match[2]] || "th") + "-day/" : "日目/") : "") + match[3]
  }
}

class Section extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.hoveredNext !== this.props.hoveredNext || nextProps.hoveredPrev !== this.props.hoveredPrev
  }

  render() {
    const addArray = (array, direction) => array.map((elem, elemIndex) => {
      if (elem.id) {
        return <Link key={elemIndex}
                     className="graph-item"
                     to={"/" + (scripts[elem.id] ? idToPath(elem.id, this.props.options.lang) : elem.id)}
                     ref={this.props.refs[elem.id]}
                     hovered={this.props.hovered === elem.id ? "" : undefined}
                     next={this.props.hoveredNext[elem.id] ? "" : undefined}
                     prev={this.props.hoveredPrev[elem.id] ? "" : undefined}
                     onMouseOver={() => this.props.onMouseOver(elem.id)}
                     onMouseOut={this.props.onMouseOut}>
          {elem.eng}
        </Link>
      } else if (elem.v) {
        return <div className="section-vertical">
          {addArray(elem.v, "v")}
        </div>
      } else if (elem.h) {
        return <div className="section-horizontal">
          {addArray(elem.h, "h")}
        </div>
      } else {
        throw new Error("unexpected element:" + elem)
      }
    })

    return addArray(this.props.section.v)
  }
}

Section = withOptions(withRouter(Section))
export default Section
