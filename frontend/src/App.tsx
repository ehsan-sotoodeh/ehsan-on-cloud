import { Authenticator } from "@aws-amplify/ui-react";

import "bootstrap/dist/css/bootstrap.min.css";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";

import TODOList from "./components/TodoList";
import AskAI from "./components/AskAI";

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <div className="container mt-4">
            <h2>Welcome, {user?.username}</h2>
            <button className="btn btn-danger" onClick={signOut}>
              Sign Out
            </button>
          </div>
          <TODOList />

          <hr />
          <AskAI />
          <br />
          <br />
          <br />
          <br />
        </>
      )}
    </Authenticator>
  );
}

export default App;
