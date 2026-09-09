/* WORK — carousel 3D loop. Diport dari hero OCULAR (se-garis huyml.co), lalu dihybrida ke arah huyml:
   - intro kocokan 5 babak ±3,5 dtk: SPLIT lebar -> RIFFLE-SILANG tukar sisi -> SQUARE ->
     FAN kipas busur -> DEAL flip tengah-ke-luar + snap hero; bisa skip via scroll/klik;
     LQIP blur-up (main instan, tajam progresif)
   - komposisi sebar: pusat + 4 sudut mengintip + 2 melayang + 2 sliver tepi (9 tampil, 1 sembunyi)
   - fly-by kamera saat transisi: kartu keluar menekuk ke arah kamera (translateZ+rotateY liar),
     kartu masuk muncul dari kedalaman
   - teks info & counter ganti INSTAN saat indeks aktif berubah (tanpa nunggu scroll settle)
   - fling governor: momentum sentuh/lempar diganti luncuran berpagu maks 2.5 section
   Tanpa GSAP / reduced-motion → html.no-wn → fallback grid CSS. */
(function () {
  'use strict';
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm || !window.gsap) { document.documentElement.classList.add('no-wn'); return; }

  var slideData = [
    { cat: 'Editorial · Archive', title: 'Aethelgard — The Hidden Archive', desc: 'Arsip narasi fantasi: scroll berlapis, cahaya lilin, rahasia yang terbuka pelan.' },
    { cat: 'F&B · Brand', title: 'Vroeger Koffiehuis', desc: 'Rasa masa lalu diseduh hari ini — hangat, nostalgik, rendah hati.' },
    { cat: 'Type · Studio', title: 'LEXIER®', desc: 'Studio tipografi eksperimental: lebih baik salah daripada membosankan.' },
    { cat: 'Fashion · Editorial', title: 'ÉLAN — New Mood', desc: 'Editorial garis tegas dengan napas haute couture.' },
    { cat: 'Horlogerie · Luxury', title: 'VIPERA — Émeraude', desc: 'Waktu melingkar seperti ular — kemewahan yang sabar.' },
    { cat: 'Immersive · 3D', title: 'AELIAN — The Light Within', desc: 'Perjalanan cahaya & ruang; landing imersif yang tenang.' },
    { cat: 'Fashion · E-commerce', title: 'Cerulean Chic', desc: 'Katalog biru yang effortless — lookbook bersih beritme editorial.' },
    { cat: 'Fashion · Brand', title: 'CHERIEL', desc: 'Keanggunan abadi; guardians of grace dalam landing yang lembut.' },
    { cat: 'Cinematic · Portfolio', title: 'OCULAR', desc: 'Versi sinematik final — portfolio yang bergerak seperti film.' },
    { cat: 'Jewelry · Brand', title: 'GLINT', desc: 'See the light, wear the shine — kilau perhiasan dalam layout presisi.' }
  ];
  var ORDER = ['aethelgard-7e0', 'vroeger-koffiehuis', 'lexier', 'elan-fashion-editorial', 'vipera-emeraude', 'aelian', 'cerulean-chic', 'cheriel-landing', 'ocular-45z', 'glint-landing-58i'];
  // LQIP blur-up: versi mungil inline tiap kartu (~1KB) — tampil instan, full menajam progresif.
  var LQIP = {
    'aethelgard-7e0': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDKtdGW4hBlleOMMfMYxggLkgEH6gConsPJuUtlQu6sUAyDzk8fWqNvfvAPk3c5B+YjjJNNW8l3icYB3d+e3vXOrnZUtZWJpoIVijUsBJ5wD5/+tRWc88hmGTnDhuBjJ9aKuzMU0tz/2Q==',
    'vroeger-koffiehuis': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDjtLtjf38MMm4xA5k2kAhOhI/OuhbQNG85UWa4ywJCl+eOvauTjkkibdG7I2MZU4NWG1GdrWOHzXBjZmDA88nJ569qyalfQ0Tj1JNUtzpupXEEDOsRzsJIJZD0zRVKSR5W3SOztjGWOTRVLzJfkf/Z',
    'lexier': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDrJp9QR5RFaBlDcHHUZ+vPH0pTc6iGkAs8gH5TjqMH3+lXGdQ5Bzn60/bk5yenTNIZRiuNQZ499mAhYBmJwQM9cZ9KK0Ao9T+dFAj/2Q==',
    'elan-fashion-editorial': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwB+pOyaTdmOKSSQxlU8vOQTx2rHuhbjw/BCPNAaPGABgMB0/PNJJ4rvNPumS3hhbOCS+evtg1TuNTjm0AQujldzljxksWJzn60mNGt4eeb+xjFOkiPG+1VdSDt7dfrRVC18WXl5NFHNHEDGhClc88Drk0UxH//Z',
    'vipera-emeraude': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDvpbxYZthjJ5AyCKso6yLuRgw9Qaa0cbN80ak+pFOVVQYVQo9hQAtFFFAH/9k=',
    'aelian': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmNNSFoYi6BiVfOT7risDcdm3Jx1x71o+e0BkRVQeUMd+5FUDHgnkcIG/T/wCvQI27lIBbNtQBhbqcj13CiqAaSXy4iw/eRcewBJ/pRQB//9k=',
    'cerulean-chic': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzhWO4fWt6OKyk04ybJPO8zpuHT8qw9mKnilZUZQe+apGcvIrMSGP1op2zJopFn//Z',
    'cheriel-landing': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDvPsNv/wA8xWIihoUhaMByeTnomcZqUeIgf+WP61nnXfmJ8o52Y/HOalpjTR0v2G3/AOeYorKPiLH/ACx/WinZiP/Z',
    'ocular-45z': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDztjk5wB7Cp2t2EYb5sFd/Tiq9TGQmLaXkOB03cUAQ0UUUAf/Z',
    'glint-landing-58i': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAOABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCe18bvfG5thYtEwBAlWVdo/wC+sdaspIq2TStdzs46LhRn8en61dPh/TLK1uWgtUUMpcoclSR06n+VYkd6xtCosrUbAMoOF5BHpTUZv4S48vUq33jHUrSeCCO3tWgVxsmc+YWGe5BxnmitpvDdjqVhbC8Vo2UmQfZyFUg9iCKKWuzJe+h//9k='
  };

  var N = slideData.length;
  var currentIndex = -1;
  var slides = document.querySelectorAll('.slide');
  var wraps = document.querySelectorAll('.parallax-wrap');
  var scrollArea = document.getElementById('wscroll');
  var uiLayer = document.getElementById('wui');
  var wappEl = document.getElementById('wapp');
  if (!slides.length || !scrollArea) { document.documentElement.classList.add('no-wn'); return; }

  var H = window.innerHeight, W = window.innerWidth;
  var totalSections = 90, centerIndex = 40;
  for (var i = 0; i < totalSections; i++) {
    var d = document.createElement('div');
    d.className = 'snap-point';
    d.style.height = H + 'px';
    d.addEventListener('click', function (e) {
      this.style.pointerEvents = 'none';
      var elBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (elBelow && elBelow.closest('.slide')) elBelow.closest('.slide').click();
      this.style.pointerEvents = 'auto';
    });
    scrollArea.appendChild(d);
  }

  var slug = (location.hash || '').replace('#', '');
  var startIdx = ORDER.indexOf(slug);
  if (startIdx < 0) startIdx = 0;
  var startY = (centerIndex + startIdx) * H;
  var targetScrollY = startY, currentScrollY = startY, lastScrollY = startY, velocity = 0;
  scrollArea.scrollTop = startY;

  var mouseX = 0, mouseY = 0, curRX = 0, curRY = 0, lastInput = 0, settling = false;
  var lastTouchT = -1e9, tSamples = []; // feel mobile: cap waktu & sampel kecepatan sentuh
  var coarsePtr = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  ['wheel', 'touchmove', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      lastInput = performance.now();
      if (ev === 'touchstart' || ev === 'touchmove') lastTouchT = performance.now();
      if (settling) { gsap.killTweensOf(scrollArea); settling = false; }
    }, { passive: true });
  });
  // sampel kecepatan lepas-jari (jendela ~120ms) untuk governor fling
  window.addEventListener('touchmove', function () {
    var now = performance.now();
    tSamples.push([now, scrollArea.scrollTop]);
    while (tSamples.length > 2 && now - tSamples[0][0] > 120) tSamples.shift();
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (e.touches && e.touches.length) return; // masih ada jari lain
    var n = tSamples.length;
    if (n >= 2) {
      var a = tSamples[0], b = tSamples[n - 1], dt = (b[0] - a[0]) / 1000;
      if (dt > 0.015) flingTakeover((b[1] - a[1]) / dt);
    }
    tSamples.length = 0;
  }, { passive: true });
  // fling governor: momentum liar diganti luncuran berpagu (maks 2.5 section, snap presisi)
  function flingTakeover(v) {
    var dir = v > 0 ? 1 : -1, sp = Math.abs(v);
    if (sp < 900) return; // bukan fling -> soft-settle biasa
    var target = Math.round((scrollArea.scrollTop + dir * Math.min(sp * 0.45, H * 2.5)) / H) * H;
    if (target === Math.round(scrollArea.scrollTop / H) * H) return;
    if (settling) gsap.killTweensOf(scrollArea);
    settling = true; // blokir soft-settle sejak dini
    lastInput = performance.now();
    // bunuh momentum native dulu (overflow hidden 2 frame), baru luncurkan tween —
    // tanpa ini momentum impl-thread melawan tween dan bikin yoyo
    scrollArea.style.overflowY = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        scrollArea.style.overflowY = '';
        if (!settling) return; // input baru masuk di tengah jalan -> batal
        gsap.to(scrollArea, {
          scrollTop: target,
          duration: 0.45 + (Math.abs(target - scrollArea.scrollTop) / H) * 0.22,
          ease: 'power3.out',
          onUpdate: function () { lastInput = performance.now(); },
          onComplete: function () { settling = false; }
        });
      });
    });
  }
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- drag pakai mouse (desktop): seret vertikal = pindah kartu ---------- */
  var finePtr = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (finePtr) {
    var dragging = false, dragMoved = false, dragY = 0, dragTop = 0;
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; dragMoved = false;
      dragY = e.clientY; dragTop = scrollArea.scrollTop;
      if (settling) { gsap.killTweensOf(scrollArea); settling = false; }
      lastInput = performance.now();
      document.body.classList.add('w-drag');
      e.preventDefault(); // blokir native image-drag & seleksi teks saat menyeret
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerType !== 'mouse') return;
      if (Math.abs(e.clientY - dragY) > 4) dragMoved = true;
      scrollArea.scrollTop = dragTop + (dragY - e.clientY);
      lastInput = performance.now();
      var mNow = performance.now();
      tSamples.push([mNow, scrollArea.scrollTop]);
      while (tSamples.length > 2 && mNow - tSamples[0][0] > 120) tSamples.shift();
    }, { passive: true });
    var dragEnd = function () {
      if (!dragging) return;
      dragging = false;
      lastInput = performance.now();
      document.body.classList.remove('w-drag');
      var mN = tSamples.length; // lemparan mouse ikut meluncur (momentum)
      if (mN >= 2) {
        var mA = tSamples[0], mB = tSamples[mN - 1], mDt = (mB[0] - mA[0]) / 1000;
        if (mDt > 0.015) flingTakeover((mB[1] - mA[1]) / mDt);
      }
      tSamples.length = 0;
    };
    window.addEventListener('pointerup', dragEnd, { passive: true });
    window.addEventListener('pointercancel', dragEnd, { passive: true });
    // telan klik yang lahir dari drag agar kartu tak ikut terpicu
    document.addEventListener('click', function (e) {
      if (dragMoved) { dragMoved = false; e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpKF(a, b, t) {
    var cp = [];
    for (var k = 0; k < 8; k++) cp[k] = lerp(a.cp[k], b.cp[k], t);
    return { w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), b: lerp(a.b, b.b, t), o: lerp(a.o, b.o, t), rz: lerp(a.rz, b.rz, t), cp: cp };
  }

  // keyframe posisi (px) — hibrida OCULAR + scatter huyml; aspekdisamakan 1.45 agar gerak = scale uniform
  function keyframes() {
    var Wc = W < 820 ? Math.min(W * 0.72, 430) : Math.min(W * 0.46, 760);
    var Hc = Wc / 1.45;
    var pw = Math.max(150, W * 0.11);
    var nw = Math.max(140, W * 0.10);
    var qw = Math.max(140, W * 0.105);
    var ew = Math.max(110, W * 0.085);
    return {
      center: { w: Wc, h: Hc, x: (W - Wc) / 2, y: (H - Hc) / 2 - H * 0.06, b: 1, o: 1, rz: 0, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      prev: { w: pw, h: pw / 1.45, x: W - pw * 0.82, y: -pw * 0.1, b: 0.3, o: 1, rz: 3, cp: [0, 0, 100, 0, 100, 80, 0, 100] },
      next: { w: nw, h: nw / 1.45, x: -nw * 0.1, y: H - nw * 0.5, b: 0.4, o: 1, rz: -3, cp: [0, 20, 100, 0, 100, 100, 0, 100] },
      farPrev: { w: W * 0.22, h: W * 0.22 / 1.45, x: W * 0.05, y: H * 0.26, b: 0.5, o: 0.85, rz: -8, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      farNext: { w: W * 0.20, h: W * 0.20 / 1.45, x: W * 0.76, y: H * 0.56, b: 0.5, o: 0.85, rz: 7, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      peekTL: { w: qw, h: qw / 1.45, x: -qw * 0.18, y: -qw * 0.1, b: 0.45, o: 0.9, rz: -3, cp: [0, 0, 100, 0, 100, 100, 0, 80] },
      peekBR: { w: qw, h: qw / 1.45, x: W - qw * 0.9, y: H - qw * 0.5, b: 0.45, o: 0.9, rz: 3, cp: [0, 0, 100, 20, 100, 100, 0, 100] },
      edgeT: { w: ew, h: ew / 1.45, x: W * 0.52, y: -(ew / 1.45) * 0.68, b: 0.35, o: 0.6, rz: 2, cp: [0, 0, 100, 0, 100, 100, 0, 100] },
      edgeB: { w: ew, h: ew / 1.45, x: W * 0.30 - ew / 2, y: H - (ew / 1.45) * 0.32, b: 0.35, o: 0.6, rz: -2, cp: [0, 0, 100, 0, 100, 100, 0, 100] }
    };
  }
  var KFcache = null, KFkey = '';
  function keyframesCached() { // keyframe cuma dihitung ulang saat viewport berubah
    var k = W + 'x' + H;
    if (k !== KFkey) { KFkey = k; KFcache = keyframes(); }
    return KFcache;
  }
  var BASE = { w: 100, h: 69 };
  function sizeBase() {
    BASE.w = keyframes().center.w; BASE.h = keyframes().center.h;
    for (var i = 0; i < slides.length; i++) { slides[i].style.width = BASE.w + 'px'; slides[i].style.height = BASE.h + 'px'; }
  }

  // pose slide ke-idx pada progress tertentu (+ efek fly-by kamera saat transisi)
  function poseFor(idx, progress, KF) {
    var pMod = ((progress % N) + N) % N;
    var df = idx - pMod;
    if (df > N / 2) df -= N;
    if (df < -N / 2) df += N;

    var p, m, z = 0, ry = 0, rx = 0;
    if (df <= -4) { // edgeT -> hilang ke atas
      var tP4 = Math.min(1, -4 - df);
      p = { w: KF.edgeT.w, h: KF.edgeT.h, x: KF.edgeT.x, y: KF.edgeT.y - tP4 * H * 0.08,
        b: KF.edgeT.b, o: KF.edgeT.o * (1 - tP4), rz: KF.edgeT.rz, cp: KF.edgeT.cp };
    } else if (df >= 4) { // edgeB -> hilang ke bawah
      var tN4 = Math.min(1, df - 4);
      p = { w: KF.edgeB.w, h: KF.edgeB.h, x: KF.edgeB.x, y: KF.edgeB.y + tN4 * H * 0.08,
        b: KF.edgeB.b, o: KF.edgeB.o * (1 - tN4), rz: KF.edgeB.rz, cp: KF.edgeB.cp };
    } else if (df <= -3) {
      p = lerpKF(KF.peekTL, KF.edgeT, -df - 3);
    } else if (df >= 3) {
      p = lerpKF(KF.peekBR, KF.edgeB, df - 3);
    } else if (df <= -2) {
      p = lerpKF(KF.farPrev, KF.peekTL, -df - 2);
    } else if (df >= 2) {
      p = lerpKF(KF.farNext, KF.peekBR, df - 2);
    } else if (df <= -1) {
      p = lerpKF(KF.prev, KF.farPrev, -df - 1); // (arah diperbaiki: dulu terbalik, pop di df=-1/-2)
    } else if (df >= 1) {
      p = lerpKF(KF.next, KF.farNext, df - 1);
      // kartu masuk: muncul dari kedalaman, menekuk lalu lurus saat jadi pusat
      m = Math.sin(Math.min(1, df) * Math.PI);
      z = -m * 320; ry = m * 13; rx = -m * 5;
    } else if (df < 0) {
      p = lerpKF(KF.prev, KF.center, df + 1);
      // kartu keluar: terbang menekuk melewati kamera di tengah transisi
      m = Math.sin(-df * Math.PI);
      z = m * 400; ry = -m * 16; rx = m * 7;
    } else {
      p = lerpKF(KF.center, KF.next, df);
      m = Math.sin(df * Math.PI);
      z = -m * 320; ry = m * 13; rx = -m * 5;
    }
    p.z = z; p.ry = ry; p.rx = rx;
    return p;
  }

  function applyPose(el, wrapEl, p, isCenter) {
    // tulis style hanya saat berubah; string dibulatkan agar settle = stabil (bukan epsilon abadi)
    var tf = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,' + p.z.toFixed(1) + 'px)'
      + ' rotateZ(' + p.rz.toFixed(2) + 'deg) rotateY(' + p.ry.toFixed(2) + 'deg) rotateX(' + p.rx.toFixed(2) + 'deg)'
      + ' scale(' + (p.w / BASE.w).toFixed(4) + ')';
    if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
    var cp = 'polygon(' + p.cp[0].toFixed(1) + '% ' + p.cp[1].toFixed(1) + '%, ' + p.cp[2].toFixed(1) + '% ' + p.cp[3].toFixed(1)
      + '%, ' + p.cp[4].toFixed(1) + '% ' + p.cp[5].toFixed(1) + '%, ' + p.cp[6].toFixed(1) + '% ' + p.cp[7].toFixed(1) + '%)';
    if (el._cp !== cp) { el._cp = cp; el.style.clipPath = cp; }
    var fl = 'brightness(' + p.b.toFixed(3) + ')';
    if (el._fl !== fl) { el._fl = fl; el.style.filter = fl; }
    var op = +p.o.toFixed(3);
    if (el._op !== op) { el._op = op; el.style.opacity = op; }
    var wt = isCenter
      ? 'scale(1.1) perspective(1000px) rotateX(' + curRX.toFixed(2) + 'deg) rotateY(' + curRY.toFixed(2) + 'deg)'
      : 'scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
    if (wrapEl._wt !== wt) { wrapEl._wt = wt; wrapEl.style.transform = wt; }
  }

  /* ---------- teks UI: ganti INSTAN saat indeks berubah ---------- */
  function setText(i) {
    document.getElementById('t-counter').textContent = String(i + 1).padStart(2, '0');
    document.getElementById('t-cat').textContent = slideData[i].cat;
    document.getElementById('t-title').textContent = slideData[i].title;
    document.getElementById('t-desc').textContent = slideData[i].desc;
  }
  function updateUIFirst(i) {
    currentIndex = i; setText(i);
    gsap.set(['#t-counter', '#t-cat', '#t-title', '#t-desc'], { y: '0%', opacity: 1 });
  }
  function updateUI(i) {
    if (currentIndex === i) return;
    currentIndex = i;
    var els = ['#t-counter', '#t-cat', '#t-title', '#t-desc'];
    gsap.killTweensOf(els);
    gsap.to(els, {
      y: '-40%', opacity: 0, duration: 0.1, stagger: 0.012, ease: 'power2.in',
      onComplete: function () {
        setText(i);
        gsap.set(els, { y: '40%', opacity: 0 });
        gsap.to(els, { y: '0%', opacity: 1, duration: 0.26, stagger: 0.025, ease: 'power3.out' });
      }
    });
  }

  /* ---------- render loop ---------- */
  var running = false;
  var TEXT_VMAX = 1600; // px/detik — teks UI ditahan saat fling agar tak strobe
  var lastFrameT = performance.now(), lastBlur = -1, lastBlurT = 0, lastC = -1; // feel: clock, bucket blur, idx pusat chromatic
  function renderLoop() {
    if (!running) return;
    W = window.innerWidth; H = window.innerHeight;
    var nowT = performance.now();
    var dtF = Math.min(0.05, Math.max(0.001, (nowT - lastFrameT) / 1000));
    lastFrameT = nowT;
    var damp = function (r) { return 1 - Math.pow(1 - r, dtF * 60); };
    // sentuh = sudah mulus dari sananya -> ikuti jari dengan ketat; wheel tetap mentega
    var trackRate = (nowT - lastTouchT < 900) ? 0.45 : 0.17;
    targetScrollY = scrollArea.scrollTop;
    currentScrollY = lerp(currentScrollY, targetScrollY, damp(trackRate));
    velocity = Math.abs(currentScrollY - lastScrollY) / dtF; // px/detik
    lastScrollY = currentScrollY;
    // chromatic fly-by: rgb-split sesaat saat melaju kencang (hysteresis anti-kedip)
    if (velocity > 1400) { if (!wappEl._chro) { wappEl._chro = true; wappEl.classList.add('chro'); } }
    else if (velocity < 900) { if (wappEl._chro) { wappEl._chro = false; wappEl.classList.remove('chro'); } }

    // blur UI = repaint full-layer -> langkah bulat 0..10 + throttle 90ms (0 selalu langsung: teks kembali tajam)
    var blurStep = velocity > 30 ? Math.min(Math.round(velocity / 300), 10) : 0;
    if (blurStep !== lastBlur && (blurStep === 0 || nowT - lastBlurT > 90)) {
      lastBlur = blurStep; lastBlurT = nowT;
      uiLayer.style.filter = blurStep ? 'blur(' + blurStep + 'px)' : '';
    }

    curRY = lerp(curRY, mouseX * 10, damp(0.05));
    curRX = lerp(curRX, -mouseY * 10, damp(0.05));

    var progress = currentScrollY / H;
    var pMod = ((progress % N) + N) % N;
    var KF = keyframesCached();

    // soft-settle one-shot: saat inersia & input tenang, glissade halus ke indeks terdekat
    if (!settling && velocity < 25 && performance.now() - lastInput > 120) {
      var nearest = Math.round(progress);
      var gap = nearest * H - scrollArea.scrollTop;
      if (Math.abs(gap) > 1 && Math.abs(gap) < H * 0.5) {
        settling = true;
        gsap.to(scrollArea, { scrollTop: nearest * H, duration: 0.5, ease: 'power2.out', onComplete: function () { settling = false; } });
      }
    }

    for (var idx = 0; idx < N; idx++) {
      var p = poseFor(idx, progress, KF);
      var sEl = slides[idx];
      if (p.o <= 0.01) { // tak terlihat -> sembunyikan & lewati (hemat GPU HP)
        if (!sEl._hid) { sEl._hid = true; sEl._op = -1; sEl.style.opacity = '0'; sEl.style.visibility = 'hidden'; }
        continue;
      } else if (sEl._hid) { sEl._hid = false; sEl.style.visibility = 'visible'; }
      var isC = Math.abs(idx - pMod) < 0.5 || Math.abs(idx - pMod + N) < 0.5 || Math.abs(idx - pMod - N) < 0.5;
      applyPose(sEl, wraps[idx], p, isC);
      if (isC && lastC !== idx) { // chromatic rgb-split cuma di kartu pusat (1 layer, bukan 7)
        if (lastC >= 0) slides[lastC].classList.remove('is-c');
        sEl.classList.add('is-c'); lastC = idx;
      }
      var zw = Math.round(100 - Math.abs(((idx - pMod + N * 1.5) % N) - N / 2) * 10);
      if (sEl._zw !== zw) { sEl._zw = zw; sEl.style.zIndex = zw; }
    }

    if ((progress < 10 || progress > 80) && targetScrollY % H === 0 && Math.abs(targetScrollY - currentScrollY) < 1) {
      var phase = Math.round(progress) % N;
      var reset = centerIndex + phase;
      scrollArea.scrollTop = reset * H;
      targetScrollY = currentScrollY = reset * H;
    }

    var active = ((Math.round(progress) % N) + N) % N;
    // throttle: saat fling cepat teks ditahan (tetap blur), tukar sekali saat tenang
    if (active !== currentIndex && velocity < TEXT_VMAX) {
      updateUI(active);
      if (coarsePtr && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
    }

    requestAnimationFrame(renderLoop);
  }

  /* ---------- intro: kocok & bagi kartu (ala deck shuffle huyml) ---------- */
  function intro() {
    var KF = keyframes();
    var P0 = centerIndex + startIdx;
    uiLayer.style.opacity = 0;
    var wloadEl = document.getElementById('wload');
    // pseudo-acak deterministik per kartu (koreografi konsisten tiap kunjungan)
    function rnd(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
    // jarak sirkular dari kartu aktif -> deal dibagikan dari tengah ke luar
    function dist(i) { var dd = Math.abs(i - startIdx) % N; return dd > N / 2 ? N - dd : dd; }
    // paused: dimainkan setelah gerbang decode di bawah (from langsung tampil via immediateRender)
    var tl = gsap.timeline({ paused: true, onComplete: function () { unskip(); if (wloadEl) wloadEl.style.display = 'none'; running = true; renderLoop(); } });
    tl.timeScale(1.08); // kocokan ±3,2 dtk (total ±3,5 dtk); proporsi babak utuh, skip tak terpengaruh
    // skip: scroll/klik saat kocokan -> langsung final (renderLoop handoff tetap mulus)
    function skipIntro() { if (!tl.isActive()) return; unskip(); tl.progress(1); }
    function unskip() {
      window.removeEventListener('wheel', skipIntro);
      window.removeEventListener('touchmove', skipIntro);
      window.removeEventListener('mousedown', skipIntro);
    }
    window.addEventListener('wheel', skipIntro, { passive: true });
    window.addEventListener('touchmove', skipIntro, { passive: true });
    window.addEventListener('mousedown', skipIntro);
    var spreadX = Math.min(W * 0.42, 460);
    var fanStep = Math.min(100, W * 0.105), fanArc = Math.min(200, H * 0.22);
    var cx = W / 2 - 170, cy = H / 2 - 120; // poros tumpukan
    var s0 = 340 / BASE.w; // skala kartu saat flourish
    for (var idx = 0; idx < N; idx++) {
      var el = slides[idx];
      var dd = dist(idx);
      var hero = dd === 0;
      var target = poseFor(idx, P0, KF);
      var r1 = rnd(idx * 4 + 1), r2 = rnd(idx * 4 + 2), r3 = rnd(idx * 4 + 3);
      var cpT = 'polygon(' + target.cp[0] + '% ' + target.cp[1] + '%, ' + target.cp[2] + '% ' + target.cp[3] + '%, ' + target.cp[4] + '% ' + target.cp[5] + '%, ' + target.cp[6] + '% ' + target.cp[7] + '%)';
      // state awal langsung (tanpa tween): redup + clip final; z = rumus renderLoop -> handoff tanpa pop
      el.style.filter = 'brightness(0.75)';
      el.style.clipPath = cpT; // clip final sejak awal — tanpa tween clip-path (repaint-bound)
      el.style.zIndex = 100 - dd * 10;
      // Kocokan 5 babak (transform/opacity saja): SPLIT -> RIFFLE -> SQUARE -> FAN -> DEAL+flip
      var left = idx < N / 2, odd = idx % 2 === 1;
      var fo = idx - (N - 1) / 2; // -4.5..4.5 poros kipas
      // 1. SPLIT: deck belah dua (hero naik sorot di tengah); deck tampil sejak gate
      tl.fromTo(el, {
        x: cx + (idx - N / 2) * 7, y: cy + (idx % 3 - 1) * 9,
        scale: s0, opacity: 1, rotationZ: (idx - N / 2) * 2, rotationY: 0, rotationX: 0, z: 0
      }, {
        x: hero ? cx : cx + (left ? -spreadX : spreadX) + r1 * 20,
        y: hero ? cy - H * 0.14 : cy + H * 0.03 + r2 * 30,
        scale: hero ? s0 * 1.18 : s0,
        opacity: 1, rotationZ: hero ? 0 : (left ? -9 : 9),
        duration: 0.55, ease: 'power2.inOut'
      }, 0.10 + (hero ? 0 : 0.02 * idx));
      // 2. RIFFLE-SILANG: paket tukar sisi sambil menganyam (sapu layar lebar)
      tl.to(el, { x: cx + (left ? 34 : -34) + (odd ? 12 : -12) + r1 * 10, y: cy + r2 * 14,
        rotationZ: odd ? 5 : -5, z: odd ? 70 : 0,
        duration: 0.52, ease: 'power3.inOut', overwrite: 'auto' }, 0.78);
      // 3. SQUARE: rapikan tumpukan
      tl.to(el, { x: cx, y: cy, rotationZ: 0, z: 0,
        duration: 0.26, ease: 'power2.out', overwrite: 'auto' }, 1.32);
      // 4. FAN: kipas busur sekejap (tengah tertinggi), sedikit menjauh
      tl.to(el, { x: cx + fo * fanStep, y: cy - (1 - Math.pow(fo / 4.5, 2)) * fanArc + r3 * 12,
        rotationZ: fo * 6.5, scale: s0 * 0.82,
        duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' }, 1.60);
      // 5. DEAL: kibas flip lalu terbang ke pose final, tengah-ke-luar
      var dealT = 2.14 + 0.07 * dd;
      tl.to(el, { rotationY: (dd % 2 ? 55 : -55), z: 130, y: '-=' + Math.round(H * 0.08),
        duration: 0.18, ease: 'power2.in', overwrite: 'auto' }, dealT);
      tl.to(el, { x: target.x, y: target.y, scale: target.w / BASE.w,
        rotationZ: target.rz, rotationX: 0, rotationY: 0, z: 0,
        opacity: target.o, filter: 'brightness(' + target.b + ')',
        duration: 0.72, ease: 'expo.out', overwrite: 'auto' }, dealT + 0.12);
      // snap kartu utama saat mendarat (kembali tepat ke target -> handoff mulus)
      if (hero) {
        var sT = target.w / BASE.w;
        tl.to(el, { scale: sT * 1.035, duration: 0.12, ease: 'power2.out' }, dealT + 0.84);
        tl.to(el, { scale: sT, duration: 0.35, ease: 'power3.inOut' }, dealT + 0.96);
      }
    }
    tl.fromTo(uiLayer, { y: 18 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 2.65);
    if (wloadEl) tl.to(wloadEl, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 2.7);
    // kesiapan LQIP (blok di bawah): kartu tak-lengkap tampil mungil dulu, full menajam
    // progresif; intro cukup nunggu hero + font (berkap). Lalu reflow + 3 frame napas agar
    // kompositor memegang layer sebelum tween pertama jalan (deck tampil sejak gate = sudah pra-raster).
    var imgs = [];
    for (var gi = 0; gi < slides.length; gi++) {
      var gim = slides[gi].querySelector('img');
      if (gim) imgs.push(gim);
    }
    // LQIP blur-up: kartu tak-lengkap langsung tampil versi mungil, full-res menajam
    // progresif saat ter-decode (gerak menutupi swap). Cache cepat = tanpa swap sama sekali.
    var heroImg = slides[startIdx].querySelector('img');
    var heroReady = Promise.resolve();
    for (var li = 0; li < imgs.length; li++) (function (gim, slug) {
      if (!gim || (gim.complete && gim.naturalWidth)) return;
      var full = gim.currentSrc || gim.src;
      gim.src = LQIP[slug];
      var pre = new Image();
      var done = new Promise(function (res) {
        pre.onload = function () { if (pre.naturalWidth) gim.src = full; res(); };
        pre.onerror = function () { res(); }; // gagal -> LQIP bertahan (lebih baik dari rusak)
      });
      if (gim === heroImg) heroReady = done;
      pre.src = full;
    })(imgs[li], ORDER[li]);
    var fontsReady = Promise.resolve();
    try {
      if (document.fonts && document.fonts.ready) {
        fontsReady = Promise.race([
          document.fonts.ready,
          new Promise(function (res) { setTimeout(res, 1200); })
        ]);
      }
    } catch (e) {}
    Promise.race([heroReady, new Promise(function (res) { setTimeout(res, 2500); })])
      .then(function () { return fontsReady; })
      .then(function () {
        void wappEl.offsetHeight; // kunci style -> kompositor memegang layer sebelum tween pertama
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { tl.play(); });
          });
        });
      });
  }

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    var pts = scrollArea.children;
    for (var i = 0; i < pts.length; i++) pts[i].style.height = H + 'px';
    sizeBase();
  });
  // deep-link: meluncur halus via jalur loop terpendek (bisa diinterupsi input baru)
  window.addEventListener('hashchange', function () {
    var i = ORDER.indexOf((location.hash || '').replace('#', ''));
    if (i < 0) return;
    var p = Math.round(scrollArea.scrollTop / H);
    var act = ((p % N) + N) % N;
    var d = i - act;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    if (d === 0) return;
    if (settling) gsap.killTweensOf(scrollArea);
    settling = true;
    gsap.to(scrollArea, {
      scrollTop: (p + d) * H, duration: 0.9, ease: 'power3.inOut',
      onUpdate: function () { lastInput = performance.now(); },
      onComplete: function () { settling = false; }
    });
  });

  /* ---------- klik kartu: yang mengintip = pusatkan dulu; pusat = buka situs ---------- */
  function activeIndex() {
    var p = scrollArea.scrollTop / H;
    return ((Math.round(p) % N) + N) % N;
  }
  slides.forEach(function (el, idx) {
    el.addEventListener('click', function (e) {
      if (!running) { e.preventDefault(); return; }          // saat intro masih kocok
      var act = activeIndex();
      if (idx === act) return;                                 // kartu pusat → biarkan buka link
      e.preventDefault();                                      // kartu mengintip → pusatkan
      var p = Math.round(scrollArea.scrollTop / H);
      var d = idx - act;
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      scrollArea.scrollTop = (p + d) * H;
    });
  });

  /* ---------- TOG: overlay list inline (mode daftar tanpa pindah halaman) ---------- */
  (function () {
    var wtog = document.getElementById('wtog');
    var wlist = document.getElementById('wlist');
    var wclose = document.getElementById('wclose');
    if (!wtog || !wlist) return;
    function open() { wlist.hidden = false; wtog.setAttribute('aria-expanded', 'true'); if (wclose) wclose.focus(); }
    function shut() { wlist.hidden = true; wtog.setAttribute('aria-expanded', 'false'); wtog.focus(); }
    wtog.addEventListener('click', function () { wlist.hidden ? open() : shut(); });
    if (wclose) wclose.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wlist.hidden) shut(); });
    // klik judul baris = hashchange memusatkan kartu (handler existing) + tutup overlay
    wlist.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('a.wl-t') : null;
      if (t) { wlist.hidden = true; wtog.setAttribute('aria-expanded', 'false'); }
    });
  })();

  sizeBase();
  updateUIFirst(startIdx);
  intro();
})();
