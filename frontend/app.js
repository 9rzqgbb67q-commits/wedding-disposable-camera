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
    shootBtn.disabled = true;
  
    const overlay = document.getElementById('overlay');
    const shutter = document.getElementById('shutter');
  
    overlay.style.display = 'flex';
  
    // задержка перед снимком
    await new Promise(resolve => setTimeout(resolve, 1500));
  
    // звук
    shutter.currentTime = 0;
    shutter.play();
  
    // snapshot
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
  
    // стопаем камеру
    const stream = video.srcObject;
    stream.getTracks().forEach(track => track.stop());
  
    video.style.display = 'none';
    canvas.style.display = 'block';
  
    // уменьшаем лимит
    const res = await fetch('http://localhost:3001/shoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  
    const data = await res.json();
    status.innerText = `Осталось фото: ${data.remaining}`;
  
    // небольшая пауза "проявления"
    await new Promise(resolve => setTimeout(resolve, 800));
    overlay.style.display = 'none';
  
    if (data.remaining <= 0) {
      shootBtn.innerText = 'Плёнка закончилась';
    }
  });
  
  
