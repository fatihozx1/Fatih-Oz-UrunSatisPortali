

$(document).ready(function () {
    $.ajaxSetup({
        beforeSend: function (xhr) {
            const token = localStorage.getItem('saleshop_token');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        }
    });


    const token = localStorage.getItem('saleshop_token');
    const userStr = localStorage.getItem('saleshop_user');

    if (!token || !userStr) {
        window.location.href = '/Home/Login';
        return;
    }

    const user = JSON.parse(userStr);
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roleClaim = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        let roles = [];
        if (Array.isArray(roleClaim)) {
            roles = roleClaim;
        } else if (roleClaim) {
            roles = [roleClaim];
        }

        if (!roles.includes("Admin")) {
            Swal.fire('Erişim Engellendi', 'Yönetici Paneline erişim izniniz yok.', 'error');
            setTimeout(() => { window.location.href = '/Home/Index'; }, 2000);
            return;
        }
    } catch (e) {
        window.location.href = '/Home/Login';
        return;
    }

    $('#adminContainer').show();

   
    if ($('#statRevenue').length) {
        fetchDashboardStats();
    }

    // Modal reset logic
    $('#categoryModal').on('hidden.bs.modal', function () {
        $('#catId').val('');
        $('#catName').val('');
        $('#catModalTitle').html('Add New <span class="text-info">Category</span>');
        $('#catSaveBtn').text('Create Category');
    });

    $('#productModal').on('hidden.bs.modal', function () {
        $('#prodId').val('');
        resetProductForm();
        $('#prodModalTitle').html('Add New <span class="text-primary">Product</span>');
        $('#prodSaveBtn').text('Launch Product');
        $('#uploadStatus').addClass('d-none');
    });
});

function fetchDashboardStats() {
    $('#tableLoader').removeClass('d-none');
    $.ajax({
        url: `${window.API_BASE_URL}/Admin/stats`,
        type: 'GET',
        success: function (data) {
            renderStats(data);
            renderRecentOrders(data.recentOrders);
            $('#tableLoader').addClass('d-none');
        },
        error: function (err) {
            console.error("Dashboard error:", err);
            if (err.status === 401 || err.status === 403) {
                Swal.fire('Oturum Süresi Doldu', 'Devam etmek için lütfen tekrar giriş yapın.', 'warning');
                setTimeout(() => { logout(); }, 2000);
            } else {
                Swal.fire('Hata', 'Panel istatistikleri yüklenemedi.', 'error');
            }
            $('#tableLoader').addClass('d-none');
        }
    });
}

function renderStats(data) {
    $('#statRevenue').text('$' + data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    $('#statOrders').text(data.totalOrders);
    $('#statUsers').text(data.totalUsers);
    $('#statProducts').text(data.totalProducts);
}

function renderRecentOrders(orders) {
    const tbody = $('#recentOrdersBody');
    if (!tbody.length) return;
    tbody.empty();

    if (!orders || orders.length === 0) {
        tbody.append('<tr><td colspan="5" class="text-center py-4">Son sipariş bulunamadı.</td></tr>');
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.orderDate).toLocaleDateString();
        const itemsSummary = order.orderItems.map(i => `${i.productName} (x${i.quantity})`).join(', ');
        
        const row = `
            <tr>
                <td class="ps-4 fw-bold">#ORD-${order.id}</td>
                <td>
                    <div class="fw-bold">${order.userName}</div>
                    <div class="text-muted small text-truncate" style="max-width: 250px;" title="${itemsSummary}">${itemsSummary}</div>
                </td>
                <td class="text-muted small">${date}</td>
                <td class="fw-bold text-primary">$${order.totalPrice.toFixed(2)}</td>
                <td class="text-center pe-4">
                    <span class="badge bg-primary-soft text-primary px-3 py-1 rounded-pill small">Completed</span>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

function viewOrderDetails(id) {
   
    Swal.fire('Sipariş Detayları', `Sipariş No: #ORD-${id}\nSipariş içeriğini görüntüleme özelliği yakında eklenecek!`, 'info');
}



// Category
function saveCategory() {
    const id = $('#catId').val();
    const name = $('#catName').val();
    if (!name) return Swal.fire('Hata', 'Kategori adı gereklidir', 'error');

    const isEdit = id && id !== "";
    const url = isEdit ? `${window.API_BASE_URL}/Category/${id}` : `${window.API_BASE_URL}/Category`;
    const type = isEdit ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        type: type,
        contentType: 'application/json',
        data: JSON.stringify({ id: isEdit ? parseInt(id) : 0, name: name }),
        success: function () {
            Swal.fire('Başarılı', isEdit ? 'Kategori güncellendi!' : 'Kategori oluşturuldu!', 'success');
            $('#categoryModal').modal('hide');
            if (typeof fetchCategoriesList === "function") fetchCategoriesList();
            else fetchDashboardStats();
        },
        error: function (err) {
            Swal.fire('Hata', 'Kategori kaydedilemedi', 'error');
        }
    });
}

