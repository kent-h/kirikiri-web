import React from "react"
import "./tag.css"

const Tag = props => (
  <div className="tag" style={{color: props.color, marginLeft: (props.command.depth || 0) + "em"}}>
    {(props.command.type) + props.command.command}
    {Object.keys(props.command.args).map(key => key === "*" ? " *" : " " + key + "=" + props.command.args[key]).join("")}
    {props.command.type === "[" && "]"}
  </div>)
// null)

export default Tag