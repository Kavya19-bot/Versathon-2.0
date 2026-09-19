/* =========================================
   FINWISE PROFILE PAGE JAVASCRIPT
   ========================================= */


const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");

const displayName = document.getElementById("displayName");
const profileAvatar = document.getElementById("profileAvatar");

const saveProfile = document.getElementById("saveProfile");
const successMessage = document.getElementById("successMessage");


/* =========================================
   LOAD PROFILE
   ========================================= */

function loadProfile() {

    const savedName =
        localStorage.getItem("finwiseUserName");

    const savedEmail =
        localStorage.getItem("finwiseUserEmail");

    const savedPhone =
        localStorage.getItem("finwiseUserPhone");


    if (savedName) {

        profileName.value = savedName;

        displayName.textContent = savedName;

        profileAvatar.textContent =
            savedName.charAt(0).toUpperCase();
    }


    if (savedEmail) {
        profileEmail.value = savedEmail;
    }


    if (savedPhone) {
        profilePhone.value = savedPhone;
    }
}


/* =========================================
   SAVE PROFILE
   ========================================= */

saveProfile.addEventListener("click", function () {

    const name = profileName.value.trim();
    const email = profileEmail.value.trim();
    const phone = profilePhone.value.trim();


    if (!name) {

        alert("Please enter your name.");

        return;
    }


    localStorage.setItem(
        "finwiseUserName",
        name
    );


    localStorage.setItem(
        "finwiseUserEmail",
        email
    );


    localStorage.setItem(
        "finwiseUserPhone",
        phone
    );


    displayName.textContent = name;


    profileAvatar.textContent =
        name.charAt(0).toUpperCase();


    successMessage.textContent =
        "Profile updated successfully!";


    setTimeout(function () {

        successMessage.textContent = "";

    }, 3000);

});


/* =========================================
   LOAD PROFILE WHEN PAGE OPENS
   ========================================= */

renderDashboardisre();