import React, {Component} from "react"
import {withRouter} from "react-router"
import {withDebug} from "../debug"
import "../reader.css"

const {Provider, Consumer} = React.createContext({id: 0})

class ScrollWatcher extends Component {
  lastScrollSection
  lastScrollTime

  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.addAnchor = this.addAnchor.bind(this)
    this.onSectionVisibilityChange = this.onSectionVisibilityChange.bind(this)

    this.savePointAtLoadTime = props.location.hash
    this.linkRefs = {}
    // to avoid unnecessary re-rendering, we will recreate the value for the provider only when the scrolled section changes
    this.includeCallbacks = { //
      onSectionChange: this.onSectionVisibilityChange,
      addAnchor: this.addAnchor,
    }
    this.visible = {}
    this.state = {visible: Object.assign({id: 0}, this.includeCallbacks)}
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.visible.id !== this.state.visible.id) {
      const section = this.linkRefs[this.state.visible.id + 1]
      const newURL = this.props.location.pathname + this.props.location.search + (section && section.savePoints.length !== 0 ? ("#" + section.savePoints[0]) : "")
      this.props.history.replace(newURL)
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown)
  }

  onKeyDown(e) {
    // forward: space w/o shift, enter w/o shift, down arrow, right arrow
    // backward: space w/ shift, enter w/ shift, up arrow, left arrow
    const moveDirection = (((e.keyCode === 32 || e.keyCode === 13) && !e.shiftKey) || e.keyCode === 40 || e.keyCode === 39) ? 1 :
      (((e.keyCode === 32 || e.keyCode === 13) && e.shiftKey) || e.keyCode === 38 || e.keyCode === 37) ? -1 : 0

    if (moveDirection !== 0) {
      e.preventDefault()
      if (this.state.visible) {
        const movedRecently = this.lastScrollTime && new Date() - this.lastScrollTime < 500
        let moveToSection = moveDirection + (movedRecently ? this.lastScrollSection : this.state.visible.id)
        let partialAdvance = false
        if (!movedRecently) {
          if (moveDirection > 0) { // if moving forwards, check to see if the current sections's text trails off the end of the screen
            const section = this.linkRefs[moveToSection]
            partialAdvance = section && section.ref.current && section.ref.current.node.getBoundingClientRect().top > window.innerHeight
          } else { // if moving backwards, check that the top is in sight
            const section = this.linkRefs[moveToSection + 1]
            moveToSection += section && section.ref.current && section.ref.current.node.getBoundingClientRect().bottom < 0 ? 1 : 0
          }
        }
        this.scrollTo(moveToSection, partialAdvance, true)
      }
    }
  }

  scrollTo(moveToSection, partialAdvance, smooth) {
    this.lastScrollTime = new Date()

    if (partialAdvance) {
      this.lastScrollSection = moveToSection - 1
      window.scrollBy({top: window.innerHeight * 0.66, behavior: smooth ? "smooth" : "auto"})
      return
    }

    const section = this.linkRefs[moveToSection]
    if (section && section.ref.current) {
      this.lastScrollSection = moveToSection
      const rect = section.ref.current.node.getBoundingClientRect()
      window.scrollTo({
        top: window.pageYOffset + rect.top + (moveToSection !== 1 ? rect.height / 2 : 0),
        behavior: smooth ? "smooth" : "auto",
      })
    }
    this.hasScrolled = true
  }

  addAnchor(id, ref, savePoints, isSaveOwner) {
    const section = {id, ref, savePoints}
    this.linkRefs[id] = section
    savePoints.forEach(savePoint => {
      this.linkRefs[savePoint] = section
    })

    if (!this.hasScrolled && isSaveOwner) {
      if (savePoints.some(savePoint => ("#" + savePoint === this.savePointAtLoadTime))) {
        this.scrollTo(id - 1, false, false)
      }
    }
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
    this.time = setTimeout(() => this.setState(() => ({
      visible: Object.assign({}, this.includeCallbacks, Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0})),
    })), 1)
  }

  render() {
    console.log(this.state.visible.timeline, this.state.visible.bgmTimeline, this.state.visible.seTimeline)
    return <Provider value={this.state.visible}>
      {this.props.debug !== 0 &&
      <div style={{position: "fixed", backgroundColor: "darkred"}}>{this.state.visible.id}</div>}

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

ScrollWatcher = withDebug(withRouter(ScrollWatcher))
export {ScrollWatcher, withScrollDetect, withScroll}
