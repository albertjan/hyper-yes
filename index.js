// Our extension's custom redux middleware. Here we can intercept redux actions and respond to them.
exports.middleware = (store) => (next) => (action) => {
  // the redux `action` object contains a loose `type` string, the
  // 'SESSION_ADD_DATA' type identifier corresponds to an action in which
  // the terminal wants to output information to the GUI.
  if ('SESSION_ADD_DATA' === action.type) {

    // 'SESSION_ADD_DATA' actions hold the output text data in the `data` key.
    const { data } = action;
    if (detectTerminateBatchJob(data)) {
      store.dispatch('SESSION_USER_DATA', "y\n");
    } else {
      next(action);
    }
  } else {
    next(action);
  }
};

// This function performs regex matching on expected shell output for 'wow' being input
// at the command line. Currently it supports output from bash, zsh, fish, cmd and powershell.
function detectTerminateBatchJob(data) {
  const pattern = 'Terminate batch job \(Y/N\)\?';
  return new RegExp(pattern).test(data)
}