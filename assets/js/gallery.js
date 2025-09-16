var mousePos = { x: 0, y: 0 };
var galleryPos = { x: 0, y: 0};
var galleryBounds = { top: 0, right: 0, bottom: 0, left: 0 };

// Variabel untuk modal
const modal = $('#image-modal');
const modalImg = modal.find('.modal-image');
const modalCaption = modal.find('.modal-caption');
let originalThumb = null; 

// <-- PERUBAHAN: Tambahkan flag untuk status modal
let isModalOpen = false;

$(document).ready(function() {
  
  var gallery = $('div#gallery-box');
  galleryPos = { x: gallery.position().left + (gallery.width() / 2), y: gallery.position().top + (gallery.height() / 2) };
  galleryBounds = { top: gallery.position().top, right: gallery.position().left + gallery.width(), bottom: gallery.position().top + gallery.height(), left: gallery.position().left };
  
  $(gallery).on('mousemove', function(e) {
    // <-- PERUBAHAN: Hentikan fungsi jika modal terbuka
    if (isModalOpen) return; 
    
    mousePos = {x: e.pageX, y: e.pageY};
    calcOffset();
    move();
    parallaxPics();
  });
  
  $(gallery).on('mouseleave', function() {
    // <-- PERUBAHAN: Jangan reset jika modal terbuka
    if (isModalOpen) return;

    $('div#gallery-box div.gallery').attr('data-offset-x', '0');
    $('div#gallery-box div.gallery').attr('data-offset-y', '0');
    
    $('div.item img').each(function() {
      $(this).css('left', '50%');
      $(this).css('top', '50%');
    });
    move();
  });
  
  $(window).resize(function() {
    galleryPos = { x: gallery.position().left + (gallery.width() / 2), y: gallery.position().top + (gallery.height() / 2) };
    galleryBounds = { top: gallery.position().top, right: gallery.position().left + gallery.width(), bottom: gallery.position().top + gallery.height(), left: gallery.position().left };
  });
  
  $('div.overlay a').on('mouseleave', function() {
    $(this).addClass('leave');
    var $element = $(this);
    setTimeout(function() {
      $element.removeClass('leave');
    }, 500);
  });

  // === LOGIKA MODAL ===

  $('div.item').on('click', function() {
    // <-- PERUBAHAN: Set flag ke true
    isModalOpen = true; 
    
    // <-- PERUBAHAN: Reset posisi galeri ke tengah agar tidak aneh saat dibekukan
    $('div#gallery-box div.gallery').attr('data-offset-x', '0').attr('data-offset-y', '0');
    move();
    $('div.item img').each(function() {
      $(this).css({'left': '50%', 'top': '50%'});
    });
    
    originalThumb = $(this);
    const imgSrc = originalThumb.find('img').attr('src');
    const imgDescription = originalThumb.data('description') || "Tidak ada deskripsi.";

    const rect = originalThumb[0].getBoundingClientRect();

    modalImg.attr('src', imgSrc);
    modalCaption.text(imgDescription);

    const scaleX = rect.width / modalImg.get(0).naturalWidth;
    const scaleY = rect.height / modalImg.get(0).naturalHeight;
    const scale = Math.max(scaleX, scaleY) * (modalImg.width() / rect.width * 1.05);

    modalImg.css({
        'transform': `translate(${rect.left - (window.innerWidth / 2) + (rect.width / 2)}px, ${rect.top - (window.innerHeight / 2) + (rect.height / 2)}px) scale(${scale})`,
        'transform-origin': 'top left',
        'opacity': '0'
    });

    modal.addClass('active');

    setTimeout(() => {
        modalImg.css({
            'transform': 'translate(0, 0) scale(1)',
            'transform-origin': 'center center',
            'opacity': '1'
        });
    }, 50);
    $('body').addClass('modal-is-active');
    
setTimeout(() => {
        modalImg.css({
            'transform': 'translate(0, 0) scale(1)',
            'transform-origin': 'center center',
            'opacity': '1'
        });
    }, 50);
  });

  function closeModal() {
      // <-- PERUBAHAN: Set flag kembali ke false
      $('body').removeClass('modal-is-active');

      isModalOpen = false;

      const rect = originalThumb[0].getBoundingClientRect();
      const scaleX = rect.width / modalImg.get(0).naturalWidth;
      const scaleY = rect.height / modalImg.get(0).naturalHeight;
      const scale = Math.max(scaleX, scaleY) * (modalImg.width() / rect.width * 1.05);

      modalImg.css({
          'transform': `translate(${rect.left - (window.innerWidth / 2) + (rect.width / 2)}px, ${rect.top - (window.innerHeight / 2) + (rect.height / 2)}px) scale(${scale})`,
          'transform-origin': 'top left',
          'opacity': '0'
      });
      modal.removeClass('active');
  }

  $('.modal-close').on('click', closeModal);
  modal.on('click', function(e) {
      if ($(e.target).is(modal)) {
          closeModal();
      }
  });

});

// Fungsi-fungsi lama Anda (tidak perlu diubah)
function calcOffset() {
  var newX = mousePos.x - galleryPos.x;
  newX = invertValue(newX) / 2;
  var newY = mousePos.y - galleryPos.y;
  newY = invertValue(newY);
  $('div#gallery-box div.gallery').attr('data-offset-x', newX);
  $('div#gallery-box div.gallery').attr('data-offset-y', newY);
}
function calcPercentage() {
  var horizontal = ((mousePos.x - galleryBounds.left) / $('div#gallery-box').width()) * 100;
  var vertical = ((mousePos.y - galleryBounds.top) / $('div#gallery-box').height()) * 100;
  return { h: horizontal, v: vertical };
}
function move() {
  var newX = $('div#gallery-box div.gallery').attr('data-offset-x');
  var newY = $('div#gallery-box div.gallery').attr('data-offset-y');
  $('div#gallery-box div.gallery').css('transform', 'translate(-50%, -50%) translate('+newX+'px, '+newY+'px)');  
}
function parallaxPics() {
  var percentages = calcPercentage();
  $('div.item img').each(function() {
    $(this).css('left', (100 -percentages.h)+'%');
    $(this).css('top', (100 -percentages.v)+'%');
  });
}
function invertValue(num) {
  if(Math.sign(num) == 1) {
    num = -Math.abs(num);
  }else {
    num = Math.abs(num);
  } 
  return num;
}
 