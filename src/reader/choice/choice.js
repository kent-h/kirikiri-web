import React, {Component} from "react"
import {Link} from "react-router-dom"
import {graphLogic} from "../../resources/generated/scene-index"
import {IDToPath} from "../../resources/lookup"
import {withOptions} from "../debug"
import "./choice.css"


class Choice extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    if (!this.props.scriptID) {
      return undefined
    }

    const node = (graphLogic[this.props.scriptID] || {})

    const renderLogic = (logic, text) => {
      text = text || ""
      if (logic.choices) {
        return logic.choices.map(choice =>
          renderLogic(choice.then, (this.props.options.debugLevel && text ? text + " > " : "") + choice.eng),
        )
      } else if (logic.conditions) {
        return <div>
          {logic.conditions.map(condition =>
            renderLogic(condition.then, text + (text && this.props.options.debugLevel ? " > " : "") + (this.props.options.debugLevel ? (condition.if || "else") : "")),
          )}
        </div>
      } else if (logic.goto) {
        return <div style={{marginTop: "2em"}}>
          <Link to={"/" + IDToPath(logic.goto, this.props.options.lang)}>
            <button className="choice-button">{text || "Continue"}</button>
          </Link>
        </div>
      }
    }

    return <div className="choice-block">
      {renderLogic(node)}
    </div>
  }
}

Choice = withOptions(Choice)
export default Choice
