document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("resetPasswordForm");
    const phoneNumberInput = document.getElementById("phoneNumber");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const newPasswordEye = document.getElementById("newPasswordEye");
    const confirmPasswordEye = document.getElementById("confirmPasswordEye");

    const resetButton = document.getElementById("resetButton");
    const message = document.getElementById("message");

    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");


    // ==========================================
    // CHECK REQUIRED ELEMENTS
    // ==========================================

    if (
        !form ||
        !phoneNumberInput ||
        !newPassword ||
        !confirmPassword ||
        !newPasswordEye ||
        !confirmPasswordEye ||
        !resetButton ||
        !message
    ) {
        console.error("Reset Password page elements are missing.");
        return;
    }


    // ==========================================
    // GET MOBILE NUMBER
    // ==========================================

    const savedPhoneNumber =
        localStorage.getItem("resetMobileNumber");

    if (savedPhoneNumber) {
        phoneNumberInput.value = savedPhoneNumber;
    }


    // ==========================================
    // MOBILE NUMBER
    // ==========================================

    phoneNumberInput.addEventListener("input", function () {

        this.value = this.value
            .replace(/\D/g, "")
            .slice(0, 10);

    });


    // ==========================================
    // SHOW / HIDE NEW PASSWORD
    // ==========================================

    newPasswordEye.addEventListener("click", function () {

        if (newPassword.type === "password") {

            newPassword.type = "text";
            newPasswordEye.textContent = "🙈";

            newPasswordEye.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            newPassword.type = "password";
            newPasswordEye.textContent = "👁";

            newPasswordEye.setAttribute(
                "aria-label",
                "Show password"
            );
        }

    });


    // ==========================================
    // SHOW / HIDE CONFIRM PASSWORD
    // ==========================================

    confirmPasswordEye.addEventListener("click", function () {

        if (confirmPassword.type === "password") {

            confirmPassword.type = "text";
            confirmPasswordEye.textContent = "🙈";

            confirmPasswordEye.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            confirmPassword.type = "password";
            confirmPasswordEye.textContent = "👁";

            confirmPasswordEye.setAttribute(
                "aria-label",
                "Show password"
            );
        }

    });


    // ==========================================
    // PASSWORD STRENGTH
    // ==========================================

    if (strengthBar && strengthText) {

        newPassword.addEventListener("input", function () {

            const password = newPassword.value;

            let score = 0;

            if (password.length >= 8) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[a-z]/.test(password)) score++;
            if (/\d/.test(password)) score++;
            if (/[^a-zA-Z0-9]/.test(password)) score++;


            if (password.length === 0) {

                strengthBar.style.width = "0%";
                strengthText.textContent =
                    "Password strength";

            }
            else if (score <= 2) {

                strengthBar.style.width = "35%";
                strengthText.textContent =
                    "Weak password";

            }
            else if (score <= 4) {

                strengthBar.style.width = "70%";
                strengthText.textContent =
                    "Medium password";

            }
            else {

                strengthBar.style.width = "100%";
                strengthText.textContent =
                    "Strong password";
            }

        });

    }


    // ==========================================
    // RESET PASSWORD
    // ==========================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        message.textContent = "";
        message.style.color = "#ef4444";


        const phoneNumber =
            phoneNumberInput.value.trim();

        const password =
            newPassword.value;

        const confirm =
            confirmPassword.value;


        // ==========================================
        // PHONE VALIDATION
        // ==========================================

        if (!/^\d{10}$/.test(phoneNumber)) {

            message.textContent =
                "Phone number must contain exactly 10 digits.";

            return;
        }


        // ==========================================
        // PASSWORD VALIDATION
        // ==========================================

        if (password.length < 8) {

            message.textContent =
                "Password must contain at least 8 characters.";

            return;
        }

        if (!/[A-Z]/.test(password)) {

            message.textContent =
                "Password must contain at least one uppercase letter.";

            return;
        }

        if (!/[a-z]/.test(password)) {

            message.textContent =
                "Password must contain at least one lowercase letter.";

            return;
        }

        if (!/\d/.test(password)) {

            message.textContent =
                "Password must contain at least one number.";

            return;
        }

        if (!/[^a-zA-Z0-9]/.test(password)) {

            message.textContent =
                "Password must contain at least one special character.";

            return;
        }


        // ==========================================
        // CONFIRM PASSWORD
        // ==========================================

        if (password !== confirm) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        // ==========================================
        // DISABLE BUTTON
        // ==========================================

        resetButton.disabled = true;

        resetButton.innerHTML =
            "<span>Resetting...</span>";


        // ==========================================
        // API CALL
        // ==========================================

        try {

            const response = await fetch(
                "/api/Account/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        phoneNumber: phoneNumber,

                        newPassword: password,

                        confirmPassword: confirm

                    })
                }
            );


            let data = {};

            try {
                data = await response.json();
            }
            catch {
                data = {};
            }


            // ==========================================
            // SUCCESS
            // ==========================================

            if (response.ok) {

                message.textContent =
                    data.message ||
                    "Password reset successfully.";

                message.style.color =
                    "#22c55e";


                localStorage.removeItem(
                    "resetMobileNumber"
                );


                setTimeout(function () {

                    window.location.href =
                        "login.html";

                }, 1500);

            }


            // ==========================================
            // API ERROR
            // ==========================================

            else {

                message.textContent =
                    data.message ||
                    "Unable to reset password.";

                message.style.color =
                    "#ef4444";


                resetButton.disabled = false;

                resetButton.innerHTML =
                    "<span>Reset Password</span>" +
                    "<span class='arrow'>→</span>";
            }

        }


        // ==========================================
        // CONNECTION ERROR
        // ==========================================

        catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            message.textContent =
                "Unable to connect to the server. Please make sure FitSync is running.";

            message.style.color =
                "#ef4444";


            resetButton.disabled = false;

            resetButton.innerHTML =
                "<span>Reset Password</span>" +
                "<span class='arrow'>→</span>";
        }

    });

});