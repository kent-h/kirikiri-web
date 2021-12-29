import React, {Fragment} from "react"
import "./tag.css"

const Tag = props => {
  const args = props.command.args || {}
  const oArgs = props.command.originalArgs || args
  const parameters = []
  const add = (Component) => {
    parameters.push(<Fragment key={parameters.length + 1}>{Component}</Fragment>)
  }
  Object.keys(oArgs).forEach(key => {
    if (key === "*") {
      add(" *")
    } else {
      add(" " + key + "=")
      const val = args[key]
      const oVal = oArgs[key]
      if (val !== undefined && oVal !== undefined && val !== oVal) {
        add(
          <div className="tag-block-inline-pin">
            <div className="tag-block-inline-size-limiter">
              <div className="tag-block-inline">
                <span className="tag-original">{oVal}</span>
              </div>
            </div>
          </div>)
        add(<span className="tag-changed">{val}</span>)
      } else if (val !== undefined) {
        add(val)
      } else if (oVal !== undefined) {
        add(<span className="tag-unresolved">{oVal}</span>)
      }
    }
  })

  const extraParams = []
  Object.keys(args || {}).forEach(key => {
    if (!oArgs.hasOwnProperty(key)) {
      extraParams.push(<Fragment key={extraParams.length + 1}>{" " + key + "=" + args[key]}</Fragment>)
    }
  })
  add(<span className="tag-extra">{extraParams}</span>)

  return <div className="tag" style={{color: props.color, marginLeft: (props.command.depth || 0) + "em"}}>
    {props.command.type + (props.command.command || props.command.id)}
    {parameters}
    {props.command.type === "[" && "]"}
  </div>
}
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
    <div className="tag-block-inline-size-limiter tag-block-inline-marker">
      <div className="tag-block-inline">
        {props.tags.map((tag, index) => (
          <Fragment key={index + 1}>{tag}</Fragment>
        ))}
      </div>
    </div>
  </div>)

export {Tag, TagBlock, TagBlockInline}
