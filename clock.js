function updateClock() {
    const clock = document.getElementById("clock");
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    clock.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 1000);
updateClock();