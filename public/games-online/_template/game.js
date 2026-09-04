// O'yin andozasi — shu fayldan boshlab yangi o'yin yozing.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bu yerda o\'yin boshlanadi', canvas.width / 2, canvas.height / 2);
  }

  draw();
})();
