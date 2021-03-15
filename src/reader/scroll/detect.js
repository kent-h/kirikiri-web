import React, {Component} from "react"
import {InView} from "react-intersection-observer"
import {withScrollDetect} from "./watcher"

class ScrollDetect extends Component {
  constructor(props) {
    super(props)

    this.state = {visible: false}
  }

  render() {
    // the <InView/> listener lags if there are too many enabled at one time
    // to fix this, only enable listeners that are close to the currently scrolled-to part of the page
    // we do this by only enabling multiples-of-2^n listeners, which are <= 2^n listeners away from the current one
    let makeActive = false
    for (let mul = 1; mul <= Math.max(this.props.id, this.props.scroll.id); mul *= 4) {
      if (this.props.id % mul === 0) {
        if (Math.abs(this.props.scroll.id - this.props.id) <= mul) {
          makeActive = true
          break
        }
      }
    }

    return <InView as="div"
                   style={{height: this.props.id === 1 ? "33vh" : "67vh"}}
                   children={undefined}
                   rootMargin="10000000% 0px -100% 0px"
                   threshold={0}
                   skip={!makeActive}
                   onChange={(inView, entry) => {
                     this.props.scroll.onSectionChange(this.props.id, inView, this.props.timeline, this.props.bgmTimeline, this.props.seTimeline)
                     this.setState({visible: inView})
                   }}/>
  }
}

ScrollDetect = withScrollDetect(ScrollDetect)
export default ScrollDetect