function editCategory(id) {
    $.get(`${window.API_BASE_URL}/Category/${id}`, function (data) {
        $('#catId').val(data.id);
        $('#catName').val(data.name);
        $('#catModalTitle').html('Edit <span class="text-info">Category</span>');
        $('#catSaveBtn').text('Update Category');
        $('#categoryModal').modal('show');
    });
}

// Product
$('#productModal').on('show.bs.modal', function () {
    loadCategoriesForSelect();
});

function loadCategoriesForSelect(callback) {
    const select = $('#prodCategory');
    select.empty().append('<option value="">Loading...</option>');

    $.get(`${window.API_BASE_URL}/Category`, function (data) {
        select.empty().append('<option value="">Select Category</option>');
        data.forEach(c => {
            select.append(`<option value="${c.id}">${c.name}</option>`);
        });
        if (callback) callback();
    });
}

function saveProduct() {
    const id = $('#prodId').val();
    const productData = {
        name: $('#prodName').val(),
        categoryId: parseInt($('#prodCategory').val()),
        description: $('#prodDesc').val(),
        price: parseFloat($('#prodPrice').val()),
        stock: parseInt($('#prodStock').val()),
        imageUrl: $('#prodImageUrl').val()
    };

    if (!productData.name || !productData.categoryId || isNaN(productData.price)) {
        return Swal.fire('Hata', 'Lütfen tüm zorunlu alanları doğru doldurun', 'error');
    }

    const isEdit = id && id !== "";
    const url = isEdit ? `${window.API_BASE_URL}/Products/${id}` : `${window.API_BASE_URL}/Products`;
    const type = isEdit ? 'PUT' : 'POST';
    
    if (isEdit) productData.id = parseInt(id);

    $.ajax({
        url: url,
        type: type,
        contentType: 'application/json',
        data: JSON.stringify(productData),
        success: function () {
            Swal.fire('Başarılı', isEdit ? 'Ürün güncellendi!' : 'Ürün yayına alındı!', 'success');
            $('#productModal').modal('hide');
            if (typeof fetchProductsList === "function") fetchProductsList();
            else fetchDashboardStats();
        },
        error: function (err) {
            Swal.fire('Hata', 'Ürün kaydedilemedi', 'error');
        }
    });
}

function editProduct(id) {
    $.get(`${window.API_BASE_URL}/Products/${id}`, function (data) {
        $('#prodId').val(data.id);
        $('#prodName').val(data.name);
        $('#prodDesc').val(data.description);
        $('#prodPrice').val(data.price);
        $('#prodStock').val(data.stock);
        $('#prodImageUrl').val(data.imageUrl);
        showImagePreview(data.imageUrl);

        loadCategoriesForSelect(() => {
            $('#prodCategory').val(data.categoryId);
        });

        $('#prodModalTitle').html('Edit <span class="text-primary">Product</span>');
        $('#prodSaveBtn').text('Update Product');
        $('#productModal').modal('show');
    });
}

function resetProductForm() {
    $('#prodName, #prodDesc, #prodPrice, #prodStock, #prodImageUrl').val('');
    $('#prodCategory').val('');
    showImagePreview('');
}

// Coupon
function saveCoupon() {
    const couponData = {
        code: $('#coupCode').val(),
        discountAmount: parseFloat($('#coupAmount').val()),
        expiryDate: $('#coupExpiry').val(),
        isActive: true
    };

    if (!couponData.code || isNaN(couponData.discountAmount) || !couponData.expiryDate) {
        return Swal.fire('Hata', 'Lütfen tüm kupon alanlarını doldurun', 'error');
    }

    $.ajax({
        url: `${window.API_BASE_URL}/Coupons`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(couponData),
        success: function () {
            Swal.fire('Başarılı', 'Kupon aktif edildi!', 'success');
            $('#couponModal').modal('hide');
            $('#coupCode, #coupAmount, #coupExpiry').val('');
            
            if (typeof fetchCouponsList === "function") fetchCouponsList();
            else fetchDashboardStats();
        },
        error: function (err) {
            Swal.fire('Hata', 'Kupon oluşturulamadı', 'error');
        }
    });
}

