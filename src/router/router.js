import React from "react"
import {BrowserRouter as Router, Route, Switch} from "react-router-dom"
import Home from "../graph/graph"
import Reader from "../reader/reader"

const Index = (props) => (
  <Router>
    <Switch>
      <Route exact path="/">
        <Home/>
      </Route>
      <Route path={["/:script/:save", "/:script"]}>
        <Reader/>
      </Route>
    </Switch>
  </Router>
)

export default Index
