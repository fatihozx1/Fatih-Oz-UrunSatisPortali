let allProducts = [];
let allCategories = [];
let currentProductStock = 0;
let cart = JSON.parse(localStorage.getItem('saleshop_cart')) || [];

$(document).ready(function () {
    // Initial data fetch
    fetchProducts();
    fetchCategories();
    updateCartUI();
    loadSiteSettings();

    // Check if we are on the Product Detail page
    const currentProdId = $('#currentProductId').val();
    if (currentProdId) {
        fetchProductDetail(currentProdId);
    }

    // Remove loader after half a second
    setTimeout(() => {
        $('#pageLoader').fadeOut();
    }, 500);
});

// --- Data Fetching ---
function fetchProducts() {
    $('#gridLoader').removeClass('d-none');
    $.get(`${window.API_BASE_URL}/Products`, function (data) {
        allProducts = data;
        renderProducts(allProducts);
        $('#gridLoader').addClass('d-none');
    }).fail(function (err) {
        console.error("Error fetching products:", err);
        Swal.fire('Hata', 'Ürünler API\'den yüklenemedi.', 'error');
        $('#gridLoader').addClass('d-none');
    });
}

function fetchCategories() {
    $.get(`${window.API_BASE_URL}/Category`, function (data) {
        allCategories = data;
        renderCategories(data);
    }).fail(function (err) {
        console.error("Error fetching categories:", err);
    });
}

// --- Rendering ---
function renderProducts(products) {
    const container = $('#productContainer');
    container.empty();

    if (products.length === 0) {
        container.append('<div class="col-12 text-center py-5"><p class="text-muted">No products found in this category.</p></div>');
        return;
    }

    products.forEach((p, index) => {
        const detailUrl = `/Home/ProductDetail?id=${p.id}`;
        const card = `
            <div class="col-sm-6 col-md-4 col-xl-3 fade-in" style="animation-delay: ${index * 0.05}s">
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="window.location.href='${detailUrl}'" style="cursor:pointer">
                        <span class="category-badge">${p.categoryName}</span>
                        <img src="${p.imageUrl}" class="product-img" alt="${p.name}" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
                        <div class="product-overlay">
                            <a href="${detailUrl}" class="btn btn-white btn-sm rounded-pill px-3 shadow-sm">
                                <i class="fa-solid fa-eye me-1"></i> View
                            </a>
                        </div>
                    </div>
                    <div class="p-4">
                        <h5 class="fw-bold mb-1 text-truncate" title="${p.name}"><a href="${detailUrl}" class="text-decoration-none text-dark">${p.name}</a></h5>
                        <p class="text-muted small mb-3 text-truncate-2" style="height: 40px;">${p.description || 'No description available.'}</p>
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="fs-5 fw-bold text-primary">$${p.price.toFixed(2)}</span>
                            <button class="btn btn-primary btn-sm px-3 rounded-pill" onclick="addToCart(${p.id})">
                                <i class="fa-solid fa-plus me-1"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });
}

function renderCategories(categories) {
    const container = $('#categoryContainer');
    // Keep the "All" pill
    categories.forEach(c => {
        container.append(`<div class="filter-pill" onclick="filterByCategory(${c.id}, this)">${c.name}</div>`);
    });
}

// --- Filtering ---
function filterByCategory(categoryId, element) {
    $('.filter-pill').removeClass('active');
    if (element) {
        $(element).addClass('active');
    } else {
        $('.filter-pill').first().addClass('active');
    }

    if (categoryId === 0) {
        renderProducts(allProducts);
        $('#gridTitle').text('Latest Products');
    } else {
        const filtered = allProducts.filter(p => p.categoryId === categoryId);
        const catName = allCategories.find(c => c.id === categoryId)?.name || 'Filtered Products';
        renderProducts(filtered);
        $('#gridTitle').text(catName);
    }
}

// --- Product Detail Page ---
function fetchProductDetail(id) {
    $.get(`${window.API_BASE_URL}/Products/${id}`, function (p) {
        // Update UI
        $('#breadcrumbCategory').text(p.categoryName);
        $('#breadcrumbProduct').text(p.name);
        $('#detailBadge').text(p.categoryName);
        $('#detailTitle').text(p.name);
        $('#detailPrice').text(`$${p.price.toFixed(2)}`);
        $('#detailOldPrice').text(`$${(p.price * 1.2).toFixed(2)}`); // Simulated old price
        $('#detailDescription').text(p.description || 'This premium product is crafted with the highest standards of quality.');
        $('#detailImage').attr('src', p.imageUrl);
        $('#detailStock').text(p.stock > 0 ? `Stokta Var (${p.stock})` : 'Stokta Yok');
        currentProductStock = p.stock;
        
        if (p.stock <= 0) {
            $('.qty-control').addClass('opacity-50 pointer-events-none');
            $('.btn-primary-gradient').attr('disabled', true).text('Stokta Yok');
        } else {
            $('.qty-control').removeClass('opacity-50 pointer-events-none');
            $('.btn-primary-gradient').attr('disabled', false).html('<i class="fa-solid fa-cart-plus me-2"></i> Add to Cart');
            $('#detailQty').text(1); // Reset to 1
        }

        // Fetch Related Products (from same category)
        fetchRelatedProducts(p.categoryId, p.id);
    });
}

function updateDetailQty(change) {
    let current = parseInt($('#detailQty').text());
    let newVal = current + change;

    if (newVal < 1) return;
    if (newVal > currentProductStock) {
        Toast.fire({
            icon: 'warning',
            title: `Stokta sadece ${currentProductStock} adet var!`
        });
        return;
    }

    $('#detailQty').text(newVal);
}

function addToCartFromDetail() {
    const id = parseInt($('#currentProductId').val());
    const qty = parseInt($('#detailQty').text());
    addToCart(id, qty);
}

function fetchRelatedProducts(categoryId, excludeId) {
    $.get(`${window.API_BASE_URL}/Products`, function (data) {
        const related = data
            .filter(p => p.categoryId === categoryId && p.id !== excludeId)
            .slice(0, 4);
        renderRelatedProducts(related);
    });
}

function renderRelatedProducts(products) {
    const container = $('#relatedContainer');
    container.empty();

    if (products.length === 0) {
        container.append('<div class="col-12 text-center py-4"><p class="text-muted">No related products found.</p></div>');
        return;
    }

    products.forEach(p => {
        const detailUrl = `/Home/ProductDetail?id=${p.id}`;
        const card = `
            <div class="col-sm-6 col-md-3">
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="window.location.href='${detailUrl}'" style="cursor:pointer; height: 200px;">
                        <img src="${p.imageUrl}" class="product-img" alt="${p.name}" style="height: 100%; object-fit: cover;">
                    </div>
                    <div class="p-3">
                        <h6 class="fw-bold mb-1 text-truncate">${p.name}</h6>
                        <div class="text-primary fw-bold">$${p.price.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });
}

// --- Cart Logic (LocalStorage) ---
function addToCart(productId, qty = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.imageUrl,
            qty: qty
        });
    }

    saveCart();
    updateCartUI();
    
    // Feedback
    Toast.fire({
        icon: 'success',
        title: `${product.name} sepete eklendi`
    });

    if ($('#productModal').hasClass('show')) {
        $('#productModal').modal('hide');
    }
}

