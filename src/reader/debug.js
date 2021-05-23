import React from "react"

const {Provider, Consumer} = React.createContext({debugLevel: 0})

const withOptions = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} options={value}/>}
    </Consumer>
  )
)

export {Provider, withOptions}
