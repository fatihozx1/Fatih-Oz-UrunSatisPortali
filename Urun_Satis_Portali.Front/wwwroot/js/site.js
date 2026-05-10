

$(document).ready(function () {
    checkAuth();
});

// Setup AJAX to always include Bearer token if available
$.ajaxSetup({
    beforeSend: function (xhr) {
        const token = localStorage.getItem('saleshop_token');
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
    }
});

function checkAuth() {
    const token = localStorage.getItem('saleshop_token');
    const userStr = localStorage.getItem('saleshop_user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        $('#navLogin').hide();
        $('#navUser').show();
        $('#navOrders').show();
        $('#userNameDisplay').text(user.userName);

    
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const roleClaim = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            let roles = [];
            if (Array.isArray(roleClaim)) {
                roles = roleClaim;
            } else if (roleClaim) {
                roles = [roleClaim];
            }

            if (roles.includes("Admin")) {
                $('#navAdmin').show();
            }
        } catch (e) {
            console.error("Token decode error", e);
        }
    } else {
        $('#navLogin').show();
        $('#navUser').hide();
        $('#navOrders').hide();
        $('#navAdmin').hide();
    }
}

function logout() {
    localStorage.removeItem('saleshop_token');
    localStorage.removeItem('saleshop_user');

    Swal.fire({
        icon: 'info',
        title: 'Çıkış Yapıldı',
        text: 'Başarıyla çıkış yaptınız.',
        timer: 1500,
        showConfirmButton: false
    });

    setTimeout(() => {
        window.location.href = '/Home/Index';
    }, 1000);
}


const GlobalToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

const Toast = GlobalToast;
