import React, {Component} from "react"

class ImageLayer extends Component {
  constructor(props) {
    super(props)

  }

  render() {
    return <img className="background-image"
                src={"static/game/" + this.props.folder + this.props.image + ".png"}
                style={{top: (this.props.animation[0].top / 6) + "%", left: (this.props.animation[0].left / 8) + "%"}}
                alt=""/>
  }
}

export default ImageLayer