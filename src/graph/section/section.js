import React, {Component} from "react"
import {Link, withRouter} from "react-router-dom"
import {withOptions} from "../../reader/debug"
import {scripts} from "../../resources/generated/scene-index"
import {IDToPath} from "../../resources/lookup"
import "./section.css"

class Section extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.hoveredNext !== this.props.hoveredNext || nextProps.hoveredPrev !== this.props.hoveredPrev || nextProps.options.debugLevel !== this.props.options.debugLevel
  }

  render() {
    const addArray = (array, direction) => array.map((elem, elemIndex) => {
      if (elem.id) {
        return <Link key={elemIndex}
                     className="graph-item"
                     style={this.props.options.debugLevel ? {backgroundColor: scripts[elem.id] ? undefined : "red"} : {}}
                     to={"/" + (scripts[elem.id] ? IDToPath(elem.id, this.props.options.lang) : elem.id)}
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
