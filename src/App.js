import React from 'react';
import { Switch, Route } from 'react-router-dom';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/Login';
import FirstRoundReview from './pages/FirstRoundReview';
import SecondRoundReview from './pages/SecondRoundReview';
import FinalReview from './pages/FinalReview';

const App = () => (
  <Switch>
    <Route path="/login" component={Login} />
    <PrivateRoute exact path="/" component={FirstRoundReview} requiredPrivilege={2} />
    <PrivateRoute path="/second-review" component={SecondRoundReview} requiredPrivilege={3} />
    <PrivateRoute path="/final-review" component={FinalReview} requiredPrivilege={4} />
  </Switch>
);

export default App;