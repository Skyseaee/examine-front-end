import { Switch, Route } from 'react-router-dom'
import Login from './pages/Login'
import HomePage from './pages/HomePage'
import FirstRoundReview from './pages/FirstRoundReview'
import SecondRoundReview from './pages/SecondRoundReview'
import FinalReview from './pages/FinalReview'
import AdminExerciseManagement from './pages/AdminExerciseManagement'
import PrivateRoute from './utils/PrivateRoute'

function App() {
  return (
    <Switch>
      <Route exact path="/login" component={Login} />
      <PrivateRoute exact path="/" component={FirstRoundReview} />
      <PrivateRoute path="/second-review" component={SecondRoundReview} />
      <PrivateRoute path="/final-review" component={FinalReview} />
      <PrivateRoute path="/admin/exercises" component={AdminExerciseManagement} />
    </Switch>
  )
}

export default App