import React, {Component} from "react"
import "../reader.css"

const {Provider, Consumer} = React.createContext({id: 0})

class ScrollWatcher extends Component {
  constructor(props) {
    super(props)
    this.onSectionVisibilityChange = this.onSectionVisibilityChange.bind(this)

    this.visible = {}
    this.state = {visible: {id: 0}}
  }

  onSectionVisibilityChange(id, visible, timeline, bgmTimeline, seTimeline) {
    if (!!this.visible[id] === visible) {
      return // exit early if there is no change
    }

    if (visible) {
      this.visible[id] = {id, timeline, bgmTimeline, seTimeline}
    } else {
      delete this.visible[id]
    }
    // try to only run setState once
    clearTimeout(this.time)
    this.time = setTimeout(() => this.setState(() => ({visible: Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0})})), 1)
  }

  render() {
    console.log(this.state.visible.timeline, this.state.visible.bgmTimeline, this.state.visible.seTimeline)

    return <Provider value={Object.assign({onSectionChange: this.onSectionVisibilityChange}, this.state.visible)}>
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible.id}</div>

      {this.props.children}
    </Provider>
  }
}

const withScrollDetect = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} scroll={value}/>}
    </Consumer>
  )
)

const withScroll = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} animation={value}/>}
    </Consumer>
  )
)

export {ScrollWatcher, withScrollDetect, withScroll}
