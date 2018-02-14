chrome.storage.local.get('accessToken', ({ accessToken }) => {
  if (accessToken) {
    login(accessToken);
  } else {
    buildLoginForm();
  }
});


/* popup content functions */

function buildLoginForm() {
  const div = document.createElement('div');
  div.textContent = 'Access Token:';

  const input = document.createElement('input');
  const button = document.createElement('button');
  button.textContent = 'Login';
  button.addEventListener('click', () => {
    login(input.value);
  });

  document.body.innerHTML = '';
  document.body.appendChild(div);
  document.body.appendChild(input);
  document.body.appendChild(button);
}

function buildMainContent() {
  const button = document.createElement('button');
  button.textContent = 'Logout';
  button.addEventListener('click', logout);

  document.body.innerHTML = '';
  document.body.appendChild(button);
}

function login(accessToken) {
  setupRequest('https://app.gitkraken.com/api/glo/users/validate')
    .post({ auth_token: accessToken })
    .then(() => {
      chrome.storage.local.set({ accessToken }, buildMainContent);
    })
    .catch(logout);
}

function logout() {
  chrome.storage.local.remove('accessToken', buildLoginForm);
}


/* request helpers */

function setupRequest(url) {
  return {
    get: () => sendRequest('GET', url),
    post: (data) => sendRequest('POST', url, data)
  }
}

function sendRequest(method = 'GET', url = '', data = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.addEventListener('load', (event) => {
      const response = JSON.parse(event.target.response);
      if (event.target.status === 200) {
        resolve(response);
      } else {
        reject(response);
      }
    });

    request.open(method, url);

    if (method === 'POST') {
      request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      request.send(JSON.stringify(data));
    } else {
      request.send();
    }
  });
}