function deleteProduct(id) {
    Swal.fire({
        title: 'Ürünü Sil?',
        text: "Bu işlem geri alınamaz!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.API_BASE_URL}/Products/${id}`,
                type: 'DELETE',
                success: function () {
                    Swal.fire('Silindi!', 'Ürün kaldırıldı.', 'success');
                    if (typeof fetchProductsList === "function") fetchProductsList();
                }
            });
        }
    });
}

function deleteCategory(id) {
    Swal.fire({
        title: 'Kategoriyi Sil?',
        text: "Bir kategoriyi silmek içindeki ürünleri etkileyebilir!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${window.API_BASE_URL}/Category/${id}`,
                type: 'DELETE',
                success: function () {
                    Swal.fire('Silindi!', 'Kategori kaldırıldı.', 'success');
                    if (typeof fetchCategoriesList === "function") fetchCategoriesList();
                }
            });
        }
    });
}

function deleteCoupon(id) {
    $.ajax({
        url: `${window.API_BASE_URL}/Coupons/${id}`,
        type: 'DELETE',
        success: function () {
            Swal.fire('Silindi!', 'Kupon devre dışı bırakıldı.', 'success');
            if (typeof fetchCouponsList === "function") fetchCouponsList();
        }
    });
}

// --- Order Management (Admin) ---
function fetchAdminOrders() {
    $('#tableLoader').removeClass('d-none');
    $.ajax({
        url: `${window.API_BASE_URL}/Orders`,
        type: 'GET',
        success: function (data) {
            renderOrdersTable(data);
            $('#tableLoader').addClass('d-none');
        },
        error: function (err) {
            console.error("Order fetch error:", err);
            $('#tableLoader').addClass('d-none');
        }
    });
}

