// Fonction pour valider le nom d'utilisateur
function validateUsername(username) {
    // Vérification : uniquement des lettres (y compris les lettres avec des signes diacritiques)
    // Modifié pour exclure les chiffres et autres caractères
    const regex = /^[a-zA-ZÀ-ÿ]+$/;
    return regex.test(username);
}

// Fonction pour valider l'adresse e-mail
function validateEmail(email) {
    // Vérification standard de l'e-mail
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Fonction principale de validation du formulaire
function validateForm() {
    var username = document.getElementById("username").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var confirm_password = document.getElementById("confirm_password").value;
    
    var username_error = document.getElementById("username_error");
    var email_error = document.getElementById("email_error");
    var password_error = document.getElementById("password_error");

    var isValid = true;

    // Vérification du nom d'utilisateur
    if (!validateUsername(username)) {
        username_error.style.display = "block";
        isValid = false;
    } else {
        username_error.style.display = "none";
    }

    // Vérification de l'e-mail
    if (!validateEmail(email)) {
        email_error.style.display = "block";
        isValid = false;
    } else {
        email_error.style.display = "none";
    }

    // Vérification des mots de passe
    if (password !== confirm_password) {
        password_error.style.display = "block";
        isValid = false;
    } else {
        password_error.style.display = "none";
    }

    return isValid;
}