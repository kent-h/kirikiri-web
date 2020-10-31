import React, {Component} from "react"
import {InView} from "react-intersection-observer"
import {withScrollDetect} from "../../../background/background"

class ScrollDetect extends Component {
  constructor(props) {
    super(props)

    this.state = {visible: false}
  }

  render() {
    return <InView as="div"
                   rootMargin="-50% 0px 100000% 0px"
                   skip={Math.abs(this.props.visible.currentID - this.props.id) > 2}
                   onChange={(inView, entry) => {
                     this.props.visible.onChange(this.props.id, "static/game/" + this.props.folder + this.props.image + ".png", !inView)
                     this.setState({visible: inView})
                   }}>
      <div style={{border: this.state.visible ? "1px solid white" : "1px solid green"}}>
        {this.props.id} {this.props.alt}
      </div>
      {/*<img style={this.state.visible ? {border: "1px solid red", mixBlendMode: "lighten"} : {border: "1px solid green"}}*/}
      {/*     src={"game/" + this.props.folder + this.props.image + ".png"}*/}
      {/*     alt={this.props.alt}*/}
      {/*     title={this.props.alt}/>*/}
    </InView>
  }
}

ScrollDetect = withScrollDetect(ScrollDetect)
export default ScrollDetect