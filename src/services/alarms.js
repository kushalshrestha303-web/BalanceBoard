let audioContext;
export async function playAlarm() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if(!Audio) return false;
  try {
    audioContext ||= new Audio();
    await audioContext.resume();
    for(let i=0;i<3;i++) {
      const oscillator=audioContext.createOscillator();
      const gain=audioContext.createGain();
      const start=audioContext.currentTime+i*.45;
      oscillator.type='sine'; oscillator.frequency.value=i===1?740:880;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(.14,start+.02);
      gain.gain.exponentialRampToValueAtTime(.0001,start+.32);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start); oscillator.stop(start+.34);
    }
    return true;
  } catch { return false; }
}
export function vibrateAlarm() { return typeof navigator.vibrate==='function' && navigator.vibrate([350,150,350,150,350]); }