function saveCart() {
    localStorage.setItem('saleshop_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const badge = $('#cartBadge');
    const container = $('#cartItems');
    const footer = $('#cartFooter');
    const emptyMsg = $('.empty-cart-msg');

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Badge
    if (totalItems > 0) {
        badge.text(totalItems).removeClass('d-none');
        footer.removeClass('d-none');
        emptyMsg.addClass('d-none');
    } else {
        badge.addClass('d-none');
        footer.addClass('d-none');
        emptyMsg.removeClass('d-none');
    }

    // List
    container.find('.cart-item').remove();
    cart.forEach(item => {
        const itemHtml = `
            <div class="cart-item">
                <img src="${item.img}" class="cart-item-img" alt="${item.name}" onerror="this.src='https://placehold.co/80x80?text=No+Image'">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-0 text-truncate" style="max-width: 150px;">${item.name}</h6>
                    <div class="text-primary fw-bold mb-2">$${(item.price * item.qty).toFixed(2)}</div>
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="qty-control shadow-none border">
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                            <span class="px-2 small fw-bold">${item.qty}</span>
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <button class="btn btn-link text-danger p-0" onclick="removeFromCart(${item.id})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.append(itemHtml);
    });

    $('#cartTotal').text(`$${totalPrice.toFixed(2)}`);
}

function updateCartQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(1, item.qty + change);
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function checkout() {
    const token = localStorage.getItem('saleshop_token');
    if (!token) {
        Swal.fire({
            title: 'Please Login',
            text: 'You need to be logged in to complete your checkout.',
            icon: 'info',
            confirmButtonText: 'Go to Login'
        }).then(() => {
            window.location.href = '/Home/Login';
        });
        return;
    }

    if (cart.length === 0) {
        return Swal.fire('Sepet Boş', 'Ödeme yapmadan önce lütfen sepetinize ürün ekleyin.', 'warning');
    }

    window.location.href = '/Home/Checkout';
}

let checkoutDiscount = 0;
let appliedCouponCode = "";

// --- Checkout Page ---
function renderCheckoutSummary() {
    const container = $('#checkoutItems');
    if (!container.length) return;

    container.empty();
    let total = 0;
    checkoutDiscount = 0;
    appliedCouponCode = "";

    cart.forEach(item => {
        total += item.price * item.qty;
        const html = `
            <div class="d-flex align-items-center mb-4 p-3 border rounded-4 bg-white shadow-sm">
                <img src="${item.img}" class="rounded-3 me-3" style="width: 70px; height: 70px; object-fit: cover;" onerror="this.src='https://placehold.co/80x80?text=No+Image'">
                <div class="flex-grow-1">
                    <h6 class="fw-bold mb-1">${item.name}</h6>
                    <div class="text-muted small">Qty: ${item.qty} × $${item.price.toFixed(2)}</div>
                </div>
                <div class="fw-bold text-primary">$${(item.price * item.qty).toFixed(2)}</div>
            </div>
        `;
        container.append(html);
    });

    $('#checkoutSubtotal').text(`$${total.toFixed(2)}`);
    $('#checkoutTotal').text(`$${total.toFixed(2)}`);
    $('#couponRow').addClass('d-none');
    $('#couponMsg').addClass('d-none');
}

function applyCoupon() {
    const code = $('#orderCoupon').val().trim();
    if (!code) return;

    const token = localStorage.getItem('saleshop_token');
    const msgEl = $('#couponMsg');

    $.ajax({
        url: `${window.API_BASE_URL}/Coupons/validate/${code}`,
        type: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (coupon) {
            let subtotal = 0;
            cart.forEach(item => subtotal += item.price * item.qty);

            let discount = 0;
            if (coupon.isPercentage) {
                discount = (subtotal * coupon.discountAmount) / 100;
            } else {
                discount = coupon.discountAmount;
            }

            checkoutDiscount = Math.min(discount, subtotal);
            appliedCouponCode = coupon.code;

            const total = subtotal - checkoutDiscount;

            // Update UI
            $('#checkoutDiscount').text(`-$${checkoutDiscount.toFixed(2)}`);
            $('#checkoutTotal').text(`$${total.toFixed(2)}`);
            $('#couponRow').removeClass('d-none');
            
            msgEl.removeClass('d-none').removeClass('text-danger').addClass('text-success')
                 .html(`<i class="fa-solid fa-check me-1"></i> Coupon "${coupon.code}" applied!`);
            
            Toast.fire({ icon: 'success', title: 'Coupon applied!' });
        },
        error: function (err) {
            msgEl.removeClass('d-none').removeClass('text-success').addClass('text-danger')
                 .html(`<i class="fa-solid fa-xmark me-1"></i> Invalid or expired coupon.`);
            
            // Reset UI
            let subtotal = 0;
            cart.forEach(item => subtotal += item.price * item.qty);
            $('#checkoutTotal').text(`$${subtotal.toFixed(2)}`);
            $('#couponRow').addClass('d-none');
            checkoutDiscount = 0;
            appliedCouponCode = "";
        }
    });
}

function placeOrder() {
    const token = localStorage.getItem('saleshop_token');
    if (!token) return window.location.href = '/Home/Login';

    const orderData = {
        couponCode: appliedCouponCode,
        note: $('#orderNote').val(),
        orderItems: cart.map(item => ({
            productId: item.id,
            quantity: item.qty
        }))
    };

    if (orderData.orderItems.length === 0) return;

    Swal.fire({
        title: 'Siparişi Onayla?',
        text: 'Bu siparişi vermek istediğinizden emin misiniz?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Evet, Siparişi Ver',
        cancelButtonText: 'İptal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.showLoading();
            $.ajax({
                url: `${window.API_BASE_URL}/Orders`,
                type: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                contentType: 'application/json',
                data: JSON.stringify(orderData),
                success: function (data) {
                    Swal.fire({
                        title: 'Mükemmel!',
                        text: 'Siparişiniz başarıyla oluşturuldu.',
                        icon: 'success',
                        timer: 3000
                    });

                    // Success! Clear cart
                    cart = [];
                    saveCart();
                    updateCartUI();

                    // Redirect to My Orders
                    setTimeout(() => {
                        window.location.href = '/Home/MyOrders';
                    }, 2500);
                },
                error: function (err) {
                    console.error("Order error:", err);
                    const msg = err.responseJSON && typeof err.responseJSON === 'string' 
                        ? err.responseJSON 
                        : "Bir şeyler yanlış gitti. Lütfen stok durumunu veya oturumunuzu kontrol edin.";
                    Swal.fire('Hata', msg, 'error');
                }
            });
        }
    });
}

// --- My Orders Page ---
function fetchMyOrders() {
    const container = $('#myOrdersContainer');
    if (!container.length) return;

    const token = localStorage.getItem('saleshop_token');
    if (!token) {
        container.html('<div class="text-center py-5"><h4 class="text-muted">Siparişlerinizi görüntülemek için lütfen giriş yapın.</h4></div>');
        return;
    }

    $.ajax({
        url: `${window.API_BASE_URL}/Orders/my-orders`,
        type: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (orders) {
            container.empty();
            if (orders.length === 0) {
                container.append('<div class="text-center py-5"><h4 class="text-muted text-center opacity-50">Henüz bir sipariş vermediniz.</h4></div>');
                return;
            }

            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            orders.forEach(o => {
                const date = new Date(o.orderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                const time = new Date(o.orderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                
                const itemAvatars = o.orderItems.slice(0, 3).map(item => `<img src="https://placehold.co/45x45?text=${item.productName.substring(0,1)}" class="avatar-stack-item shadow-sm">`).join('');
                const extraCount = o.orderItems.length > 3 ? `<div class="avatar-stack-item d-flex align-items-center justify-content-center bg-light text-muted small shadow-sm">+${o.orderItems.length - 3}</div>` : '';

                const orderHtml = `
                    <div class="order-card p-4 border border-light mb-4 fade-in">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <div class="text-primary fw-bold small">#ORD-${o.id}</div>
                                <div class="fw-800 fs-5">${date}</div>
                                <div class="text-muted small">${time}</div>
                            </div>
                            <div class="col-md-4 py-3 py-md-0">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-stack">${itemAvatars}${extraCount}</div>
                                    <div class="small fw-bold text-secondary">${o.orderItems.length} Ürün</div>
                                </div>
                            </div>
                            <div class="col-md-2 text-md-center py-2 py-md-0">
                                <span class="order-status-badge">Tamamlandı</span>
                            </div>
                            <div class="col-md-3 text-md-end">
                                <div class="h4 mb-0 fw-800 text-primary">$${o.totalPrice.toFixed(2)}</div>
                                <button class="btn btn-link btn-sm text-primary p-0 fw-bold text-decoration-none">Fatura <i class="fa-solid fa-file-invoice ms-1"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                container.append(orderHtml);
            });
        },
        error: function(err) {
             container.html('<div class="text-center py-5"><h4 class="text-danger">Siparişler yüklenemedi. Lütfen tekrar deneyin.</h4></div>');
        }
    });
}

