chrome.storage.local.get('accessToken', ({ accessToken }) => {
  if (accessToken) {
    buildMainContent();
  } else {
    buildLoginForm();
  }
});


/* popup content functions */

function buildLoginForm() {
  const emailDiv = document.createElement('div');
  emailDiv.textContent = 'Email:';
  const passwordDiv = document.createElement('div');
  passwordDiv.textContent = 'Passowrd:';

  const emailInput = document.createElement('input');
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';

  const submitButton = document.createElement('button');

  submitButton.textContent = 'Login';
  submitButton.addEventListener('click', () => {
    login(emailInput.value, passwordInput.value)
      .then(buildMainContent)
      .then(() => {
        chrome.runtime.getBackgroundPage((page) => {
          page.setupNotificationPolling();
        });
      });
  });

  document.body.innerHTML = '';
  document.body.appendChild(emailDiv);
  document.body.appendChild(emailInput);
  document.body.appendChild(passwordDiv);
  document.body.appendChild(passwordInput);
  document.body.appendChild(submitButton);
}

function buildMainContent() {
  chrome.storage.local.get('email', ({ email }) => {
    const div = document.createElement('div');
    div.textContent = email;

    const button = document.createElement('button');
    button.textContent = 'Logout';
    button.addEventListener('click', () => {
      logout()
        .then(buildLoginForm);
    });

    const notificationsDiv = document.createElement('div');
    notificationsDiv.style.maxHeight = '200px';

    document.body.innerHTML = '';
    document.body.appendChild(div);
    document.body.appendChild(button);
    document.body.appendChild(notificationsDiv);

    getUnseenNotifications()
      .then((notifications) => {
        notifications.forEach((notification) => {
          const { event, data } = notification;
          const notificationDiv = document.createElement('div');
          notificationDiv.style.padding = '5px';
          notificationDiv.style.borderTop = '1px solid #ddd';

          switch(event) {
            case 'card-added':
              notificationDiv.textContent = `${data.user.name} created card "${data.card.name}"`;
              break;
            case 'card-member-added':
              notificationDiv.textContent = `${data.user.name} assigned ${data.members[0].name} to card "${data.card.name}"`;
              break;
            case 'card-moved-column':
              notificationDiv.textContent = `${data.user.name} moved card "${data.card.name}" to column "${data.column.name}"`;
              break;
            case 'card-updated-description':
              notificationDiv.textContent = `${data.user.name} updated descripton on card "${data.card.name}"`;
              break;
            default:
              notificationDiv.textContent = event;
              notificationDiv.style.color = 'red';
              break;
          }

          notificationsDiv.appendChild(notificationDiv);
        });
      });
  });
}
