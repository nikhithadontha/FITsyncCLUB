/* =========================================================
   FITSYNC — GLOBAL TOAST NOTIFICATION SYSTEM
   Replaces browser alert() dialogs with modern, accessible toasts.
   Usage: showToast("Message", "success" | "error" | "warning" | "info");
========================================================= */

(function () {
    let toastContainer = null;

    function getOrCreateContainer() {
        if (!toastContainer || !document.body.contains(toastContainer)) {
            toastContainer = document.createElement("div");
            toastContainer.id = "fitsyncToastContainer";
            toastContainer.className = "fitsync-toast-container";
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    window.showToast = function (message, type = "info", duration = 4000) {
        const container = getOrCreateContainer();

        const toast = document.createElement("div");
        toast.className = `fitsync-toast toast-${type}`;

        const icons = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ"
        };

        const iconEl = document.createElement("span");
        iconEl.className = "toast-icon";
        iconEl.textContent = icons[type] || "ℹ";

        const textEl = document.createElement("div");
        textEl.className = "toast-text";
        textEl.textContent = message;

        const closeBtn = document.createElement("button");
        closeBtn.className = "toast-close";
        closeBtn.innerHTML = "×";
        closeBtn.onclick = function () {
            removeToast(toast);
        };

        toast.appendChild(iconEl);
        toast.appendChild(textEl);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        // Auto dismiss
        const timer = setTimeout(() => {
            removeToast(toast);
        }, duration);

        function removeToast(t) {
            clearTimeout(timer);
            t.classList.remove("show");
            t.classList.add("hide");
            setTimeout(() => {
                if (t.parentElement) {
                    t.parentElement.removeChild(t);
                }
            }, 300);
        }
    };

    // Override global alert safely with our toast so legacy calls upgrade automatically
    window.alert = function (msg) {
        window.showToast(msg, "info");
    };
})();
