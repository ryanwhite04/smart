// disable remove buttons until at least one checkbox is checked
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.checkbox');
    const submitBtn = document.getElementById('Remove_Button');
  
    function updateSubmitButtonStatus() {
      let atLeastOneChecked = false;
      checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
          atLeastOneChecked = true;
        }
      });
      submitBtn.disabled = !atLeastOneChecked;
    }
  
    checkboxes.forEach(function(checkbox) {
      checkbox.addEventListener('click', updateSubmitButtonStatus);
    });
  
    updateSubmitButtonStatus();
  });