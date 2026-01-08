
let currentFacingMode = 'user'; // 'user' = фронтальная, 'environment' = задняя
let stream;

const status = document.getElementById('status');
const shootBtn = document.getElementById('shoot');
const video = document.getElementById('video');

const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const API_BASE = 'https://surprised-tools-bucks-mambo.trycloudflare.com';

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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentFacingMode
      }
    });
  
    video.srcObject = stream;
    if (currentFacingMode === 'user') {
        video.style.transform = 'scaleX(-1)';
      } else {
        video.style.transform = 'none';
      }
  
    await new Promise(resolve => {
      video.onloadedmetadata = () => resolve();
    });
  }

  // обработка внопки смены камеры фронт и бэк
  document.getElementById('flip').onclick = () => {
    currentFacingMode =
      currentFacingMode === 'user' ? 'environment' : 'user';
    startCamera();
  };
  

async function loadLimit() {
    const res = await fetch(`${API_BASE}/limit?token=${token}`);
  const data = await res.json();

  status.innerText = `Осталось фото: ${data.remaining}`;

  if (data.remaining <= 0) {
    shootBtn.disabled = true;
    shootBtn.innerText = 'Плёнка закончилась';
  }
}
// ДЕЛАЕМ ОРАБОТКУ
function applyPolaroidEffect(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
  
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
  
      // 🧼 Lift shadows (молочные)
      r += (255 - r) * 0.12;
      g += (255 - g) * 0.12;
      b += (255 - b) * 0.12;
  
      // ❄️ Холодный баланс
      r *= 0.98;
      g *= 1.0;
      b *= 1.03;
  
      // 📉 Убрать цифровой контраст
      const avg = (r + g + b) / 3;
      r = r * 0.9 + avg * 0.1;
      g = g * 0.9 + avg * 0.1;
      b = b * 0.9 + avg * 0.1;
  
      // 🎞 Очень тонкое зерно
      const grain = (Math.random() - 0.5) * 3;
      r += grain;
      g += grain;
      b += grain;
  
      d[i]     = Math.min(255, Math.max(0, r));
      d[i + 1] = Math.min(255, Math.max(0, g));
      d[i + 2] = Math.min(255, Math.max(0, b));
    }
  
    ctx.putImageData(imageData, 0, 0);
  }
  
  function drawPolaroidFrame(canvas) {
    const ctx = canvas.getContext('2d');
  
    const frameTop = 40;
    const frameSide = 40;
    const frameBottom = 110;
  
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width + frameSide * 2;
    newCanvas.height = canvas.height + frameTop + frameBottom;
  
    const newCtx = newCanvas.getContext('2d');
  
    // 🧻 Белая рамка
    newCtx.fillStyle = '#f8f8f6';
    newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  
    

    // 📸 Фото
    newCtx.drawImage(
      canvas,
      frameSide,
      frameTop,
      canvas.width,
      canvas.height
    );
  
    return newCanvas;
  }
  
  
//ОБРАБОТЧИК КНОПКИ
shootBtn.addEventListener('click', async () => {
    // 1. блокируем кнопку
    shootBtn.disabled = true;
  
    const overlay = document.getElementById('overlay');
    const shutter = document.getElementById('shutter');
    const canvas = document.getElementById('canvas');
    const result = document.getElementById('result');
  
    // 2. показываем "Проявляется…"
    overlay.style.display = 'flex';
  
    // 3. небольшая задержка перед снимком
    await new Promise(resolve => setTimeout(resolve, 1200));
  
    // 4. звук затвора
    try {
      shutter.currentTime = 0;
      await shutter.play();
    } catch (e) {
      // iOS может молча запретить звук — это нормально
    }
  
    // 5. определяем размеры (iPhone-safe)
    const width = video.videoWidth || window.innerWidth;
    const height = video.videoHeight || window.innerHeight;
  
    canvas.width = width;
    canvas.height = height;
  
    // 6. делаем снимок
    const ctx = canvas.getContext('2d');
    if (currentFacingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
    ctx.drawImage(video, 0, 0, width, height);
  
    // 7. применяем эффект
    applyPolaroidEffect(canvas);
  
    // 8. делаем рамку
    const framedCanvas = drawPolaroidFrame(canvas);
  
    // 9. показываем результат (ВАЖНО: ДО остановки камеры)
   // показываем результат
    result.style.display = 'flex';
    result.innerHTML = '';
    result.appendChild(framedCanvas);
  
    // 10. аккуратно выключаем камеру
    video.style.display = 'none';
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

  
    // 11. уменьшаем лимит (не блокируем UI)
    try {
      const res = await fetch(`${API_BASE}/shoot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
  
      const data = await res.json();
      status.innerText = `Осталось фото: ${data.remaining}`;
    } catch (e) {
      console.error('Ошибка при уменьшении лимита', e);
    }
  
    // 12. убираем overlay
    overlay.style.display = 'none';
  });
  
  

  
 
