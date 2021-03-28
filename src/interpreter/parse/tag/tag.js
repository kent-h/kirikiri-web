import React, {Fragment} from "react"
import "./tag.css"

const Tag = props => (
  <div className="tag" style={{color: props.color, marginLeft: (props.command.depth || 0) + "em"}}>
    {props.command.type + (props.command.command || props.command.id)}
    {props.command.args && Object.keys(props.command.args).map(key => key === "*" ? " *" : " " + key + "=" + props.command.args[key]).join("")}
    {props.command.type === "[" && "]"}
  </div>)
// null)

const TagBlock = props => (
  <div className="tag-block-pin">
    <div className="tag-block-size-limiter">
      <div className="tag-block">
        {props.tags.map((tag, index) => (
          <Fragment key={index + 1}>{tag}</Fragment>
        ))}
      </div>
    </div>
  </div>)

const TagBlockInline = props => (
  <div className="tag-block-inline-pin">
    <div className="tag-block-inline-size-limiter">
      <div className="tag-block-inline">
        {props.tags.map((tag, index) => (
          <Fragment key={index + 1}>{tag}</Fragment>
        ))}
      </div>
    </div>
  </div>)

export {Tag, TagBlock, TagBlockInline}
