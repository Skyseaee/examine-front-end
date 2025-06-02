import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ component: Component, requiredPrivilege, ...rest }) => {
  const { user } = useAuth();

  return (
    <Route
      {...rest}
      render={props =>
        user ? (
          user.privilege >= requiredPrivilege ? (
            <Component {...props} />
          ) : (
            <Redirect to="/login" />
          )
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default PrivateRoute;