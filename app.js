// ============================================
// 1) HTML ELEMANLARINA ERİŞİM
// ============================================
const tarihInput = document.getElementById('tarih-input');
const oncekiGunBtn = document.getElementById('onceki-gun');
const sonrakiGunBtn = document.getElementById('sonraki-gun');
const gunAdiP = document.getElementById('gun-adi');
const ozetP = document.getElementById('ozet');
const slotListesi = document.getElementById('slot-listesi');

// ============================================
// 2) TARİH İŞLEMLERİ
// ============================================
function tarihiFormatla(tarih) {
  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, '0');
  const gun = String(tarih.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

const bugun = new Date();
tarihInput.value = tarihiFormatla(bugun);

const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function gunAdiniGoster() {
  const tarih = new Date(tarihInput.value + 'T00:00:00');
  gunAdiP.textContent = GUN_ADLARI[tarih.getDay()];
}

function ozetiGoster() {
  const randevular = tumRandevulariGetir();
  const gunVerisi = randevular[tarihInput.value];
  if (gunVerisi) {
    const toplam = Object.keys(gunVerisi).length;
    let tamamlanan = 0;
    for (const saat in gunVerisi) {
      if (gunVerisi[saat].tamamlandi) tamamlanan++;
    }
    if (tamamlanan > 0) {
      ozetP.textContent = toplam + ' randevu · ' + tamamlanan + ' tamamlandı';
    } else {
      ozetP.textContent = toplam + ' randevu';
    }
  } else {
    ozetP.textContent = 'Randevu yok';
  }
}

// ============================================
// 3) LOCALSTORAGE - VERİ KAYDETME/OKUMA
// ============================================

// Veri yapısı:
// { "2026-09-18": { "09:00": { isim: "Ahmet", tamamlandi: false } } }

function tumRandevulariGetir() {
  const veri = localStorage.getItem('randevular');
  if (!veri) return {};

  const randevular = JSON.parse(veri);

  // Eski formattan (düz string) yeni formata (obje) göç
  for (const tarih in randevular) {
    for (const saat in randevular[tarih]) {
      const deger = randevular[tarih][saat];
      if (typeof deger === 'string') {
        randevular[tarih][saat] = { isim: deger, tamamlandi: false };
      }
    }
  }

  return randevular;
}

function randevuyuGetir(tarih, saat) {
  const randevular = tumRandevulariGetir();
  return randevular[tarih]?.[saat] || null;
}

function randevuyuKaydet(tarih, saat, isim, tamamlandi) {
  const randevular = tumRandevulariGetir();

  if (!randevular[tarih]) {
    randevular[tarih] = {};
  }

  if (isim) {
    randevular[tarih][saat] = { isim: isim, tamamlandi: tamamlandi || false };
  } else {
    delete randevular[tarih][saat];
    if (Object.keys(randevular[tarih]).length === 0) {
      delete randevular[tarih];
    }
  }

  localStorage.setItem('randevular', JSON.stringify(randevular));
}

function randevuyuSil(tarih, saat) {
  randevuyuKaydet(tarih, saat, null, false);
}

function tamamlandiIsaretle(tarih, saat) {
  const randevu = randevuyuGetir(tarih, saat);
  if (randevu) {
    randevuyuKaydet(tarih, saat, randevu.isim, !randevu.tamamlandi);
  }
}

// ============================================
// 4) SAAT SLOTLARINI OLUŞTUR
// ============================================
function slotlariOlustur() {
  slotListesi.innerHTML = '';

  const BASLANGIC_SAAT = 9;
  const BITIS_SAAT = 22;

  for (let saat = BASLANGIC_SAAT; saat < BITIS_SAAT; saat++) {
    const dakikalar = [0, 15, 30, 45];

    for (let i = 0; i < dakikalar.length; i++) {
      const dakika = dakikalar[i];
      const saatStr = String(saat).padStart(2, '0') + ':' + String(dakika).padStart(2, '0');
      const anaSlotMu = (dakika === 0 || dakika === 30);
      const randevu = randevuyuGetir(tarihInput.value, saatStr);
      const musteriAdi = randevu ? randevu.isim : '';
      const tamamlandi = randevu ? randevu.tamamlandi : false;

      // Wrapper (sürükleme arka planını tutar)
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-wrapper';

      // Arka plan - sağa sürükle (tamamlandı)
      const bgTamam = document.createElement('div');
      bgTamam.className = 'slot-bg slot-bg-tamam';
      bgTamam.textContent = '✓ Geldi';

      // Arka plan - sola sürükle (sil)
      const bgSil = document.createElement('div');
      bgSil.className = 'slot-bg slot-bg-sil';
      bgSil.textContent = 'Sil ✕';

      // Slot kendisi
      const slotDiv = document.createElement('div');
      let classlar = 'slot';
      classlar += anaSlotMu ? ' ana' : ' ceyrek';
      if (musteriAdi) classlar += ' dolu';
      if (tamamlandi) classlar += ' tamamlandi';
      slotDiv.className = classlar;

      let icerik = `<span class="saat">${saatStr}</span>`;
      if (musteriAdi) {
        icerik += `<span>`;
        icerik += `<span class="musteri-adi">${musteriAdi}</span>`;
        if (tamamlandi) icerik += `<span class="tik">✓</span>`;
        icerik += `</span>`;
      } else {
        icerik += `<span class="bos-yazi">${anaSlotMu ? '—' : ''}</span>`;
      }
      slotDiv.innerHTML = icerik;

      // Tıklama (isim ekle/düzenle)
      slotDiv.addEventListener('click', function () {
        slotaTiklandi(saatStr);
      });

      // Sürükleme (swipe) - sadece dolu slotlarda
      if (musteriAdi) {
        suruklemeyiEkle(slotDiv, saatStr);
      }

      wrapper.appendChild(bgTamam);
      wrapper.appendChild(bgSil);
      wrapper.appendChild(slotDiv);
      slotListesi.appendChild(wrapper);
    }
  }
}

// ============================================
// 5) SÜRÜKLEME (SWIPE) MEKANİĞİ
// ============================================
function suruklemeyiEkle(slotDiv, saatStr) {
  let baslangicX = 0;
  let suanX = 0;
  let surukleniyor = false;
  let aktif = false;

  function basla(x) {
    baslangicX = x;
    suanX = x;
    surukleniyor = false;
    aktif = true;
    slotDiv.classList.add('swiping');
  }

  function hareket(x) {
    if (!aktif) return;
    suanX = x;
    const fark = suanX - baslangicX;

    if (Math.abs(fark) > 10) {
      surukleniyor = true;
    }

    const sinirli = Math.max(-120, Math.min(120, fark));
    slotDiv.style.transform = 'translateX(' + sinirli + 'px)';
  }

  function bitir() {
    if (!aktif) return;
    aktif = false;
    slotDiv.classList.remove('swiping');
    const fark = suanX - baslangicX;

    if (fark > 80) {
      slotDiv.style.transform = 'translateX(0)';
      tamamlandiIsaretle(tarihInput.value, saatStr);
      slotlariOlustur();
      ozetiGoster();
    } else if (fark < -80) {
      slotDiv.style.transform = 'translateX(-100%)';
      setTimeout(function () {
        randevuyuSil(tarihInput.value, saatStr);
        slotlariOlustur();
        ozetiGoster();
      }, 200);
    } else {
      slotDiv.style.transform = 'translateX(0)';
    }

    if (surukleniyor) {
      slotDiv.addEventListener('click', function engelleyici(e) {
        e.stopPropagation();
        slotDiv.removeEventListener('click', engelleyici, true);
      }, { capture: true, once: true });
    }

    baslangicX = 0;
    suanX = 0;
  }

  // Touch (telefon)
  slotDiv.addEventListener('touchstart', function (e) {
    basla(e.touches[0].clientX);
  }, { passive: true });

  slotDiv.addEventListener('touchmove', function (e) {
    hareket(e.touches[0].clientX);
  }, { passive: true });

  slotDiv.addEventListener('touchend', bitir);

  // Mouse (masaüstü)
  slotDiv.addEventListener('mousedown', function (e) {
    e.preventDefault();
    basla(e.clientX);
  });

  document.addEventListener('mousemove', function (e) {
    hareket(e.clientX);
  });

  document.addEventListener('mouseup', bitir);
}

// ============================================
// 6) SLOT'A TIKLANINCA
// ============================================
function slotaTiklandi(saat) {
  const tarih = tarihInput.value;
  const randevu = randevuyuGetir(tarih, saat);
  const mevcutIsim = randevu ? randevu.isim : '';

  const yeniIsim = prompt(saat + ' için müşteri adı:', mevcutIsim);

  if (yeniIsim === null) return;

  const temizIsim = yeniIsim.trim();
  if (temizIsim) {
    randevuyuKaydet(tarih, saat, temizIsim, false);
  } else {
    randevuyuSil(tarih, saat);
  }

  slotlariOlustur();
  ozetiGoster();
}

// ============================================
// 7) TARİH GEÇİŞ BUTONLARI
// ============================================
function gunuDegistir(fark) {
  const tarih = new Date(tarihInput.value + 'T00:00:00');
  tarih.setDate(tarih.getDate() + fark);
  tarihInput.value = tarihiFormatla(tarih);
  gunAdiniGoster();
  ozetiGoster();
  slotlariOlustur();
}

tarihInput.addEventListener('change', function () {
  gunAdiniGoster();
  ozetiGoster();
  slotlariOlustur();
});

oncekiGunBtn.addEventListener('click', function () {
  gunuDegistir(-1);
});

sonrakiGunBtn.addEventListener('click', function () {
  gunuDegistir(1);
});

// ============================================
// 8) SAYFA İLK AÇILDIĞINDA
// ============================================
gunAdiniGoster();
ozetiGoster();
slotlariOlustur();
