import React from "react"
import "./navigation.css"

const Navigation = (props) => (
  <div className="graph-navigation">
    <div className="graph-navigation-panel" side="left" hide={props.pane <= 0 ? "" : undefined}
         onClick={props.onLeft}>
      <svg className="graph-navigation-arrow" viewBox="0 0 4 10" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 1L1 5L3 9"/>
      </svg>
    </div>
    <div className="graph-navigation-panel" side="right" hide={props.pane >= 2 ? "" : undefined}
         onClick={props.onRight}>
      <svg className="graph-navigation-arrow" viewBox="0 0 4 10" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L3 5L1 9"/>
      </svg>
    </div>
  </div>)

export default Navigation
