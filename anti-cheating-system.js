let warning = 0;

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    warning++;
    alert("⚠️ Do not switch tabs!");

    if (warning >= 3) {
      alert("❌ Exam auto-submitted!");
      document.getElementById("examForm").submit();
    }
  }
});