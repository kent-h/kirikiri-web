import React, {Component} from "react"
import ImageLayer from "./animation/image-layer"
import "./background.css"

const {Provider, Consumer} = React.createContext(undefined)

class Background extends Component {
  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)

    this.visible = {}
    this.state = {visible: {id: 0}}
  }

  onChange(id, image, visible, layers) {
    if (visible) {
      this.visible[id] = {id, image, layers}
    } else {
      delete this.visible[id]
    }
    this.setState(() => ({visible: Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0})}))
  }

  render() {
    console.log(this.state.visible.layers)
    return <Provider value={{onChange: this.onChange, currentID: this.state.visible.id}}>
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible.id}</div>

      <div className="large-background-holder-left">
        <div className="background-margin-hack background-blur">
          {this.state.visible.id !== 0 &&
          <img className="background-image" src={this.state.visible.image} alt=""/>}
        </div>
      </div>

      <div className="large-background-holder-right">
        <div className="background-margin-hack background-blur">
          {this.state.visible.id !== 0 &&
          <img className="background-image" src={this.state.visible.image} alt=""/>}
        </div>
      </div>

      <div className="large-background-holder-bottom">
        <div className="background-margin-hack background-blur">
          {this.state.visible.id !== 0 &&
          <img className="background-image" src={this.state.visible.image} alt=""/>}
        </div>
      </div>


      <div className="background-holder">
        <div className="background-margin-hack">
          <div className="background-image-holder">
            {this.state.visible.id !== 0 && Object.keys(this.state.visible.layers).map(layerID => {
              const layer = this.state.visible.layers[layerID]
              return <ImageLayer key={layerID + " " + this.state.visible.id}
                                 layer={layerID}
                                 visibleID={this.state.visible.id}
                                 animation={layer}/>
            })}
          </div>
        </div>
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