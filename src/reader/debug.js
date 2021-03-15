import React from "react"

const {Provider, Consumer} = React.createContext({debugLevel: 0})

const withDebug = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} debug={value}/>}
    </Consumer>
  )
)

export {Provider, withDebug}
