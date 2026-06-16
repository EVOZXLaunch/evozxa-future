let currentStep = 1;
const MAX_STEP = 4;

// ===============================
// SHOW STEP ENGINE
// ===============================
function showStep(step) {
    document.querySelectorAll(".wizard-step").forEach(el => {
        el.style.display = Number(el.dataset.step) === step ? "block" : "none";
    });

    const stepNow = document.getElementById("stepNow");
    if (stepNow) stepNow.textContent = step;

    updateButtons();
}

// ===============================
// BUTTON STATE CONTROL
// ===============================
function updateButtons() {
    const nextBtn = document.getElementById("nextStep");
    const prevBtn = document.getElementById("prevStep");

    if (prevBtn) prevBtn.disabled = currentStep === 1;

    if (nextBtn) {
        nextBtn.textContent = currentStep === MAX_STEP ? "Review" : "Next";
    }
}

// ===============================
// NEXT STEP
// ===============================
function nextStep() {
    if (currentStep < MAX_STEP) {
        currentStep++;
        showStep(currentStep);
    } else {
        // FINAL STEP (review mode)
        console.log("Wizard complete - ready to deploy");
        const deployBtn = document.getElementById("deployBtn");
        if (deployBtn) deployBtn.scrollIntoView({ behavior: "smooth" });
    }
}

// ===============================
// PREVIOUS STEP
// ===============================
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// ===============================
// INIT EVENTS
// ===============================
function initWizard() {

    const nextBtn = document.getElementById("nextStep");
    const prevBtn = document.getElementById("prevStep");

    if (nextBtn) nextBtn.addEventListener("click", nextStep);
    if (prevBtn) prevBtn.addEventListener("click", prevStep);

    showStep(currentStep);
}

// ===============================
// AUTO INIT
// ===============================
document.addEventListener("DOMContentLoaded", initWizard);
