const status = document.getElementById('status');
const shootBtn = document.getElementById('shoot');
const video = document.getElementById('video');

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
  status.innerText = 'Нет токена';
  shootBtn.disabled = true;
} else {
  init();
}

async function init() {
  await startCamera();
  await loadLimit();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
  } catch (err) {
    status.innerText = 'Нет доступа к камере';
    console.error(err);
  }
}

async function loadLimit() {
  const res = await fetch(`http://localhost:3001/limit?token=${token}`);
  const data = await res.json();

  status.innerText = `Осталось фото: ${data.remaining}`;

  if (data.remaining <= 0) {
    shootBtn.disabled = true;
    shootBtn.innerText = 'Плёнка закончилась';
  }
}

shootBtn.addEventListener('click', async () => {
    // 1. Делаем snapshot
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
  
    // 2. Останавливаем камеру
    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
  
    video.style.display = 'none';
    canvas.style.display = 'block';
  
    // 3. Уменьшаем лимит на бэке
    const res = await fetch('http://localhost:3001/shoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  
    const data = await res.json();
  
    // 4. Обновляем счётчик
    status.innerText = `Осталось фото: ${data.remaining}`;
  
    // 5. Блокируем кнопку, если плёнка закончилась
    if (data.remaining <= 0) {
      shootBtn.disabled = true;
      shootBtn.innerText = 'Плёнка закончилась';
    } else {
      shootBtn.disabled = true; // пока одна фотка = одна попытка
    }
  });
  
  
