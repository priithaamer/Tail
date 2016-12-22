const {ipcRenderer} = require('electron');

const log = document.querySelector('.log');

function addLine(line) {
  const row = document.createElement('div');
  row.innerHTML = line;
  log.appendChild(row);

  row.scrollIntoView();
}

ipcRenderer.on('line', (event, line) => {
  addLine(line);
});

ipcRenderer.on('clear', () => {
  log.innerHTML = '';
});

ipcRenderer.on('fade', () => {
  Array.from(document.querySelectorAll('.log > div')).forEach(item => {
    item.classList.add('fade');
  });
});
