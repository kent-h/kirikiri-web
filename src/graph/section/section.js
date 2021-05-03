import React, {Component} from "react"
import {withRouter} from "react-router-dom"
import "./section.css"

class Section extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.hoveredNext !== this.props.hoveredNext || nextProps.hoveredPrev !== this.props.hoveredPrev
  }

  render() {
    const addArray = (array, direction) => array.map((elem, elemIndex) => {
      if (elem.link) {
        return <div key={elemIndex}
                    className="graph-item"
                    ref={this.props.refs[elem.link]}
                    hovered={this.props.hovered === elem.link ? "" : undefined}
                    next={this.props.hoveredNext[elem.link] ? "" : undefined}
                    prev={this.props.hoveredPrev[elem.link] ? "" : undefined}
                    onMouseOver={() => this.props.onMouseOver(elem.link)}
                    onMouseOut={this.props.onMouseOut}
                    onClick={() => this.props.history.push("/" + elem.link)}>{elem.eng}</div>
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
