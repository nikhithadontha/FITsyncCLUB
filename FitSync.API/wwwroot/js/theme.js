/* =====================================================
   FITSYNC THEME — shared sticky navbar scroll effect
===================================================== */

(function () {

    const navbar = document.querySelector(".navbar");

    if (!navbar) {
        return;
    }

    function updateNavbarState() {

        if (window.scrollY > 10) {
            navbar.classList.add("fs-scrolled");
        } else {
            navbar.classList.remove("fs-scrolled");
        }

    }

    window.addEventListener("scroll", updateNavbarState);
    updateNavbarState();

})();
