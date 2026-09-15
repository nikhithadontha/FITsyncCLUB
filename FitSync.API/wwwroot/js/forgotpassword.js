document.addEventListener("DOMContentLoaded", function () {

    const form             = document.getElementById("forgotPasswordForm");
    const phoneInput       = document.getElementById("phoneNumber");
    const message          = document.getElementById("message");
    const continueButton   = document.getElementById("continueButton");

    if (!form || !phoneInput || !message || !continueButton) {
        console.error("Forgot Password form elements not found.");
        return;
    }

    // ── Strip non-digits and cap at 10 characters ──────────────
    phoneInput.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
        // Clear any error while the user is correcting their input
        message.textContent = "";
    });

    // ── Prevent paste of non-numeric content ───────────────────
    phoneInput.addEventListener("paste", function (e) {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 10);
        this.value = pasted;
    });

    // ── Form submit ─────────────────────────────────────────────
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        message.textContent = "";
        message.style.color = "#ef4444";

        const phone = phoneInput.value.trim();

        // 1. Exactly 10 digits
        if (!/^\d{10}$/.test(phone)) {
            message.textContent = "Please enter a valid 10-digit mobile number.";
            phoneInput.focus();
            return;
        }

        // 2. Disable button & show loading
        continueButton.disabled = true;
        continueButton.innerHTML = `<span>Checking...</span><span class="arrow">→</span>`;

        try {

            // 3. Verify the number belongs to a registered FitSync account
            const response = await fetch("/api/account/check-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: phone })
            });

            const data = await response.json();

            if (!response.ok || !data.exists) {
                message.textContent = data.message || "No FitSync account found with this mobile number.";
                continueButton.disabled = false;
                continueButton.innerHTML = `<span>Continue</span><span class="arrow">→</span>`;
                return;
            }

            // 4. All good — save phone and navigate to reset page
            localStorage.setItem("resetMobileNumber", phone);

            message.style.color = "#22c55e";
            message.textContent = "Account found! Redirecting…";

            setTimeout(function () {
                window.location.href = "resetpassword.html";
            }, 500);

        } catch (err) {
            console.error("Check phone error:", err);
            message.textContent = "Unable to reach the server. Please try again.";
            continueButton.disabled = false;
            continueButton.innerHTML = `<span>Continue</span><span class="arrow">→</span>`;
        }

    });

});