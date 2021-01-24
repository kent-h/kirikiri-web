import React, {Component} from "react"
import Animation from "./animation/animation"
import "./background.css"

const {Provider, Consumer} = React.createContext(undefined)

class Background extends Component {
  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)

    this.visible = {}
    this.state = {visible: {id: 0}}
  }

  onChange(id, visible, animation, bgmTimeline, seTimeline) {
    if (!!this.visible[id] === visible) {
      return // exit early if there is no change
    }

    if (visible) {
      this.visible[id] = {id, animation, bgmTimeline, seTimeline}
    } else {
      delete this.visible[id]
    }
    // try to only run setState once
    clearTimeout(this.time)
    this.time = setTimeout(() => this.setState(() => ({visible: Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0})})), 1)
  }

  render() {
    console.log(this.state.visible.animation, this.state.visible.bgmTimeline, this.state.visible.seTimeline)

    return <Provider value={{onChange: this.onChange, currentID: this.state.visible.id}}>
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible.id}</div>

      <Animation animationID={this.state.visible.id}
                 animation={this.state.visible.animation}
                 bgmTimeline={this.state.visible.bgmTimeline}
                 seTimeline={this.state.visible.seTimeline}/>

      <div className="text-area">
        <div className="text">
          {this.props.children}
        </div>
      </div>
    </Provider>
  }
}

const withScrollDetect = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} visible={value}/>}
    </Consumer>
  )
)

export {Background, withScrollDetect}