// Dismiss flash messages after 5 seconds
setTimeout(function () {
  $(".flash-messages").fadeOut("slow");
}, 5000);


// enable submit button when all required fields are filled
function enableSubmit() {
  let inputs = document.getElementsByClassName('required');
  let btns = document.querySelectorAll('input[type="submit"]');

  btns.forEach((btn) => {
      let parentForm = btn.closest('form');
      let requiredInputs = parentForm.getElementsByClassName('required');
      let isValid = true;

      for (let i = 0; i < requiredInputs.length; i++) {
          let changedInput = requiredInputs[i];
          if (changedInput.value.trim() === "" || changedInput.value === null) {
              isValid = false;
              break;
          }
      }

      btn.disabled = !isValid;
  });
}
