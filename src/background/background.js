import React, {Component} from "react"

const {Provider, Consumer} = React.createContext(undefined)

class Background extends Component {
  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)

    this.visible = {}
    this.state = {visible: 0}
  }

  onChange(id, visible) {
    if (visible) {
      this.visible[id] = id
    } else {
      delete this.visible[id]
    }
    this.setState(() => ({visible: Object.keys(this.visible).reduce((a, b) => (a > this.visible[b] ? a : this.visible[b]), 0)}))
  }

  render() {
    return <Provider value={{onChange: this.onChange, currentID: this.state.visible}}>
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible}</div>
      {this.props.children}
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