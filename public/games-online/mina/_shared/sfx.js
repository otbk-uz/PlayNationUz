// UzIndieGame — umumiy ovoz/musiqa dvigateli (WebAudio, tashqi fayl/CDN'siz).
// Ishlatish: <script src="../_shared/sfx.js"></script> (game.js dan OLDIN).
//   SFX.resume()  — birinchi user gesture'da chaqir (masalan Boshlash tugmasi).
//   SFX.jump()/land()/coin()/hit()/win()/... — effektlar.
//   SFX.music('ritm')  — fon musiqasini boshlaydi;  SFX.music(null) — to'xtatadi.
// Susturish: ekrandagi #soundBtn tugmasi yoki 'M' tugmasi. localStorage'da saqlanadi.
(function () {
  if (window.SFX) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, musicBus = null, sfxBus = null, lp = null;
  var enabled = true;
  try { enabled = localStorage.getItem('uzig_sound') !== '0'; } catch (e) {}

  function ensure() {
    if (ctx || !AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = enabled ? 1 : 0; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.6;
      lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      musicBus.connect(lp); lp.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    } catch (e) { ctx = null; }
  }
  function resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }

  function voice(freq, dur, o) {
    ensure(); if (!ctx) return;
    o = o || {};
    var t = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + dur);
    var vol = o.vol == null ? 0.2 : o.vol, atk = o.atk == null ? 0.005 : o.atk;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.03);
  }
  function noise(dur, o) {
    ensure(); if (!ctx) return; o = o || {};
    var t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var g = ctx.createGain(); g.gain.value = o.vol == null ? 0.1 : o.vol;
    var f = ctx.createBiquadFilter(); f.type = o.hp ? 'highpass' : 'lowpass'; f.frequency.value = o.freq || (o.hp ? 1200 : 1800);
    src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t);
  }
  function seq(freqs, step, type, vol) {
    freqs.forEach(function (f, i) { setTimeout(function () { voice(f, step * 1.7, { type: type || 'triangle', vol: vol == null ? 0.16 : vol }); }, i * step * 1000); });
  }

  // ── musiqa sekvenseri (8-lik to'r) ──
  var mus = { timer: null, steps: null, tempo: 120, step: 0, next: 0 };
  function mstop() { if (mus.timer) { clearInterval(mus.timer); mus.timer = null; } mus.steps = null; }
  function mstart(name) {
    ensure(); if (!ctx) return; mstop();
    var d = THEMES[name]; if (!d) return;
    mus.steps = d.steps; mus.tempo = d.tempo; mus.step = 0; mus.next = ctx.currentTime + 0.12;
    mus.timer = setInterval(tick, 25);
  }
  function tick() {
    if (!ctx || !mus.steps) return;
    var eighth = (60 / mus.tempo) / 2, ahead = 0.14;
    while (mus.next < ctx.currentTime + ahead) {
      var s = mus.steps[mus.step % mus.steps.length];
      if (s) playStep(s, mus.next, eighth);
      mus.step++; mus.next += eighth;
    }
  }
  function playStep(s, at, eighth) {
    var arr = (s instanceof Array) ? s : [s];
    for (var k = 0; k < arr.length; k++) {
      var it = arr[k]; if (it == null) continue;
      var freq = (typeof it === 'number') ? it : it.f;
      var dur = (it.dur || 0.9) * eighth;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = (it.type) || 'triangle'; osc.frequency.setValueAtTime(freq, at);
      var vol = (it.vol == null ? 0.06 : it.vol);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g); g.connect(musicBus); osc.start(at); osc.stop(at + dur + 0.03);
    }
  }

  // Nota chastotalari (kalit)
  var N = { C3:130.8,D3:146.8,E3:164.8,F3:174.6,G3:196,Ab3:207.7,A3:220,Bb3:233,B3:246.9,
    C4:261.6,D4:293.7,Eb4:311.1,E4:329.6,F4:349.2,G4:392,Ab4:415.3,A4:440,Bb4:466.2,B4:493.9,
    C5:523.3,D5:587.3,Eb5:622.3,E5:659.3,F5:698.5,G5:784,A5:880 };
  var b = { type: 'triangle', vol: 0.055 };      // bass helper style
  // Har o'yin uchun qisqa halqa (8-lik qadamlar). null = jimlik.
  var THEMES = {
    // Ritm — haydovchi bass + arp (132 BPM, o'yin beat'iga mos)
    ritm: { tempo: 132, steps: [
      [{f:N.C3,type:'sawtooth',vol:0.05}, {f:N.C5,vol:0.045}], null, {f:N.G4,vol:0.04}, null,
      [{f:N.Ab4,type:'sawtooth',vol:0.045}], null, {f:N.Eb5,vol:0.04}, null,
      [{f:N.F3,type:'sawtooth',vol:0.05}, {f:N.C5,vol:0.045}], null, {f:N.Ab4,vol:0.04}, null,
      [{f:N.G3,type:'sawtooth',vol:0.05}, {f:N.D5,vol:0.045}], null, {f:N.B4,vol:0.04}, {f:N.D5,vol:0.035} ] },
    // Soya — sekin, sirli minor pad
    soya: { tempo: 74, steps: [
      {f:N.A3,type:'sine',vol:0.06,dur:3}, null, null, null, {f:N.E4,type:'sine',vol:0.045,dur:2}, null, null, null,
      {f:N.F3,type:'sine',vol:0.06,dur:3}, null, null, null, {f:N.C4,type:'sine',vol:0.045,dur:2}, null, {f:N.G4,type:'sine',vol:0.035}, null ] },
    // Oyna — yumshoq, tinch arpeggio
    oyna: { tempo: 96, steps: [
      {f:N.C4,vol:0.05}, null, {f:N.E4,vol:0.045}, null, {f:N.G4,vol:0.045}, null, {f:N.B4,vol:0.04}, null,
      {f:N.A3,vol:0.05}, null, {f:N.C4,vol:0.045}, null, {f:N.E4,vol:0.045}, null, {f:N.G4,vol:0.04}, null ] },
    // Bir Chiziq — sokin ambient pluck
    'bir-chiziq': { tempo: 84, steps: [
      {f:N.D4,vol:0.05}, null, null, {f:N.A4,vol:0.04}, null, {f:N.F4,vol:0.045}, null, null,
      {f:N.C4,vol:0.05}, null, null, {f:N.G4,vol:0.04}, null, {f:N.E4,vol:0.045}, null, null ] },
    // Muz — sovuq, tiniq ambient
    muz: { tempo: 80, steps: [
      {f:N.E4,type:'sine',vol:0.05,dur:2}, null, {f:N.B4,type:'sine',vol:0.04}, null, {f:N.G4,type:'sine',vol:0.045,dur:2}, null, null, null,
      {f:N.D4,type:'sine',vol:0.05,dur:2}, null, {f:N.A4,type:'sine',vol:0.04}, null, {f:N.E5,type:'sine',vol:0.035}, null, {f:N.B4,type:'sine',vol:0.035}, null ] },
    // Rang — o'ynoqi, yorqin
    rang: { tempo: 104, steps: [
      {f:N.C4,vol:0.05}, {f:N.E4,vol:0.04}, {f:N.G4,vol:0.045}, {f:N.E4,vol:0.04}, {f:N.A4,vol:0.045}, {f:N.G4,vol:0.04}, {f:N.E4,vol:0.04}, {f:N.C4,vol:0.04},
      {f:N.F4,vol:0.05}, {f:N.A4,vol:0.04}, {f:N.C5,vol:0.045}, {f:N.A4,vol:0.04}, {f:N.G4,vol:0.045}, {f:N.E4,vol:0.04}, {f:N.D4,vol:0.04}, {f:N.G4,vol:0.04} ] },
    // Qamal — taranglik, haydovchi
    qamal: { tempo: 126, steps: [
      [{f:N.A3,type:'sawtooth',vol:0.045}], null, {f:N.E4,vol:0.04}, null, [{f:N.A3,type:'sawtooth',vol:0.045}], {f:N.A4,vol:0.035}, {f:N.E4,vol:0.04}, null,
      [{f:N.F3,type:'sawtooth',vol:0.045}], null, {f:N.C4,vol:0.04}, null, [{f:N.G3,type:'sawtooth',vol:0.045}], {f:N.B4,vol:0.035}, {f:N.D4,vol:0.04}, null ] },
    // Mina — sokin, ehtiyotkor
    mina: { tempo: 72, steps: [
      {f:N.A3,type:'sine',vol:0.05,dur:2}, null, null, {f:N.C4,type:'sine',vol:0.04}, null, null, {f:N.E4,type:'sine',vol:0.04}, null,
      {f:N.G3,type:'sine',vol:0.05,dur:2}, null, null, {f:N.B3,type:'sine',vol:0.04}, null, {f:N.D4,type:'sine',vol:0.04}, null, null ] },
    // Tirik Naqsh — organik, tinch
    hayot: { tempo: 88, steps: [
      {f:N.D4,type:'sine',vol:0.05}, null, {f:N.F4,type:'sine',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.045}, null, {f:N.G4,type:'sine',vol:0.04}, null,
      {f:N.C4,type:'sine',vol:0.05}, null, {f:N.E4,type:'sine',vol:0.04}, null, {f:N.G4,type:'sine',vol:0.045}, null, {f:N.F4,type:'sine',vol:0.04}, null ] },
    // Zanjir Portlash — taranglik + portlash hissi
    'zanjir-portlash': { tempo: 112, steps: [
      [{f:N.C3,type:'sawtooth',vol:0.045}], null, {f:N.G4,vol:0.04}, null, {f:N.Eb5,vol:0.04}, null, {f:N.G4,vol:0.035}, null,
      [{f:N.Ab3,type:'sawtooth',vol:0.045}], null, {f:N.Eb5,vol:0.04}, null, {f:N.C5,vol:0.04}, null, {f:N.G4,vol:0.035}, null ] },
    // Vaznsiz To'p — kosmik, suzuvchi
    vaznsiz: { tempo: 70, steps: [
      {f:N.E4,type:'sine',vol:0.05,dur:3}, null, null, null, {f:N.B4,type:'sine',vol:0.04,dur:2}, null, null, null,
      {f:N.A4,type:'sine',vol:0.045,dur:3}, null, null, null, {f:N.E5,type:'sine',vol:0.035,dur:2}, null, {f:N.C5,type:'sine',vol:0.03}, null ] },
    // Soya Shakl — o'ychan, iliq
    'soya-shakl': { tempo: 92, steps: [
      {f:N.F4,vol:0.05}, null, {f:N.A4,vol:0.04}, null, {f:N.C5,vol:0.045}, null, {f:N.A4,vol:0.04}, null,
      {f:N.G4,vol:0.05}, null, {f:N.Bb4,vol:0.04}, null, {f:N.D5,vol:0.045}, null, {f:N.Bb4,vol:0.04}, null ] },
    // Rang Kimyosi — o'ynoqi, tomchili laboratoriya
    'rang-kimyo': { tempo: 100, steps: [
      {f:N.C4,type:'triangle',vol:0.05}, null, {f:N.G4,type:'triangle',vol:0.04}, null, {f:N.E4,type:'triangle',vol:0.045}, null, {f:N.B4,type:'triangle',vol:0.035}, null,
      {f:N.A3,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, null, {f:N.D4,type:'triangle',vol:0.045}, null, {f:N.G4,type:'triangle',vol:0.035}, null ] },
    // Soya Teatri — sirli, teatrona
    'soya-teatri': { tempo: 76, steps: [
      {f:N.D4,type:'sine',vol:0.05,dur:2}, null, null, {f:N.F4,type:'sine',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.04}, null, null,
      {f:N.Bb3,type:'sine',vol:0.05,dur:2}, null, {f:N.D4,type:'sine',vol:0.04}, null, {f:N.F4,type:'sine',vol:0.045}, null, {f:N.E4,type:'sine',vol:0.035}, null ] },
    // Aks-Nusxa — vaqt, pulsatsiya
    'aks-nusxa': { tempo: 96, steps: [
      [{f:N.A3,type:'triangle',vol:0.045}], null, {f:N.E4,type:'sine',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.04}, null, {f:N.E4,type:'sine',vol:0.035}, null,
      [{f:N.F3,type:'triangle',vol:0.045}], null, {f:N.C4,type:'sine',vol:0.04}, null, {f:N.G4,type:'sine',vol:0.04}, null, {f:N.C4,type:'sine',vol:0.035}, null ] },
    // Domino Reaksiya — o'ynoqi, sakrash
    domino: { tempo: 118, steps: [
      {f:N.C4,type:'square',vol:0.04}, null, {f:N.E4,type:'square',vol:0.04}, null, {f:N.G4,type:'square',vol:0.04}, null, {f:N.C5,type:'square',vol:0.035}, null,
      {f:N.A3,type:'square',vol:0.04}, null, {f:N.C4,type:'square',vol:0.04}, null, {f:N.F4,type:'square',vol:0.04}, null, {f:N.A4,type:'square',vol:0.035}, null ] },
    // Prizma — tiniq, kristall
    prizma: { tempo: 84, steps: [
      {f:N.E4,type:'sine',vol:0.05}, null, {f:N.G4,type:'sine',vol:0.04}, null, {f:N.B4,type:'sine',vol:0.045}, null, {f:N.E5,type:'sine',vol:0.035}, null,
      {f:N.D4,type:'sine',vol:0.05}, null, {f:N.A4,type:'sine',vol:0.04}, null, {f:N.C5,type:'sine',vol:0.045}, null, {f:N.G4,type:'sine',vol:0.035}, null ] },
    // Molekula — iliq, ilmiy
    molekula: { tempo: 96, steps: [
      {f:N.C4,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, {f:N.G4,type:'triangle',vol:0.04}, null, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.035},
      {f:N.F4,type:'triangle',vol:0.05}, null, {f:N.A4,type:'triangle',vol:0.04}, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.A4,type:'triangle',vol:0.04}, null, {f:N.F4,type:'triangle',vol:0.035} ] },
    // Rezonans — chuqur, to'lqinli
    rezonans: { tempo: 72, steps: [
      {f:N.A3,type:'sine',vol:0.06,dur:2}, null, null, {f:N.E4,type:'sine',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.04,dur:2}, null, null,
      {f:N.G3,type:'sine',vol:0.06,dur:2}, null, {f:N.D4,type:'sine',vol:0.04}, null, {f:N.G4,type:'sine',vol:0.045,dur:2}, null, null, null ] },
    // Berkinmachoq — taranglik, yashirin
    berkinmachoq: { tempo: 108, steps: [
      [{f:N.E3,type:'triangle',vol:0.04}], null, {f:N.B3,type:'sine',vol:0.035}, null, {f:N.E4,type:'sine',vol:0.035}, null, {f:N.D4,type:'sine',vol:0.03}, null,
      [{f:N.C3,type:'triangle',vol:0.04}], null, {f:N.G3,type:'sine',vol:0.035}, null, {f:N.C4,type:'sine',vol:0.035}, null, {f:N.B3,type:'sine',vol:0.03}, null ] },
    // Quvlashmachoq — chaqqon, quvnoq quvlash
    quvlashmachoq: { tempo: 126, steps: [
      [{f:N.A3,type:'sawtooth',vol:0.045}], {f:N.E5,type:'square',vol:0.03}, {f:N.A4,vol:0.04}, null, {f:N.C5,vol:0.04}, null, {f:N.A4,vol:0.035}, {f:N.E4,vol:0.03},
      [{f:N.F3,type:'sawtooth',vol:0.045}], {f:N.C5,type:'square',vol:0.03}, {f:N.A4,vol:0.04}, null, {f:N.G4,vol:0.04}, null, {f:N.E4,vol:0.035}, {f:N.G4,vol:0.03} ] },
    // Varrak Jang — shabada, osmon, keng
    varrak: { tempo: 88, steps: [
      {f:N.D4,type:'sine',vol:0.05,dur:2}, null, {f:N.A4,type:'sine',vol:0.04}, null, {f:N.F5,type:'sine',vol:0.035,dur:2}, null, null, null,
      {f:N.G4,type:'sine',vol:0.05,dur:2}, null, {f:N.D5,type:'sine',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.035}, null, {f:N.C5,type:'sine',vol:0.03}, null ] },
    // Besh tosh — o'ynoqi, xalqona pluck
    'besh-tosh': { tempo: 112, steps: [
      {f:N.G4,type:'triangle',vol:0.05}, null, {f:N.B4,type:'triangle',vol:0.04}, {f:N.D5,type:'triangle',vol:0.04}, null, {f:N.B4,type:'triangle',vol:0.04}, {f:N.G4,type:'triangle',vol:0.035}, null,
      {f:N.C4,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, {f:N.G4,type:'triangle',vol:0.04}, null, {f:N.A4,type:'triangle',vol:0.04}, {f:N.E4,type:'triangle',vol:0.035}, null ] },
    // Chillak — dala, quvnoq, xalqona
    chillak: { tempo: 116, steps: [
      [{f:N.D3,type:'sawtooth',vol:0.04}], null, {f:N.A4,vol:0.04}, null, {f:N.D5,vol:0.04}, null, {f:N.A4,vol:0.035}, {f:N.F4,vol:0.03},
      [{f:N.G3,type:'sawtooth',vol:0.04}], null, {f:N.D5,vol:0.04}, null, {f:N.C5,vol:0.04}, null, {f:N.A4,vol:0.035}, {f:N.G4,vol:0.03} ] },
    // Oshiq — o'ynoqi, jaranglovchi
    oshiq: { tempo: 100, steps: [
      {f:N.A4,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, null, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.A4,type:'triangle',vol:0.035}, null,
      {f:N.G4,type:'triangle',vol:0.05}, null, {f:N.D4,type:'triangle',vol:0.04}, null, {f:N.B4,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.035}, null ] },
    // Lanka — yengil, sakrovchi refleks
    lanka: { tempo: 124, steps: [
      {f:N.E4,type:'triangle',vol:0.05}, null, {f:N.B4,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.04}, null, {f:N.E5,type:'triangle',vol:0.035}, null,
      {f:N.A4,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, null, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.035}, null ] },
    // Arqon tortish — taranglik, kuch
    arqon: { tempo: 108, steps: [
      [{f:N.C3,type:'sawtooth',vol:0.05}], null, {f:N.G3,vol:0.04}, null, [{f:N.C3,type:'sawtooth',vol:0.045}], null, {f:N.C4,vol:0.035}, null,
      [{f:N.F3,type:'sawtooth',vol:0.05}], null, {f:N.C4,vol:0.04}, null, [{f:N.G3,type:'sawtooth',vol:0.045}], null, {f:N.D4,vol:0.035}, null ] },
    // Sakrash arqoni — sakrovchi, ritmik
    sakrash: { tempo: 128, steps: [
      {f:N.C4,type:'square',vol:0.045}, null, {f:N.G4,type:'square',vol:0.035}, null, {f:N.E4,type:'square',vol:0.04}, null, {f:N.C5,type:'square',vol:0.03}, null,
      {f:N.A3,type:'square',vol:0.045}, null, {f:N.E4,type:'square',vol:0.035}, null, {f:N.G4,type:'square',vol:0.04}, null, {f:N.E4,type:'square',vol:0.03}, null ] },
    // To'p-tosh — chaqqon, taranglik
    'top-tosh': { tempo: 132, steps: [
      [{f:N.E3,type:'sawtooth',vol:0.045}], null, {f:N.B4,vol:0.035}, null, {f:N.E4,vol:0.04}, null, {f:N.G4,vol:0.035}, {f:N.B4,vol:0.03},
      [{f:N.C3,type:'sawtooth',vol:0.045}], null, {f:N.G4,vol:0.035}, null, {f:N.C5,vol:0.04}, null, {f:N.G4,vol:0.035}, {f:N.E4,vol:0.03} ] },
    // G'ildirak — dumalovchi, oqib boruvchi
    gildirak: { tempo: 116, steps: [
      {f:N.D4,type:'triangle',vol:0.045}, {f:N.F4,type:'triangle',vol:0.035}, {f:N.A4,type:'triangle',vol:0.04}, {f:N.F4,type:'triangle',vol:0.035}, {f:N.D5,type:'triangle',vol:0.04}, {f:N.A4,type:'triangle',vol:0.035}, {f:N.F4,type:'triangle',vol:0.035}, {f:N.A4,type:'triangle',vol:0.03},
      {f:N.C4,type:'triangle',vol:0.045}, {f:N.E4,type:'triangle',vol:0.035}, {f:N.G4,type:'triangle',vol:0.04}, {f:N.E4,type:'triangle',vol:0.035}, {f:N.C5,type:'triangle',vol:0.04}, {f:N.G4,type:'triangle',vol:0.035}, {f:N.E4,type:'triangle',vol:0.035}, {f:N.G4,type:'triangle',vol:0.03} ] },
    // Yumronqoziq — o'ynoqi, chaqqon, kulgili
    yumronqoziq: { tempo: 138, steps: [
      {f:N.C4,type:'square',vol:0.04}, {f:N.E4,type:'square',vol:0.035}, {f:N.G4,type:'square',vol:0.04}, null, {f:N.C5,type:'square',vol:0.035}, null, {f:N.G4,type:'square',vol:0.035}, {f:N.E4,type:'square',vol:0.03},
      {f:N.F4,type:'square',vol:0.04}, {f:N.A4,type:'square',vol:0.035}, {f:N.C5,type:'square',vol:0.04}, null, {f:N.A4,type:'square',vol:0.035}, null, {f:N.F4,type:'square',vol:0.035}, {f:N.G4,type:'square',vol:0.03} ] },
    // Xalqa otish — tinch, aniq, sirkli
    xalqa: { tempo: 96, steps: [
      {f:N.G4,type:'triangle',vol:0.05}, null, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.E5,type:'triangle',vol:0.04}, null, {f:N.C5,type:'triangle',vol:0.035}, null,
      {f:N.F4,type:'triangle',vol:0.05}, null, {f:N.A4,type:'triangle',vol:0.04}, null, {f:N.D5,type:'triangle',vol:0.04}, null, {f:N.A4,type:'triangle',vol:0.035}, null ] },
    // Klass — bolalarcha, sakrovchi
    klass: { tempo: 120, steps: [
      {f:N.E4,type:'triangle',vol:0.05}, null, {f:N.G4,type:'triangle',vol:0.04}, {f:N.A4,type:'triangle',vol:0.04}, {f:N.B4,type:'triangle',vol:0.04}, null, {f:N.A4,type:'triangle',vol:0.035}, {f:N.G4,type:'triangle',vol:0.03},
      {f:N.C4,type:'triangle',vol:0.05}, null, {f:N.E4,type:'triangle',vol:0.04}, {f:N.G4,type:'triangle',vol:0.04}, {f:N.C5,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.035}, {f:N.E4,type:'triangle',vol:0.03} ] },
    // Uch qadah — sirli, diqqatli
    'uch-qadah': { tempo: 92, steps: [
      {f:N.A3,type:'sine',vol:0.05,dur:2}, null, {f:N.C4,type:'sine',vol:0.04}, null, {f:N.E4,type:'sine',vol:0.04}, null, {f:N.D4,type:'sine',vol:0.035}, null,
      {f:N.F3,type:'sine',vol:0.05,dur:2}, null, {f:N.A3,type:'sine',vol:0.04}, null, {f:N.C4,type:'sine',vol:0.04}, null, {f:N.B3,type:'sine',vol:0.035}, null ] },
    // Oq terak ko'k terak — jamoaviy, kuch
    'oq-terak': { tempo: 118, steps: [
      [{f:N.D3,type:'sawtooth',vol:0.045}], null, {f:N.A4,vol:0.04}, null, {f:N.D5,vol:0.04}, null, {f:N.A4,vol:0.035}, {f:N.F4,vol:0.03},
      [{f:N.G3,type:'sawtooth',vol:0.045}], null, {f:N.D5,vol:0.04}, null, {f:N.C5,vol:0.04}, null, {f:N.A4,vol:0.035}, {f:N.D5,vol:0.03} ] },
    // Kurash — milliy, dovruqli
    kurash: { tempo: 104, steps: [
      [{f:N.A3,type:'sawtooth',vol:0.05}], null, {f:N.E4,vol:0.04}, null, {f:N.A4,vol:0.04}, null, {f:N.G4,vol:0.035}, {f:N.E4,vol:0.03},
      [{f:N.F3,type:'sawtooth',vol:0.05}], null, {f:N.C4,vol:0.04}, null, {f:N.F4,vol:0.04}, null, {f:N.E4,vol:0.035}, {f:N.C4,vol:0.03} ] },
    // Sirtmoq — havoyi, orbital
    sirtmoq: { tempo: 110, steps: [
      {f:N.D4,type:'sine',vol:0.05}, null, {f:N.A4,type:'sine',vol:0.04}, null, {f:N.D5,type:'triangle',vol:0.04}, null, {f:N.A4,type:'sine',vol:0.035}, {f:N.F4,type:'sine',vol:0.03},
      {f:N.G4,type:'sine',vol:0.05}, null, {f:N.D5,type:'sine',vol:0.04}, null, {f:N.G5,type:'triangle',vol:0.04}, null, {f:N.D5,type:'sine',vol:0.035}, {f:N.A4,type:'sine',vol:0.03} ] },
    // Girdob — suvli, oqimli, sokin
    girdob: { tempo: 88, steps: [
      {f:N.A3,type:'sine',vol:0.05,dur:2}, null, {f:N.C4,type:'sine',vol:0.04}, null, {f:N.E4,type:'sine',vol:0.04}, null, {f:N.G4,type:'sine',vol:0.035}, null,
      {f:N.F3,type:'sine',vol:0.05,dur:2}, null, {f:N.A3,type:'sine',vol:0.04}, null, {f:N.D4,type:'sine',vol:0.04}, null, {f:N.C4,type:'sine',vol:0.035}, null ] },
    // Qatlam — qat'iy, ko'tariluvchi
    qatlam: { tempo: 116, steps: [
      [{f:N.C3,type:'square',vol:0.04}], null, {f:N.C4,type:'triangle',vol:0.04}, null, {f:N.E4,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.035}, null,
      [{f:N.G3,type:'square',vol:0.04}], null, {f:N.E4,type:'triangle',vol:0.04}, null, {f:N.G4,type:'triangle',vol:0.04}, null, {f:N.C5,type:'triangle',vol:0.035}, null ] }
  };

  // ── umumiy effektlar ──
  var SFX = {
    resume: resume,
    isOn: function () { return enabled; },
    tone: voice, noise: noise,
    music: function (name) { if (name) mstart(name); else mstop(); },
    toggle: function () {
      enabled = !enabled;
      try { localStorage.setItem('uzig_sound', enabled ? '1' : '0'); } catch (e) {}
      if (master) master.gain.value = enabled ? 1 : 0;
      if (enabled) resume();
      syncBtn(); return enabled;
    },
    // effektlar
    jump: function () { voice(360, 0.16, { type: 'square', vol: 0.12, to: 660 }); },
    land: function () { voice(180, 0.08, { type: 'sine', vol: 0.1, to: 90 }); noise(0.04, { vol: 0.04 }); },
    step: function () { voice(220, 0.04, { type: 'sine', vol: 0.05 }); },
    coin: function () { voice(880, 0.06, { type: 'square', vol: 0.11 }); setTimeout(function () { voice(1320, 0.1, { type: 'square', vol: 0.11 }); }, 55); },
    hit: function () { voice(220, 0.28, { type: 'sawtooth', vol: 0.18, to: 55 }); noise(0.18, { vol: 0.1 }); },
    death: function () { voice(300, 0.4, { type: 'sawtooth', vol: 0.18, to: 50 }); noise(0.25, { vol: 0.1 }); },
    win: function () { seq([523.3, 659.3, 784, 1046.5], 0.11, 'triangle', 0.16); },
    levelup: function () { seq([523.3, 784, 1046.5], 0.09, 'square', 0.13); },
    click: function () { voice(300, 0.05, { type: 'square', vol: 0.1 }); },
    torch: function (on) { voice(on ? 520 : 320, 0.14, { type: 'sine', vol: 0.1, to: on ? 900 : 180 }); },
    alarm: function () { voice(440, 0.1, { type: 'sawtooth', vol: 0.1, to: 520 }); },
    blip: function (i) { voice(300 + (i || 0) * 45, 0.09, { type: 'triangle', vol: 0.12 }); },
    move: function () { voice(340, 0.05, { type: 'sine', vol: 0.08 }); },
    blocked: function () { voice(150, 0.09, { type: 'square', vol: 0.09 }); },
    undo: function () { voice(400, 0.09, { type: 'triangle', vol: 0.1, to: 220 }); },
    beat: function () { voice(150, 0.08, { type: 'sine', vol: 0.06 }); }
  };

  // ── susturish tugmasi ──
  function syncBtn() { var el = document.getElementById('soundBtn'); if (el) { el.textContent = enabled ? '🔊' : '🔇'; el.setAttribute('aria-label', enabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'); } }
  function bind() {
    var el = document.getElementById('soundBtn');
    if (el) { syncBtn(); el.addEventListener('click', function (e) { e.preventDefault(); SFX.toggle(); }); }
    addEventListener('keydown', function (e) { if (e.code === 'KeyM') { SFX.toggle(); } });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', bind); else bind();

  window.SFX = SFX;
})();
