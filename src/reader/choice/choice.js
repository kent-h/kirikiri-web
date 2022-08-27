import React from "react"
import {Link} from "react-router-dom"
import {graphLogic} from "../../resources/generated/scene-index"
import {IDToPath} from "../../resources/lookup"
import {withOptions} from "../debug"
import "./choice.css"

const hRegex = /^[^-]+-1\d\d$/

const Choice = props => {
  if (!props.scriptID) {
    return undefined
  }

  const node = (graphLogic[props.scriptID] || {})

  const renderLogic = (logic, text) => {
    text = text || ""
    if (logic.choices) {
      return logic.choices.map(choice =>
        renderLogic(choice.then, (props.options.debugLevel && text ? text + " > " : "") + (props.options.lang === "eng" ? choice.eng : choice.jp)),
      )
    } else if (logic.conditions) {
      return <div>
        {logic.conditions.map(condition =>
          renderLogic(condition.then, text + (text && props.options.debugLevel ? " > " : "") + (props.options.debugLevel ? (condition.if || "else") : "")),
        )}
      </div>
    } else if (logic.goto) {
      return (!hRegex.test(logic.goto) || !!props.options.h) &&
        <div style={{marginTop: "2em"}}>
          <Link to={"/" + IDToPath(logic.goto, props.options.lang)}>
            <button className="choice-button">{text || (props.options.lang === "eng" ? "Continue" : "次へ")}</button>
          </Link>
        </div>
    }
  }

  return <div className="choice-block">
    {renderLogic(node)}
  </div>
}

export default withOptions(Choice)
