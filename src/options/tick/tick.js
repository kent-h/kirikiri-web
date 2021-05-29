import React from "react"
import "./tick.css"

const Tick = (props) =>
  <svg className="tick" viewBox="0 0 98 102" xmlns="http://www.w3.org/2000/svg" onClick={props.onClick}>
    <path d="M73.5 2L93.6 70.7L2 97.3Z"/>
    <path d="M0 0L0 100L75 0Z"/>
    <path d="M75 0L96 72L0 100"/>
  </svg>

export default Tick
