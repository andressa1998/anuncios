function login() {
    const user = document.getElementById("user").value.trim();
    const pass = document.getElementById("pass").value.trim();
    const error = document.getElementById("error");

    if (user === "andressa" && pass === "1234") {
        window.location.href = "dashboard.html";
    } else {
        error.style.display = "block";
    }
}
