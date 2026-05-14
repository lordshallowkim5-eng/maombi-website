let time = 60 * 30; // 30 minutes

const timer = setInterval(() => {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;

  document.getElementById("timer").innerHTML =
    `${minutes}:${seconds}`;

  time--;

  if (time < 0) {
    clearInterval(timer);
    alert("Time is up!");
    document.getElementById("examForm").submit();
  }
}, 1000);