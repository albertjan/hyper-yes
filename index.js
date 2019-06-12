const actionTerminations = require('./actionTerminations');
const answeredTerminations = require('./answeredTerminations');
const unansweredTerminations = require('./unansweredTerminations');

function sendSessionData(uid, data, escaped) {
  return (dispatch, getState) => {
    dispatch({
      type: 'SESSION_USER_DATA',
      data,
      effect() {
        // If no uid is passed, data is sent to the active session.
        const targetUid = uid || getState().sessions.activeUid;

        window.rpc.emit('data', {uid: targetUid, data, escaped});
      }
    });
  };
}

exports.middleware = (store) => (next) => (action) => {
  console.log(action.type);
  if (['SESSION_ADD_DATA', 'SESSION_USER_DATA', 'SESSION_PTY_DATA'].indexOf(action.type) >= 0) {
    console.log(action.type + ": " + action.data);
  }
  if ('SESSION_PTY_DATA' === action.type) {
    const { data } = action;
    if (detectTerminateBatchJob(data)) {
      if (detectTerminateBatchJob(data, true)) {
        sendSessionData(action.uid, 'y\r')(store.dispatch, store.getState);
      }
      // we don't even want to see the message!
      const regex = actionTerminations.find((item) => item.test(action.data));
      if (regex) {
        action.data.replace(regex, "");
      }
      next(action);
    } else {
      next(action);
    }
  } else {
    next(action);
  }
};

// This function performs regex matching on expected shell output for 'wow' being input
// at the command line. Currently it supports output from bash, zsh, fish, cmd and powershell.
function detectTerminateBatchJob(data, unanswered) {
  if (unanswered) {
    return !!unansweredTerminations.find((regex) => regex.test(data));;
  }

  return !!answeredTerminations.find((regex) => regex.test(data));
}
