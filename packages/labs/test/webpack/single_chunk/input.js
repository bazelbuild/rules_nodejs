import('./strings').then(m => {const msg = document.createElement('span'); msg.innerText = m.hello(); document.body.appendChild(msg);});
