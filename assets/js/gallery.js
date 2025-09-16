$(document).ready(function() {
  
  // === DEKLARASI VARIABEL GLOBAL ===
  const gallery = $('#gallery-box');
  const galleryElement = $('div.gallery');
  const modal = $('#image-modal');
  const modalImg = modal.find('.modal-image');
  const modalCaption = modal.find('.modal-caption');
  
  let galleryPos = { x: 0, y: 0 };
  let galleryBounds = { top: 0, right: 0, bottom: 0, left: 0 };
  let mousePos = { x: 0, y: 0 };
  
  let originalThumb = null;
  let scale = 1.0;
  
  // Variabel Status
  let isModalOpen = false;
  let isHoveringItem = false;
  let isIdle = false;
  let idleTimer, idleInterval;

  // === FUNGSI UTAMA ===

  function updateGalleryPositions() {
    galleryPos = { x: gallery.position().left + (gallery.width() / 2), y: gallery.position().top + (gallery.height() / 2) };
    galleryBounds = { top: gallery.position().top, right: gallery.position().left + gallery.width(), bottom: gallery.position().top + gallery.height(), left: gallery.position().left };
  }

  function move() {
    const offsetX = $('div#gallery-box div.gallery').attr('data-offset-x') || 0;
    const offsetY = $('div#gallery-box div.gallery').attr('data-offset-y') || 0;
    galleryElement.css('transform', `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`);
  }

 function calcOffset() {
  // 1. Hitung pergeseran mentah seperti sebelumnya (untuk arah)
  let rawX = mousePos.x - galleryPos.x;
  rawX = invertValue(rawX) / 10;
  let rawY = mousePos.y - galleryPos.y;
  rawY = invertValue(rawY) / 20;

  // 2. Hitung batas geser MAKSIMUM yang diizinkan untuk menyisakan border 50px
  const viewportWidth = $(window).width();
  const viewportHeight = $(window).height();
  const galleryWidth = galleryElement.width();
  const galleryHeight = galleryElement.height();
  
  // Rumus: (Lebar galeri setelah di-zoom - (Lebar layar - 100px border)) / 2
  const maxPanX = Math.max(0, (galleryWidth * scale - (viewportWidth - 100)) / 2);
  const maxPanY = Math.max(0, (galleryHeight * scale - (viewportHeight - 100)) / 2);
  
  // 3. Batasi nilai pergeseran agar tidak melebihi batas aman
  const newX = Math.max(-maxPanX, Math.min(rawX, maxPanX));
  const newY = Math.max(-maxPanY, Math.min(rawY, maxPanY));
  
  // 4. Terapkan nilai yang sudah dibatasi
  $('div#gallery-box div.gallery').attr('data-offset-x', newX);
  $('div#gallery-box div.gallery').attr('data-offset-y', newY);
}

  function parallaxPics() {
  const w = $('div#gallery-box').width();
  const h = $('div#gallery-box').height();
  if (w === 0 || h === 0) return;
  const horizontal = ((mousePos.x - galleryBounds.left) / w) * 100;
  const vertical = ((mousePos.y - galleryBounds.top) / h) * 100;

  $('div.item img').each(function() {
    // Ubah angka pembagi di sini untuk efek yang lebih subtil
    const moveX = (50 - (horizontal - 50) / 40); // Diubah dari 10 menjadi 40
    const moveY = (50 - (vertical - 50) / 40);   // Diubah dari 10 menjadi 40
    $(this).css({ 'left': moveX + '%', 'top': moveY + '%' });
  });
}

  function invertValue(num) {
    return num > 0 ? -Math.abs(num) : Math.abs(num);
  }

  // === LOGIKA IDLE ===

  function startIdleAnimation() {
    if (isModalOpen || isIdle) return;
    isIdle = true;

    // Ganti fungsi ini di dalam startIdleAnimation()
    const driftToNewPosition = () => {
      // 1. PERKECIL RENTANG ZOOM
      // Sebelumnya: 1.1 + Math.random() * 0.2  (110% - 130%)
      // Sekarang: 1.0 + Math.random() * 0.05 (100% - 105%) -> Sangat halus
      const randomScale = 1.0 + Math.random() * 0.05;

      // 2. PERKECIL JARAK GERAKAN (PAN)
      const extraScale = randomScale - 1.0;
      // Sebelumnya: const panFactor = 400;
      // Sekarang: panFactor jauh lebih kecil
      const panFactor = 150; 
      const maxPan = extraScale * panFactor;
      
      const randomX = (Math.random() - 0.5) * maxPan;
      const randomY = (Math.random() - 0.5) * maxPan;
      
      // Sisa kode di bawah ini tidak perlu diubah
      scale = randomScale;
      
      galleryElement.css('transform', `translate(-50%, -50%) translate(${randomX}px, ${randomY}px) scale(${scale})`);
      
      const galleryRect = galleryElement[0].getBoundingClientRect();
      mousePos = { 
        x: galleryRect.left + (galleryRect.width / 2) - randomX, 
        y: galleryRect.top + (galleryRect.height / 2) - randomY 
      };
      parallaxPics();
    };

    driftToNewPosition();
    idleInterval = setInterval(driftToNewPosition, 6000);
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    clearInterval(idleInterval);

    if (isIdle) {
      isIdle = false;
      galleryElement.addClass('is-resetting');
      scale = 1.0;
      $('div#gallery-box div.gallery').attr('data-offset-x', '0').attr('data-offset-y', '0');
      move();
      setTimeout(() => { galleryElement.removeClass('is-resetting'); }, 600);
    }
    
    if (!isHoveringItem && !isModalOpen) {
      idleTimer = setTimeout(startIdleAnimation, 4000);
    }
  }

  // === EVENT LISTENERS ===

  // Inisialisasi posisi
  updateGalleryPositions();
  $(window).resize(updateGalleryPositions);

  // Gerakan mouse utama
  $(window).on('mousemove', function(e) {
    if (isModalOpen || isIdle || isHoveringItem) return;

    mousePos = { x: e.pageX, y: e.pageY };
    calcOffset();
    move();
    parallaxPics();
    resetIdleTimer();
  });

  // Pause saat hover gambar
  $('div.item').hover(
    function() { // Masuk
      isHoveringItem = true;
      resetIdleTimer();
    },
    function() { // Keluar
      isHoveringItem = false;
      resetIdleTimer();
    }
  );

  galleryElement.on('wheel', function(e) {
    if (isModalOpen) { e.preventDefault(); return; }
    e.preventDefault();
    
    const delta = e.originalEvent.deltaY > 0 ? -0.03 : 0.1;
    scale += delta;

    // --- LOGIKA BATAS ZOOM-OUT ---
    const viewportWidth = $(window).width();
    const viewportHeight = $(window).height();
    const galleryWidth = galleryElement.width();
    const galleryHeight = galleryElement.height();

    // Diubah dari 200 menjadi 100 (untuk border 50px di setiap sisi)
    const targetWidth = viewportWidth - 100;
    const targetHeight = viewportHeight - 100;

    const minScaleX = targetWidth / galleryWidth;
    const minScaleY = targetHeight / galleryHeight;
    const minScale = Math.max(minScaleX, minScaleY);

    scale = Math.max(minScale, Math.min(scale, 2.5));
    
    // Sisa kode tidak berubah
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    $(this).css('transform-origin', `${x}% ${y}%`);
    move();
    resetIdleTimer();
  });

  // Double click untuk reset zoom
  galleryElement.on('dblclick', function() {
    scale = 1.0;
    $(this).css('transform-origin', 'center center');
    move();
  });

  // LOGIKA MODAL
  $('div.item').on('click', function() {
    isModalOpen = true;
    resetIdleTimer(); // Hentikan semua animasi idle
    
    // Transisi galeri kembali ke tengah
    galleryElement.addClass('is-resetting');
    scale = 1.0;
    $('div#gallery-box div.gallery').attr('data-offset-x', '0').attr('data-offset-y', '0');
    move();
    setTimeout(() => { galleryElement.removeClass('is-resetting'); }, 600);
    
    // Logika buka modal
    originalThumb = $(this);
    $('body').addClass('modal-is-active');
    modal.addClass('active');
    // ... (sisa logika modal Anda)
    const imgSrc = originalThumb.find('img').attr('src');
    const imgDescription = originalThumb.data('description') || " ";
    modalImg.attr('src', imgSrc);
    modalCaption.text(imgDescription);
    setTimeout(() => { modalImg.css('opacity', '1'); modalCaption.css('opacity', '1'); }, 50);
  });

  function closeModal() {
    modal.removeClass('active');
    $('body').removeClass('modal-is-active');
    modalImg.css('opacity', '0');
    modalCaption.css('opacity', '0');
    isModalOpen = false;
    resetIdleTimer(); // Mulai lagi countdown idle
  }

  $('.modal-close').on('click', closeModal);
  modal.on('click', function(e) { if ($(e.target).is(modal)) { closeModal(); } });
  
  // Mulai timer idle saat halaman dimuat
  resetIdleTimer();
});