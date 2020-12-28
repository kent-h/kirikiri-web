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

  onChange(id, visible, layers) {
    if (visible) {
      this.visible[id] = {id, layers}
    } else {
      delete this.visible[id]
    }
    this.setState(() => ({visible: Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0})}))
  }

  render() {
    console.log(this.state.visible.layers)

    return <Provider value={{onChange: this.onChange, currentID: this.state.visible.id}}>
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible.id}</div>

      <div className="large-background-holder-left background-blur">
        <Animation animationID={this.state.visible.id} animation={this.state.visible.layers}/>
      </div>

      <div className="large-background-holder-right background-blur">
        <Animation animationID={this.state.visible.id} animation={this.state.visible.layers}/>
      </div>

      <div className="large-background-holder-bottom background-blur">
        <Animation animationID={this.state.visible.id} animation={this.state.visible.layers}/>
      </div>

      <div className="background-holder">
        <Animation animationID={this.state.visible.id} animation={this.state.visible.layers}/>
      </div>

      <div className="text">
        {this.props.children}
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