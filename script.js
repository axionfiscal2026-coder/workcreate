function alternarVisibilidadeSenha() {
    const inputSenha = document.getElementById('inputSenha');
    const icon = document.getElementById('togglePasswordIcon');

    if (!inputSenha || !icon) return;

    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        inputSenha.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

function realizarLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const email = document.getElementById('inputUsuario').value.trim();
    const senha = document.getElementById('inputSenha').value.trim();

    if (!email || !senha) {
        alert("Preencha o e-mail e a senha para continuar.");
        return;
    }

    const btn = document.getElementById('btnLoginSubmit');
    if (btn) btn.disabled = true;

    if (typeof window.firebaseAuthLogin === 'function') {
        window.firebaseAuthLogin(email, senha);
    } else {
        alert("Erro de inicialização do Firebase.");
        if (btn) btn.disabled = false;
    }
}

function mostrarNotificacaoToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    const msgSpan = document.getElementById('toast-msg');
    if (msgSpan) msgSpan.innerText = msg;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}