// --- Auth ---
function register() {
    const fullName = $('#regFullName').val();
    const userName = $('#regUserName').val();
    const email = $('#regEmail').val();
    const password = $('#regPassword').val();
    const confirmPassword = $('#regConfirmPassword').val();

    if (!fullName || !userName || !email || !password || !confirmPassword) {
        return Swal.fire('Hata', 'Lütfen tüm alanları doldurun', 'error');
    }

    if (password !== confirmPassword) {
        return Swal.fire('Hata', 'Şifreler eşleşmiyor', 'error');
    }

    Swal.showLoading();

    $.ajax({
        url: `${window.API_BASE_URL}/Account/register`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            userName: userName,
            email: email,
            password: password,
            fullName: fullName
        }),
        success: function (data) {
            Swal.fire({
                title: 'Başarılı!',
                text: 'Hesabınız başarıyla oluşturuldu.',
                icon: 'success',
                timer: 2000
            });

            // Store user data
            localStorage.setItem('saleshop_token', data.token);
            localStorage.setItem('saleshop_user', JSON.stringify({
                id: data.id,
                userName: data.userName,
                email: data.email
            }));

            // Redirect home
            setTimeout(() => {
                window.location.href = '/Home/Index';
            }, 2000);
        },
        error: function (err) {
            console.error("Registration error:", err);
            const msg = err.responseJSON && typeof err.responseJSON === 'string' 
                ? err.responseJSON 
                : (err.responseJSON && err.responseJSON[0] && err.responseJSON[0].description)
                    ? err.responseJSON[0].description
                    : "Kayıt işlemi başarısız. Lütfen tekrar deneyin.";
            Swal.fire('Hata', msg, 'error');
        }
    });
}

function loadSiteSettings() {
    $.get(`${window.API_BASE_URL}/Settings`, function (data) {
        const heroSetting = data.find(s => s.key === 'HeroImageUrl');
        if (heroSetting && heroSetting.value) {
            $('#heroImage').attr('src', heroSetting.value);
        }
    });
}

// --- Utils ---
// Toast is now globally defined in site.js

