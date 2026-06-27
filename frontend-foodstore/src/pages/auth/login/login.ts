import usuariosJson from "../../../data/usuarios.json";
import type { IUser } from "../../../types/IUser";
import { navigate } from "../../../utils/navigate";

const form = document.getElementById("loginForm") as HTMLFormElement | null;
const inputEmail = document.getElementById("emailLogin") as HTMLInputElement | null;
const inputPassword = document.getElementById("passwordLogin") as HTMLInputElement | null;
const errorMsg = document.getElementById("loginError") as HTMLParagraphElement | null;

if (!form || !inputEmail || !inputPassword) {
  throw new Error("Login form elements were not found in the DOM.");
}

form.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();

  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  const found = usuariosJson.find(
    (u) => u.mail === email && u.password === password,
  );

  if (!found) {
    if (errorMsg) {
      errorMsg.textContent = "Email o contraseña incorrectos.";
      errorMsg.hidden = false;
    }
    return;
  }

  if (errorMsg) errorMsg.hidden = true;

  const role = found.rol === "ADMIN" ? "admin" : "client";

  const user: IUser = {
    email: found.mail,
    role: role as IUser["role"],
    loggedIn: true,
  };

  localStorage.setItem("userData", JSON.stringify(user));

  if (role === "admin") {
    navigate("/src/pages/admin/home/home.html");
  } else {
    navigate("/src/pages/store/home/home.html");
  }
});
