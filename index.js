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
      action.data = action.data.replace(/Terminate batch job \(Y\/N\)\?.{2}/, "");
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
    return /Terminate batch job \(Y\/N\)\?[^\s]/g.test(data);
  }

  return /Terminate batch job \(Y\/N\)\?/g.test(data);
}