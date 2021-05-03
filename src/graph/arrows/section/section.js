import React, {Component} from "react"
import {withRouter} from "react-router-dom"

class Section extends Component {
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.updating !== false) {
      return false
    }
    return nextProps.hoveredNext !== this.props.hoveredNext || nextProps.hoveredPrev !== this.props.hoveredPrev || nextProps.updating !== this.props.updating
  }

  render() {
    const rx = -this.props.rRect.left
    const ry = -this.props.rRect.top

    const lines = []
    const linesOnTop = []

    this.props.links.forEach((link, linkIndex) => {
      const startRef = this.props.positions[link.from]
      const endRef = this.props.positions[link.to]
      if (startRef && endRef && startRef.current && endRef.current) {
        const startRect = startRef.current.getBoundingClientRect()
        const endRect = endRef.current.getBoundingClientRect()
        const highlight = this.props.hovered === link.from || this.props.hovered === link.to

        const line = <line className="graph-svg-line" fill="none" strokeWidth="2"
                           key={linkIndex}
                           highlight={highlight ? "" : undefined}
                           x1={rx + startRect.left + startRect.width / 2}
                           y1={ry + startRect.bottom}
                           x2={rx + endRect.left + endRect.width / 2}
                           y2={ry + endRect.top}/>
        if (highlight) {
          linesOnTop.push(line)
        } else {
          lines.push(line)
        }
      } else {
        // console.log(link)
      }
    })

    return lines.concat(linesOnTop)
  }
}

Section = withRouter(Section)
export default Section
