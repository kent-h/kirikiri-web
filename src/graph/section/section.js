import React, {Component} from "react"
import {Link, withRouter} from "react-router-dom"
import {scripts} from "../scene-index"
import "./section.css"

class Section extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.hoveredNext !== this.props.hoveredNext || nextProps.hoveredPrev !== this.props.hoveredPrev
  }

  render() {
    const addArray = (array, direction) => array.map((elem, elemIndex) => {
      if (elem.id) {
        return <Link key={elemIndex}
                     className="graph-item"
                     to={"/" + (scripts[elem.id] || elem.id)}
                     ref={this.props.refs[elem.id]}
                     hovered={this.props.hovered === elem.id ? "" : undefined}
                     next={this.props.hoveredNext[elem.id] ? "" : undefined}
                     prev={this.props.hoveredPrev[elem.id] ? "" : undefined}
                     onMouseOver={() => this.props.onMouseOver(elem.id)}
                     onMouseOut={this.props.onMouseOut}>{elem.eng}
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

Section = withRouter(Section)
export default Section
