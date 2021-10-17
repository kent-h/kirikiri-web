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
    const borderLines = []
    const linesOnTop = []
    const borderLinesOnTop = []

    this.props.links.forEach((link, linkIndex) => {
      const startRef = this.props.positions[link.from]
      const endRef = this.props.positions[link.to]
      if (startRef && endRef && startRef.current && endRef.current) {
        const startRect = startRef.current.getBoundingClientRect()
        const endRect = endRef.current.getBoundingClientRect()
        const highlight = this.props.hovered === link.from || this.props.hovered === link.to

        const x1 = rx + startRect.left + startRect.width / 2
        const y1 = ry + startRect.bottom - 2
        const x2 = rx + endRect.left + endRect.width / 2
        const y2 = ry + endRect.top + 2

        const border = <line className="graph-svg-line" border=""
                             key={linkIndex + "bg"}
                             highlight={highlight ? "" : undefined}
                             x1={x1} y1={y1} x2={x2} y2={y2}/>
        const line = <line className="graph-svg-line"
                           key={linkIndex}
                           highlight={highlight ? "" : undefined}
                           x1={x1} y1={y1} x2={x2} y2={y2}/>
        if (highlight) {
          borderLinesOnTop.push(border)
          linesOnTop.push(line)
        } else {
          borderLines.push(border)
          lines.push(line)
        }
      }
    })

    return borderLines.concat(lines, borderLinesOnTop, linesOnTop)
  }
}

Section = withRouter(Section)
export default Section