function renderOrdersTable(orders) {
    const tbody = $('#adminOrdersBody');
    if (!tbody.length) return;
    tbody.empty();

    if (!orders || orders.length === 0) {
        tbody.append('<tr><td colspan="7" class="text-center py-4">Sipariş bulunamadı.</td></tr>');
        return;
    }

    orders.sort((a, b) => b.id - a.id);

    orders.forEach(o => {
        const date = new Date(o.orderDate).toLocaleDateString();
        const row = `
            <tr>
                <td class="ps-4 fw-bold text-primary">#ORD-${o.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                            ${o.userName.substring(0, 2).toUpperCase()}
                        </div>
                        <span class="fw-medium">${o.userName}</span>
                    </div>
                </td>
                <td class="text-muted small">${date}</td>
                <td class="text-center"><span class="badge bg-light text-dark border">${o.orderItems.length} ürün</span></td>
                <td class="fw-bold">$${o.totalPrice.toFixed(2)}</td>
                <td class="text-center">
                    <span class="badge bg-primary-soft text-primary px-3 py-2 rounded-pill fw-bold">Tamamlandı</span>
                </td>
                <td class="pe-4 text-end">
                    <button class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm" onclick="viewAdminOrderModal(${o.id})">
                        <i class="fa-solid fa-eye me-1"></i> Yönet
                    </button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

function viewAdminOrderModal(id) {
    Swal.showLoading();
    $.get(`${window.API_BASE_URL}/Orders/${id}`, function (o) {
        Swal.close();
        let itemsHtml = '';
        o.orderItems.forEach(item => {
            itemsHtml += `
                <div class="d-flex align-items-center p-3 border rounded-3 mb-2 bg-light">
                    <div class="avatar bg-white border rounded p-1 me-3" style="width: 50px; height: 50px;">
                        <img src="https://placehold.co/40x40?text=${item.productName.substring(0,1)}" class="img-fluid rounded">
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-bold">${item.productName}</h6>
                        <div class="small text-muted">Birim Fiyat: $${item.unitPrice.toFixed(2)}</div>
                    </div>
                    <div class="text-end fw-bold">
                        <div>Adet: ${item.quantity}</div>
                        <div class="text-primary">$${(item.unitPrice * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `;
        });

        const html = `
            <div class="row g-4">
                <div class="col-md-7 border-end">
                    <h6 class="text-uppercase fw-bold text-muted small mb-3">Sipariş İçeriği</h6>
                    <div class="order-items-list" style="max-height: 400px; overflow-y: auto;">
                        ${itemsHtml}
                    </div>
                </div>
                <div class="col-md-5">
                    <h6 class="text-uppercase fw-bold text-muted small mb-3">Sipariş Detayları</h6>
                    <div class="mb-3">
                        <label class="text-muted small d-block">Sipariş Tarihi</label>
                        <div class="fw-bold">${new Date(o.orderDate).toLocaleString()}</div>
                    </div>
                    <div class="mb-3">
                        <label class="text-muted small d-block">Kullanılan Kupon</label>
                        <div class="fw-bold text-success">${o.couponCode || 'Yok'}</div>
                    </div>
                    <div class="mb-3">
                        <label class="text-muted small d-block">Müşteri Notu</label>
                        <div class="p-2 bg-light rounded text-muted small" style="min-height: 60px;">${o.note || 'Müşteri notu yok.'}</div>
                    </div>
                    <div class="p-3 bg-primary-soft text-primary rounded-4">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Ara Toplam</span>
                            <span>$${(o.totalPrice + o.discountAmount).toFixed(2)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span>İndirim</span>
                            <span class="text-danger">-$${o.discountAmount.toFixed(2)}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-800 fs-5 mt-2 pt-2 border-top">
                            <span>Toplam</span>
                            <span>$${o.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="text-muted small d-block mb-2">Sipariş Durumu</label>
                        <select class="form-select rounded-pill border shadow-none" onchange="updateAdminOrderStatus(${o.id}, this.value)">
                            <option value="Completed" selected>Tamamlandı</option>
                            <option value="Processing">Hazırlanıyor</option>
                            <option value="Shipped">Kargoya Verildi</option>
                            <option value="Delivered">Teslim Edildi</option>
                            <option value="Cancelled">İptal Edildi</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        $('#adminOrderModalBody').html(html);
        $('#adminOrderModal').modal('show');
    });
}

function updateAdminOrderStatus(id, status) {
    $.ajax({
        url: `${window.API_BASE_URL}/Orders/${id}/status`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(status),
        success: function() {
            Toast.fire({
                icon: 'success',
                title: 'Sipariş durumu güncellendi!'
            });
            fetchAdminOrders();
        },
        error: function() {
             Swal.fire('Hata', 'Sipariş durumu güncellenemedi.', 'error');
        }
    });
}

// --- Site Settings ---
function loadSettings() {
    $.get(`${window.API_BASE_URL}/Settings`, function (data) {
        const heroSetting = data.find(s => s.key === 'HeroImageUrl');
        if (heroSetting) {
            $('#heroImageUrlInput').val(heroSetting.value);
            updateHeroPreview(heroSetting.value);
        }
    });
}

function updateHeroPreview(url) {
    $('#heroPreviewImg').attr('src', url);
}

function saveSiteSettings() {
    const url = $('#heroImageUrlInput').val();
    if (!url) return Swal.fire('Hata', 'Hero görsel URL\'si boş olamaz', 'error');

    const token = localStorage.getItem('saleshop_token');
    
    Swal.showLoading();
    $.ajax({
        url: `${window.API_BASE_URL}/Settings`,
        type: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        contentType: 'application/json',
        data: JSON.stringify({ key: 'HeroImageUrl', value: url }),
        success: function () {
            Swal.fire('Başarılı!', 'Site ayarları başarıyla güncellendi.', 'success');
        },
        error: function () {
            Swal.fire('Hata', 'Ayarlar güncellenemedi.', 'error');
        }
    });
}

function handleProductImageUpload(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const statusObj = $('#uploadStatus');
    statusObj.removeClass('d-none text-danger text-success').addClass('text-primary').text('Dönüştürülüyor...').show();

    const MAX_SIDE = 800;
    const QUALITY = 0.82;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            let w = img.width, h = img.height;
            if (w > MAX_SIDE || h > MAX_SIDE) {
                if (w > h) { h = Math.round(h * MAX_SIDE / w); w = MAX_SIDE; }
                else       { w = Math.round(w * MAX_SIDE / h); h = MAX_SIDE; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', QUALITY);
            $('#prodImageUrl').val(base64);
            showImagePreview(base64);
            const kb = Math.round(base64.length * 0.75 / 1024);
            statusObj.removeClass('text-primary').addClass('text-success').text(`Görsel hazır! (~${kb} KB)`);
            setTimeout(() => statusObj.fadeOut(() => statusObj.addClass('d-none')), 3000);
            $(input).val('');
        };
        img.onerror = function () {
            statusObj.removeClass('text-primary').addClass('text-danger').text('Görsel yüklenemedi.');
        };
        img.src = e.target.result;
    };
    reader.onerror = function () {
        statusObj.removeClass('text-primary').addClass('text-danger').text('Dosya okunamadı.');
    };
    reader.readAsDataURL(file);
}

function showImagePreview(src) {
    if (src && src.length > 0 && !src.includes('placehold.co')) {
        $('#imagePreviewIcon').addClass('d-none');
        $('#imagePreviewImg').attr('src', src).removeClass('d-none');
    } else {
        $('#imagePreviewIcon').removeClass('d-none');
        $('#imagePreviewImg').addClass('d-none').attr('src', '');
    }
}
